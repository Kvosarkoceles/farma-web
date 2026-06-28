import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import SearchBar from '@/components/common/SearchBar';
import DataTable from '@/components/common/DataTable';
import PaginationControls from '@/components/common/PaginationControls';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import FormDialog from '@/components/common/FormDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { consultationsAPI, doctorsAPI, patientsAPI, prescriptionsAPI, productsAPI } from '@/services/api';
import StatusChip from '@/components/common/StatusChip';
import { validateRequired } from '@/lib/validators';

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

const initialItem = {
    source_type: 'pharmacy',
    product_id: '',
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    instructions: '',
};

const initialFormData = {
    consultation_id: '',
    patient_id: '',
    doctor_id: '',
    create_order: true,
    status: 'pending',
    notes: '',
    items: [{ ...initialItem }],
};

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
};

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [products, setProducts] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});

    const pageSize = Number.isFinite(DEFAULT_PAGE_SIZE) && DEFAULT_PAGE_SIZE > 0 ? DEFAULT_PAGE_SIZE : 10;

    const loadPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await prescriptionsAPI.getAll({});
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            console.error('Error loading prescriptions:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRelations = async () => {
        try {
            const [patientsData, doctorsData, productsData, consultationsData] = await Promise.all([
                patientsAPI.getAll(),
                doctorsAPI.getAll(),
                productsAPI.getAll(),
                consultationsAPI.getAll({}),
            ]);
            setPatients(Array.isArray(patientsData) ? patientsData : []);
            setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
            setConsultations(Array.isArray(consultationsData) ? consultationsData : []);
        } catch (err) {
            console.error('Error loading related entities:', err);
        }
    };

    useEffect(() => {
        loadPrescriptions();
        loadRelations();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const resetForm = () => {
        setFormData({ ...initialFormData, items: [{ ...initialItem }] });
        setFormErrors({});
    };

    const validateFormData = () => {
        const errors = {};

        const patientResult = validateRequired(formData.patient_id, 'El paciente');
        if (!patientResult.valid) errors.patient_id = patientResult.message;

        const doctorResult = validateRequired(formData.doctor_id, 'El doctor');
        if (!doctorResult.valid) errors.doctor_id = doctorResult.message;

        if (!Array.isArray(formData.items) || formData.items.length === 0) {
            errors.items = 'Debes agregar al menos un item a la receta';
        }

        formData.items.forEach((item, index) => {
            if (!item.source_type) {
                errors[`item_${index}_source_type`] = 'Selecciona el tipo de item';
            }

            const quantity = Number(item.quantity);
            if (!quantity || quantity <= 0) {
                errors[`item_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
            }

            if (item.source_type === 'pharmacy' && !item.product_id) {
                errors[`item_${index}_product_id`] = 'Para item de farmacia debes seleccionar un producto';
            }

            if (item.source_type === 'external' && !item.medicine_name?.trim()) {
                errors[`item_${index}_medicine_name`] = 'Para item externo debes ingresar nombre del medicamento';
            }
        });

        if (!['pending', 'closed', 'cancelled'].includes(formData.status)) {
            errors.status = 'Estado invalido';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getCreatePayload = () => ({
        ...(formData.consultation_id ? { consultation_id: Number(formData.consultation_id) } : {}),
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        create_order: Boolean(formData.create_order),
        status: formData.status,
        notes: formData.notes?.trim() || '',
        items: formData.items.map((item) => {
            const payloadItem = {
                source_type: item.source_type,
                quantity: Number(item.quantity),
                dosage: item.dosage?.trim() || undefined,
                frequency: item.frequency?.trim() || undefined,
                duration: item.duration?.trim() || undefined,
                instructions: item.instructions?.trim() || undefined,
            };

            if (item.source_type === 'pharmacy') {
                const selectedProduct = products.find((p) => String(p.id) === String(item.product_id));
                return {
                    ...payloadItem,
                    product_id: Number(item.product_id),
                    medicine_name: item.medicine_name?.trim() || selectedProduct?.name || undefined,
                };
            }

            return {
                ...payloadItem,
                medicine_name: item.medicine_name?.trim(),
            };
        }),
    });

    const getUpdatePayload = () => ({
        status: formData.status,
        notes: formData.notes?.trim() || '',
    });

    const handleCreatePrescription = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await prescriptionsAPI.create(getCreatePayload());
            await loadPrescriptions();
            setIsCreateOpen(false);
            resetForm();
        } catch (err) {
            alert(`Error al crear receta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePrescription = async () => {
        if (!selectedPrescription) return;

        setIsSubmitting(true);
        try {
            await prescriptionsAPI.update(selectedPrescription.id, getUpdatePayload());
            await loadPrescriptions();
            setIsEditOpen(false);
            setSelectedPrescription(null);
            resetForm();
        } catch (err) {
            alert(`Error al actualizar receta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePrescription = async () => {
        if (!selectedPrescription) return;

        setIsSubmitting(true);
        try {
            await prescriptionsAPI.delete(selectedPrescription.id);
            await loadPrescriptions();
            setIsDeleteOpen(false);
            setSelectedPrescription(null);
        } catch (err) {
            alert(`Error al eliminar receta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPatientName = (prescription) => {
        if (prescription.patient_name) return prescription.patient_name;
        if (prescription.patient?.first_name || prescription.patient?.last_name) {
            return `${prescription.patient?.first_name || ''} ${prescription.patient?.last_name || ''}`.trim();
        }
        const patient = patients.find((item) => Number(item.id) === Number(prescription.patient_id));
        if (!patient) return prescription.patient_id || '-';
        return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.identification || patient.id;
    };

    const getDoctorName = (prescription) => {
        if (prescription.doctor_name) return prescription.doctor_name;
        if (prescription.doctor?.first_name || prescription.doctor?.last_name) {
            return `${prescription.doctor?.first_name || ''} ${prescription.doctor?.last_name || ''}`.trim();
        }
        const doctor = doctors.find((item) => Number(item.id) === Number(prescription.doctor_id));
        if (!doctor) return prescription.doctor_id || '-';
        return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.license_number || doctor.id;
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (prescription) => {
        setSelectedPrescription(prescription);
        setFormData({
            ...initialFormData,
            consultation_id: prescription.consultation_id ? String(prescription.consultation_id) : '',
            patient_id: prescription.patient_id ? String(prescription.patient_id) : '',
            doctor_id: prescription.doctor_id ? String(prescription.doctor_id) : '',
            create_order: Boolean(prescription.create_order),
            status: prescription.status || 'pending',
            notes: prescription.notes || '',
            items: [{ ...initialItem }],
        });
        setFormErrors({});
        setIsEditOpen(true);
    };

    const openDeleteModal = (prescription) => {
        setSelectedPrescription(prescription);
        setIsDeleteOpen(true);
    };

    const filteredPrescriptions = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return prescriptions;
        return prescriptions.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
    }, [prescriptions, searchQuery]);

    const paginatedPrescriptions = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredPrescriptions.slice(start, start + pageSize);
    }, [filteredPrescriptions, page, pageSize]);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'patient_name', label: 'Paciente', render: (item) => getPatientName(item) },
        { key: 'doctor_name', label: 'Doctor', render: (item) => getDoctorName(item) },
        { key: 'issued_at', label: 'Emitida', render: (item) => formatDate(item.issued_at) },
        { key: 'status', label: 'Estado', render: (item) => <StatusChip status={item.status} /> },
        { key: 'notes', label: 'Notas' },
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

    const updateItemField = (index, field, value) => {
        const nextItems = [...formData.items];
        const nextItem = { ...nextItems[index], [field]: value };

        if (field === 'source_type') {
            if (value === 'pharmacy') {
                nextItem.medicine_name = '';
            }
            if (value === 'external') {
                nextItem.product_id = '';
            }
        }

        if (field === 'product_id') {
            const selectedProduct = products.find((p) => String(p.id) === String(value));
            if (selectedProduct) {
                nextItem.medicine_name = selectedProduct.name || nextItem.medicine_name;
            }
        }

        nextItems[index] = nextItem;
        setFormData({ ...formData, items: nextItems });
    };

    const addItem = () => {
        setFormData({ ...formData, items: [...formData.items, { ...initialItem }] });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const nextItems = formData.items.filter((_, itemIndex) => itemIndex !== index);
        setFormData({ ...formData, items: nextItems });
    };

    const createFormContent = (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Consulta (opcional)</label>
                <select
                    value={formData.consultation_id}
                    onChange={(e) => setFormData({ ...formData, consultation_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="">Sin consulta asociada</option>
                    {consultations.map((consultation) => (
                        <option key={consultation.id} value={consultation.id}>
                            {`Consulta #${consultation.id}`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Paciente *</label>
                    <select
                        value={formData.patient_id}
                        onChange={(e) => {
                            setFormData({ ...formData, patient_id: e.target.value });
                            setFormErrors({ ...formErrors, patient_id: undefined });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">Selecciona un paciente</option>
                        {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                                {`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.identification || patient.id}
                            </option>
                        ))}
                    </select>
                    {renderFieldError('patient_id')}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Doctor *</label>
                    <select
                        value={formData.doctor_id}
                        onChange={(e) => {
                            setFormData({ ...formData, doctor_id: e.target.value });
                            setFormErrors({ ...formErrors, doctor_id: undefined });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="">Selecciona un doctor</option>
                        {doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                                {`${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.license_number || doctor.id}
                            </option>
                        ))}
                    </select>
                    {renderFieldError('doctor_id')}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Estado inicial</label>
                <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="pending">Pendiente</option>
                    <option value="closed">Cerrada</option>
                    <option value="cancelled">Cancelada</option>
                </select>
                {renderFieldError('status')}
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input
                    type="checkbox"
                    checked={Boolean(formData.create_order)}
                    onChange={(e) => setFormData({ ...formData, create_order: e.target.checked })}
                />
                Crear pedido automatico si hay faltantes
            </label>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Notas</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Indicaciones de la receta"
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-700">Items de la receta *</label>
                    <Button type="button" variant="outline" onClick={addItem}>Agregar item</Button>
                </div>
                {renderFieldError('items')}

                <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
                    {formData.items.map((item, index) => (
                        <div key={index} className="rounded-xl border border-gray-100 p-4 space-y-3 bg-slate-50/40">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-gray-700">Item #{index + 1}</p>
                                <Button type="button" variant="ghost" className="text-red-600" onClick={() => removeItem(index)}>
                                    Quitar
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Tipo *</label>
                                    <select
                                        value={item.source_type}
                                        onChange={(e) => updateItemField(index, 'source_type', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="pharmacy">Farmacia</option>
                                        <option value="external">Externo</option>
                                    </select>
                                    {renderFieldError(`item_${index}_source_type`)}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Cantidad *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    {renderFieldError(`item_${index}_quantity`)}
                                </div>
                            </div>

                            {item.source_type === 'pharmacy' ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Producto farmacia *</label>
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => updateItemField(index, 'product_id', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Selecciona producto</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {`${product.name} (${product.sku || 'sin SKU'})`}
                                            </option>
                                        ))}
                                    </select>
                                    {renderFieldError(`item_${index}_product_id`)}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Nombre medicamento externo *</label>
                                    <input
                                        type="text"
                                        value={item.medicine_name}
                                        onChange={(e) => updateItemField(index, 'medicine_name', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        placeholder="Ej. Producto magistral"
                                    />
                                    {renderFieldError(`item_${index}_medicine_name`)}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={item.dosage}
                                    onChange={(e) => updateItemField(index, 'dosage', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Dosis"
                                />
                                <input
                                    type="text"
                                    value={item.frequency}
                                    onChange={(e) => updateItemField(index, 'frequency', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Frecuencia"
                                />
                                <input
                                    type="text"
                                    value={item.duration}
                                    onChange={(e) => updateItemField(index, 'duration', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="Duracion"
                                />
                            </div>

                            <textarea
                                value={item.instructions}
                                onChange={(e) => updateItemField(index, 'instructions', e.target.value)}
                                rows={2}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="Instrucciones"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const editFormContent = (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Estado</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="pending">Pendiente</option>
                        <option value="closed">Cerrada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Notas</label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Notas de la receta"
                />
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Recetas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Recetas y estado de surtido</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={loadPrescriptions}
                        >
                            <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                        </Button>
                        <Button
                            className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={openCreateModal}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Agregar Receta
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
                            <ErrorState message={`Error al cargar recetas: ${error.message}`} onRetry={loadPrescriptions} />
                        ) : filteredPrescriptions.length === 0 ? (
                            <EmptyState description="No hay recetas para mostrar con el filtro actual." />
                        ) : (
                            <div>
                                <DataTable columns={columns} data={paginatedPrescriptions} rowKey="id" />
                                <div className="border-t border-gray-100 bg-slate-50/30 p-6">
                                    <PaginationControls
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={filteredPrescriptions.length}
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
                onSubmit={handleCreatePrescription}
                title="Agregar Receta"
                submitText="Guardar"
                loading={isSubmitting}
            >
                {createFormContent}
            </FormDialog>

            <FormDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdatePrescription}
                title="Editar Receta"
                submitText="Guardar Cambios"
                loading={isSubmitting}
            >
                {editFormContent}
            </FormDialog>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeletePrescription}
                title="Eliminar Receta"
                message={`¿Seguro que deseas eliminar la receta #${selectedPrescription?.id || ''}?`}
                confirmText="Eliminar"
                loading={isSubmitting}
            />
        </Layout>
    );
};

export default Prescriptions;
