import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { Shield, Globe, Lock, Clock, Plus, Trash2, Check, AlertCircle, Save, Zap, Terminal, RefreshCw, X, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const CorsConfig = () => {
    const [selectedApi, setSelectedApi] = useState(null);
    const [apis, setApis] = useState([]);
    const [isFilterEnabled, setIsFilterEnabled] = useState(true);
    const [allowCredentials, setAllowCredentials] = useState(false);
    const [allowAllMethods, setAllowAllMethods] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    const [origins, setOrigins] = useState(['https://myapp.com', 'https://admin.myapp.com']);
    const [deniedOrigins, setDeniedOrigins] = useState(['https://malicious-site.net']);
    const [selectedMethods, setSelectedMethods] = useState(['GET', 'POST']);

    const [newOrigin, setNewOrigin] = useState('');
    const [newDeniedOrigin, setNewDeniedOrigin] = useState('');

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

    useEffect(() => {
        const fetchApis = async () => {
            try {
                const res = await api.get('/inventory');
                setApis(res.data);
                if (res.data.length > 0) setSelectedApi(res.data[0]);
            } catch (err) {
                console.error('Failed to load infrastructure nodes');
            }
        };
        fetchApis();
    }, []);

    // Track initial load to prevent auto-save on mount
    const isPolicyLoaded = React.useRef(false);
    // Debounce timer
    const saveTimeout = React.useRef(null);

    useEffect(() => {
        if (!selectedApi) return;
        isPolicyLoaded.current = false; // Reset on API change

        const fetchPolicy = async () => {
            try {
                // selectedApi can be object or ID depending on select interaction, ensuring ID
                const apiId = selectedApi._id || selectedApi;
                const res = await api.get(`/policies/${apiId}`);
                const { allowedOrigins, blacklistedOrigins, allowedMethods, allowCredentials } = res.data;

                setOrigins(allowedOrigins || []);
                setDeniedOrigins(blacklistedOrigins || []);
                setSelectedMethods(allowedMethods || ['GET', 'POST']);
                setAllowCredentials(allowCredentials || false);
                setAllowAllMethods(allowedMethods?.includes('*') || false);

                // Allow auto-save after data is set
                setTimeout(() => { isPolicyLoaded.current = true; }, 500);
            } catch (err) {
                console.error('Policy sync failed');
            }
        };
        fetchPolicy();
    }, [selectedApi]);

    // Auto-Save Effect
    useEffect(() => {
        if (!isPolicyLoaded.current || !selectedApi) return;

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            setIsDeploying(true);
            try {
                await api.post('/policies/update', {
                    apiId: selectedApi._id || selectedApi,
                    allowedOrigins: origins,
                    blacklistedOrigins: deniedOrigins,
                    allowedMethods: allowAllMethods ? ['*'] : selectedMethods,
                    allowCredentials,
                    isDeploying: false // Internal save, not full edge deploy log
                });
                setIsDeploying(false);
                toast.success('Policy saved', { id: 'autosave', icon: '☁️' });
            } catch (err) {
                setIsDeploying(false);
                console.error('Auto-save failed', err);
            }
        }, 1000); // 1-second debounce

        return () => clearTimeout(saveTimeout.current);
    }, [origins, deniedOrigins, selectedMethods, allowCredentials, allowAllMethods, selectedApi]);

    // ... helper functions ...
    const addOrigin = (type) => {
        const val = type === 'allowed' ? newOrigin : newDeniedOrigin;
        if (!val) return;

        try {
            if (!val.startsWith('http') && !val.includes('*')) throw new Error();
            if (val.startsWith('http')) new URL(val.replace('*', 'wildcard'));
        } catch (e) {
            toast.error('Invalid origin format');
            return;
        }

        if (type === 'allowed') {
            if (origins.includes(val)) return;
            setOrigins([...origins, val]);
            setNewOrigin('');
            // toast.success('Allowed origin staged'); // Autosave handles toast
        } else {
            if (deniedOrigins.includes(val)) return;
            setDeniedOrigins([...deniedOrigins, val]);
            setNewDeniedOrigin('');
            // toast.success('Blocked origin staged');
        }
    };

    const removeOrigin = (val, type) => {
        if (type === 'allowed') {
            setOrigins(origins.filter(o => o !== val));
        } else {
            setDeniedOrigins(deniedOrigins.filter(o => o !== val));
        }
        // toast.success('Origin removed from stage');
    };

    const toggleMethod = (method) => {
        if (selectedMethods.includes(method)) {
            setSelectedMethods(selectedMethods.filter(m => m !== method));
        } else {
            setSelectedMethods([...selectedMethods, method]);
        }
    };

    const handleDeploy = async () => {
        if (!selectedApi) {
            toast.error('Please select an API to deploy policy updates');
            return;
        }

        setIsDeploying(true);
        const deployToast = toast.loading(`Propagating security policy to ${selectedApi.name || 'edge'} nodes...`);

        try {
            await api.post('/policies/update', {
                apiId: selectedApi._id || selectedApi,
                allowedOrigins: origins,
                blacklistedOrigins: deniedOrigins,
                allowedMethods: allowAllMethods ? ['*'] : selectedMethods,
                allowCredentials,
                isDeploying: true
            });

            setIsDeploying(false);
            toast.dismiss(deployToast);
            toast.success('Security policy successfully deployed across edge nodes!', {
                icon: '🚀'
            });
        } catch (err) {
            setIsDeploying(false);
            toast.dismiss(deployToast);
            toast.error('Deployment sequence failed');
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Policy Constructor</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Define cross-origin access control logic for individual API endpoints.</p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest pl-2", isFilterEnabled ? "text-green-600" : "text-slate-400")}>
                        {isFilterEnabled ? 'ENFORCEMENT ACTIVE' : 'FILTER DISABLED'}
                    </span>
                    <button
                        onClick={() => {
                            setIsFilterEnabled(!isFilterEnabled);
                            toast(isFilterEnabled ? 'Filter enforcement suspended' : 'Filter enforcement resumed', { icon: isFilterEnabled ? '⚠️' : '🛡️' });
                        }}
                        className={cn(
                            "relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none ring-4 ring-transparent",
                            isFilterEnabled ? "bg-green-600 ring-green-500/10" : "bg-slate-200 dark:bg-slate-700 ring-slate-400/10"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md",
                            isFilterEnabled ? "translate-x-7" : "translate-x-1"
                        )} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                                <Server className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Endpoints</h3>
                        </div>
                        <div className="space-y-4">
                            <select
                                value={selectedApi?._id || ''}
                                onChange={(e) => setSelectedApi(apis.find(a => a._id === e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold"
                            >
                                <option value="">Target API Instance...</option>
                                {apis.map(api => <option key={api._id} value={api._id}>{api.name}</option>)}
                            </select>

                            <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-200/50 dark:border-amber-500/20">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                                        Policy changes take approximately 60 seconds to propagate to global edge nodes after deployment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                                <Lock className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Security Flags</h3>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer group">
                                <div>
                                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">Allow Credentials</p>
                                    <p className="text-[10px] font-bold text-slate-400">Cookies & Auth Headers</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allowCredentials}
                                    onChange={(e) => setAllowCredentials(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </label>

                            <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer group">
                                <div>
                                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">Universal Methods</p>
                                    <p className="text-[10px] font-bold text-slate-400">Allow All HTTP Verbs</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={allowAllMethods}
                                    onChange={(e) => setAllowAllMethods(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying || !selectedApi}
                        title={!selectedApi ? "Select a Target API Instance first" : "Deploy policy to edge nodes"}
                        className={cn(
                            "w-full flex items-center justify-center gap-3 px-6 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                            (isDeploying || !selectedApi)
                                ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                        )}
                    >
                        {isDeploying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Zap className="w-5 h-5 fill-current" />
                                {selectedApi ? 'Deploy Policy Updates' : 'Select API to Deploy'}
                            </>
                        )}
                    </button>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Allowed Origins</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={newOrigin}
                                            onChange={(e) => setNewOrigin(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addOrigin('allowed')}
                                            placeholder="https://example.com"
                                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold"
                                        />
                                        <button
                                            onClick={() => addOrigin('allowed')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[120px] content-start">
                                        {origins.map(origin => (
                                            <div key={origin} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{origin}</span>
                                                <button onClick={() => removeOrigin(origin, 'allowed')} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {origins.length === 0 && <p className="text-[11px] font-bold text-slate-400 py-4 italic">No allowed origins staged.</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Blacklisted</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={newDeniedOrigin}
                                            onChange={(e) => setNewDeniedOrigin(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addOrigin('denied')}
                                            placeholder="https://malicious.com"
                                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none transition-all text-sm font-bold"
                                        />
                                        <button
                                            onClick={() => addOrigin('denied')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[120px] content-start">
                                        {deniedOrigins.map(origin => (
                                            <div key={origin} className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/20 animate-in zoom-in-95">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400">{origin}</span>
                                                <button onClick={() => removeOrigin(origin, 'denied')} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {deniedOrigins.length === 0 && <p className="text-[11px] font-bold text-slate-400 py-4 italic">No blocked origins staged.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">HTTP Verb Authorization</h3>
                            </div>
                            {allowAllMethods && <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-600/20 uppercase tracking-tighter">Wildcard Active</span>}
                        </div>

                        <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-4 transition-opacity", allowAllMethods && "opacity-40 cursor-not-allowed pointer-events-none")}>
                            {methods.map(method => (
                                <button
                                    key={method}
                                    onClick={() => toggleMethod(method)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all group relative overflow-hidden",
                                        selectedMethods.includes(method)
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-200 dark:hover:border-indigo-500/30"
                                    )}
                                >
                                    <span className="text-sm font-black tracking-widest z-10">{method}</span>
                                    {selectedMethods.includes(method) && <Check className="w-12 h-12 absolute -right-2 -bottom-2 text-white/10" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorsConfig;
