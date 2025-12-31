import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'header-outline';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm inline-flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
        primary: 'bg-sap-blue text-white hover:bg-sap-light-blue',
        secondary: 'bg-sap-dark-gray text-white hover:bg-gray-700',
        outline: 'bg-transparent border border-sap-blue text-sap-blue hover:bg-sap-blue hover:text-white',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        'header-outline': 'bg-transparent border border-gray-400 text-gray-200 hover:bg-white hover:text-sap-header',
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
            {children}
        </button>
    );
};