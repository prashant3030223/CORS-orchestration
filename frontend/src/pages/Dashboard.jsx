import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import {
    BarChart3,
    Globe,
    ShieldCheck,
    ShieldAlert,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    MoreHorizontal
} from 'lucide-react';
import { Line, Pie } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { exportToCsv } from '../utils/export';

const Dashboard = () => {
    // Chart Data State
    const [lineData, setLineData] = useState({
        labels: [],
        datasets: [
            {
                fill: true,
                label: 'Requests',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    });

    const [pieData, setPieData] = useState({
        labels: ['Allowed', 'Blocked', 'Filtered'],
        datasets: [
            {
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    });

    const [stats, setStats] = useState([
        { name: 'Total APIs', value: '0', icon: Globe, change: '+0%', positive: true },
        { name: 'Total Requests', value: '0', icon: BarChart3, change: '+0%', positive: true },
        { name: 'Allowed Requests', value: '0', icon: ShieldCheck, change: '+0%', positive: true },
        { name: 'Blocked Requests', value: '0', icon: ShieldAlert, change: '-0%', positive: false },
    ]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                const { counts, recentActivity, trafficData, policyDistribution } = res.data;

                setStats([
                    { name: 'Total APIs', value: counts.apis.toString(), icon: Globe, change: '', positive: true },
                    { name: 'Total Requests', value: counts.requests.toString(), icon: BarChart3, change: '', positive: true },
                    { name: 'Allowed Requests', value: counts.allowed.toString(), icon: ShieldCheck, change: '', positive: true },
                    { name: 'Blocked Requests', value: counts.blocked.toString(), icon: ShieldAlert, change: '', positive: false },
                ]);

                // Update Charts
                if (trafficData) {
                    setLineData(prev => ({
                        ...prev,
                        labels: trafficData.labels,
                        datasets: [{ ...prev.datasets[0], data: trafficData.data }]
                    }));
                }

                if (policyDistribution) {
                    setPieData(prev => ({
                        ...prev,
                        datasets: [{
                            ...prev.datasets[0],
                            data: [
                                policyDistribution.Allowed || 0,
                                policyDistribution.Blocked || 0,
                                policyDistribution.Modified || 0
                            ]
                        }]
                    }));
                }

                setRecentActivity(recentActivity.map(log => ({
                    id: log._id,
                    api: log.apiEndpoint || 'Unknown',
                    origin: log.origin || 'Unknown',
                    method: 'GET',
                    status: log.status,
                    time: new Date(log.timestamp).toLocaleTimeString()
                })));
            } catch (err) {
                console.error('Failed to load dashboard intelligence', err);
            }
        };

        fetchDashboardData();

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

        // 3. Re-join on every connect (e.g. after server restart)
        socket.on('connect', joinOrg);

        socket.on('log_received', (newLog) => {
            setRecentActivity(prev => [{
                id: newLog._id,
                api: newLog.apiEndpoint || 'Unknown',
                origin: newLog.origin || 'Unknown',
                method: 'GET',
                status: newLog.status,
                time: new Date(newLog.timestamp).toLocaleTimeString()
            }, ...prev].slice(0, 5));

            setStats(prev => prev.map(stat => {
                const currentVal = parseInt(stat.value.replace(/,/g, '')) || 0;
                if (stat.name === 'Total Requests') return { ...stat, value: (currentVal + 1).toLocaleString() };
                if (stat.name === 'Allowed Requests' && newLog.status === 'Allowed') return { ...stat, value: (currentVal + 1).toLocaleString() };
                if (stat.name === 'Blocked Requests' && (newLog.status === 'Blocked' || newLog.status === 'Denied')) return { ...stat, value: (currentVal + 1).toLocaleString() };
                return stat;
            }));

            if (newLog.status) {
                setPieData(prev => {
                    const newData = [...prev.datasets[0].data];
                    if (newLog.status === 'Allowed') newData[0] = (newData[0] || 0) + 1;
                    else if (newLog.status === 'Blocked' || newLog.status === 'Denied') newData[1] = (newData[1] || 0) + 1;
                    else newData[2] = (newData[2] || 0) + 1;
                    return { ...prev, datasets: [{ ...prev.datasets[0], data: newData }] };
                });
            }
        });

        socket.on('api_created', () => {
            setStats(prev => prev.map(s => s.name === 'Total APIs' ? { ...s, value: (parseInt(s.value) + 1).toString() } : s));
        });

        socket.on('api_deleted', () => {
            setStats(prev => prev.map(s => s.name === 'Total APIs' ? { ...s, value: Math.max(0, parseInt(s.value) - 1).toString() } : s));
        });

        return () => {
            socket.off('connect', joinOrg);
            socket.off('log_received');
            socket.off('api_created');
            socket.off('api_deleted');
        };
    }, []);

    const handleExport = () => {
        try {
            if (stats.every(s => s.value === '0') && recentActivity.length === 0) {
                toast.error('No dashboard data available to export');
                return;
            }

            const exportData = [
                ...stats.map(s => ({
                    'Report Category': 'Metric Summary',
                    'Metric Name': s.name,
                    'Current Value': s.value,
                    'Timestamp': new Date().toLocaleString()
                })),
                ...recentActivity.map(a => ({
                    'Report Category': 'Recent Security Event',
                    'Metric Name': a.api,
                    'Current Value': `${a.method} from ${a.origin}`,
                    'Timestamp': a.time
                }))
            ];

            exportToCsv(exportData, `CORSGuard_Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('Enterprise report exported to CSV');
        } catch (err) {
            toast.error('Export sequence aborted: System error');
        }
    };

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Enterprise Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Real-time governance metrics for all edge infrastructure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Export Report
                    </button>
                    <Link to="/api-management">
                        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            New Instance
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tight",
                                stat.positive ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'
                            )}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.name}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tabular-nums tracking-tighter">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Global Traffic Curve</h3>
                        <select className="bg-slate-50 dark:bg-slate-800 border-none text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-2 text-slate-600 dark:text-slate-400 outline-none ring-1 ring-slate-200 dark:ring-slate-700">
                            <option>Cycle: 7D</option>
                            <option>Cycle: 30D</option>
                            <option>Cycle: 12M</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <Line
                            data={lineData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { grid: { borderDash: [5, 5] }, ticks: { font: { weight: 'bold', size: 10 } } },
                                    x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/5 blur-2xl rounded-full" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest relative z-10">Policy Distribution</h3>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="w-52 h-52">
                            <Pie
                                data={pieData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20,
                                                font: { weight: 'bold', size: 10 }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Real-Time Event Stream</h3>
                    <button
                        onClick={() => toast.success('Event stream refreshed')}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                            <tr>
                                <th className="px-6 py-4">API Instance</th>
                                <th className="px-6 py-4">Origin Node</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Propagation</th>
                                <th className="px-6 py-4 text-right pr-6">Vault</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentActivity.map((item) => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{item.api}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{item.origin}</code>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">{item.method}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                            item.status === 'Allowed' ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'Allowed' ? 'bg-green-500' : 'bg-red-500')} />
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {item.time}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-6">
                                        <button
                                            onClick={() => toast.info(`Viewing trace for ${item.id}`)}
                                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 transition-colors uppercase tracking-widest"
                                        >
                                            View Trace
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
                    <Link to="/logs" className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all uppercase tracking-[0.2em]">
                        Inspect All Infrastructure Logs
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
