import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={48} className="text-green-500" />;
            case 'error': return <AlertCircle size={48} className="text-red-500" />;
            default: return <Info size={48} className="text-blue-500" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-100';
            case 'error': return 'bg-red-50 border-red-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className={cn(
                "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border",
                getHeaderColor()
            )}>
                <div className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                            {getIcon()}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
                        <p className="text-gray-600 font-medium">{message}</p>
                    </div>
                </div>
                <div className="p-4 bg-white/50 border-t border-gray-100">
                    <Button onClick={onClose} className="w-full font-bold shadow-md">
                        Entendido
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AlertModal;
