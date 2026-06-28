import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import SearchBar from '@/components/common/SearchBar';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { prescriptionsAPI } from '@/services/api';
import StatusChip from '@/components/common/StatusChip';

const PrescriptionAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await prescriptionsAPI.getAlerts({ status });
            setAlerts(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, [status]);

    const filteredAlerts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return alerts;
        return alerts.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
    }, [alerts, searchQuery]);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'prescription_id', label: 'Receta' },
        { key: 'alert_type', label: 'Tipo' },
        { key: 'message', label: 'Mensaje' },
        { key: 'status', label: 'Estado', render: (item) => <StatusChip status={item.status} /> },
        { key: 'created_at', label: 'Creada' },
    ];

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Alertas de Recetas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Faltantes, pedidos y eventos de surtido</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={loadAlerts}
                    >
                        <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <Card className="border-none shadow-xl">
                    <CardHeader className="p-6 border-b border-gray-100 space-y-4">
                        <SearchBar value={searchQuery} onChange={setSearchQuery} />
                        <div className="max-w-xs">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="active">Activas</option>
                                <option value="resolved">Resueltas</option>
                                <option value="all">Todas</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <LoadingOverlay />
                        ) : error ? (
                            <ErrorState message={`Error al cargar alertas: ${error.message}`} onRetry={loadAlerts} />
                        ) : filteredAlerts.length === 0 ? (
                            <EmptyState description="No hay alertas para mostrar." />
                        ) : (
                            <DataTable columns={columns} data={filteredAlerts} rowKey="id" />
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default PrescriptionAlerts;
