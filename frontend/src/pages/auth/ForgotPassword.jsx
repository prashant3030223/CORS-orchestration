import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
            toast.success('Reset link sent to your email');
        }, 1500);
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
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Reset Password</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Enter your email to receive recovery instructions</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/5">
                    {!isSent ? (
                        <form className="space-y-5" onSubmit={handleReset}>
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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                We've sent a password reset link to <span className="font-bold text-slate-900 dark:text-white">{email}</span>
                            </p>
                            <button
                                onClick={() => setIsSent(false)}
                                className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                            >
                                Try another email
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center mt-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Remember your password? <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
