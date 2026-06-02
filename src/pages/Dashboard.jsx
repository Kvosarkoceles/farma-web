import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, AlertCircle, TrendingUp, Clock as ClockIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, salesAPI, purchasesAPI } from '@/services/api';
import AlertModal from '@/components/ui/AlertModal';

const StatCard = ({ title, value, subtext, icon: Icon, trend, loading }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
                <>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend && <span className="text-green-600 font-medium mr-1">{trend}</span>}
                        {subtext}
                    </p>
                </>
            )}
        </CardContent>
    </Card>
);

const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 font-bold">
            <ClockIcon size={18} className="text-blue-100" />
            <span className="text-sm">
                {time.toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })} • {time.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todaySales: 0,
        lowStockCount: 0,
        totalProducts: 0,
        totalStock: 0,
    });
    const [recentSales, setRecentSales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    // Alerts
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        loadDashboardData();
        checkNotifications();
    }, []);

    const checkNotifications = async () => {
        const savedSettings = JSON.parse(localStorage.getItem('farma_settings') || '{"notifyStock": true, "notifyOrders": true}');

        // Wait a bit for initial data or perform checks
        if (savedSettings.notifyStock) {
            try {
                const products = await productsAPI.getAll();
                const lowStock = products.filter(p => p.stock < 10);
                if (lowStock.length > 0) {
                    // Use setTimeout to avoid conflict if multiple alerts or too early
                    setTimeout(() => {
                        setAlertState({
                            isOpen: true,
                            title: '⚠️ Alerta de Stock',
                            message: `Hay ${lowStock.length} productos con stock crítico (< 10). Revisa el inventario.`,
                            type: 'error'
                        });
                    }, 500);
                    return; // Show only one alert at a time usually
                }
            } catch (e) { console.error(e); }
        }

        if (savedSettings.notifyOrders) {
            try {
                const purchases = await purchasesAPI.getAll();
                const pending = purchases.filter(p => p.status === 'pending');
                if (pending.length > 0) {
                    setTimeout(() => {
                        setAlertState({
                            isOpen: true,
                            title: '📦 Pedidos Pendientes',
                            message: `Tienes ${pending.length} pedido(s) pendiente(s) de recepción.`,
                            type: 'info'
                        });
                    }, 1500); // Slightly delayed if stock alert also triggers (simple queue simulation)
                }
            } catch (e) { console.error(e); }
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch products and sales in parallel
            const [products, sales] = await Promise.all([
                productsAPI.getAll(),
                salesAPI.getAll(),
            ]);

            // Calculate stats from products
            const lowStockProducts = products.filter(p => p.stock < 20);
            const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

            // Calculate today's sales
            const today = new Date().toDateString();
            const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
            const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

            setStats({
                todaySales: todayTotal,
                lowStockCount: lowStockProducts.length,
                totalProducts: products.length,
                totalStock: totalStock,
            });

            // Get recent sales (last 5)
            setRecentSales(sales.slice(0, 5));

            // Get top products by lowest stock (most sold = lowest stock assumption)
            const sortedByStock = [...products].sort((a, b) => a.stock - b.stock).slice(0, 5);
            setTopProducts(sortedByStock);

            console.log('Dashboard data loaded successfully');
            console.log('Stats:', { todaySales: todayTotal, lowStockCount: lowStockProducts.length, totalProducts: products.length, totalStock: totalStock });
            console.log('Recent Sales:', todaySales);
            console.log('Top Products:', sortedByStock);    

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
        return date.toLocaleDateString('es-NI');
    };

    const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-teal-500','bg-teal-500','bg-teal-500'];

    return (
        <Layout>
            {/* Header Section with Wave */}
            <div className="relative bg-mesh-gradient pb-32 pt-12 px-8 shadow-lg overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:justify-between lg:items-center text-white gap-6">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Dashboard</h2>
                        <p className="text-blue-100 text-lg opacity-90">Resumen general de Farmacia Dulce Esperanza</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Clock />
                        <Button
                            variant="secondary"
                            className="bg-white text-primary hover:bg-blue-50 border-0 shadow-lg font-black h-11 px-6 active:scale-95 transition-all"
                            onClick={() => navigate('/pos')}
                        >
                            <span className="mr-2">+</span> Nueva Venta
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Areas with Overlapping Cards */}
            <div className="px-8 -mt-24 relative z-20 pb-12">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard
                        title="Ventas del Día"
                        value={`$ ${stats.todaySales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`}
                        subtext="Total del día"
                        icon={DollarSign}
                        loading={loading}
                    />
                    <StatCard
                        title="Productos Bajos"
                        value={stats.lowStockCount}
                        subtext="Stock menor a 20 unidades"
                        icon={AlertCircle}
                        loading={loading}
                    />
                    <StatCard
                        title="Inventario Total"
                        value={stats.totalProducts.toLocaleString()}
                        subtext="Productos registrados"
                        icon={Package}
                        loading={loading}
                    />
                    <StatCard
                        title="Stock Total"
                        value={stats.totalStock.toLocaleString()}
                        subtext="Unidades en inventario"
                        icon={TrendingUp}
                        loading={loading}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-primary">Ventas Recientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : recentSales.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No hay ventas registradas</p>
                                ) : (
                                    recentSales.map((sale, i) => (
                                        <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
                                                    #{i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-700">Venta #{sale.id}</p>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                                        {formatTime(sale.timestamp)} • {sale.payment_method}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary text-lg">$ {parseFloat(sale.total).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl text-primary">Productos con Bajo Stock</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : topProducts.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No hay productos registrados</p>
                                ) : (
                                    topProducts.map((product, i) => (
                                        <div key={product.id} className="flex items-center justify-between group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg ${colors[i]} flex items-center justify-center text-white text-xs font-bold`}>
                                                    {i + 1}
                                                </div>
                                                <span className="text-base font-semibold text-gray-700 group-hover:text-primary transition-colors">
                                                    {product.name}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`font-bold ${product.stock < 20 ? 'text-red-500' : 'text-gray-900'}`}>
                                                    {product.stock}
                                                </span>
                                                <span className="text-xs text-muted-foreground">En stock</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState({ ...alertState, isOpen: false })}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </Layout>
    );
};

export default Dashboard;
