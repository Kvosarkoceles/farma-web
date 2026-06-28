import React from 'react';
import { Package } from 'lucide-react';

const EmptyState = ({ title = 'Sin resultados', description = 'No hay registros para mostrar.' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <div className="mb-3 rounded-full bg-slate-100 p-3">
                <Package className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-gray-700">{title}</p>
            <p className="mt-1 text-sm">{description}</p>
        </div>
    );
};

export default EmptyState;
