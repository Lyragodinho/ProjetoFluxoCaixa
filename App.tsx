
import React, { useState, useReducer, useCallback, useMemo, useEffect } from 'react';
import { CashFlowState, CashFlowAction, Step, InitialBalance, Revenue, Supplier, Outflow } from './types.ts';
import { INITIAL_STATE, cashFlowReducer } from './constants.tsx';
import { Header } from './components/Header.tsx';
import { Card } from './components/Card.tsx';
import { Button } from './components/Button.tsx';
import { Modal } from './components/Modal.tsx';
import { DownloadIcon, UploadIcon, PlusIcon, TrashIcon, DatabaseIcon, CheckCircleIcon, ErrorIcon, CheckIcon, HomeIcon, BanknotesIcon, ArrowUpCircleIcon, CheckBadgeIcon, TruckIcon, ArrowDownCircleIcon, ExclamationTriangleIcon, ChartPieIcon, ChevronRightIcon, ChevronDownIcon } from './components/icons.tsx';
import { formatCurrency, generateCsv, parseCsv, calculateNextBusinessDay } from './utils/helpers.ts';
import { CustomSelect } from './components/CustomSelect.tsx';
import { getHashedStateFromUrl, loadStateFromUrl, saveStateToUrl } from './services/cloudStorage.ts';

type BulkEntryType = 'banks' | 'initialBalance' | 'revenue' | 'supplier';

interface ReportRow {
  id: string;
  label: string;
  isBold?: boolean;
  isSubtotal?: boolean;
  indentationLevel: number;
  dailyValues: number[];
}

