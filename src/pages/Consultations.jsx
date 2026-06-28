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
import { consultationsAPI, doctorsAPI, patientsAPI } from '@/services/api';
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
    consultation_date: getTodayDateTimeLocal(),
    diagnosis: '',
    treatment: '',
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
};

const Consultations = () => {
    const [consultations, setConsultations] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});

    const pageSize = Number.isFinite(DEFAULT_PAGE_SIZE) && DEFAULT_PAGE_SIZE > 0 ? DEFAULT_PAGE_SIZE : 10;

    const loadConsultations = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await consultationsAPI.getAll({});
            setConsultations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err);
            console.error('Error loading consultations:', err);
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
        loadConsultations();
        loadRelations();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    const resetForm = () => {
        setFormData({ ...initialFormData, consultation_date: getTodayDateTimeLocal() });
        setFormErrors({});
    };

    const validateFormData = () => {
        const errors = {};

        const patientResult = validateRequired(formData.patient_id, 'El paciente');
        if (!patientResult.valid) errors.patient_id = patientResult.message;

        const doctorResult = validateRequired(formData.doctor_id, 'El doctor');
        if (!doctorResult.valid) errors.doctor_id = doctorResult.message;

        const dateResult = validateRequired(formData.consultation_date, 'La fecha de consulta');
        if (!dateResult.valid) errors.consultation_date = dateResult.message;

        const diagnosisResult = validateRequired(formData.diagnosis, 'El diagnostico');
        if (!diagnosisResult.valid) errors.diagnosis = diagnosisResult.message;

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getPayload = () => ({
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        consultation_date: formData.consultation_date,
        diagnosis: formData.diagnosis.trim(),
        treatment: formData.treatment.trim() || null,
    });

    const handleCreateConsultation = async () => {
        if (!validateFormData()) return;

        setIsSubmitting(true);
        try {
            await consultationsAPI.create(getPayload());
            await loadConsultations();
            setIsCreateOpen(false);
            resetForm();
        } catch (err) {
            alert(`Error al crear consulta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateConsultation = async () => {
        if (!selectedConsultation || !validateFormData()) return;

        setIsSubmitting(true);
        try {
            await consultationsAPI.update(selectedConsultation.id, getPayload());
            await loadConsultations();
            setIsEditOpen(false);
            setSelectedConsultation(null);
            resetForm();
        } catch (err) {
            alert(`Error al actualizar consulta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConsultation = async () => {
        if (!selectedConsultation) return;

        setIsSubmitting(true);
        try {
            await consultationsAPI.delete(selectedConsultation.id);
            await loadConsultations();
            setIsDeleteOpen(false);
            setSelectedConsultation(null);
        } catch (err) {
            alert(`Error al eliminar consulta: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPatientName = (consultation) => {
        if (consultation.patient_name) return consultation.patient_name;
        if (consultation.patient?.first_name || consultation.patient?.last_name) {
            return `${consultation.patient?.first_name || ''} ${consultation.patient?.last_name || ''}`.trim();
        }
        const patient = patients.find((item) => Number(item.id) === Number(consultation.patient_id));
        if (!patient) return consultation.patient_id || '-';
        return `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.identification || patient.id;
    };

    const getDoctorName = (consultation) => {
        if (consultation.doctor_name) return consultation.doctor_name;
        if (consultation.doctor?.first_name || consultation.doctor?.last_name) {
            return `${consultation.doctor?.first_name || ''} ${consultation.doctor?.last_name || ''}`.trim();
        }
        const doctor = doctors.find((item) => Number(item.id) === Number(consultation.doctor_id));
        if (!doctor) return consultation.doctor_id || '-';
        return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.license_number || doctor.id;
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEditModal = (consultation) => {
        setSelectedConsultation(consultation);
        setFormData({
            patient_id: consultation.patient_id ? String(consultation.patient_id) : '',
            doctor_id: consultation.doctor_id ? String(consultation.doctor_id) : '',
            consultation_date: consultation.consultation_date ? consultation.consultation_date.slice(0, 16) : getTodayDateTimeLocal(),
            diagnosis: consultation.diagnosis || '',
            treatment: consultation.treatment || '',
        });
        setFormErrors({});
        setIsEditOpen(true);
    };

    const openDeleteModal = (consultation) => {
        setSelectedConsultation(consultation);
        setIsDeleteOpen(true);
    };

    const filteredConsultations = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return consultations;
        return consultations.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
    }, [consultations, searchQuery]);

    const paginatedConsultations = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredConsultations.slice(start, start + pageSize);
    }, [filteredConsultations, page, pageSize]);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'patient_name', label: 'Paciente', render: (item) => getPatientName(item) },
        { key: 'doctor_name', label: 'Doctor', render: (item) => getDoctorName(item) },
        { key: 'consultation_date', label: 'Fecha consulta', render: (item) => formatDateTime(item.consultation_date) },
        { key: 'diagnosis', label: 'Diagnostico' },
        { key: 'treatment', label: 'Tratamiento' },
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

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Fecha y hora *</label>
                <input
                    type="datetime-local"
                    value={formData.consultation_date}
                    onChange={(e) => {
                        setFormData({ ...formData, consultation_date: e.target.value });
                        setFormErrors({ ...formErrors, consultation_date: undefined });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {renderFieldError('consultation_date')}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Diagnostico *</label>
                <textarea
                    value={formData.diagnosis}
                    onChange={(e) => {
                        setFormData({ ...formData, diagnosis: e.target.value });
                        setFormErrors({ ...formErrors, diagnosis: undefined });
                    }}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Diagnostico medico"
                />
                {renderFieldError('diagnosis')}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tratamiento</label>
                <textarea
                    value={formData.treatment}
                    onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Tratamiento indicado"
                />
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Consultas</h2>
                        <p className="text-blue-100 text-lg opacity-90">Listado de consultas medicas</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={loadConsultations}
                        >
                            <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                        </Button>
                        <Button
                            className="bg-white text-primary hover:bg-blue-50 font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                            onClick={openCreateModal}
                        >
                            <Plus className="mr-2 h-5 w-5" /> Agregar Consulta
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
                            <ErrorState message={`Error al cargar consultas: ${error.message}`} onRetry={loadConsultations} />
                        ) : filteredConsultations.length === 0 ? (
                            <EmptyState description="No hay consultas para mostrar con el filtro actual." />
                        ) : (
                            <div>
                                <DataTable columns={columns} data={paginatedConsultations} rowKey="id" />
                                <div className="border-t border-gray-100 bg-slate-50/30 p-6">
                                    <PaginationControls
                                        page={page}
                                        pageSize={pageSize}
                                        totalItems={filteredConsultations.length}
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
                onSubmit={handleCreateConsultation}
                title="Agregar Consulta"
                submitText="Guardar"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <FormDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdateConsultation}
                title="Editar Consulta"
                submitText="Guardar Cambios"
                loading={isSubmitting}
            >
                {formContent}
            </FormDialog>

            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConsultation}
                title="Eliminar Consulta"
                message={`¿Seguro que deseas eliminar la consulta #${selectedConsultation?.id || ''}?`}
                confirmText="Eliminar"
                loading={isSubmitting}
            />
        </Layout>
    );
};

export default Consultations;
