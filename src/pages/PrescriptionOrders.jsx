import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { prescriptionsAPI } from '@/services/api';
import StatusChip from '@/components/common/StatusChip';

const PrescriptionOrders = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [error, setError] = useState(null);
    const [submittingOrderId, setSubmittingOrderId] = useState(null);

    const loadPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await prescriptionsAPI.getAll({});
            const rows = Array.isArray(data) ? data : [];
            setPrescriptions(rows);
            if (!selectedPrescriptionId && rows.length > 0) {
                setSelectedPrescriptionId(String(rows[0].id));
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async (prescriptionId) => {
        if (!prescriptionId) {
            setOrders([]);
            return;
        }

        try {
            setOrdersLoading(true);
            setError(null);
            const data = await prescriptionsAPI.getOrders(prescriptionId);
            setOrders(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
        } catch (err) {
            setError(err);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        loadPrescriptions();
    }, []);

    useEffect(() => {
        if (selectedPrescriptionId) {
            loadOrders(selectedPrescriptionId);
        }
    }, [selectedPrescriptionId]);

    const updateOrderStatus = async (orderId, status) => {
        if (!selectedPrescriptionId) return;

        try {
            setSubmittingOrderId(orderId);
            await prescriptionsAPI.updateOrderStatus(selectedPrescriptionId, orderId, { status });
            await loadOrders(selectedPrescriptionId);
        } catch (err) {
            alert(`Error al actualizar pedido: ${err.message}`);
        } finally {
            setSubmittingOrderId(null);
        }
    };

    const receiveOrder = async (orderId) => {
        if (!selectedPrescriptionId) return;

        try {
            setSubmittingOrderId(orderId);
            await prescriptionsAPI.receiveOrder(selectedPrescriptionId, orderId, {});
            await loadOrders(selectedPrescriptionId);
        } catch (err) {
            alert(`Error al recibir pedido: ${err.message}`);
        } finally {
            setSubmittingOrderId(null);
        }
    };

    const selectedPrescription = useMemo(
        () => prescriptions.find((item) => String(item.id) === String(selectedPrescriptionId)),
        [prescriptions, selectedPrescriptionId],
    );

    const columns = [
        { key: 'id', label: 'Pedido' },
        { key: 'status', label: 'Estado', render: (item) => <StatusChip status={item.status} /> },
        { key: 'created_at', label: 'Creado' },
        { key: 'updated_at', label: 'Actualizado' },
        {
            key: 'actions',
            label: 'Acciones',
            render: (item) => (
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={submittingOrderId === item.id}
                        onClick={() => updateOrderStatus(item.id, 'pending')}
                    >
                        Pendiente
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={submittingOrderId === item.id}
                        onClick={() => updateOrderStatus(item.id, 'cancelled')}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        disabled={submittingOrderId === item.id}
                        onClick={() => receiveOrder(item.id)}
                    >
                        {submittingOrderId === item.id ? 'Procesando...' : 'Recibir'}
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Pedidos de Recetas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Gestion de pedidos asociados a recetas</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={loadPrescriptions}
                    >
                        <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <Card className="border-none shadow-xl">
                    <CardHeader className="p-6 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Receta</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedPrescriptionId}
                                    onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                                >
                                    {prescriptions.length === 0 ? <option value="">Sin recetas</option> : null}
                                    {prescriptions.map((prescription) => (
                                        <option key={prescription.id} value={prescription.id}>
                                            {`Receta #${prescription.id} - Estado: ${prescription.status || 'pending'}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-sm text-gray-600">
                                {selectedPrescription ? `Receta seleccionada: #${selectedPrescription.id}` : 'Selecciona una receta para ver pedidos'}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading || ordersLoading ? (
                            <LoadingOverlay />
                        ) : error ? (
                            <ErrorState message={`Error al cargar pedidos: ${error.message}`} onRetry={() => loadOrders(selectedPrescriptionId)} />
                        ) : orders.length === 0 ? (
                            <EmptyState description="No hay pedidos para esta receta." />
                        ) : (
                            <DataTable columns={columns} data={orders} rowKey="id" />
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default PrescriptionOrders;
