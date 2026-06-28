import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import StatusChip from '@/components/common/StatusChip';
import { prescriptionsAPI } from '@/services/api';

const PrescriptionDispensing = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
    const [prescriptionDetail, setPrescriptionDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dispenseQty, setDispenseQty] = useState({});
    const [submittingItemId, setSubmittingItemId] = useState(null);

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

    const loadDetail = async (prescriptionId) => {
        if (!prescriptionId) {
            setPrescriptionDetail(null);
            return;
        }

        try {
            setDetailLoading(true);
            setError(null);
            const data = await prescriptionsAPI.getById(prescriptionId);
            setPrescriptionDetail(data || null);
        } catch (err) {
            setError(err);
            setPrescriptionDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        loadPrescriptions();
    }, []);

    useEffect(() => {
        if (selectedPrescriptionId) {
            loadDetail(selectedPrescriptionId);
        }
    }, [selectedPrescriptionId]);

    const items = useMemo(() => {
        if (!prescriptionDetail) return [];
        if (Array.isArray(prescriptionDetail.items)) return prescriptionDetail.items;
        if (Array.isArray(prescriptionDetail.prescription_items)) return prescriptionDetail.prescription_items;
        if (Array.isArray(prescriptionDetail.data?.items)) return prescriptionDetail.data.items;
        return [];
    }, [prescriptionDetail]);

    const dispenseItem = async (itemId) => {
        if (!selectedPrescriptionId) return;
        const qty = Number(dispenseQty[itemId]);
        if (!qty || qty <= 0) {
            alert('Ingresa una cantidad valida para surtir.');
            return;
        }

        try {
            setSubmittingItemId(itemId);
            await prescriptionsAPI.dispenseItem(selectedPrescriptionId, itemId, { quantity: qty });
            await loadDetail(selectedPrescriptionId);
        } catch (err) {
            alert(`Error al surtir item: ${err.message}`);
        } finally {
            setSubmittingItemId(null);
        }
    };

    const dispenseAll = async () => {
        if (!selectedPrescriptionId) return;
        try {
            setDetailLoading(true);
            await prescriptionsAPI.dispense(selectedPrescriptionId, {});
            await loadDetail(selectedPrescriptionId);
        } catch (err) {
            alert(`Error al surtir receta: ${err.message}`);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Surtido de Recetas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Dispensa parcial o total por item</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={loadPrescriptions}
                        >
                            <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                        </Button>
                        <Button className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl" onClick={dispenseAll}>
                            Surtir Receta
                        </Button>
                    </div>
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
                                            {`Receta #${prescription.id} - ${prescription.status || 'pending'}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading || detailLoading ? (
                            <LoadingOverlay />
                        ) : error ? (
                            <ErrorState message={`Error al cargar receta: ${error.message}`} onRetry={() => loadDetail(selectedPrescriptionId)} />
                        ) : !prescriptionDetail ? (
                            <EmptyState description="Selecciona una receta para iniciar el surtido." />
                        ) : items.length === 0 ? (
                            <EmptyState description="Esta receta no tiene items para surtir." />
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-50 p-4 border border-gray-100 flex flex-wrap gap-3 items-center">
                                    <p className="font-bold text-gray-800">Receta #{prescriptionDetail.id}</p>
                                    <StatusChip status={prescriptionDetail.status || 'pending'} />
                                </div>

                                {items.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-gray-100 p-4 bg-white">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <p className="font-bold text-gray-800">{item.medicine_name || `Producto #${item.product_id}`}</p>
                                                <p className="text-sm text-gray-600">
                                                    Cantidad: {item.quantity || 0} | Surtido: {item.dispensed_quantity || 0} | Faltante: {item.missing_quantity || 0}
                                                </p>
                                            </div>
                                            <StatusChip status={item.item_status || 'pending'} />
                                        </div>

                                        <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Cantidad a surtir"
                                                value={dispenseQty[item.id] || ''}
                                                onChange={(e) => setDispenseQty({ ...dispenseQty, [item.id]: e.target.value })}
                                                className="md:max-w-xs"
                                            />
                                            <Button
                                                disabled={submittingItemId === item.id}
                                                onClick={() => dispenseItem(item.id)}
                                            >
                                                {submittingItemId === item.id ? 'Procesando...' : 'Surtir Item'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default PrescriptionDispensing;
