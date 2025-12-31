import React from 'react';
import { Button } from './Button.tsx';
import { TrashIcon } from './icons.tsx';

interface HeaderProps {
    onClear: () => void;
    isClearEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onClear, isClearEnabled }) => {
    return (
        <header className="bg-sap-header text-white shadow-md p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
                <svg className="h-8 w-8 text-sap-light-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h1 className="text-xl font-bold ml-3">Feedis - Gerenciador de Fluxo de Caixa</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
                <Button onClick={onClear} variant="danger" disabled={!isClearEnabled} title="Limpar Dados da Etapa Atual">
                    <TrashIcon />
                    <span className="hidden md:inline ml-2">Limpar Etapa</span>
                </Button>
            </div>
        </header>
    );
};