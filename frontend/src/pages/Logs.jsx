import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { Search, Download, Trash2, ShieldAlert, ShieldCheck, Clock, ListOrdered, ChevronLeft, ChevronRight, X, Filter, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { exportToCsv } from '../utils/export';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/logs');
                setLogs(res.data);
            } catch (err) {
                console.error('Audit vault inaccessible');
            }
        };

        fetchLogs();

        // 1. Define Join Function
        const joinOrg = () => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return;
            const user = JSON.parse(storedUser);
            if (user && user.organization) {
                const orgId = typeof user.organization === 'string' ? user.organization : user.organization._id;
                socket.emit('join_org', orgId);
            }
        };

        // 2. Initial Join
        if (socket.connected) {
            joinOrg();
        }

        // 3. Re-join on every connect (listener)
        socket.on('connect', joinOrg);

        socket.on('log_received', (newLog) => {
            setLogs(prev => [newLog, ...prev]);
        });

        return () => {
            socket.off('connect', joinOrg);
            socket.off('log_received');
        };
    }, []);

    const filteredLogs = logs.filter(log =>
        (log.apiEndpoint || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.origin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        try {
            if (filteredLogs.length === 0) {
                toast.error('No logs available to export');
                return;
            }

            const exportData = filteredLogs.map(log => ({
                Timestamp: new Date(log.timestamp).toLocaleString(),
                Type: log.eventType,
                Origin: log.origin || 'INTERNAL',
                Endpoint: log.apiEndpoint || 'N/A',
                Status: log.status,
                Details: log.details
            }));

            exportToCsv(exportData, `CORSGuard_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Security audit archive exported');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    const handleClearLogs = async () => {
        if (window.confirm('CRITICAL: Purge all current security logs? This action is irreversible.')) {
            try {
                await api.delete('/logs/clear');
                setLogs([]);
                toast.success('Audit vault successfully purged');
            } catch (err) {
                toast.error('Purge sequence failed');
            }
        }
    };

    const handlePageChange = (page) => {
        if (typeof page !== 'number') return;
        setCurrentPage(page);
        toast.info(`Navigating to log segment: ${page}`);
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Security Audit</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Comprehensive trail for all cross-origin requests and engine decisions.</p>
                </div>
                <button
                    onClick={handleClearLogs}
                    className="flex items-center gap-2 px-5 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-200 dark:border-red-500/20 active:scale-95"
                >
                    <Trash2 className="w-4 h-4" /> Purge Cache
                </button>
            </div>

            <div className="glass-card rounded-[40px] premium-shadow overflow-hidden flex flex-col border border-white/20 dark:border-white/5">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find logs by instance, node origin, or reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-black transition-all shadow-sm focus:border-blue-500/30"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => toast.success('Filter protocols active')}
                            className="flex items-center gap-2 px-7 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Filter className="w-4 h-4 text-blue-500" /> Protocol Filters
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-7 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Download className="w-4 h-4 text-green-500" /> Export Archive
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-200">
                            <tr>
                                <th className="px-8 py-6">Event & Type</th>
                                <th className="px-8 py-6">Origin Node</th>
                                <th className="px-8 py-6">Request Trace</th>
                                <th className="px-8 py-6">Outcome</th>
                                <th className="px-8 py-6 max-w-[200px]">Details</th>
                                <th className="px-8 py-6 text-right pr-12">Vault</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-transparent">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="group hover:bg-blue-500/[0.02] dark:hover:bg-blue-500/[0.03] transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.eventType}</div>
                                            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                                                {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <code className="text-[10px] font-black text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-500/10">{log.origin || 'INTERNAL'}</code>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-wider">{log.method || 'N/A'}</span>
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{log.apiEndpoint || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={cn(
                                            "inline-flex items-center gap-2.5 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm",
                                            log.status === 'Allowed'
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                                                : log.status === 'Blocked'
                                                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                                                    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
                                        )}>
                                            {log.status === 'Allowed' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 max-w-[200px]">
                                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 opacity-90 truncate hover:whitespace-normal hover:overflow-visible transition-all cursor-help">{log.details}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right pr-12">
                                        <button
                                            onClick={() => toast.success(`Inspecting trace #${log._id}`)}
                                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90"
                                        >
                                            <BarChart3 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-8 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/20 dark:bg-slate-950/20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">Vault stream synchronization active • Persistent tracking</p>
                    <div className="flex items-center gap-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-20 active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            className="w-12 h-12 flex items-center justify-center rounded-2xl text-xs font-black transition-all uppercase tracking-widest bg-blue-600 text-white shadow-xl shadow-blue-500/40 neon-glow-blue border border-transparent"
                        >
                            1
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Logs;