const App: React.FC = () => {
    const [step, setStep] = useState<Step>('home');
    const [state, dispatch] = useReducer(cashFlowReducer, INITIAL_STATE);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
    const [sqlQuery, setSqlQuery] = useState<string>('');
    const [showBulkEntryModal, setShowBulkEntryModal] = useState<BulkEntryType | null>(null);
    const [bulkRows, setBulkRows] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const hashedState = getHashedStateFromUrl();
        if (hashedState) {
            const data = loadStateFromUrl(hashedState);
            if (data) {
                dispatch({ type: 'SET_STATE', payload: data.appState });
                setStartDate(data.config.startDate);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        
        const handler = setTimeout(() => {
             saveStateToUrl(state, startDate);
        }, 1000);

        return () => clearTimeout(handler);
    }, [state, startDate, isLoaded]);
    
    const handleClearStepData = () => {
        const stepConfig: Record<Step, { action: CashFlowAction['type'], message: string } | null> = {
            home: null,
            initialBalance: { action: 'CLEAR_INITIAL_BALANCES', message: 'Tem certeza que deseja limpar todos os saldos iniciais?' },
            inflows: { action: 'CLEAR_REVENUES', message: 'Tem certeza que deseja limpar todas as entradas (receitas)? Isso também limpará os recebimentos confirmados.' },
            receipts: null,
            suppliers: { action: 'CLEAR_SUPPLIERS', message: 'Tem certeza que deseja limpar todos os fornecedores e contas?' },
            outflows: { action: 'CLEAR_OUTFLOWS', message: 'Tem certeza que deseja limpar todas as saídas?' },
            overdue: null,
            report: null,
        };
    
        const config = stepConfig[step];
        if (config && window.confirm(config.message)) {
            dispatch({ type: config.action });
        }
    };

    const steps: Step[] = ['home', 'initialBalance', 'inflows', 'receipts', 'suppliers', 'outflows', 'overdue', 'report'];

    const handleNextStep = () => {
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        }
    };

    const handlePrevStep = () => {
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'initialBalance' | 'revenue' | 'supplier' | 'banks') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const data = parseCsv(text);
                if(data.length > 0 && data[0].length === 1 && data[0][0].includes(',')){ 
                } else if (data.length > 1) {
                   data.shift(); 
                }

                switch (type) {
                    case 'initialBalance':
                        const balances = data.map(row => ({ bankCode: state.banks.find(b => b.name === row[0] || b.code === row[0])?.code, amount: parseFloat(row[1]) })).filter(b => b.bankCode && !isNaN(b.amount));
                        dispatch({ type: 'ADD_INITIAL_BALANCES', payload: balances as InitialBalance[] });
                        break;
                    case 'revenue':
                        const revenues = data.map(row => {
                            const dueDateStr = row[4];
                            if (!dueDateStr) return null;
                            const creditDate = calculateNextBusinessDay(dueDateStr);
                            return { id: Date.now() + Math.random(), clientName: row[0] || '', documentType: row[1] as any, documentNumber: row[2], issueDate: new Date(`${row[3]}T12:00:00Z`), dueDate: new Date(`${dueDateStr}T12:00:00Z`), creditDate, type: row[5], amount: parseFloat(row[6]), };
                        }).filter(r => r && r.clientName && r.type && !isNaN(r.amount));
                        revenues.forEach(r => dispatch({ type: 'ADD_REVENUE', payload: r as Revenue }));
                        break;
                    case 'supplier':
                         const suppliers = data.map(row => ({ id: Date.now() + Math.random(), name: row[0], cashFlowType: row[1], supplierType: row[2] })).filter(s => s.name && s.cashFlowType && s.supplierType);
                        suppliers.forEach(s => dispatch({ type: 'ADD_SUPPLIER', payload: s }));
                        break;
                    case 'banks':
                        const banks = data.map(row => ({ code: row[0], name: row[1] })).filter(b => b.code && b.name);
                        dispatch({ type: 'ADD_BANKS', payload: banks });
                        break;
                }
            } catch (error) {
                alert('Erro ao processar o arquivo. Verifique o formato.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };
    
    const handleSqlSubmit = () => {
        alert(`Executando SQL (simulação):\n${sqlQuery}\n\nEm uma aplicação real, isto se conectaria a um banco de dados.`);
        setShowSqlModal(false);
        setSqlQuery('');
    };

    const createEmptyRow = useCallback((type: BulkEntryType | null) => {
        const today = new Date().toISOString().split('T')[0];
        switch(type) {
            case 'banks': return { code: '', name: '' };
            case 'initialBalance': return { bankCode: state.banks[0]?.code || '', amount: '' };
            case 'revenue': return { clientName: '', type: 'Venda de Produto', amount: '', documentType: 'NF', documentNumber: '', issueDate: today, dueDate: today };
            case 'supplier': return { name: '', cashFlowType: 'Fluxo de Caixa Operacional', supplierType: '' };
            default: return {};
        }
    }, [state.banks]);

    const handleOpenBulkEntry = (type: BulkEntryType) => {
        setBulkRows([createEmptyRow(type)]);
        setShowBulkEntryModal(type);
    };

    const handleBulkRowChange = (index: number, field: string, value: any) => {
        const newRows = [...bulkRows];
        newRows[index][field] = value;
        setBulkRows(newRows);
    };

    const handleAddBulkRow = () => {
        setBulkRows([...bulkRows, createEmptyRow(showBulkEntryModal)]);
    };

    const handleRemoveBulkRow = (index: number) => {
        if (bulkRows.length > 1) {
            setBulkRows(bulkRows.filter((_, i) => i !== index));
        }
    };

    const handleBulkEntrySubmit = () => {
        try {
            switch(showBulkEntryModal) {
                case 'banks':
                    const banks = bulkRows.map(row => ({ code: row.code, name: row.name })).filter(b => b.code && b.name);
                    if (banks.length) dispatch({ type: 'ADD_BANKS', payload: banks });
                    break;
                case 'initialBalance':
                    const balances = bulkRows.map(row => ({ bankCode: row.bankCode, amount: parseFloat(row.amount) })).filter(b => b.bankCode && !isNaN(b.amount) && b.amount > 0);
                    if(balances.length) dispatch({ type: 'ADD_INITIAL_BALANCES', payload: balances as InitialBalance[] });
                    break;
                case 'revenue':
                     const revenues = bulkRows.map(row => {
                             if (!row.dueDate) return null;
                             const creditDate = calculateNextBusinessDay(row.dueDate);
                             return { id: Date.now() + Math.random(), clientName: row.clientName, documentType: row.documentType, documentNumber: row.documentNumber, issueDate: new Date(`${row.issueDate}T12:00:00Z`), dueDate: new Date(`${row.dueDate}T12:00:00Z`), creditDate, type: row.type, amount: parseFloat(row.amount) };
                        }).filter(r => r && r.clientName && r.type && !isNaN(r.amount) && r.amount > 0);
                    revenues.forEach(r => dispatch({ type: 'ADD_REVENUE', payload: r as Revenue }));
                    break;
                case 'supplier':
                    const suppliers = bulkRows.map(row => ({ id: Date.now() + Math.random(), name: row.name, cashFlowType: row.cashFlowType, supplierType: row.supplierType, })).filter(s => s.name && s.cashFlowType && s.supplierType);
                    suppliers.forEach(s => dispatch({ type: 'ADD_SUPPLIER', payload: s }));
                    break;
            }
            setShowBulkEntryModal(null);
            setBulkRows([]);
        } catch (error) {
            console.error(error);
            alert('Erro ao processar os dados. Verifique os valores inseridos.');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 'home': return <HomePage setStep={setStep} />;
            case 'initialBalance': return <InitialBalanceStep state={state} dispatch={dispatch} handleFileUpload={handleFileUpload} onOpenBulkEntry={handleOpenBulkEntry} startDate={startDate} setStartDate={setStartDate} />;
            case 'inflows': return <InflowsStep state={state} dispatch={dispatch} onSqlClick={() => setShowSqlModal(true)} onOpenBulkEntry={handleOpenBulkEntry} handleFileUpload={handleFileUpload} />;
            case 'receipts': return <ReceiptsStep state={state} dispatch={dispatch} />;
            case 'suppliers': return <SuppliersStep state={state} dispatch={dispatch} onOpenBulkEntry={handleOpenBulkEntry} handleFileUpload={handleFileUpload} />;
            case 'outflows': return <OutflowsStep state={state} dispatch={dispatch} />;
            case 'overdue': return <OverdueStep state={state} />;
            case 'report': return <CashFlowReport state={state} startDate={startDate} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen text-gray-800 font-sans">
            <Header
                onClear={handleClearStepData}
                isClearEnabled={['initialBalance', 'inflows', 'suppliers', 'outflows'].includes(step)}
            />
            <main className="p-4 md:p-8">
                {step !== 'home' && <StepWizard currentStep={step} setStep={setStep} />}
                <div className="mt-8">
                    {!isLoaded ? <p className="text-center text-gray-600">Carregando...</p> : renderStep()}
                </div>
                 {step !== 'home' && (
                    <div className="flex justify-between mt-8">
                        <Button onClick={handlePrevStep} disabled={step === 'initialBalance'} variant="secondary">Anterior</Button>
                        {step !== 'report' ? (
                            <Button onClick={handleNextStep} variant="primary">Próximo</Button>
                        ) : (
                            <Button onClick={() => window.print()} variant="primary">Imprimir / Salvar PDF</Button>
                        )}
                    </div>
                )}
            </main>
            {showSqlModal && (
                <Modal title="Conectar ao Banco de Dados (SQL)" onClose={() => setShowSqlModal(false)}>
                    <p className="text-sm text-sap-dark-gray mb-4">Insira sua consulta SQL para buscar dados. A conexão será simulada.</p>
                    <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} className="w-full h-40 p-2 border rounded-md bg-gray-900 text-green-400 font-mono" placeholder="SELECT name, type, amount FROM revenues" />
                    <div className="mt-4 flex justify-end"> <Button onClick={handleSqlSubmit} variant="primary">Executar Consulta</Button> </div>
                </Modal>
            )}

            {showBulkEntryModal && (
                <BulkEntryModal
                    type={showBulkEntryModal}
                    rows={bulkRows}
                    state={state}
                    onClose={() => setShowBulkEntryModal(null)}
                    onRowChange={handleBulkRowChange}
                    onAddRow={handleAddBulkRow}
                    onRemoveRow={handleRemoveBulkRow}
                    onSubmit={handleBulkEntrySubmit}
                />
            )}
        </div>
    );
};

const StepWizard = ({ currentStep, setStep }: { currentStep: Step, setStep: (step: Step) => void }) => {
    const steps: { id: Step; name: string }[] = [
        { id: 'initialBalance', name: 'Saldos Iniciais' },
        { id: 'inflows', name: 'Entradas' },
        { id: 'receipts', name: 'Recebimentos' },
        { id: 'suppliers', name: 'Fornecedores' },
        { id: 'outflows', name: 'Saídas' },
        { id: 'overdue', name: 'Inadimplência' },
        { id: 'report', name: 'Fluxo de Caixa' },
    ];
    // We don't show the 'home' step in the wizard itself
    const wizardSteps = steps.filter(s => s.id !== 'home');
    const currentIndex = wizardSteps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
                <div className="pr-4 mr-4 border-r border-gray-300">
                    <button onClick={() => setStep('home')} className="text-sap-blue hover:text-sap-light-blue transition-colors" title="Voltar ao Painel" aria-label="Voltar ao Painel de Navegação">
                        <HomeIcon />
                    </button>
                </div>
                <div className="flex items-center justify-between flex-grow">
                    {wizardSteps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center cursor-pointer text-center" onClick={() => setStep(step.id)} style={{minWidth: '80px'}}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentIndex ? 'bg-sap-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {index < currentIndex ? <CheckCircleIcon /> : index + 1}
                                </div>
                                <p className={`mt-2 text-xs md:text-sm ${index <= currentIndex ? 'text-sap-blue font-semibold' : 'text-gray-500'}`}>{step.name}</p>
                            </div>
                            {index < wizardSteps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 ${index < currentIndex ? 'bg-sap-blue' : 'bg-gray-200'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HomePage = ({ setStep }: { setStep: (step: Step) => void }) => {
    const navItems = [
        { id: 'initialBalance', name: 'Saldos Iniciais', desc: 'Defina os saldos de partida.', icon: <BanknotesIcon /> },
        { id: 'inflows', name: 'Entradas', desc: 'Cadastre as receitas previstas.', icon: <ArrowUpCircleIcon /> },
        { id: 'receipts', name: 'Recebimentos', desc: 'Confirme as entradas de caixa.', icon: <CheckBadgeIcon /> },
        { id: 'suppliers', name: 'Fornecedores', desc: 'Gerencie contas a pagar.', icon: <TruckIcon /> },
        { id: 'outflows', name: 'Saídas', desc: 'Registre todos os pagamentos.', icon: <ArrowDownCircleIcon /> },
        { id: 'overdue', name: 'Inadimplência', desc: 'Monitore recebíveis vencidos.', icon: <ExclamationTriangleIcon /> },
        { id: 'report', name: 'Fluxo de Caixa', desc: 'Visualize o relatório completo.', icon: <ChartPieIcon /> },
    ];
    
    return (
        <Card title="Painel de Navegação">
            <div className="text-center mb-8">
                 <div className="bg-sap-blue text-white rounded-lg p-8 max-w-4xl mx-auto shadow-2xl bg-cover bg-center" style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3e%3crect fill='%23005792' width='200' height='200'/%3e%3cdefs%3e%3clinearGradient id='a' gradientUnits='userSpaceOnUse' x1='100' y1='33' x2='100' y2='-3'%3e%3cstop offset='0' stop-color='%23005792' stop-opacity='0'/%3e%3cstop offset='1' stop-color='%23005792' stop-opacity='1'/%3e%3c/linearGradient%3e%3clinearGradient id='b' gradientUnits='userSpaceOnUse' x1='100' y1='135' x2='100' y2='97'%3e%3cstop offset='0' stop-color='%23005792' stop-opacity='0'/%3e%3cstop offset='1' stop-color='%23005792' stop-opacity='1'/%3e%3c/linearGradient%3e%3c/defs%3e%3cg fill='%23004a7c' fill-opacity='0.6'%3e%3crect x='100' width='100' height='100'/%3e%3crect y='100' width='100' height='100'/%3e%3c/g%3e%3cg fill-opacity='0.5'%3e%3cpolygon fill='url(%23a)' points='100 30 0 0 200 0'/%3e%3cpolygon fill='url(%23b)' points='100 100 0 130 0 100 200 100 200 130'/%3e%3c/g%3e%3c/svg%3e")`}}>
                    <h2 className="text-4xl font-bold mb-2">Bem-vindo ao Feedis</h2>
                    <p className="text-lg text-gray-200">Seu assistente inteligente para gestão de fluxo de caixa.</p>
                    <p className="mt-4 text-sm text-gray-300">Utilize os atalhos abaixo para navegar diretamente para a seção desejada.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {navItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="flex items-center text-sap-blue mb-3">
                            {item.icon}
                            <h3 className="text-lg font-bold ml-3">{item.name}</h3>
                        </div>
                        <p className="text-gray-600 text-sm flex-grow">{item.desc}</p>
                        <Button onClick={() => setStep(item.id as Step)} variant="outline" className="mt-4 w-full">Acessar</Button>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const InitialBalanceStep = ({ state, dispatch, handleFileUpload, onOpenBulkEntry, startDate, setStartDate }: { state: CashFlowState, dispatch: React.Dispatch<CashFlowAction>, handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'banks' | 'initialBalance') => void, onOpenBulkEntry: (type: BulkEntryType) => void, startDate: string, setStartDate: (date: string) => void }) => {
    const [selectedBank, setSelectedBank] = useState<string>(state.banks.length > 0 ? state.banks[0].code : '');
    const [amount, setAmount] = useState<string>('');
    const totalBalance = state.initialBalances.reduce((acc, b) => acc + b.amount, 0);
    const bankUploadInputRef = React.useRef<HTMLInputElement>(null);
    const balanceUploadInputRef = React.useRef<HTMLInputElement>(null);

    const handleAddBalance = () => {
        const bank = state.banks.find(b => b.code === selectedBank);
        if (bank && amount) {
            dispatch({ type: 'ADD_INITIAL_BALANCE', payload: { bankCode: bank.code, amount: parseFloat(amount) } });
            setAmount('');
        }
    };
    
    const bankOptions = state.banks.map(bank => ({ value: bank.code, label: `${bank.code} - ${bank.name}` }));

    return (
        <Card title="Saldos Iniciais e Data de Início">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Configuração Inicial</h3>
                    <div className="space-y-4">
                        <div>
                             <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 mb-1">Data Inicial do Fluxo de Caixa</label>
                             <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/>
                        </div>
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Banco</label>
                            <CustomSelect value={selectedBank} onChange={setSelectedBank} options={bankOptions} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-600 mb-1">Valor do Saldo Inicial (R$)</label>
                             <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000.00" className="w-full p-2 border rounded-md bg-white"/>
                        </div>
                        <Button onClick={handleAddBalance}><PlusIcon /> Adicionar Saldo</Button>
                    </div>
                     <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-2 text-gray-700">Importar Saldos em Lote</h3>
                        <div className="flex flex-wrap gap-2">
                            <input type="file" ref={balanceUploadInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => handleFileUpload(e, 'initialBalance')} />
                            <Button onClick={() => balanceUploadInputRef.current?.click()} variant="secondary"><UploadIcon /> Upload CSV</Button>
                            <Button onClick={() => onOpenBulkEntry('initialBalance')} variant="secondary">Preenchimento Manual</Button>
                            <Button onClick={() => generateCsv([['banco', 'valor']], 'template_saldos.csv')} variant="outline"><DownloadIcon /> Baixar Template</Button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Saldos Adicionados</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        {state.initialBalances.length === 0 ? <p className="text-sm text-gray-500">Nenhum saldo adicionado.</p> : (
                            <ul className="space-y-3">
                                {state.initialBalances.map((balance, i) => {
                                    const bank = state.banks.find(b => b.code === balance.bankCode);
                                    return (
                                        <li key={i} className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm">
                                            <div className="flex items-center"> <span className="font-medium">{bank?.name || `Código: ${balance.bankCode}`}</span> </div>
                                            <div className="flex items-center"> <span className="text-gray-800">{formatCurrency(balance.amount)}</span> <button onClick={() => dispatch({ type: 'REMOVE_INITIAL_BALANCE', payload: i })} className="ml-4 text-red-500 hover:text-red-700"><TrashIcon /></button> </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="mt-4 p-4 bg-sap-blue text-white rounded-lg flex justify-between items-center font-bold text-lg">
                        <span>Saldo Inicial Total:</span>
                        <span>{formatCurrency(totalBalance)}</span>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-2 text-gray-700">Gerenciar Bancos</h3>
                        <p className="text-sm text-gray-600 mb-3">Adicione novos bancos à sua lista via upload de arquivo CSV ou preenchimento manual.</p>
                        <div className="flex flex-wrap gap-2">
                            <input type="file" ref={bankUploadInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => handleFileUpload(e, 'banks')} />
                            <Button onClick={() => bankUploadInputRef.current?.click()} variant="secondary"><UploadIcon /> Upload CSV</Button>
                            <Button onClick={() => onOpenBulkEntry('banks')} variant="secondary">Preenchimento Manual</Button>
                            <Button onClick={() => generateCsv([['code', 'name']], 'template_bancos.csv')} variant="outline"><DownloadIcon /> Baixar Template</Button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const InflowsStep = ({ state, dispatch, onSqlClick, onOpenBulkEntry, handleFileUpload }: { state: CashFlowState, dispatch: React.Dispatch<CashFlowAction>, onSqlClick: () => void, onOpenBulkEntry: (type: BulkEntryType) => void, handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'revenue') => void }) => {
    const today = new Date().toISOString().split('T')[0];
    const [clientName, setClientName] = useState('');
    const [documentType, setDocumentType] = useState<'NF' | 'Previsão' | 'Carteira'>('NF');
    const [documentNumber, setDocumentNumber] = useState('');
    const [issueDate, setIssueDate] = useState(today);
    const [dueDate, setDueDate] = useState(today);
    const [type, setType] = useState('Venda de Produto');
    const [amount, setAmount] = useState('');
    const revenueUploadInputRef = React.useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const docTypes: ('NF' | 'Previsão' | 'Carteira')[] = ['NF', 'Previsão', 'Carteira'];
    const [filterDocTypes, setFilterDocTypes] = useState<Set<string>>(new Set(docTypes));


    const creditDate = useMemo(() => {
        if (!dueDate) return null;
        try {
            return calculateNextBusinessDay(dueDate);
        } catch {
            return null;
        }
    }, [dueDate]);

    const validate = () => {
        const newErrors: Record<string, boolean> = {};
        if (!clientName.trim()) newErrors.clientName = true;
        if (!documentNumber.trim()) newErrors.documentNumber = true;
        if (!amount || parseFloat(amount) <= 0) newErrors.amount = true;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleAddRevenue = () => {
        if (!validate()) return;

        if(creditDate) {
            dispatch({ type: 'ADD_REVENUE', payload: { id: Date.now(), clientName, documentType, documentNumber, issueDate: new Date(`${issueDate}T12:00:00Z`), dueDate: new Date(`${dueDate}T12:00:00Z`), creditDate, type, amount: parseFloat(amount), } });
            setClientName(''); setDocumentType('NF'); setDocumentNumber(''); setIssueDate(today); setDueDate(today); setType('Venda de Produto'); setAmount(''); setErrors({});
        }
    };
    
    const handleDocTypeFilterChange = (docType: string) => {
        setFilterDocTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docType)) newSet.delete(docType); else newSet.add(docType);
            return newSet;
        });
    };

    const clearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterDocTypes(new Set(docTypes));
    };

    const filteredRevenues = useMemo(() => {
        return state.revenues.filter(revenue => {
            const creditDateOnly = new Date(new Date(revenue.creditDate).toISOString().split('T')[0] + 'T00:00:00Z');
            if (filterStartDate) { const startDate = new Date(filterStartDate + 'T00:00:00Z'); if (creditDateOnly < startDate) return false; }
            if (filterEndDate) { const endDate = new Date(filterEndDate + 'T00:00:00Z'); if (creditDateOnly > endDate) return false; }
            if (!filterDocTypes.has(revenue.documentType)) return false;
            return true;
        });
    }, [state.revenues, filterStartDate, filterEndDate, filterDocTypes]);

    const totalInflows = filteredRevenues.reduce((acc, r) => acc + r.amount, 0);

    const summaryByCreditDate = useMemo(() => {
        const summary = filteredRevenues.reduce((acc, revenue) => {
            const dateStr = new Date(revenue.creditDate).toISOString().split('T')[0];
            if (!acc[dateStr]) acc[dateStr] = 0;
            acc[dateStr] += revenue.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(summary).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
    }, [filteredRevenues]);
    
    return (
        <Card title="Entradas Operacionais (Receitas)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Adicionar Receita</h3>
                     {Object.values(errors).some(Boolean) && (<div className="flex items-center p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert"><ErrorIcon /><span className="ml-2 font-medium">Existem dados obrigatórios não preenchidos.</span></div>)}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Cliente</label>
                                <input type="text" value={clientName} onChange={e => { setClientName(e.target.value); if (errors.clientName) setErrors(prev => ({ ...prev, clientName: false })); }} placeholder="Ex: Empresa Y" className={`w-full p-2 border rounded-md bg-white ${errors.clientName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Documento</label>
                                <select value={documentType} onChange={e => setDocumentType(e.target.value as any)} className="w-full p-2 border rounded-md bg-white border-gray-300"><option>NF</option><option>Previsão</option><option>Carteira</option></select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Número do Documento</label>
                                <input type="text" value={documentNumber} onChange={e => { setDocumentNumber(e.target.value); if (errors.documentNumber) setErrors(prev => ({ ...prev, documentNumber: false })); }} placeholder="12345" className={`w-full p-2 border rounded-md bg-white ${errors.documentNumber ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Data Emissão</label> <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full p-2 border rounded-md bg-white border-gray-300"/></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Data Vencimento</label> <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded-md bg-white border-gray-300"/></div>
                            
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Data de Crédito (Automática)</label>
                                <div className="p-2 border rounded-md bg-gray-100 text-gray-800 font-medium">{creditDate ? creditDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Selecione a data de vencimento'}</div>
                                <p className="text-xs text-gray-500 mt-1">Esta é a data que será usada no fluxo de caixa (1º dia útil após o vencimento).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Receita</label>
                                <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 border rounded-md bg-white border-gray-300"><option>Venda de Produto</option><option>Venda de Serviço</option><option>Venda de Sucatas</option><option>Outros</option></select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Valor (R$)</label>
                                <input type="number" value={amount} onChange={e => { setAmount(e.target.value); if (errors.amount) setErrors(prev => ({ ...prev, amount: false })); }} placeholder="15000.00" className={`w-full p-2 border rounded-md bg-white ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} />
                            </div>
                        </div>
                        <Button onClick={handleAddRevenue}><PlusIcon /> Adicionar Receita</Button>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-2 text-gray-700">Importar Dados em Lote</h3>
                        <div className="flex flex-wrap gap-2">
                             <input type="file" ref={revenueUploadInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => handleFileUpload(e, 'revenue')} />
                            <Button onClick={() => onOpenBulkEntry('revenue')} variant="secondary">Preenchimento Manual</Button>
                            <Button onClick={() => generateCsv([['nome_cliente', 'tipo_documento', 'numero_documento', 'data_emissao(YYYY-MM-DD)', 'data_vencimento(YYYY-MM-DD)', 'tipo_receita', 'valor']], 'template_entradas.csv')} variant="outline"><DownloadIcon /> Baixar Template</Button>
                            <Button onClick={onSqlClick} variant="outline"><DatabaseIcon /> Conectar SQL</Button>
                        </div>
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-100 border">
                         <h3 className="font-semibold mb-4 text-gray-700">Relatório de Entradas</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Data de Crédito (Início)</label><input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/></div>
                            <div><label className="block text-sm font-medium text-gray-600 mb-1">Data de Crédito (Fim)</label><input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/></div>
                         </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Tipo de Documento</label>
                            <div className="flex flex-wrap gap-4">{docTypes.map(docType => (<label key={docType} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={filterDocTypes.has(docType)} onChange={() => handleDocTypeFilterChange(docType)} className="form-checkbox h-4 w-4 text-sap-blue rounded"/><span>{docType}</span></label>))}</div>
                         </div>
                         <div className="mt-4"><Button onClick={clearFilters} variant="outline">Limpar Filtros</Button></div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2 text-gray-700">Receitas Adicionadas (Filtrado)</h3>
                        <div className="bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                            <table className="w-full text-sm"><thead className="bg-gray-200 sticky top-0"><tr className="text-gray-600"><th className="p-2 text-left font-semibold">Cliente</th><th className="p-2 text-left font-semibold">Documento</th><th className="p-2 text-left font-semibold">Vencimento</th><th className="p-2 text-left font-semibold">Crédito</th><th className="p-2 text-right font-semibold">Valor</th><th className="p-2 text-right"></th></tr></thead>
                               <tbody>{filteredRevenues.length === 0 ? (<tr><td colSpan={6} className="p-4 text-center text-gray-500">Nenhuma receita encontrada para os filtros selecionados.</td></tr>) : (filteredRevenues.map((revenue) => (<tr key={revenue.id} className="border-b text-gray-800"><td className="p-2">{revenue.clientName}</td><td className="p-2">{revenue.documentType}<br/><span className="text-xs text-gray-500">{revenue.documentNumber}</span></td><td className="p-2">{new Date(revenue.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td><td className="p-2 font-semibold">{new Date(revenue.creditDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td><td className="p-2 text-right font-medium">{formatCurrency(revenue.amount)}</td><td className="p-2 text-right"><button onClick={() => dispatch({type: 'REMOVE_REVENUE', payload: revenue.id})} className="text-red-500 hover:text-red-700"><TrashIcon /></button></td></tr>)))}</tbody>
                            </table>
                        </div>
                    </div>
                    {summaryByCreditDate.length > 0 && (<div><h3 className="font-semibold mb-2 text-gray-700">Resumo por Data de Crédito (Filtrado)</h3><div className="bg-gray-50 rounded-lg max-h-32 overflow-y-auto"><table className="w-full text-sm"><thead className="bg-gray-200 sticky top-0"><tr className="text-gray-600"><th className="p-2 text-left font-semibold">Data</th><th className="p-2 text-right font-semibold">Valor Total</th></tr></thead><tbody>{summaryByCreditDate.map(([date, total]) => (<tr key={date} className="border-b text-gray-800"><td className="p-2 font-medium">{new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</td><td className="p-2 text-right font-semibold text-green-700">{formatCurrency(total)}</td></tr>))}</tbody></table></div></div>)}
                    <div className="mt-4 p-4 bg-green-600 text-white rounded-lg flex justify-between items-center font-bold text-lg"><span>Total de Entradas (Filtrado):</span><span>{formatCurrency(totalInflows)}</span></div>
                </div>
            </div>
        </Card>
    );
};

const ReceiptsStep = ({ state, dispatch }: { state: CashFlowState, dispatch: React.Dispatch<CashFlowAction> }) => {
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [showFuture, setShowFuture] = useState(false);
    
    const pendingRevenues = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        let revenues = state.revenues.filter(r => {
            if (state.confirmedRevenueIds.includes(r.id)) return false; // Exclude confirmed
            if (showFuture) return true; // Show all pending if toggled
            return new Date(r.creditDate) <= today; // Default: show only due or overdue
        });
        
        if (filterStartDate) {
            const startDate = new Date(filterStartDate + 'T00:00:00Z');
            revenues = revenues.filter(r => new Date(r.creditDate) >= startDate);
        }
        if (filterEndDate) {
            const endDate = new Date(filterEndDate + 'T00:00:00Z');
            revenues = revenues.filter(r => new Date(r.creditDate) <= endDate);
        }
        
        return revenues.sort((a, b) => new Date(a.creditDate).getTime() - new Date(b.creditDate).getTime());
    }, [state.revenues, state.confirmedRevenueIds, filterStartDate, filterEndDate, showFuture]);

    const totalPending = pendingRevenues.reduce((acc, r) => acc + r.amount, 0);
    const clearFilters = () => { setFilterStartDate(''); setFilterEndDate(''); };

    return (
        <Card title="Confirmar Recebimentos">
            <div className="mb-4 bg-blue-50 border-l-4 border-sap-blue p-4">
                <p className="text-sm text-gray-700">
                    Por padrão, esta tela mostra apenas os recebimentos com data de crédito **hoje ou anterior**. Use os filtros para períodos específicos ou o botão abaixo para visualizar previsões futuras.
                </p>
            </div>
             <div className="p-4 rounded-lg bg-gray-100 border mb-4">
                <div className="flex justify-between items-start flex-wrap">
                     <h3 className="font-semibold mb-3 text-gray-700">Filtrar por Data de Crédito</h3>
                     <label className="flex items-center space-x-2 mb-3 cursor-pointer">
                        <input type="checkbox" checked={showFuture} onChange={e => setShowFuture(e.target.checked)} className="form-checkbox h-5 w-5 text-sap-blue rounded" />
                        <span className="text-sm font-medium text-gray-700">Mostrar recebimentos futuros</span>
                    </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data de Início</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Final</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/>
                    </div>
                    <div><Button onClick={clearFilters} variant="outline" className="w-full">Limpar Filtros</Button></div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                 <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                        <tr className="text-gray-600">
                            <th className="p-2 text-left font-semibold">Cliente</th>
                            <th className="p-2 text-left font-semibold">Documento</th>
                            <th className="p-2 text-left font-semibold">Data de Crédito</th>
                            <th className="p-2 text-right font-semibold">Valor</th>
                            <th className="p-2 text-center font-semibold">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRevenues.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">Nenhuma receita pendente encontrada para os filtros selecionados.</td></tr>
                        ) : (
                            pendingRevenues.map((revenue) => (
                                <tr key={revenue.id} className="border-b text-gray-800 hover:bg-gray-100">
                                    <td className="p-2">{revenue.clientName}</td>
                                    <td className="p-2">{revenue.documentType} #{revenue.documentNumber}</td>
                                    <td className="p-2 font-semibold">{new Date(revenue.creditDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(revenue.amount)}</td>
                                    <td className="p-2 text-center">
                                        <Button onClick={() => dispatch({type: 'CONFIRM_REVENUE', payload: revenue.id})} variant="outline" title="Confirmar Recebimento">
                                            <CheckIcon />
                                            <span className="hidden md:inline ml-2">Confirmar</span>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 p-4 bg-sap-blue text-white rounded-lg flex justify-between items-center font-bold text-lg">
                <span>Total Pendente (Filtrado):</span>
                <span>{formatCurrency(totalPending)}</span>
            </div>
        </Card>
    );
};

const OverdueStep = ({ state }: { state: CashFlowState }) => {
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const overdueRevenues = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        let revenues = state.revenues
            .filter(r => !state.confirmedRevenueIds.includes(r.id) && new Date(r.creditDate) < today);

        if (filterStartDate) {
            const startDate = new Date(filterStartDate + 'T00:00:00Z');
            revenues = revenues.filter(r => new Date(r.creditDate) >= startDate);
        }
        if (filterEndDate) {
            const endDate = new Date(filterEndDate + 'T00:00:00Z');
            revenues = revenues.filter(r => new Date(r.creditDate) <= endDate);
        }

        return revenues.sort((a, b) => new Date(a.creditDate).getTime() - new Date(b.creditDate).getTime());
    }, [state.revenues, state.confirmedRevenueIds, filterStartDate, filterEndDate]);

    const totalOverdue = overdueRevenues.reduce((acc, r) => acc + r.amount, 0);
    const clearFilters = () => { setFilterStartDate(''); setFilterEndDate(''); };

    return (
        <Card title="Títulos em Atraso (Inadimplência)">
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-gray-700">
                   Esta tela exibe receitas não confirmadas cuja data de crédito já passou. Use os filtros para refinar sua busca.
                </p>
            </div>
            <div className="p-4 rounded-lg bg-gray-100 border mb-4">
                <h3 className="font-semibold mb-3 text-gray-700">Filtrar por Data de Crédito</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data de Início</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Final</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/>
                    </div>
                    <div><Button onClick={clearFilters} variant="outline" className="w-full">Limpar Filtros</Button></div>
                </div>
            </div>
            <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-200 sticky top-0">
                        <tr className="text-gray-600">
                            <th className="p-2 text-left font-semibold">Cliente</th>
                            <th className="p-2 text-left font-semibold">Data de Crédito</th>
                            <th className="p-2 text-right font-semibold">Dias em Atraso</th>
                            <th className="p-2 text-right font-semibold">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {overdueRevenues.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhum título em atraso encontrado para os filtros selecionados.</td></tr>
                        ) : (
                            overdueRevenues.map((revenue) => {
                                const today = new Date(); today.setUTCHours(0, 0, 0, 0);
                                const creditDate = new Date(revenue.creditDate); creditDate.setUTCHours(0, 0, 0, 0);
                                const daysOverdue = Math.floor((today.getTime() - creditDate.getTime()) / (1000 * 3600 * 24));
                                return (
                                <tr key={revenue.id} className="border-b text-gray-800 bg-red-50 hover:bg-red-100">
                                    <td className="p-2">{revenue.clientName}</td>
                                    <td className="p-2 font-semibold">{new Date(revenue.creditDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                    <td className="p-2 text-right font-bold text-red-600">{daysOverdue}</td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(revenue.amount)}</td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 p-4 bg-red-600 text-white rounded-lg flex justify-between items-center font-bold text-lg">
                <span>Total em Atraso (Filtrado):</span>
                <span>{formatCurrency(totalOverdue)}</span>
            </div>
        </Card>
    );
};

const SuppliersStep = ({ state, dispatch, onOpenBulkEntry, handleFileUpload }: { state: CashFlowState, dispatch: React.Dispatch<CashFlowAction>, onOpenBulkEntry: (type: BulkEntryType) => void, handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'supplier') => void }) => {
    const [name, setName] = useState('');
    const [cashFlowType, setCashFlowType] = useState('Fluxo de Caixa Operacional');
    const [supplierType, setSupplierType] = useState('Fornecedor');
    const [assignBank, setAssignBank] = useState(false);
    const [selectedBankCode, setSelectedBankCode] = useState<string | undefined>(undefined);
    const supplierUploadInputRef = React.useRef<HTMLInputElement>(null);

    const handleAddSupplier = () => {
        if(name && cashFlowType && supplierType) {
            dispatch({ type: 'ADD_SUPPLIER', payload: { id: Date.now(), name, cashFlowType, supplierType, bankCode: assignBank ? selectedBankCode : undefined } });
            setName(''); setCashFlowType('Fluxo de Caixa Operacional'); setSupplierType('Fornecedor'); setAssignBank(false); setSelectedBankCode(undefined);
        }
    };
    
    return (
        <Card title="Cadastro de Fornecedores e Contas">
            <div className="mb-4 bg-blue-50 border-l-4 border-sap-blue p-4"><p className="text-sm text-gray-700">Aqui você cadastra todos os tipos de saídas de caixa: despesas, investimentos e financiamentos.</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Adicionar Conta/Fornecedor</h3>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-600 mb-1">Nome</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Cia Saneamento de São Paulo" className="w-full p-2 border rounded-md bg-white"/></div>
                        <div><label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Fluxo de Caixa</label><select value={cashFlowType} onChange={e => setCashFlowType(e.target.value)} className="w-full p-2 border rounded-md bg-white"><option>Fluxo de Caixa Operacional</option><option>Fluxo de Caixa de Investimento</option><option>Fluxo de Caixa de Financiamento</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Conta/Fornecedor</label><input type="text" value={supplierType} onChange={e => setSupplierType(e.target.value)} placeholder="Ex: Água e Esgoto" className="w-full p-2 border rounded-md bg-white"/></div>
                        <div className="p-3 bg-gray-50 rounded-md">
                            <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={assignBank} onChange={e => setAssignBank(e.target.checked)} className="form-checkbox h-5 w-5 text-sap-blue"/><span className="text-sm font-medium">Indicar banco para pagamento?</span></label>
                            {assignBank && (<div className="mt-3"><label className="block text-sm font-medium text-gray-600 mb-1">Selecione o Banco</label><select value={selectedBankCode} onChange={e => setSelectedBankCode(e.target.value)} className="w-full p-2 border rounded-md bg-white"><option value="">Selecione um banco</option>{state.banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div>)}
                        </div>
                        <Button onClick={handleAddSupplier}><PlusIcon/> Adicionar</Button>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold mb-2 text-gray-700">Importar Dados em Lote</h3>
                        <div className="flex flex-wrap gap-2">
                           <input type="file" ref={supplierUploadInputRef} style={{ display: 'none' }} accept=".csv" onChange={(e) => handleFileUpload(e, 'supplier')} />
                           <Button onClick={() => onOpenBulkEntry('supplier')} variant="secondary">Preenchimento Manual</Button>
                           <Button onClick={() => generateCsv([['nome_fornecedor', 'tipo_fluxo_caixa', 'tipo_fornecedor']], 'template_fornecedores.csv')} variant="outline"><DownloadIcon /> Baixar Template</Button>
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Contas Cadastradas</h3>
                    <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                         <table className="w-full text-sm">
                           <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2 text-left font-semibold text-gray-600">Nome</th><th className="p-2 text-left font-semibold text-gray-600">Tipo Fluxo</th><th className="p-2 text-left font-semibold text-gray-600">Banco</th><th className="p-2"></th></tr></thead>
                           <tbody>{state.suppliers.length === 0 ? (<tr><td colSpan={4} className="p-4 text-center text-gray-500">Nenhuma conta cadastrada.</td></tr>) : (state.suppliers.map((supplier) => (<tr key={supplier.id} className="border-b"><td className="p-2 font-medium text-gray-800">{supplier.name}<br/><span className="font-normal text-xs text-gray-500">{supplier.supplierType}</span></td><td className="p-2 text-gray-600 text-xs">{supplier.cashFlowType}</td><td className="p-2 text-gray-800">{supplier.bankCode ? state.banks.find(b => b.code === supplier.bankCode)?.name : 'Geral'}</td><td className="p-2 text-right"><button onClick={() => dispatch({type: 'REMOVE_SUPPLIER', payload: supplier.id})} className="text-red-500 hover:text-red-700"><TrashIcon /></button></td></tr>)))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Card>
    );
};

const OutflowsStep = ({ state, dispatch }: { state: CashFlowState, dispatch: React.Dispatch<CashFlowAction> }) => {
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const totalOutflows = state.outflows.reduce((acc, o) => acc + o.amount, 0);

    const handleAddOutflow = () => {
        const supplier = state.suppliers.find(s => s.id === parseFloat(selectedSupplier));
        if (supplier && amount && date) {
            dispatch({ type: 'ADD_OUTFLOW', payload: { id: Date.now(), supplierId: supplier.id, amount: parseFloat(amount), date: new Date(date + 'T12:00:00Z') } });
            setSelectedSupplier(''); setAmount('');
        }
    };
    
    const outflowsByCategory = (category: string) => state.outflows.filter(o => { const supplier = state.suppliers.find(s => s.id === o.supplierId); return supplier?.cashFlowType === category; });

    const renderOutflowCategory = (title: string, category: string) => (
        <div>
            <h4 className="font-semibold text-gray-700 mb-2">{title}</h4>
            <div className="bg-white p-2 rounded-lg max-h-48 overflow-y-auto">
                {outflowsByCategory(category).length === 0 ? <p className="text-xs text-center text-gray-500 p-2">Nenhuma saída.</p> : (<table className="w-full text-xs"><tbody>{outflowsByCategory(category).map(o => { const supplier = state.suppliers.find(s => s.id === o.supplierId); return (<tr key={o.id} className="border-b"><td className="p-1 font-medium text-sap-blue">{supplier?.name || 'Fornecedor não encontrado'}</td><td className="p-1 text-gray-600">{new Date(o.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td><td className="p-1 text-right font-medium text-sap-blue">{formatCurrency(o.amount)}</td><td className="p-1 text-right"><button onClick={() => dispatch({type: 'REMOVE_OUTFLOW', payload: o.id})} className="text-red-500 hover:text-red-700"><TrashIcon/></button></td></tr>)})}</tbody></table>)}
            </div>
        </div>
    );

    return (
        <Card title="Lançamento de Saídas">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-4 text-gray-700">Adicionar Saída</h3>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-600 mb-1">Conta/Fornecedor</label><select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="w-full p-2 border rounded-md bg-white"><option value="">Selecione uma conta</option>{state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.cashFlowType.split(' ')[3]})</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-600 mb-1">Valor (R$)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1200.00" className="w-full p-2 border rounded-md bg-white"/></div>
                        <div><label htmlFor="outflowDate" className="block text-sm font-medium text-gray-600 mb-1">Data de Vencimento</label><input id="outflowDate" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-md bg-white"/></div>
                        <Button onClick={handleAddOutflow}><PlusIcon/> Adicionar Saída</Button>
                    </div>
                </div>
                <div>
                     <h3 className="font-semibold mb-4 text-gray-700">Saídas Lançadas</h3>
                     <div className="space-y-4">
                        {renderOutflowCategory('Fluxo de Caixa Operacional', 'Fluxo de Caixa Operacional')}
                        {renderOutflowCategory('Fluxo de Caixa de Investimento', 'Fluxo de Caixa de Investimento')}
                        {renderOutflowCategory('Fluxo de Caixa de Financiamento', 'Fluxo de Caixa de Financiamento')}
                     </div>
                     <div className="mt-4 p-4 bg-red-600 text-white rounded-lg flex justify-between items-center font-bold text-lg"><span>Total de Saídas:</span><span>{formatCurrency(totalOutflows)}</span></div>
                </div>
            </div>
        </Card>
    );
};

const CashFlowReport = ({ state, startDate }: { state: CashFlowState, startDate: string }) => {
    const [days, setDays] = useState(30);
    const [expandedRows, setExpandedRows] = useState(new Set<string>());

    const handleToggleRow = (rowId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            } else {
                newSet.add(rowId);
            }
            return newSet;
        });
    };

    const reportData = useMemo(() => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const confirmedRevenues = state.revenues.filter(r => state.confirmedRevenueIds.includes(r.id));
        const projectedRevenues = state.revenues.filter(r => !state.confirmedRevenueIds.includes(r.id) && new Date(r.creditDate) >= today);

        const headerDates: Date[] = [];
        const reportStartDate = new Date(startDate + 'T12:00:00Z');
        for (let i = 0; i < days; i++) {
            const loopDate = new Date(reportStartDate);
            loopDate.setUTCDate(reportStartDate.getUTCDate() + i);
            headerDates.push(loopDate);
        }
        const dateStrings = headerDates.map(d => d.toISOString().split('T')[0]);

        const dailyInflows = new Map<string, number>();
        const dailyProjectedInflows = new Map<string, number>();

        confirmedRevenues.forEach(r => {
            const dateStr = new Date(r.creditDate).toISOString().split('T')[0];
            dailyInflows.set(dateStr, (dailyInflows.get(dateStr) || 0) + r.amount);
        });
        projectedRevenues.forEach(r => {
            const dateStr = new Date(r.creditDate).toISOString().split('T')[0];
            dailyProjectedInflows.set(dateStr, (dailyProjectedInflows.get(dateStr) || 0) + r.amount);
        });

        const supplierMap = new Map(state.suppliers.map(s => [s.id, s]));
        const uniqueConfirmedRevenueTypes = [...new Set(confirmedRevenues.map(r => r.type))].sort();
        const uniqueProjectedRevenueTypes = [...new Set(projectedRevenues.map(r => r.type))].sort();

        const uniqueSuppliersByType = state.suppliers.reduce((acc, s) => {
            if (!acc[s.cashFlowType]) acc[s.cashFlowType] = new Set();
            acc[s.cashFlowType].add(s.supplierType);
            return acc;
        }, {} as Record<string, Set<string>>);

        const opSupplierTypes = [...(uniqueSuppliersByType['Fluxo de Caixa Operacional'] || [])].sort();
        const invSupplierTypes = [...(uniqueSuppliersByType['Fluxo de Caixa de Investimento'] || [])].sort();
        const finSupplierTypes = [...(uniqueSuppliersByType['Fluxo de Caixa de Financiamento'] || [])].sort();
        
        const createRow = (id: string, label: string, indentationLevel: number, options: {isBold?: boolean, isSubtotal?: boolean} = {}): ReportRow => ({ id, label, indentationLevel, dailyValues: Array(days).fill(0), ...options });

        let rows: ReportRow[] = [];
        rows.push(createRow('initial_balance', 'Saldo Inicial de Caixa', 0, {isBold: false, isSubtotal: true}));
        rows.push(createRow('inflows_header', '(+) Recebimentos Operacionais', 0, {isBold: true}));
        uniqueConfirmedRevenueTypes.forEach(type => { rows.push(createRow(`inflow_${type}`, type, 1)); });

        if (uniqueProjectedRevenueTypes.length > 0) {
            rows.push(createRow('projected_inflows_header', '(+) Previsão de Recebimentos', 0, {isBold: true}));
            uniqueProjectedRevenueTypes.forEach(type => { rows.push(createRow(`projected_inflow_${type}`, type, 1)); });
        }

        rows.push(createRow('outflows_op_header', '(-) Pagamentos Operacionais', 0, {isBold: true}));
        opSupplierTypes.forEach(type => { rows.push(createRow(`outflow_op_${type}`, `(-) ${type}`, 1)); });
        rows.push(createRow('op_generation', '(=) Geração Operacional de Caixa', 0, {isBold: true, isSubtotal: true}));
        rows.push(createRow('outflows_inv_header', '(-) Investimentos', 0, {isBold: true}));
        invSupplierTypes.forEach(supplierType => { rows.push(createRow(`outflow_inv_${supplierType}`, `(-) ${supplierType}`, 1)); });
        rows.push(createRow('outflows_fin_header', '(-) Financiamentos', 0, {isBold: true}));
        finSupplierTypes.forEach(supplierType => { rows.push(createRow(`outflow_fin_${supplierType}`, `(-) ${supplierType}`, 1)); });
        rows.push(createRow('net_cash_flow', '(=) Fluxo de Caixa Líquido', 0, {isBold: true, isSubtotal: true}));
        rows.push(createRow('final_balance', 'Saldo Final de Caixa', 0, {isBold: true, isSubtotal: true}));
        
        const rowMap = new Map<string, ReportRow>(rows.map(r => [r.id, r]));
        const detailsByRowId = new Map<string, (Revenue | Outflow)[]>();

        confirmedRevenues.forEach(r => {
            const rowId = `inflow_${r.type}`;
            if (!detailsByRowId.has(rowId)) detailsByRowId.set(rowId, []);
            detailsByRowId.get(rowId)!.push(r);
        });
        projectedRevenues.forEach(r => {
            const rowId = `projected_inflow_${r.type}`;
            if (!detailsByRowId.has(rowId)) detailsByRowId.set(rowId, []);
            detailsByRowId.get(rowId)!.push(r);
        });
        state.outflows.forEach(o => {
            const sInfo = supplierMap.get(o.supplierId); if (!sInfo) return;
            let rowId = '';
            if (sInfo.cashFlowType === 'Fluxo de Caixa Operacional') rowId = `outflow_op_${sInfo.supplierType}`;
            else if (sInfo.cashFlowType === 'Fluxo de Caixa de Investimento') rowId = `outflow_inv_${sInfo.supplierType}`;
            else if (sInfo.cashFlowType === 'Fluxo de Caixa de Financiamento') rowId = `outflow_fin_${sInfo.supplierType}`;
            if (rowId) {
                if (!detailsByRowId.has(rowId)) detailsByRowId.set(rowId, []);
                detailsByRowId.get(rowId)!.push(o);
            }
        });

        let currentBalance = state.initialBalances.reduce((acc, b) => acc + b.amount, 0);

        for (let i = 0; i < days; i++) {
            const dateStr = dateStrings[i];
            
            let dailyConfirmedInflow = 0;
            confirmedRevenues.filter(r => new Date(r.creditDate).toISOString().split('T')[0] === dateStr).forEach(r => {
                 const row = rowMap.get(`inflow_${r.type}`); if(row) row.dailyValues[i] += r.amount; dailyConfirmedInflow += r.amount;
            });

            let dailyProjectedInflow = 0;
            projectedRevenues.filter(r => new Date(r.creditDate).toISOString().split('T')[0] === dateStr).forEach(r => {
                 const row = rowMap.get(`projected_inflow_${r.type}`); if(row) row.dailyValues[i] += r.amount; dailyProjectedInflow += r.amount;
            });

            rowMap.get('inflows_header')!.dailyValues[i] = dailyConfirmedInflow;
            const projectedHeader = rowMap.get('projected_inflows_header');
            if (projectedHeader) projectedHeader.dailyValues[i] = dailyProjectedInflow;

            let dailyOpOutflowTotal = 0, dailyInvOutflowTotal = 0, dailyFinOutflowTotal = 0;
            const dailyOutflowsForDate = state.outflows.filter(o => { const oDate = new Date(o.date); return !isNaN(oDate.getTime()) && oDate.toISOString().split('T')[0] === dateStr });

            dailyOutflowsForDate.forEach(outflow => {
                 const sInfo = supplierMap.get(outflow.supplierId); if (!sInfo) return;
                 if (sInfo.cashFlowType === 'Fluxo de Caixa Operacional') { const row = rowMap.get(`outflow_op_${sInfo.supplierType}`); if (row) row.dailyValues[i] += outflow.amount; dailyOpOutflowTotal += outflow.amount; } 
                 else if (sInfo.cashFlowType === 'Fluxo de Caixa de Investimento') { const row = rowMap.get(`outflow_inv_${sInfo.supplierType}`); if (row) row.dailyValues[i] += outflow.amount; dailyInvOutflowTotal += outflow.amount; } 
                 else if (sInfo.cashFlowType === 'Fluxo de Caixa de Financiamento') { const row = rowMap.get(`outflow_fin_${sInfo.supplierType}`); if (row) row.dailyValues[i] += outflow.amount; dailyFinOutflowTotal += outflow.amount; }
            });
            rowMap.get('outflows_op_header')!.dailyValues[i] = dailyOpOutflowTotal;
            rowMap.get('outflows_inv_header')!.dailyValues[i] = dailyInvOutflowTotal;
            rowMap.get('outflows_fin_header')!.dailyValues[i] = dailyFinOutflowTotal;
            
            const totalDailyInflows = dailyConfirmedInflow + dailyProjectedInflow;
            const opGeneration = totalDailyInflows - dailyOpOutflowTotal;
            const netCashFlow = opGeneration - dailyInvOutflowTotal - dailyFinOutflowTotal;

            rowMap.get('op_generation')!.dailyValues[i] = opGeneration;
            rowMap.get('net_cash_flow')!.dailyValues[i] = netCashFlow;
            rowMap.get('initial_balance')!.dailyValues[i] = currentBalance;
            const finalBalance = currentBalance + netCashFlow;
            rowMap.get('final_balance')!.dailyValues[i] = finalBalance;
            currentBalance = finalBalance;
        }
        return { headerDates, rows, detailsByRowId, supplierMap };
    }, [state, days, startDate]);

    const renderCell = (value: number, isSubtotal: boolean = false) => {
        const isZero = Math.abs(value) < 0.001; const textColor = value < 0 ? 'text-red-600' : 'text-gray-800'; const formattedValue = isZero ? '0,00' : formatCurrency(value).replace('R$', '').trim();
        return (<td className={`p-2 text-right whitespace-nowrap font-mono text-sm ${textColor} ${isSubtotal ? 'font-bold bg-gray-100' : ''}`}>{formattedValue}</td>);
    }
    
    return (
        <Card title="Relatório de Fluxo de Caixa Direto">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="font-semibold">Período: {new Date(startDate + 'T00:00:00').toLocaleDateString()} a {reportData.headerDates[reportData.headerDates.length - 1]?.toLocaleDateString() || ''}</h3>
                <div className="flex items-center space-x-4"><label className="flex items-center space-x-2"><span className="text-sm font-medium">Visualizar dias:</span><input type="number" value={days} onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 p-1 border rounded-md bg-white"/></label></div>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left table-fixed">
                    <thead className="bg-sap-header text-white sticky top-0 z-10">
                        <tr>
                            <th className="p-2 font-semibold w-64 sticky left-0 bg-sap-header">Fluxo de Caixa Direto</th>
                            {reportData.headerDates.map((date, i) => (<th key={i} className="p-2 font-semibold w-32 text-center">{date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).split(',')[0]}<br/>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</th>))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {reportData.rows.map((row) => {
                            const isExpandable = row.indentationLevel === 1;
                            const isExpanded = expandedRows.has(row.id);
                            const details = reportData.detailsByRowId.get(row.id)?.filter(tx => {
                                const txDate = new Date('date' in tx ? tx.date : tx.creditDate);
                                return txDate >= reportData.headerDates[0] && txDate <= reportData.headerDates[reportData.headerDates.length - 1];
                            }).sort((a,b) => new Date('date' in a ? a.date : a.creditDate).getTime() - new Date('date' in b ? b.date : b.creditDate).getTime());

                            return (
                                <React.Fragment key={row.id}>
                                    <tr className={`border-b ${row.isSubtotal ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                        <td className={`p-2 font-medium sticky left-0 z-0 ${row.isBold ? 'font-bold' : ''} ${row.id.startsWith('outflow') ? 'text-sap-blue' : (row.isBold ? 'text-gray-800' : 'text-gray-600')} ${row.isSubtotal ? 'bg-gray-100' : 'bg-white'}`} style={{ paddingLeft: `${1 + row.indentationLevel * 1.5}rem`}}>
                                            <div className="flex items-center">
                                                {(isExpandable && (details?.length ?? 0) > 0) ? (
                                                    <button onClick={() => handleToggleRow(row.id)} className="mr-2 text-sap-blue">
                                                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                                    </button>
                                                ) : <span className="w-6 inline-block mr-2"></span>}
                                                {row.label}
                                            </div>
                                        </td>
                                        {row.dailyValues.map((value, i) => renderCell(value, row.isSubtotal))}
                                    </tr>
                                    {isExpanded && details && (
                                        <tr>
                                            <td colSpan={days + 1} className="p-0 bg-gray-50 sticky left-0">
                                                 <div className="p-3 pl-12">
                                                    <table className="w-full text-xs">
                                                        <thead className="border-b">
                                                            <tr>
                                                                <th className="p-1 text-left font-semibold text-gray-600 w-1/4">Data</th>
                                                                <th className="p-1 text-left font-semibold text-gray-600 w-2/4">Descrição</th>
                                                                <th className="p-1 text-right font-semibold text-gray-600 w-1/4">Valor</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.map(tx => {
                                                                 const txDate = 'date' in tx ? tx.date : tx.creditDate;
                                                                 const description = 'clientName' in tx ? `${tx.clientName} (Doc: ${tx.documentNumber})` : reportData.supplierMap.get((tx as Outflow).supplierId)?.name || '';
                                                                 return (
                                                                     <tr key={tx.id} className="border-b last:border-b-0 hover:bg-gray-100">
                                                                        <td className="p-1 text-gray-700">{new Date(txDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                                        <td className="p-1 text-gray-700">{description}</td>
                                                                        <td className={`p-1 text-right font-mono ${'amount' in tx && tx.amount < 0 ? 'text-red-600' : 'text-gray-800'}`}>{formatCurrency(tx.amount)}</td>
                                                                    </tr>
                                                                 )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const BulkEntryModal: React.FC<{ type: BulkEntryType; rows: any[]; state: CashFlowState; onClose: () => void; onRowChange: (index: number, field: string, value: any) => void; onAddRow: () => void; onRemoveRow: (index: number) => void; onSubmit: () => void; }> = ({ type, rows, state, onClose, onRowChange, onAddRow, onRemoveRow, onSubmit }) => {
    const renderRowInputs = (row: any, index: number) => {
        switch (type) {
            case 'banks': return (<><div className="flex-1"><input type="text" value={row.code} onChange={(e) => onRowChange(index, 'code', e.target.value)} placeholder="Código" className="w-full p-2 border rounded-md bg-white"/></div><div className="flex-[3]"><input type="text" value={row.name} onChange={(e) => onRowChange(index, 'name', e.target.value)} placeholder="Nome do Banco" className="w-full p-2 border rounded-md bg-white"/></div></>);
            case 'initialBalance': return (<><div className="flex-1"><select value={row.bankCode} onChange={(e) => onRowChange(index, 'bankCode', e.target.value)} className="w-full p-2 border rounded-md bg-white">{state.banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div><div className="flex-1"><input type="number" value={row.amount} onChange={(e) => onRowChange(index, 'amount', e.target.value)} placeholder="Valor" className="w-full p-2 border rounded-md bg-white"/></div></>);
            case 'revenue': return (<div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full"><input type="text" value={row.clientName} onChange={(e) => onRowChange(index, 'clientName', e.target.value)} placeholder="Nome do Cliente" className="w-full p-2 border rounded-md bg-white"/><select value={row.documentType} onChange={(e) => onRowChange(index, 'documentType', e.target.value)} className="w-full p-2 border rounded-md bg-white"><option>NF</option><option>Previsão</option><option>Carteira</option></select><input type="text" value={row.documentNumber} onChange={(e) => onRowChange(index, 'documentNumber', e.target.value)} placeholder="Num. Doc." className="w-full p-2 border rounded-md bg-white"/><input type="date" value={row.issueDate} onChange={(e) => onRowChange(index, 'issueDate', e.target.value)} className="w-full p-2 border rounded-md bg-white"/><input type="date" value={row.dueDate} onChange={(e) => onRowChange(index, 'dueDate', e.target.value)} className="w-full p-2 border rounded-md bg-white"/><select value={row.type} onChange={(e) => onRowChange(index, 'type', e.target.value)} className="w-full p-2 border rounded-md bg-white"><option>Venda de Produto</option><option>Venda de Serviço</option><option>Venda de Sucatas</option><option>Outros</option></select><input type="number" value={row.amount} onChange={(e) => onRowChange(index, 'amount', e.target.value)} placeholder="Valor" className="w-full p-2 border rounded-md bg-white"/></div>);
            case 'supplier': return (<><div className="flex-[2]"><input type="text" value={row.name} onChange={(e) => onRowChange(index, 'name', e.target.value)} placeholder="Nome Fornecedor/Conta" className="w-full p-2 border rounded-md bg-white"/></div><div className="flex-[2]"><select value={row.cashFlowType} onChange={(e) => onRowChange(index, 'cashFlowType', e.target.value)} className="w-full p-2 border rounded-md bg-white"><option>Fluxo de Caixa Operacional</option><option>Fluxo de Caixa de Investimento</option><option>Fluxo de Caixa de Financiamento</option></select></div><div className="flex-1"><input type="text" value={row.supplierType} onChange={(e) => onRowChange(index, 'supplierType', e.target.value)} placeholder="Tipo (Ex: Água)" className="w-full p-2 border rounded-md bg-white"/></div></>);
            default: return null;
        }
    };
    const titles: Record<BulkEntryType, string> = { banks: 'Adicionar Bancos em Lote', initialBalance: 'Adicionar Saldos Iniciais em Lote', revenue: 'Adicionar Receitas em Lote', supplier: 'Adicionar Fornecedores/Contas em Lote', };
    return (<Modal title={titles[type]} onClose={onClose}><div className="space-y-2 max-h-96 overflow-y-auto pr-2">{rows.map((row, index) => (<div key={index} className="flex items-center space-x-2">{renderRowInputs(row, index)}<button onClick={() => onRemoveRow(index)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={rows.length <= 1}><TrashIcon /></button></div>))}</div><div className="mt-4 flex justify-between"><Button onClick={onAddRow} variant="outline"><PlusIcon/> Adicionar Linha</Button><Button onClick={onSubmit} variant="primary">Salvar Dados</Button></div></Modal>);
};

export default App;