import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import SearchBar from '@/components/common/SearchBar';
import DataTable from '@/components/common/DataTable';
import PaginationControls from '@/components/common/PaginationControls';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import FormDialog from '@/components/common/FormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { patientsAPI } from '@/services/api';
import { validateEmail, validatePhone, validateRequired } from '@/lib/validators';

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

const initialFormData = {
    identification: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
};

const Patients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});

    const pageSize = Number.isFinite(DEFAULT_PAGE_SIZE) && DEFAULT_PAGE_SIZE > 0 ? DEFAULT_PAGE_SIZE : 10;

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await patientsAPI.getAll();
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            console.error('Error loading patients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const resetForm = () => {
        setFormData(initialFormData);
        setFormErrors({});
    };

    const validateFormData = () => {
        const errors = {};

        const firstNameResult = validateRequired(formData.first_name, 'El nombre');
        if (!firstNameResult.valid) errors.first_name = firstNameResult.message;

        const lastNameResult = validateRequired(formData.last_name, 'El apellido');
        if (!lastNameResult.valid) errors.last_name = lastNameResult.message;

        const phoneResult = validatePhone(formData.phone);
        if (!phoneResult.valid) errors.phone = phoneResult.message;

        const emailResult = validateEmail(formData.email);
        if (!emailResult.valid) errors.email = emailResult.message;

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getPayload = () => ({
        identification: formData.identification.trim() || null,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
    });

    const handleCreatePatient = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await patientsAPI.create(getPayload());
            await loadPatients();
            setIsCreateOpen(false);
            resetForm();
        } catch (err) {
            alert(`Error al crear paciente: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePatient = async () => {
        if (!selectedPatient || !validateFormData()) return;

        setIsSubmitting(true);
        try {
            await patientsAPI.update(selectedPatient.id, getPayload());
            await loadPatients();
            setIsEditOpen(false);
            setSelectedPatient(null);
            resetForm();
        } catch (err) {
            alert(`Error al actualizar paciente: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePatient = async () => {
        if (!selectedPatient) return;

        setIsSubmitting(true);
        try {
            await patientsAPI.delete(selectedPatient.id);
            await loadPatients();
            setIsDeleteOpen(false);
            setSelectedPatient(null);
        } catch (err) {
            alert(`Error al eliminar paciente: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (patient) => {
        setSelectedPatient(patient);
        setFormData({
            identification: patient.identification || '',
            first_name: patient.first_name || '',
            last_name: patient.last_name || '',
            phone: patient.phone || '',
            email: patient.email || '',
        });
        setFormErrors({});
        setIsEditOpen(true);
    };

    const openDeleteModal = (patient) => {
        setSelectedPatient(patient);
        setIsDeleteOpen(true);
    };

    const filteredPatients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return patients;
        return patients.filter((patient) => JSON.stringify(patient).toLowerCase().includes(q));
    }, [patients, searchQuery]);

    const paginatedPatients = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredPatients.slice(start, start + pageSize);
    }, [filteredPatients, page, pageSize]);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'identification', label: 'Identificacion' },
        { key: 'first_name', label: 'Nombre' },
        { key: 'last_name', label: 'Apellido' },
        { key: 'phone', label: 'Telefono' },
        { key: 'email', label: 'Email' },
        {
            key: 'actions',
            label: 'Acciones',
            render: (item) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                        onClick={() => openEditModal(item)}
                    >
                        <Edit2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-100"
                        onClick={() => openDeleteModal(item)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            ),
        },
    ];

    const renderFieldError = (field) => {
        if (!formErrors[field]) return null;
        return <p className="text-red-500 text-xs mt-1 font-medium">{formErrors[field]}</p>;
    };

    const formContent = (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Identificacion</label>
                <Input
                    value={formData.identification}
                    onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                    placeholder="Cedula o documento"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nombre *</label>
                    <Input
                        value={formData.first_name}
                        onChange={(e) => {
                            setFormData({ ...formData, first_name: e.target.value });
                            setFormErrors({ ...formErrors, first_name: undefined });
                        }}
                        className={formErrors.first_name ? 'border-red-400' : ''}
                        placeholder="Nombre"
                    />
                    {renderFieldError('first_name')}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Apellido *</label>
                    <Input
                        value={formData.last_name}
                        onChange={(e) => {
                            setFormData({ ...formData, last_name: e.target.value });
                            setFormErrors({ ...formErrors, last_name: undefined });
                        }}
                        className={formErrors.last_name ? 'border-red-400' : ''}
                        placeholder="Apellido"
                    />
                    {renderFieldError('last_name')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Telefono</label>
                    <Input
                        value={formData.phone}
                        onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            setFormErrors({ ...formErrors, phone: undefined });
                        }}
                        className={formErrors.phone ? 'border-red-400' : ''}
                        placeholder="8888-8888"
                    />
                    {renderFieldError('phone')}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Email</label>
                    <Input
                        value={formData.email}
                        onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            setFormErrors({ ...formErrors, email: undefined });
                        }}
                        className={formErrors.email ? 'border-red-400' : ''}
                        placeholder="paciente@correo.com"
                    />
                    {renderFieldError('email')}
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Pacientes</h2>
                        <p className="text-blue-100 text-lg opacity-90">Listado de pacientes del consultorio</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={loadPatients}
                        >
                            <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                        </Button>
                        <Button
                            className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={openCreateModal}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Agregar Paciente
                        </Button>
                    </div>
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
                            <ErrorState message={`Error al cargar pacientes: ${error.message}`} onRetry={loadPatients} />
                        ) : filteredPatients.length === 0 ? (
                            <EmptyState description="No hay pacientes para mostrar con el filtro actual." />
                        ) : (
                            <div>
                                <DataTable columns={columns} data={paginatedPatients} rowKey="id" />
                                <div className="border-t border-gray-100 bg-slate-50/30 p-6">
                                    <PaginationControls
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={filteredPatients.length}
                                        onPageChange={setPage}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <FormDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreatePatient}
                title="Agregar Paciente"
                submitText="Guardar"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <FormDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdatePatient}
                title="Editar Paciente"
                submitText="Guardar Cambios"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeletePatient}
                title="Eliminar Paciente"
                message={`¿Seguro que deseas eliminar a ${selectedPatient?.first_name || ''} ${selectedPatient?.last_name || ''}?`}
                confirmText="Eliminar"
                loading={isSubmitting}
            />
        </Layout>
    );
};

export default Patients;
