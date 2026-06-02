import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { API_BASE_URL } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings as SettingsIcon, Bell, Lock, Globe, AlertCircle, Package } from 'lucide-react';

const Settings = () => {
    // Settings State
    const [settings, setSettings] = useState({
        notifyStock: true,
        notifyOrders: true
    });

    // Tab State
    const [activeTab, setActiveTab] = useState('General');

    // Users State
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'seller' });
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('farma_settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'Seguridad') {
            fetchUsers();
        }
    }, [activeTab]);

    const updateSetting = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('farma_settings', JSON.stringify(newSettings));
    };

    // User Management Functions
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch(`${API_BASE_URL}/users`);
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setShowUserModal(false);
                setNewUser({ username: '', password: '', role: 'seller' });
                fetchUsers();
            } else {
                alert('Error al crear usuario');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
        try {
            await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'General':
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-500 uppercase tracking-widest">Nombre de la Farmacia</label>
                                <Input defaultValue="Farmacia Dulce Esperanza" className="h-12 border-2 font-semibold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-500 uppercase tracking-widest">RUC / Identificación</label>
                                <Input defaultValue="J031000000123" className="h-12 border-2 font-semibold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-500 uppercase tracking-widest">Moneda Principal</label>
                                <Input defaultValue="Córdoba ($)" disabled className="h-12 border-2 font-semibold bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-gray-500 uppercase tracking-widest">Idioma del Sistema</label>
                                <Input defaultValue="Español" className="h-12 border-2 font-semibold" />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" className="h-12 px-8 font-bold border-2">Cancelar</Button>
                            <Button className="h-12 px-8 font-bold shadow-lg">Guardar Cambios</Button>
                        </div>
                    </div>
                );
            case 'Seguridad':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-gray-800">Gestión de Usuarios</h3>
                            <Button onClick={() => setShowUserModal(true)} className="font-bold shadow-md">
                                + Nuevo Usuario
                            </Button>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-black text-gray-500 text-xs uppercase tracking-wider">Usuario</th>
                                        <th className="text-left py-4 px-6 font-black text-gray-500 text-xs uppercase tracking-wider">Rol</th>
                                        <th className="text-left py-4 px-6 font-black text-gray-500 text-xs uppercase tracking-wider">Creado</th>
                                        <th className="text-right py-4 px-6 font-black text-gray-500 text-xs uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-800">{user.username}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {user.username !== 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold text-xs"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && !loadingUsers && (
                                <div className="p-8 text-center text-gray-400 font-medium">No hay usuarios registrados</div>
                            )}
                        </div>

                        {/* Modal Nuevo Usuario */}
                        {showUserModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                                    <h3 className="text-xl font-black mb-4">Nuevo Usuario</h3>
                                    <form onSubmit={handleCreateUser} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Nombre de Usuario</label>
                                            <Input
                                                required
                                                value={newUser.username}
                                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                                placeholder="ej. vendedor1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Contraseña</label>
                                            <Input
                                                required
                                                type="password"
                                                value={newUser.password}
                                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-600">Rol</label>
                                            <select
                                                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                value={newUser.role}
                                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                            >
                                                <option value="seller">Vendedor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <Button type="button" variant="outline" className="flex-1 font-bold" onClick={() => setShowUserModal(false)}>
                                                Cancelar
                                            </Button>
                                            <Button type="submit" className="flex-1 font-bold">
                                                Crear Usuario
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Notificaciones':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-800">Notificaciones</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">Alerta de Stock Bajo</p>
                                        <p className="text-xs text-gray-500">Avisar al iniciar si hay productos &lt; 10 u.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.notifyStock}
                                        onChange={(e) => updateSetting('notifyStock', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">Pedidos Pendientes</p>
                                        <p className="text-xs text-gray-500">Recordar recibir pedidos pendientes</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.notifyOrders}
                                        onChange={(e) => updateSetting('notifyOrders', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="p-8 text-center text-gray-400">Próximamente...</div>;
        }
    };

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <h2 className="text-4xl font-black tracking-tight mb-2">Configuración</h2>
                <p className="text-blue-100 text-lg opacity-90">Ajustes del sistema y preferencias</p>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 border-none shadow-lg h-fit">
                        <CardHeader>
                            <CardTitle className="text-xl">Opciones</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {[
                                    { icon: SettingsIcon, label: 'General' },
                                    { icon: Lock, label: 'Seguridad' },
                                    { icon: Bell, label: 'Notificaciones' },
                                ].map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(item.label)}
                                        className={`flex items-center gap-4 px-6 py-4 text-left transition-colors ${activeTab === item.label ? 'bg-blue-50 text-primary border-l-4 border-primary font-bold' : 'text-gray-600 hover:bg-slate-50'}`}
                                    >
                                        <item.icon size={20} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-lg">
                        <CardHeader className="border-b border-gray-50">
                            <CardTitle className="text-2xl font-black">
                                {activeTab === 'General' && 'Ajustes Generales'}
                                {activeTab === 'Seguridad' && 'Seguridad y Acceso'}
                                {activeTab === 'Notificaciones' && 'Preferencias de Notificación'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {renderContent()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
