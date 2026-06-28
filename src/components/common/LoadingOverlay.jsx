import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ label = 'Cargando...' }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-primary">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="mt-3 text-sm font-semibold text-gray-600">{label}</p>
        </div>
    );
};

export default LoadingOverlay;
