import React, { useState } from 'react';

type Step = 'home' | 'initialBalance' | 'inflows' | 'receipts' | 'suppliers' | 'outflows' | 'overdue' | 'report';

const App: React.FC = () => {
    const [step, setStep] = useState<Step>('home');

    const navItems = [
        { id: 'initialBalance', name: 'Saldos Iniciais', desc: 'Defina os saldos de partida.', icon: '🏦' },
        { id: 'inflows', name: 'Entradas', desc: 'Cadastre as receitas previstas.', icon: '💰' },
        { id: 'receipts', name: 'Recebimentos', desc: 'Confirme as entradas de caixa.', icon: '✅' },
        { id: 'suppliers', name: 'Fornecedores', desc: 'Gerencie contas a pagar.', icon: '🚚' },
        { id: 'outflows', name: 'Saídas', desc: 'Registre todos os pagamentos.', icon: '💸' },
        { id: 'overdue', name: 'Inadimplência', desc: 'Monitore recebíveis vencidos.', icon: '⚠️' },
        { id: 'report', name: 'Fluxo de Caixa', desc: 'Visualize o relatório completo.', icon: '📊' },
    ];

    const HomePage = () => (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
                <div className="bg-blue-900 text-white rounded-lg p-8 max-w-4xl mx-auto shadow-2xl">
                    <h2 className="text-4xl font-bold mb-2">Bem-vindo ao Feedis</h2>
                    <p className="text-lg text-gray-200">Seu assistente inteligente para gestão de fluxo de caixa.</p>
                    <p className="mt-4 text-sm text-gray-300">Utilize os atalhos abaixo para navegar diretamente para a seção desejada.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {navItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col border border-gray-200">
                        <div className="flex items-center text-blue-900 mb-3">
                            <span className="text-2xl mr-3">{item.icon}</span>
                            <h3 className="text-lg font-bold">{item.name}</h3>
                        </div>
                        <p className="text-gray-600 text-sm flex-grow">{item.desc}</p>
                        <button 
                            onClick={() => setStep(item.id as Step)}
                            className="mt-4 w-full bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                        >
                            Acessar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const StepContent = () => {
        const stepInfo = navItems.find(item => item.id === step);
        return (
            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center mb-6">
                    <button 
                        onClick={() => setStep('home')}
                        className="mr-4 text-blue-900 hover:text-blue-700 transition-colors"
                    >
                        ← Voltar
                    </button>
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">{stepInfo?.icon}</span>
                        <h2 className="text-2xl font-bold text-gray-800">{stepInfo?.name}</h2>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Módulo em Desenvolvimento</h3>
                    <p className="text-blue-800 mb-4">Esta seção está sendo implementada. Em breve você poderá:</p>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                        <li>{stepInfo?.desc}</li>
                        <li>Importar dados via CSV</li>
                        <li>Visualizar relatórios detalhados</li>
                        <li>Exportar para diferentes formatos</li>
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-900 text-white p-4 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Feedis - Gerenciador de Fluxo de Caixa</h1>
                    <div className="text-sm">
                        Versão 1.0.0 | Desenvolvimento
                    </div>
                </div>
            </header>
            
            <main className="p-4 md:p-8">
                {step === 'home' ? <HomePage /> : <StepContent />}
            </main>

            <footer className="bg-blue-900 text-white p-4 mt-8">
                <div className="max-w-7xl mx-auto text-center text-sm">
                    © 2025 Feedis - Sistema de Gestão de Fluxo de Caixa
                </div>
            </footer>
        </div>
    );
};

export default App;
