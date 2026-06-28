import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import SearchBar from '@/components/common/SearchBar';
import DataTable from '@/components/common/DataTable';
import PaginationControls from '@/components/common/PaginationControls';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';

const getValueByPath = (obj, path) => {
    if (!path) return '';
    return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
};

const defaultFormat = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

const ResourceTablePage = ({
    title,
    subtitle,
    loadData,
    columns,
    rowKey = 'id',
}) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await loadData();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            console.error('Error loading resource:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
    }, [items, searchQuery]);

    const pageSize = Number.isFinite(DEFAULT_PAGE_SIZE) && DEFAULT_PAGE_SIZE > 0 ? DEFAULT_PAGE_SIZE : 10;

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, page, pageSize]);

    const tableColumns = useMemo(() => {
        return columns.map((column) => ({
            key: column.key,
            label: column.label,
            render: (item) => {
                const rawValue = getValueByPath(item, column.key);
                return column.format ? column.format(rawValue, item) : defaultFormat(rawValue);
            },
        }));
    }, [columns]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">{title}</h2>
                        <p className="text-blue-100 text-lg opacity-90">{subtitle}</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={fetchItems}
                    >
                        <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <Card className="border-none shadow-xl transition-all duration-300">
                    <CardHeader className="p-6 border-b border-gray-100">
                        <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    </CardHeader>

                    <CardContent className="p-0">
                        {loading ? (
                            <LoadingOverlay />
                        ) : error ? (
                            <ErrorState message={`Error al cargar datos: ${error.message}`} onRetry={fetchItems} />
                        ) : filteredItems.length === 0 ? (
                            <EmptyState description="No hay registros para mostrar con el filtro actual." />
                        ) : (
                            <div>
                                <DataTable columns={tableColumns} data={paginatedItems} rowKey={rowKey} />
                                <div className="border-t border-gray-100 bg-slate-50/30 p-6">
                                    <PaginationControls
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={filteredItems.length}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default ResourceTablePage;
