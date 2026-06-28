import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Truck, Receipt, Users, Settings as SettingsIcon, LogOut, ChevronLeft, ChevronRight, UserCog, UserRound, Stethoscope, CalendarCheck, FileText, Pill, NotebookPen, Bell, ClipboardList, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getCurrentUser, hasAnyRole, logout } from '@/lib/auth';

import logo from '@/assets/logo.webp';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ShoppingCart, label: 'Punto de Venta', path: '/pos' },
        { icon: Package, label: 'Inventario', path: '/inventory' },
        { icon: Truck, label: 'Proveedores', path: '/suppliers' },
        { icon: Receipt, label: 'Facturación', path: '/invoicing' },
        { icon: Users, label: 'Clientes', path: '/clients' },
        { icon: SettingsIcon, label: 'Compras', path: '/purchases' },
        { icon: UserCog, label: 'Usuarios', path: '/users', roles: ['admin'] },
        { icon: UserRound, label: 'Pacientes', path: '/patients' },
        { icon: Stethoscope, label: 'Doctores', path: '/doctors' },
        { icon: CalendarCheck, label: 'Citas', path: '/appointments' },
        { icon: FileText, label: 'Consultas', path: '/consultations' },
        { icon: NotebookPen, label: 'Historial Clinico', path: '/medical-history' },
        { icon: Pill, label: 'Recetas', path: '/prescriptions' },
        { icon: PackageCheck, label: 'Surtido Recetas', path: '/prescriptions/dispensing' },
        { icon: ClipboardList, label: 'Pedidos Recetas', path: '/prescriptions/orders' },
        { icon: Bell, label: 'Alertas Recetas', path: '/prescriptions/alerts' },
        { icon: SettingsIcon, label: 'Configuración', path: '/settings' },
    ];

    const visibleItems = menuItems.filter((item) => hasAnyRole(item.roles || []));

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className={cn(
            "h-screen bg-sidebar-gradient text-white flex flex-col fixed left-0 top-0 shadow-2xl z-30 transition-all duration-300",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-primary text-white p-1.5 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform z-40"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={cn("p-8 flex flex-col items-center gap-4 text-center overflow-hidden transition-all", isCollapsed && "p-4")}>
                <div className={cn(
                    "bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg p-1 overflow-hidden border border-white/20 transition-all",
                    isCollapsed ? "h-12 w-12" : "h-16 w-16"
                )}>
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in duration-500">
                        <h1 className="font-extrabold text-xl leading-tight tracking-widest">FARMACIA</h1>
                        <p className="text-xs font-bold text-blue-200 tracking-[0.3em] uppercase mt-1">Dulce Esperanza</p>
                        {currentUser?.role ? (
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-100">
                                Rol: {currentUser.role}
                            </p>
                        ) : null}
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                {visibleItems.map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        title={isCollapsed ? item.label : ""}
                        className={({ isActive }) => cn(
                            "flex items-center gap-4 text-base font-medium transition-all duration-200 rounded-xl px-4 py-3",
                            "hover:bg-white/10 hover:text-white",
                            isCollapsed && "px-2 justify-center",
                            isActive
                                ? "bg-white text-blue-700 shadow-md translate-x-1"
                                : "text-blue-50"
                        )}
                    >
                        <item.icon size={22} className="shrink-0" />
                        {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 text-blue-100 hover:text-white hover:bg-white/10 rounded-xl",
                        isCollapsed && "justify-center px-0"
                    )}
                    onClick={handleLogout}
                >
                    <LogOut size={20} className="shrink-0" />
                    {!isCollapsed && <span className="animate-in fade-in duration-300">Cerrar Sesión</span>}
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
