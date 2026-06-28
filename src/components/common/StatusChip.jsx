import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
    active: 'bg-green-50 text-green-700 border-green-200',
    inactive: 'bg-gray-50 text-gray-700 border-gray-200',
    pending: 'bg-orange-50 text-orange-700 border-orange-200',
    received: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dispensed: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const StatusChip = ({ status }) => {
    const normalized = String(status || 'unknown').toLowerCase();

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                statusStyles[normalized] || 'bg-slate-50 text-slate-700 border-slate-200'
            )}
        >
            {normalized}
        </span>
    );
};

export default StatusChip;
