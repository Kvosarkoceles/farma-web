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

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/invoicing" element={<Invoicing />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Router>
    );
}

export default App;
