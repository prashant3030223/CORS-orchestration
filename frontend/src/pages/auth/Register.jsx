import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Users } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        companyName: '',
        role: 'Global Admin',
        password: ''
    });
    const { theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [inviteData, setInviteData] = useState(null);
    const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const inviteToken = queryParams.get('invite');
    const inviteCode = queryParams.get('code');

    React.useEffect(() => {
        if (inviteToken || inviteCode) {
            const verifyToken = async () => {
                setIsVerifyingInvite(true);
                try {
                    const tokenToVerify = inviteCode || inviteToken;
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/invite/verify/${tokenToVerify}`);
                    const data = await response.json();
                    if (response.ok) {
                        setInviteData(data);
                        setFormData(prev => ({
                            ...prev,
                            companyName: data.organizationName,
                            role: data.role
                        }));
                    } else {
                        toast.error('Invite link invalid or expired');
                    }
                } catch (err) {
                    toast.error('Security verification failed');
                } finally {
                    setIsVerifyingInvite(false);
                }
            };
            verifyToken();
        }
    }, [inviteToken, inviteCode]);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill in all security fields');
            return;
        }

        if (formData.password.length < 8) {
            toast.error('Security protocol requires at least 8 characters');
            return;
        }

        setIsLoading(true);
        const loadingToast = toast.loading('Initializing enterprise account...');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002/api'}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    inviteToken: inviteToken,
                    inviteCode: inviteCode
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Auto login after registration
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            toast.dismiss(loadingToast);
            toast.success('Account provisioned successfully! Redirecting...');
            navigate('/dashboard');

        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative overflow-hidden">
            <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 -right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

            <div className="w-full max-w-sm z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-6 text-white">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Create Account</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Start managing your CORS policies today</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/5">
                    <form className="space-y-4" onSubmit={handleRegister}>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {!(inviteToken || inviteCode) && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Company/Organization Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        placeholder="Acme Corp"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {(inviteToken || inviteCode) && inviteData && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl space-y-2 animate-in slide-in-from-top-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Joining Organization</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{inviteData.organizationName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-11">
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black rounded-md uppercase tracking-widest border border-blue-500/20">
                                        Role: {inviteData.role}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!(inviteToken || inviteCode) && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Role</label>
                                <div className="relative">
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium appearance-none"
                                    >
                                        <option value="Global Admin">Global Admin (Owner)</option>
                                        <option value="Security Lead">Security Lead</option>
                                        <option value="DevOps">DevOps Engineer</option>
                                        <option value="Auditor">Auditor</option>
                                        <option value="Viewer">Viewer</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@company.com"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                        <div className="pt-2 space-y-3">
                            <div className="flex items-center gap-2 ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <div className={cn(
                                    "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                                    formData.password.length >= 8 ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                                )}>
                                    <Check className="w-3 h-3" />
                                </div>
                                Password must be at least 8 characters
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Free Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Already have an account? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
