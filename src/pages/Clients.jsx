import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, User, Phone, Mail, History, Trash2, Edit2, ShoppingBag, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/modal';
import AlertModal from '@/components/ui/AlertModal';
import { clientsAPI } from '@/services/api';
import { validateRequired, validateClientId, validatePhone } from '@/lib/validators';

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ name: '', client_id: '', phone: '', email: '' });
    const [formErrors, setFormErrors] = useState({});
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientHistory, setClientHistory] = useState({ sales: [], stats: { total_spent: 0, total_purchases: 0 } });
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Alert State
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const showAlert = (title, message, type = 'info') => {
        setAlertState({ isOpen: true, title, message, type });
    };

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await clientsAPI.getAll();
            setClients(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        const nameResult = validateRequired(formData.name, 'El nombre');
        if (!nameResult.valid) errors.name = nameResult.message;

        if (formData.client_id) {
            const idResult = validateClientId(formData.client_id);
            if (!idResult.valid) errors.client_id = idResult.message;
        }

        if (formData.phone) {
            const phoneResult = validatePhone(formData.phone);
            if (!phoneResult.valid) errors.phone = phoneResult.message;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveClient = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            if (selectedClient) {
                await clientsAPI.update(selectedClient.id, formData);
            } else {
                await clientsAPI.create(formData);
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setFormData({ name: '', client_id: '', phone: '', email: '' });
            setFormErrors({});
            setSelectedClient(null);
            loadClients();
            showAlert('Éxito', selectedClient ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Error', error.message || 'Error al guardar cliente', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
        try {
            await clientsAPI.delete(id);
            loadClients();
            showAlert('Éxito', 'Cliente eliminado correctamente', 'success');
        } catch (error) {
            console.error(error);
            showAlert('Error', 'No se pudo eliminar el cliente. Puede tener ventas asociadas.', 'error');
        }
    };

    const openEditModal = (client) => {
        setSelectedClient(client);
        setFormData({
            name: client.name || '',
            client_id: client.client_id || '',
            phone: client.phone || '',
            email: client.email || ''
        });
        setFormErrors({});
        setIsEditModalOpen(true);
    };

    const openHistoryModal = async (client) => {
        setSelectedClient(client);
        setIsHistoryModalOpen(true);
        setLoadingHistory(true);
        try {
            const data = await clientsAPI.getSales(client.id);
            setClientHistory(data);
        } catch (error) {
            console.error(error);
            setClientHistory({ sales: [], stats: { total_spent: 0, total_purchases: 0 } });
        } finally {
            setLoadingHistory(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.client_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.includes(searchQuery)
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(amount);
    };

    const renderFieldError = (field) => {
        if (!formErrors[field]) return null;
        return <p className="text-red-500 text-xs mt-1 font-medium">{formErrors[field]}</p>;
    };

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Clientes</h2>
                        <p className="text-blue-100 text-lg opacity-90">Gestión de fidelidad y datos de pacientes</p>
                    </div>
                    <Button
                        className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={() => { setFormData({ name: '', client_id: '', phone: '', email: '' }); setFormErrors({}); setSelectedClient(null); setIsAddModalOpen(true); }}
                    >
                        <Plus className="mr-2 h-5 w-5" /> Nuevo Cliente
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12">
                <div className="mb-8 relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    <Input
                        className="pl-12 h-14 bg-white border-none shadow-xl rounded-2xl text-lg"
                        placeholder="Buscar por nombre, cédula o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map((client) => (
                            <Card key={client.id} className="border-none shadow-lg hover:shadow-2xl transition-all duration-300 relative group">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => openEditModal(client)}>
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => openHistoryModal(client)}>
                                        <History size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteClient(client.id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                                <CardHeader className="flex flex-row items-center gap-4 pb-2 cursor-pointer" onClick={() => openHistoryModal(client)}>
                                    <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                                        <User size={30} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black text-gray-800">{client.name}</CardTitle>
                                        <p className="text-primary font-bold text-xs uppercase tracking-tighter">
                                            {client.client_id || 'S/N'}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {client.phone && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Phone size={16} className="text-primary" />
                                            <span className="font-semibold">{client.phone}</span>
                                        </div>
                                    )}
                                    {client.email && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Mail size={16} className="text-primary" />
                                            <span className="font-semibold">{client.email}</span>
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-black text-gray-400">Puntos</span>
                                            <span className="text-lg font-black text-primary">{client.points || 0} pts</span>
                                        </div>
                                        {client.last_visit && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-black text-gray-400">Última visita</span>
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {new Date(client.last_visit).toLocaleDateString('es-NI')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Client Modal */}
            <Modal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormErrors({}); }}
                title={isEditModalOpen ? "Editar Cliente" : "Registrar Nuevo Cliente"}
                footer={
                    <>
                        <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setFormErrors({}); }}>Cancelar</Button>
                        <Button onClick={handleSaveClient} disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Nombre Completo *</label>
                        <Input
                            value={formData.name}
                            onChange={e => { setFormData({ ...formData, name: e.target.value }); setFormErrors({ ...formErrors, name: undefined }); }}
                            placeholder="Ej. Juan Pérez"
                            className={formErrors.name ? 'border-red-400 focus:ring-red-400' : ''}
                        />
                        {renderFieldError('name')}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Cédula / RUC</label>
                        <Input
                            value={formData.client_id}
                            onChange={e => { setFormData({ ...formData, client_id: e.target.value }); setFormErrors({ ...formErrors, client_id: undefined }); }}
                            placeholder="Ej. 001-010190-0001A o J0310000000001"
                            className={formErrors.client_id ? 'border-red-400 focus:ring-red-400' : ''}
                        />
                        {renderFieldError('client_id')}
                        <p className="text-[10px] text-gray-400">Cédula: XXX-DDMMAA-XXXXL | RUC: J + 13 dígitos</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Teléfono</label>
                            <Input
                                value={formData.phone}
                                onChange={e => { setFormData({ ...formData, phone: e.target.value }); setFormErrors({ ...formErrors, phone: undefined }); }}
                                placeholder="8888-8888"
                                className={formErrors.phone ? 'border-red-400 focus:ring-red-400' : ''}
                            />
                            {renderFieldError('phone')}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Email</label>
                            <Input
                                value={formData.email}
                                onChange={e => { setFormData({ ...formData, email: e.target.value }); setFormErrors({ ...formErrors, email: undefined }); }}
                                placeholder="cliente@email.com"
                                className={formErrors.email ? 'border-red-400 focus:ring-red-400' : ''}
                            />
                            {renderFieldError('email')}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Purchase History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={`Historial de ${selectedClient?.name || 'Cliente'}`}
                className="max-w-2xl"
                footer={
                    <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</Button>
                }
            >
                {loadingHistory ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <p className="text-xs font-black text-blue-400 uppercase">Total Compras</p>
                                <p className="text-2xl font-black text-blue-800">{clientHistory.stats.total_purchases}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <p className="text-xs font-black text-green-400 uppercase">Total Gastado</p>
                                <p className="text-2xl font-black text-green-800">{formatCurrency(clientHistory.stats.total_spent)}</p>
                            </div>
                        </div>

                        {/* Sales list */}
                        {clientHistory.sales.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">Este cliente no tiene compras registradas</p>
                            </div>
                        ) : (
                            <div className="border rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-500 font-bold sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">ID</th>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3 text-center">Items</th>
                                            <th className="px-4 py-3">Método</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {clientHistory.sales.map(sale => (
                                            <tr key={sale.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-bold text-primary">#{sale.id}</td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {new Date(sale.timestamp).toLocaleDateString('es-NI')}
                                                </td>
                                                <td className="px-4 py-3 text-center">{sale.items_count}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[10px] font-black uppercase text-gray-500 border border-gray-200 px-2 py-0.5 rounded bg-gray-50">
                                                        {sale.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-black">{formatCurrency(sale.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

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

export default Clients;
