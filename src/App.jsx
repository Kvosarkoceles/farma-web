import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Inventory from '@/pages/Inventory';
import Suppliers from '@/pages/Suppliers';
import Invoicing from '@/pages/Invoicing';
import Clients from '@/pages/Clients';
import Purchases from '@/pages/Purchases';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import Patients from '@/pages/Patients';
import Doctors from '@/pages/Doctors';
import Appointments from '@/pages/Appointments';
import Consultations from '@/pages/Consultations';
import Prescriptions from '@/pages/Prescriptions';
import MedicalHistory from '@/pages/MedicalHistory';
import PrescriptionAlerts from '@/pages/PrescriptionAlerts';
import PrescriptionOrders from '@/pages/PrescriptionOrders';
import PrescriptionDispensing from '@/pages/PrescriptionDispensing';
import { hasAnyRole, isAuthenticated } from '@/lib/auth';

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const RoleRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    if (!hasAnyRole(allowedRoles)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
                <Route path="/invoicing" element={<ProtectedRoute><Invoicing /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
                <Route
                    path="/users"
                    element={(
                        <RoleRoute allowedRoles={['admin']}>
                            <Users />
                        </RoleRoute>
                    )}
                />
                <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/consultations" element={<ProtectedRoute><Consultations /></ProtectedRoute>} />
                <Route path="/prescriptions" element={<ProtectedRoute><Prescriptions /></ProtectedRoute>} />
                <Route path="/medical-history" element={<ProtectedRoute><MedicalHistory /></ProtectedRoute>} />
                <Route path="/prescriptions/alerts" element={<ProtectedRoute><PrescriptionAlerts /></ProtectedRoute>} />
                <Route path="/prescriptions/orders" element={<ProtectedRoute><PrescriptionOrders /></ProtectedRoute>} />
                <Route path="/prescriptions/dispensing" element={<ProtectedRoute><PrescriptionDispensing /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
