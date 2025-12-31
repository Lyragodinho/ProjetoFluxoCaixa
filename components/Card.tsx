
import React from 'react';

interface CardProps {
    title: string;
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-300">
                <h2 className="text-lg font-bold text-sap-blue">{title}</h2>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};