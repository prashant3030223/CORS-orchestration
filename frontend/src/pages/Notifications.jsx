import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import {
    Bell,
    ShieldAlert,
    CheckCircle2,
    Zap,
    Clock,
    MoreVertical,
    Trash2,
    Check
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const Notifications = () => {
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data);
            } catch (err) {
                console.error('Failed to fetch from vault');
            }
        };

        fetchNotifications();

        socket.on('notification_received', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            toast.custom((t) => (
                <div className={cn(
                    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4",
                    t.visible ? "opacity-100" : "opacity-0"
                )}>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-black uppercase text-slate-900 dark:text-white">{notification.title}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">Real-time Security Event Sync</p>
                    </div>
                </div>
            ));
        });

        return () => socket.off('notification_received');
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'security': return <ShieldAlert className="w-5 h-5 text-red-600" />;
            case 'policy': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'alert': return <Zap className="w-5 h-5 text-amber-600" />;
            default: return <Bell className="w-5 h-5 text-blue-600" />;
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications synchronized as read');
        } catch (err) {
            toast.error('Sync failed');
        }
    };

    const deleteNotification = async (id, title) => {
        // Individual delete route not implemented yet, using local state for now
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success(`Discarded alert: ${title}`);
    };

    const markSingleRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            toast.success('Alert acknowledged');
        } catch (err) {
            toast.error('Acknowledgement failed');
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/clear');
            setNotifications([]);
            toast.success('Notification vault cleared');
        } catch (err) {
            toast.error('Wipe sequence failed');
        }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || n.type === filter);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Feed</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time audit of security events and system mutations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllRead}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/20 uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
                    >
                        Mark All Read
                    </button>
                    <button
                        onClick={clearAll}
                        className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                    >
                        Clear Vault
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 overflow-x-auto bg-slate-50/50 dark:bg-slate-800/20 no-scrollbar">
                    {[
                        { id: 'all', label: 'ALL LOGS' },
                        { id: 'security', label: 'SECURITY' },
                        { id: 'policy', label: 'POLICIES' },
                        { id: 'system', label: 'SYSTEM' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => {
                                setFilter(f.id);
                                toast.info(`Viewing ${f.label.toLowerCase()} stream`);
                            }}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap tracking-widest",
                                filter === f.id
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotifications.map((n) => (
                        <div key={n._id} className={cn(
                            "p-8 flex items-start gap-6 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all relative",
                            !n.read && "bg-blue-50/30 dark:bg-blue-500/5"
                        )}>
                            {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />}

                            <div className={cn(
                                "p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110",
                                n.type === 'security' ? 'bg-red-50 dark:bg-red-500/10' :
                                    n.type === 'policy' ? 'bg-green-50 dark:bg-green-500/10' :
                                        'bg-blue-50 dark:bg-blue-500/10'
                            )}>
                                {getIcon(n.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <h4 className={cn(
                                        "text-sm font-black uppercase tracking-tight truncate",
                                        n.read ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white"
                                    )}>
                                        {n.title}
                                    </h4>
                                    <span className="text-[10px] font-black text-slate-400 whitespace-nowrap flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <Clock className="w-3.5 h-3.5" /> {(n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'NOW')}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                    {n.message}
                                </p>
                                <div className="flex items-center gap-6">
                                    {!n.read && (
                                        <button
                                            onClick={() => markSingleRead(n._id)}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.15em] flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Acknowledge
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toast.info(`Accessing trace for: ${n.title}`)}
                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-[0.15em]"
                                    >
                                        Inspect Trace
                                    </button>
                                    <button
                                        onClick={() => deleteNotification(n._id, n.title)}
                                        className="text-[10px] font-black text-red-400 hover:text-red-600 transition-colors uppercase tracking-[0.15em] flex items-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Discard
                                    </button>
                                </div>
                            </div>

                            <button className="p-2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                        <div className="py-32 text-center animate-in fade-in duration-700">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200 dark:text-slate-700 rotate-12">
                                <Bell className="w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Vault is Empty</h3>
                            <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">No alerts matching current filter level.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
