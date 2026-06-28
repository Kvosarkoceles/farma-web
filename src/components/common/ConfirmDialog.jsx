import React from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar accion',
    message = 'Esta accion no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    loading = false,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={(
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Procesando...' : confirmText}
                    </Button>
                </>
            )}
        >
            <p className="text-sm text-gray-600">{message}</p>
        </Modal>
    );
};

export default ConfirmDialog;
