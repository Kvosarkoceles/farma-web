import React from 'react';
import { Button } from '@/components/ui/button';

const PaginationControls = ({ page, pageSize, totalItems, onPageChange }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="text-sm text-muted-foreground font-medium">
                Pagina {page} de {totalPages} - {totalItems} registro(s)
            </span>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
};

export default PaginationControls;
