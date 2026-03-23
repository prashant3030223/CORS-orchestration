import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading('Authenticating...');

        try {
            // Real API call
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            toast.dismiss(loadingToast);
            toast.success(`Welcome back, ${data.name}!`);
            navigate('/dashboard');

        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            // Unique toast ID prevents duplicates
            toast.error(error.message || 'Server connection failed', { id: 'auth-error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-hidden relative">
            <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 -right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

            <div className="w-full max-w-sm z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-6 text-white">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Login to your CORSGuard dashboard</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/5">
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                                <Link to="/forgot-password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 ml-1">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">Remember me for 30 days</label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Connect to Dashboard
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={() => toast.success('GitHub login simulation ready')}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                        >
                            <Github className="w-5 h-5 text-slate-900 dark:text-white" />
                            Sign in with GitHub
                        </button>
                    </div>
                </div>

                <p className="text-center mt-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Don't have an account? <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Create for free</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
