
import React from 'react';
import { Bank, CashFlowState, CashFlowAction, Revenue, Outflow } from './types.ts';

export const DEFAULT_BANKS: Bank[] = [
    { code: '341', name: 'Itaú Unibanco' },
    { code: '237', name: 'Bradesco' },
    { code: '001', name: 'Banco do Brasil' },
    { code: '033', name: 'Santander' },
    { code: '104', name: 'Caixa Econômica Federal' },
];

export const INITIAL_STATE: CashFlowState = {
    banks: DEFAULT_BANKS,
    initialBalances: [],
    revenues: [],
    suppliers: [],
    outflows: [],
    assignBankPerSupplier: false,
    confirmedRevenueIds: [],
};

/**
 * Safely parses a value into a Date object.
 * Returns the current date if the value is null, undefined, or an invalid date string.
 * @param {any} date - The value to parse.
 * @returns {Date} A valid Date object.
 */
const safeParseDate = (date: any): Date => {
  if (!date) return new Date(); // Default to now if falsy
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d; // Default to now if invalid
};

export const cashFlowReducer = (state: CashFlowState, action: CashFlowAction): CashFlowState => {
    switch (action.type) {
        case 'ADD_INITIAL_BALANCE':
            const existingBalanceIndex = state.initialBalances.findIndex(b => b.bankCode === action.payload.bankCode);
            if (existingBalanceIndex > -1) {
                const updatedBalances = [...state.initialBalances];
                updatedBalances[existingBalanceIndex] = action.payload;
                return { ...state, initialBalances: updatedBalances };
            }
            return { ...state, initialBalances: [...state.initialBalances, action.payload] };
        case 'ADD_INITIAL_BALANCES':
            const newBalances = [...state.initialBalances];
            action.payload.forEach(newBalance => {
                const existingIndex = newBalances.findIndex(b => b.bankCode === newBalance.bankCode);
                if (existingIndex > -1) {
                    newBalances[existingIndex] = newBalance;
                } else {
                    newBalances.push(newBalance);
                }
            });
            return { ...state, initialBalances: newBalances };
        case 'REMOVE_INITIAL_BALANCE':
            return { ...state, initialBalances: state.initialBalances.filter((_, index) => index !== action.payload) };
        case 'ADD_REVENUE':
            return { ...state, revenues: [...state.revenues, action.payload] };
        case 'REMOVE_REVENUE':
            // Also remove from confirmed list if it exists there
            return { 
                ...state, 
                revenues: state.revenues.filter(r => r.id !== action.payload),
                confirmedRevenueIds: state.confirmedRevenueIds.filter(id => id !== action.payload),
            };
        case 'ADD_SUPPLIER':
            return { ...state, suppliers: [...state.suppliers, action.payload] };
        case 'REMOVE_SUPPLIER':
            return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
        case 'ADD_OUTFLOW':
            return { ...state, outflows: [...state.outflows, action.payload] };
        case 'REMOVE_OUTFLOW':
            return { ...state, outflows: state.outflows.filter(o => o.id !== action.payload) };
        case 'TOGGLE_ASSIGN_BANK':
            return { ...state, assignBankPerSupplier: action.payload };
        case 'ADD_BANKS':
            const currentBanks = [...state.banks];
            action.payload.forEach(newBank => {
                const existing = currentBanks.some(b => b.code === newBank.code);
                if (!existing) {
                    currentBanks.push(newBank);
                }
            });
            return { ...state, banks: currentBanks };
        case 'CONFIRM_REVENUE':
            if (state.confirmedRevenueIds.includes(action.payload)) {
                return state; // Avoid duplicates
            }
            return { ...state, confirmedRevenueIds: [...state.confirmedRevenueIds, action.payload] };
        case 'RESET_STATE':
            return { ...INITIAL_STATE, banks: state.banks }; 
        case 'CLEAR_INITIAL_BALANCES':
            return { ...state, initialBalances: [] };
        case 'CLEAR_REVENUES':
            return { ...state, revenues: [], confirmedRevenueIds: [] };
        case 'CLEAR_SUPPLIERS':
            return { ...state, suppliers: [] };
        case 'CLEAR_OUTFLOWS':
            return { ...state, outflows: [] };
        case 'SET_STATE':
            const loadedState = action.payload;

            const newState = { ...INITIAL_STATE, ...loadedState };
            
            if (newState.revenues && Array.isArray(newState.revenues)) {
                newState.revenues = newState.revenues.map((r: any) => ({
                    ...r,
                    issueDate: safeParseDate(r.issueDate),
                    dueDate: safeParseDate(r.dueDate),
                    creditDate: safeParseDate(r.creditDate),
                }));
            }
            
            newState.confirmedRevenueIds = newState.confirmedRevenueIds || [];

            if (newState.outflows && Array.isArray(newState.outflows)) {
                newState.outflows = newState.outflows.map((o: any) => ({
                    ...o,
                    date: safeParseDate(o.date),
                }));
            }

            return newState;
        default:
            return state;
    }
};
