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
import { appointmentsAPI, doctorsAPI, patientsAPI } from '@/services/api';
import StatusChip from '@/components/common/StatusChip';
import { validateRequired } from '@/lib/validators';

const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE || 10);

const getTodayDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
};

const initialFormData = {
    patient_id: '',
    doctor_id: '',
    appointment_date: getTodayDateTimeLocal(),
    status: 'scheduled',
    reason: '',
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
};

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});

    const pageSize = Number.isFinite(DEFAULT_PAGE_SIZE) && DEFAULT_PAGE_SIZE > 0 ? DEFAULT_PAGE_SIZE : 10;

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await appointmentsAPI.getAll({});
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            console.error('Error loading appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRelations = async () => {
        try {
            const [patientsData, doctorsData] = await Promise.all([
                patientsAPI.getAll(),
                doctorsAPI.getAll(),
            ]);
            setPatients(Array.isArray(patientsData) ? patientsData : []);
            setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        } catch (err) {
            console.error('Error loading related entities:', err);
        }
    };

    useEffect(() => {
        loadAppointments();
        loadRelations();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const resetForm = () => {
        setFormData({ ...initialFormData, appointment_date: getTodayDateTimeLocal() });
        setFormErrors({});
    };

    const validateFormData = () => {
        const errors = {};

        const patientResult = validateRequired(formData.patient_id, 'El paciente');
        if (!patientResult.valid) errors.patient_id = patientResult.message;

        const doctorResult = validateRequired(formData.doctor_id, 'El doctor');
        if (!doctorResult.valid) errors.doctor_id = doctorResult.message;

        const dateResult = validateRequired(formData.appointment_date, 'La fecha de la cita');
        if (!dateResult.valid) errors.appointment_date = dateResult.message;

        const reasonResult = validateRequired(formData.reason, 'El motivo');
        if (!reasonResult.valid) errors.reason = reasonResult.message;

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getPayload = () => ({
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        appointment_date: formData.appointment_date,
        status: formData.status,
        reason: formData.reason.trim(),
    });

    const handleCreateAppointment = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await appointmentsAPI.create(getPayload());
            await loadAppointments();
            setIsCreateOpen(false);
            resetForm();
        } catch (err) {
            alert(`Error al crear cita: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateAppointment = async () => {
        if (!selectedAppointment || !validateFormData()) return;

        setIsSubmitting(true);
        try {
            await appointmentsAPI.update(selectedAppointment.id, getPayload());
            await loadAppointments();
            setIsEditOpen(false);
            setSelectedAppointment(null);
            resetForm();
        } catch (err) {
            alert(`Error al actualizar cita: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return;

        setIsSubmitting(true);
        try {
            await appointmentsAPI.delete(selectedAppointment.id);
            await loadAppointments();
            setIsDeleteOpen(false);
            setSelectedAppointment(null);
        } catch (err) {
            alert(`Error al eliminar cita: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPatientName = (appointment) => {
        if (appointment.patient_name) return appointment.patient_name;
        if (appointment.patient?.first_name || appointment.patient?.last_name) {
            return `${appointment.patient?.first_name || ''} ${appointment.patient?.last_name || ''}`.trim();
        }
        const patient = patients.find((item) => Number(item.id) === Number(appointment.patient_id));
        if (!patient) return appointment.patient_id || '-';
        return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.identification || patient.id;
    };

    const getDoctorName = (appointment) => {
        if (appointment.doctor_name) return appointment.doctor_name;
        if (appointment.doctor?.first_name || appointment.doctor?.last_name) {
            return `${appointment.doctor?.first_name || ''} ${appointment.doctor?.last_name || ''}`.trim();
        }
        const doctor = doctors.find((item) => Number(item.id) === Number(appointment.doctor_id));
        if (!doctor) return appointment.doctor_id || '-';
        return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.license_number || doctor.id;
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (appointment) => {
        setSelectedAppointment(appointment);
        setFormData({
            patient_id: appointment.patient_id ? String(appointment.patient_id) : '',
            doctor_id: appointment.doctor_id ? String(appointment.doctor_id) : '',
            appointment_date: appointment.appointment_date ? appointment.appointment_date.slice(0, 16) : getTodayDateTimeLocal(),
            status: appointment.status || 'scheduled',
            reason: appointment.reason || '',
        });
        setFormErrors({});
        setIsEditOpen(true);
    };

    const openDeleteModal = (appointment) => {
        setSelectedAppointment(appointment);
        setIsDeleteOpen(true);
    };

    const filteredAppointments = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return appointments;
        return appointments.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
    }, [appointments, searchQuery]);

    const paginatedAppointments = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredAppointments.slice(start, start + pageSize);
    }, [filteredAppointments, page, pageSize]);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'patient_name', label: 'Paciente', render: (item) => getPatientName(item) },
        { key: 'doctor_name', label: 'Doctor', render: (item) => getDoctorName(item) },
        { key: 'appointment_date', label: 'Fecha cita', render: (item) => formatDateTime(item.appointment_date) },
        { key: 'status', label: 'Estado', render: (item) => <StatusChip status={item.status} /> },
        { key: 'reason', label: 'Motivo' },
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Fecha y hora *</label>
                    <input
                        type="datetime-local"
                        value={formData.appointment_date}
                        onChange={(e) => {
                            setFormData({ ...formData, appointment_date: e.target.value });
                            setFormErrors({ ...formErrors, appointment_date: undefined });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {renderFieldError('appointment_date')}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Estado</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="scheduled">Programada</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Motivo *</label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => {
                        setFormData({ ...formData, reason: e.target.value });
                        setFormErrors({ ...formErrors, reason: undefined });
                    }}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Motivo de la cita"
                />
                {renderFieldError('reason')}
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Citas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Agenda de citas del consultorio</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={loadAppointments}
                        >
                            <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                        </Button>
                        <Button
                            className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={openCreateModal}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Agregar Cita
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
                            <ErrorState message={`Error al cargar citas: ${error.message}`} onRetry={loadAppointments} />
                        ) : filteredAppointments.length === 0 ? (
                            <EmptyState description="No hay citas para mostrar con el filtro actual." />
                        ) : (
                            <div>
                                <DataTable columns={columns} data={paginatedAppointments} rowKey="id" />
                                <div className="border-t border-gray-100 bg-slate-50/30 p-6">
                                    <PaginationControls
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={filteredAppointments.length}
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
                onSubmit={handleCreateAppointment}
                title="Agregar Cita"
                submitText="Guardar"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <FormDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdateAppointment}
                title="Editar Cita"
                submitText="Guardar Cambios"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteAppointment}
                title="Eliminar Cita"
                message={`¿Seguro que deseas eliminar la cita #${selectedAppointment?.id || ''}?`}
                confirmText="Eliminar"
                loading={isSubmitting}
            />
        </Layout>
    );
};

export default Appointments;
