import React from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

const FormDialog = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    children,
    submitText = 'Guardar',
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
                    <Button onClick={onSubmit} disabled={loading}>
                        {loading ? 'Guardando...' : submitText}
                    </Button>
                </>
            )}
        >
            {children}
        </Modal>
    );
};

export default FormDialog;
