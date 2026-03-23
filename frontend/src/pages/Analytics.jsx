import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import {
    BarChart3,
    Activity,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Globe,
    Monitor,
    Calendar,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { exportToCsv } from '../utils/export';

const Analytics = () => {
    const [range, setRange] = useState('7d');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Stats State
    const [stats, setStats] = useState([
        { label: 'Peak RPM', value: '0', icon: Activity, change: '', color: 'blue', pos: true },
        { label: 'Active Origins', value: '0', icon: Globe, change: '', color: 'indigo', pos: true },
        { label: 'CORS Blocks', value: '0%', icon: AlertTriangle, change: '', color: 'red', pos: false },
    ]);

    // Charts State
    const [originData, setOriginData] = useState({
        labels: [],
        datasets: [{
            label: 'Top Origins',
            data: [],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(99, 102, 241, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(192, 38, 211, 0.8)',
            ],
            borderRadius: 12,
        }]
    });

    const [rpmChartData, setRpmChartData] = useState({
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
            label: 'Requests Per Hour',
            data: Array(24).fill(0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
        }]
    });

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await api.get('/analytics/charts');
            const { originStats, rpmData, summary } = res.data;

            // Stats Update
            if (summary) {
                setStats([
                    { label: 'Peak RPM', value: summary.peakRpm, icon: Activity, change: '+0%', color: 'blue', pos: true },
                    { label: 'Active Origins', value: summary.activeOrigins, icon: Globe, change: '', color: 'indigo', pos: true },
                    { label: 'CORS Blocks', value: `${summary.blockPercentage}%`, icon: AlertTriangle, change: '', color: 'red', pos: false },
                ]);
            }

            // Charts Update
            setOriginData(prev => ({
                ...prev,
                labels: originStats.map(o => o._id || 'Unknown'),
                datasets: [{ ...prev.datasets[0], data: originStats.map(o => o.count) }]
            }));

            setRpmChartData(prev => ({
                ...prev,
                datasets: [{ ...prev.datasets[0], data: rpmData }]
            }));

        } catch (err) {
            console.error('Analytics sync failed', err);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();

        // Join organization room for targeted real-time updates
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.organization) {
            socket.emit('join_org', typeof user.organization === 'string' ? user.organization : user.organization._id);
        }

        socket.on('log_received', (newLog) => {
            // Real-time chart updates (Optimistic)
            const currentHour = new Date().getHours();
            setRpmChartData(prev => {
                const newData = [...prev.datasets[0].data];
                newData[currentHour] = (newData[currentHour] || 0) + 1;
                return { ...prev, datasets: [{ ...prev.datasets[0], data: newData }] };
            });

            const origin = newLog.origin || 'Unknown';
            setOriginData(prev => {
                const index = prev.labels.indexOf(origin);
                if (index !== -1) {
                    const newCount = [...prev.datasets[0].data];
                    newCount[index] += 1;
                    return { ...prev, datasets: [{ ...prev.datasets[0], data: newCount }] };
                }
                return prev;
            });
        });

        return () => socket.off('log_received');
    }, [fetchAnalytics]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        const id = toast.loading('Synchronizing with edge telemetry...');
        fetchAnalytics().then(() => {
            setIsRefreshing(false);
            toast.dismiss(id);
            toast.success('Analytics data synchronized');
        });
    };

    const handleDownload = (format) => {
        try {
            if (format === 'csv') {
                const exportData = [
                    ...stats.map(s => ({ Category: 'System Intelligence', Label: s.label, Value: s.value })),
                    ...originData.labels.map((label, i) => ({
                        Category: 'Top Origin Usage',
                        Label: label,
                        Value: originData.datasets[0].data[i]
                    }))
                ];

                exportToCsv(exportData, `CORSGuard_Intelligence_${new Date().toISOString().split('T')[0]}.csv`);
                toast.success('Analytics intelligence exported to CSV');
            } else {
                toast.promise(
                    new Promise(resolve => setTimeout(resolve, 2000)),
                    {
                        loading: `Compiling ${format.toUpperCase()} report...`,
                        success: `${format.toUpperCase()} report generation complete`,
                        error: 'Report generation failed'
                    }
                );
            }
        } catch (err) {
            toast.error('Intelligence export failed');
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">System Intelligence</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Deep dive into traffic patterns and security events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        {['24h', '7d', '30d', '90d'].map(r => (
                            <button
                                key={r}
                                onClick={() => {
                                    setRange(r);
                                    toast.success(`Range adjusted to ${r}`);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest",
                                    range === r ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-500 hover:text-slate-700 dark:hover:text-white"
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            "p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-90",
                            isRefreshing && "animate-spin"
                        )}
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "p-3 rounded-2xl transition-transform group-hover:scale-110",
                                stat.color === 'blue' && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                stat.color === 'indigo' && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                                stat.color === 'red' && "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
                            )}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            {stat.change && (
                                <span className={cn(
                                    "text-[10px] font-black flex items-center gap-1 px-2.5 py-1.5 rounded-xl uppercase tracking-widest",
                                    stat.pos ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'
                                )}>
                                    {stat.pos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />} {stat.change}
                                </span>
                            )}
                        </div>
                        <h4 className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h4>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            Requests Per Minute
                        </h3>
                        <button
                            onClick={() => handleDownload('csv')}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all text-slate-400 hover:text-blue-600"
                            title="Download CSV"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-80">
                        <Line
                            data={rpmChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
                                    y: { grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }, ticks: { font: { weight: 'bold', size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                                <Monitor className="w-4 h-4" />
                            </div>
                            Usage by Origin
                        </h3>
                        <button
                            onClick={() => handleDownload('pdf')}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all text-slate-400 hover:text-indigo-600"
                            title="Download PDF"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-80">
                        <Bar
                            data={originData}
                            options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' }, ticks: { font: { weight: 'bold', size: 10 } } },
                                    y: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
