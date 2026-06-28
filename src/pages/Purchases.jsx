import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Loader2, Eye, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/modal';
import { purchasesAPI } from '@/services/api';

const INITIAL_FILTERS = {
    status: 'received',
    supplier_id: '',
    payment_method: '',
    search: '',
    date_from: '',
    date_to: '',
    min_total: '',
    max_total: '',
};

const INITIAL_PAGINATION = {
    page: 1,
    limit: 5,
    totalItems: 0,
    totalPages: 1,
};

const Purchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [pagination, setPagination] = useState(INITIAL_PAGINATION);

    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        loadPurchases();
    }, [page, limit, filters]);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await purchasesAPI.getDetailAll({
                page,
                limit,
                ...filters,
            });

            // Compatibilidad: algunos backends devuelven Array directo y otros { data, pagination }
            const normalizedData = Array.isArray(response) ? response : (response?.data || []);
            const hasPagination = !Array.isArray(response) && response?.pagination;
            const fallbackTotalPages = normalizedData.length < limit ? page : page + 1;

            setPurchases(normalizedData);
            setPagination(
                hasPagination
                    ? response.pagination
                    : {
                        page,
                        limit,
                        totalItems: normalizedData.length,
                        totalPages: fallbackTotalPages,
                    }
            );
        } catch (err) {
            setError(err);
            console.error('Error loading purchases:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        setPage(1);
        setFilters({ ...draftFilters });
    };

    const clearFilters = () => {
        const reset = { ...INITIAL_FILTERS };
        setDraftFilters(reset);
        setFilters(reset);
        setPage(1);
    };

    const handleViewDetails = (purchase) => {
        setSelectedPurchase(purchase);
        setIsDetailsModalOpen(true);
    };

    const formatCurrency = (amount) => {
        return `$ ${new Intl.NumberFormat('es-NI', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(amount || 0))}`;
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('es-NI', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Compras</h2>
                        <p className="text-blue-100 text-lg opacity-90">Compras detalladas con filtros y paginacion</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={loadPurchases}
                    >
                        <Loader2 size={18} className={cn('mr-2', loading && 'animate-spin')} />
                        Recargar
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <Card className="border-none shadow-xl transition-all duration-300">
                    <CardHeader className="p-6 border-b border-gray-100 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="relative w-full md:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    className="pl-10 h-11 bg-slate-50 border-none shadow-inner"
                                    placeholder="Buscar por proveedor o producto"
                                    value={draftFilters.search}
                                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                            <Button className="h-11 font-bold gap-2" onClick={applyFilters}>
                                <Filter size={18} /> Aplicar filtros
                            </Button>
                            <Button variant="outline" className="h-11 font-bold" onClick={clearFilters}>
                                Limpiar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                                value={draftFilters.status}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="received">Estado: received</option>
                                <option value="pending">Estado: pending</option>
                                <option value="cancelled">Estado: cancelled</option>
                                <option value="">Estado: backend default</option>
                            </select>

                            <Input
                                placeholder="supplier_id"
                                value={draftFilters.supplier_id}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, supplier_id: e.target.value }))}
                            />

                            <Input
                                placeholder="payment_method"
                                value={draftFilters.payment_method}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, payment_method: e.target.value }))}
                            />

                            <select
                                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                                value={limit}
                                onChange={(e) => {
                                    const newLimit = Number(e.target.value);
                                    setLimit(newLimit);
                                    setPage(1);
                                }}
                            >
                                <option value={5}>5 por pagina</option>
                                <option value={10}>10 por pagina</option>
                                <option value={20}>20 por pagina</option>
                                <option value={50}>50 por pagina</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <Input
                                type="date"
                                value={draftFilters.date_from}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                            />
                            <Input
                                type="date"
                                value={draftFilters.date_to}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="min_total"
                                value={draftFilters.min_total}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, min_total: e.target.value }))}
                            />
                            <Input
                                type="number"
                                placeholder="max_total"
                                value={draftFilters.max_total}
                                onChange={(e) => setDraftFilters((prev) => ({ ...prev, max_total: e.target.value }))}
                            />
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">
                                <p>Error al cargar compras: {error.message}</p>
                                <Button onClick={loadPurchases} className="mt-4">Reintentar</Button>
                            </div>
                        ) : purchases.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">
                                <p>No hay compras para los filtros aplicados.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Proveedor</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Cantidad</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Pago</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">Estado</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {purchases.map((purchase) => (
                                                <tr key={purchase.id} className="transition-colors group hover:bg-blue-50/30">
                                                    <td className="px-6 py-4 font-mono text-xs text-gray-800 font-bold">#{purchase.id}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{purchase.supplier_name || '-'}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-800">{purchase.total_quantity || '-'}</td>
                                                    <td className="px-6 py-4 text-right font-black text-gray-700">{formatCurrency(purchase.total)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-semibold text-blue-600 border border-blue-200">
                                                            {purchase.payment_method || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={cn(
                                                                'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border',
                                                                purchase.status === 'received' && 'bg-green-50 text-green-600 border-green-200',
                                                                purchase.status === 'pending' && 'bg-orange-50 text-orange-600 border-orange-200',
                                                                purchase.status === 'cancelled' && 'bg-red-50 text-red-600 border-red-200',
                                                                !purchase.status && 'bg-gray-50 text-gray-600 border-gray-200'
                                                            )}
                                                        >
                                                            {purchase.status || 'unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(purchase.timestamp)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-gray-400 hover:text-primary hover:bg-blue-50"
                                                            onClick={() => handleViewDetails(purchase)}
                                                        >
                                                            <Eye size={18} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-6 border-t border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-50/30">
                                    <span className="text-sm text-muted-foreground font-medium">
                                        Pagina {pagination.page} de {pagination.totalPages} - {pagination.totalItems} compras
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={pagination.page <= 1}
                                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={pagination.page >= pagination.totalPages}
                                            onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title={`Detalle de Compra #${selectedPurchase?.id || ''}`}
                className="max-w-2xl"
                footer={<Button onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>}
            >
                {selectedPurchase ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Fecha</p>
                                <p className="font-semibold text-gray-800">{formatDate(selectedPurchase.timestamp)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Proveedor</p>
                                <p className="font-semibold text-gray-800">{selectedPurchase.supplier_name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Metodo de Pago</p>
                                <p className="font-semibold text-gray-800">{selectedPurchase.payment_method || '-'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Package size={18} className="text-primary" /> Productos
                            </h4>
                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Producto</th>
                                            <th className="px-4 py-3 text-center">Cant.</th>
                                            <th className="px-4 py-3 text-right">Precio Unit.</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedPurchase.purchase_items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 font-medium text-gray-800">{item.name || '-'}</td>
                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(item.cost_price)}</td>
                                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(item.quantity) * Number(item.cost_price))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-blue-50/50 font-bold text-gray-800">
                                        <tr>
                                            <td colSpan="3" className="px-4 py-3 text-right">Total</td>
                                            <td className="px-4 py-3 text-right text-primary text-lg">{formatCurrency(selectedPurchase.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </Layout>
    );
};

export default Purchases;
