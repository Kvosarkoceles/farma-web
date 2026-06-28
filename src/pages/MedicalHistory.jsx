import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { patientsAPI } from '@/services/api';

const MedicalHistory = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadPatients = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await patientsAPI.getAll();
            const rows = Array.isArray(data) ? data : [];
            setPatients(rows);
            if (!selectedPatientId && rows.length > 0) {
                setSelectedPatientId(String(rows[0].id));
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async (patientId) => {
        if (!patientId) {
            setHistory([]);
            setSelectedPatient(null);
            return;
        }

        try {
            setHistoryLoading(true);
            setError(null);
            const [patient, patientHistory] = await Promise.all([
                patientsAPI.getById(patientId),
                patientsAPI.getMedicalHistory(patientId),
            ]);

            setSelectedPatient(patient || null);

            if (Array.isArray(patientHistory)) {
                setHistory(patientHistory);
            } else if (Array.isArray(patientHistory?.data)) {
                setHistory(patientHistory.data);
            } else if (Array.isArray(patientHistory?.history)) {
                setHistory(patientHistory.history);
            } else {
                setHistory([]);
            }
        } catch (err) {
            setError(err);
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            loadHistory(selectedPatientId);
        }
    }, [selectedPatientId]);

    const patientLabel = useMemo(() => {
        if (!selectedPatient) return 'Paciente';
        return `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() || `Paciente #${selectedPatient.id}`;
    }, [selectedPatient]);

    return (
        <Layout>
            <div className="bg-mesh-gradient pt-12 pb-24 px-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight mb-2">Historial Clinico</h2>
                        <p className="text-blue-100 text-lg opacity-90">Resumen medico por paciente</p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white/90 text-primary hover:bg-white font-bold px-6 h-12 shadow-lg rounded-xl active:scale-95 transition-all"
                        onClick={loadPatients}
                    >
                        <Loader2 size={18} className={loading ? 'mr-2 animate-spin' : 'mr-2'} /> Recargar
                    </Button>
                </div>
            </div>

            <div className="px-8 -mt-16 relative z-20 pb-12 space-y-6">
                <Card className="border-none shadow-xl">
                    <CardHeader className="p-6 border-b border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Paciente</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                >
                                    {patients.length === 0 ? <option value="">Sin pacientes</option> : null}
                                    {patients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {`${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.identification || patient.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading || historyLoading ? (
                            <LoadingOverlay />
                        ) : error ? (
                            <ErrorState message={`Error al cargar historial: ${error.message}`} onRetry={() => loadHistory(selectedPatientId)} />
                        ) : history.length === 0 ? (
                            <EmptyState description="No hay eventos en el historial para este paciente." />
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-gray-800">{patientLabel}</h3>
                                {history.map((entry, index) => (
                                    <div key={entry.id || index} className="rounded-xl border border-gray-100 p-4 bg-slate-50/50">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                            <p className="font-bold text-gray-800">{entry.type || entry.event_type || 'Evento clinico'}</p>
                                            <p className="text-sm text-gray-500">{entry.date || entry.created_at || entry.updated_at || '-'}</p>
                                        </div>
                                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                            {entry.summary || entry.notes || entry.description || JSON.stringify(entry)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default MedicalHistory;
