import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ShareModalProps {
    shareUrl: string;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ shareUrl, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal title="Compartilhar Sessão" onClose={onClose}>
            <p className="text-sm text-sap-dark-gray mb-4">
                Qualquer pessoa com este link poderá visualizar e editar esta sessão de fluxo de caixa.
            </p>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="w-full p-2 border rounded-md bg-gray-100"
                />
                <Button onClick={handleCopy} variant="primary">
                    {copied ? 'Copiado!' : 'Copiar'}
                </Button>
            </div>
        </Modal>
    );
};
