import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ErrorState = ({ message = 'Ocurrio un error', onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center text-red-600">
            <AlertCircle className="h-8 w-8" />
            <p className="mt-3 font-semibold">{message}</p>
            {onRetry ? (
                <Button onClick={onRetry} className="mt-4">
                    Reintentar
                </Button>
            ) : null}
        </div>
    );
};

export default ErrorState;
