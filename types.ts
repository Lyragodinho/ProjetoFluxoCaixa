
export type Step = 'home' | 'initialBalance' | 'inflows' | 'receipts' | 'suppliers' | 'outflows' | 'overdue' | 'report';

export interface Bank {
    code: string;
    name: string;
}

export interface InitialBalance {
    bankCode: string;
    amount: number;
}

export interface Revenue {
    id: number;
    clientName: string;
    type: string;
    amount: number;
    documentType: 'NF' | 'Previsão' | 'Carteira';
    documentNumber: string;
    issueDate: Date;
    dueDate: Date;
    creditDate: Date;
}

export interface Supplier {
    id: number;
    name: string;
    cashFlowType: string;
    supplierType: string;
    bankCode?: string; // Optional bank code for specific payments
}

export interface Outflow {
    id: number;
    supplierId: number;
    amount: number;
    date: Date;
}

export interface CashFlowState {
    banks: Bank[];
    initialBalances: InitialBalance[];
    revenues: Revenue[];
    suppliers: Supplier[];
    outflows: Outflow[];
    assignBankPerSupplier: boolean;
    confirmedRevenueIds: number[];
}

export type CashFlowAction =
    | { type: 'ADD_INITIAL_BALANCE'; payload: InitialBalance }
    | { type: 'ADD_INITIAL_BALANCES'; payload: InitialBalance[] }
    | { type: 'REMOVE_INITIAL_BALANCE'; payload: number }
    | { type: 'ADD_REVENUE'; payload: Revenue }
    | { type: 'REMOVE_REVENUE'; payload: number }
    | { type: 'ADD_SUPPLIER'; payload: Supplier }
    | { type: 'REMOVE_SUPPLIER'; payload: number }
    | { type: 'ADD_OUTFLOW'; payload: Outflow }
    | { type: 'REMOVE_OUTFLOW'; payload: number }
    | { type: 'TOGGLE_ASSIGN_BANK'; payload: boolean }
    | { type: 'ADD_BANKS'; payload: Bank[] }
    | { type: 'RESET_STATE' }
    | { type: 'SET_STATE'; payload: CashFlowState }
    | { type: 'CLEAR_INITIAL_BALANCES' }
    | { type: 'CLEAR_REVENUES' }
    | { type: 'CLEAR_SUPPLIERS' }
    | { type: 'CLEAR_OUTFLOWS' }
    | { type: 'CONFIRM_REVENUE'; payload: number };
