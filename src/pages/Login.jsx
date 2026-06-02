import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, User, Activity, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

import logo from '@/assets/logo.webp';
import { API_BASE_URL } from '@/services/api';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('farma_user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                setError(data.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Gradients */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-20 w-20 bg-blue-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-500 p-2 border-4 border-white overflow-hidden">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">DULCE ESPERANZA</h1>
                    <p className="text-primary font-bold tracking-[0.3em] text-xs mt-1">SISTEMA DE GESTIÓN</p>
                </div>

                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-blue-gradient text-white p-8 text-center">
                        <CardTitle className="text-2xl font-black">Bienvenido</CardTitle>
                        <CardDescription className="text-blue-100 font-medium">Inicia sesión para continuar</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-10">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold text-center">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Usuario</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary h-5 w-5" />
                                    <Input
                                        name="username"
                                        required
                                        className="h-14 pl-12 bg-slate-50 border-none shadow-inner rounded-2xl font-bold"
                                        placeholder="admin"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary h-5 w-5" />
                                    <Input
                                        name="password"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        className="h-14 pl-12 pr-12 bg-slate-50 border-none shadow-inner rounded-2xl font-bold"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">Recordarme</span>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 mt-4 active:scale-[0.98] transition-transform"
                                disabled={loading}
                            >
                                {loading ? "ACCEDIENDO..." : "INGRESAR AL SISTEMA"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center mt-8 text-sm font-medium text-gray-400">
                    © 2026 Farmacia Dulce Esperanza. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
};

export default Login;
