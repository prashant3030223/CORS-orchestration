import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import { Plus, Search, MoreVertical, Edit, Trash2, ExternalLink, Shield, Server, Key, FileText, X } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { exportToCsv } from '../utils/export';

const ApiManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [apis, setApis] = useState([]);

    useEffect(() => {
        const fetchApis = async () => {
            try {
                const res = await api.get('/inventory');
                setApis(res.data);
            } catch (err) {
                console.error('Inventory fetch failed');
            }
        };

        fetchApis();

        // Join organization room for targeted real-time updates
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.organization) {
            socket.emit('join_org', typeof user.organization === 'string' ? user.organization : user.organization._id);
        }

        socket.on('api_created', (newApi) => setApis(prev => [newApi, ...prev]));
        socket.on('api_updated', (updatedApi) => setApis(prev => prev.map(a => a._id === updatedApi._id ? updatedApi : a)));
        socket.on('api_deleted', (id) => setApis(prev => prev.filter(a => a._id !== id)));

        return () => {
            socket.off('api_created');
            socket.off('api_updated');
            socket.off('api_deleted');
        };
    }, []);

    const [newApi, setNewApi] = useState({ name: '', url: '', key: '', description: '' });
    const [editApiId, setEditApiId] = useState(null); // Track if editing
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const handleAddApi = async (e) => {
        e.preventDefault();

        if (!newApi.name || !newApi.url || !newApi.key) {
            toast.error('Name, URL and API Key are required');
            return;
        }

        try {
            if (editApiId) {
                // Update Mode
                await api.put(`/inventory/${editApiId}`, newApi);
                toast.success('Configuration updated successfully');
            } else {
                // Create Mode
                await api.post('/inventory', newApi);
                toast.success('Infrastructure registration sequence successful');
            }

            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const openEditModal = (api) => {
        setNewApi({
            name: api.name,
            url: api.url,
            key: api.key,
            description: api.description || ''
        });
        setEditApiId(api._id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewApi({ name: '', url: '', key: '', description: '' });
        setEditApiId(null);
    };

    const handleDeleteApi = async (id, name) => {
        if (window.confirm(`Are you sure you want to remove ${name}?`)) {
            try {
                await api.delete(`/inventory/${id}`);
                toast.success(`Successfully removed ${name}`);
            } catch (err) {
                toast.error('Removal sequence failed');
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await api.put(`/inventory/${id}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error('Status sync failed');
        }
    };
    const handleExport = () => {
        try {
            if (filteredApis.length === 0) {
                toast.error('No API records available to export');
                return;
            }

            const exportData = filteredApis.map(api => ({
                Name: api.name,
                URL: api.url,
                Status: api.status,
                'API Key': api.key,
                'Created At': new Date(api.createdAt).toLocaleString(),
                Description: api.description || ''
            }));

            exportToCsv(exportData, `CORSGuard_API_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success('API inventory exported to CSV');
        } catch (err) {
            toast.error('Inventory export failed');
        }
    };

    const filteredApis = apis.filter(api => {
        const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            api.url.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || api.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">API Governance</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure and inventory your protected API infrastructure.</p>
                </div>
                <button
                    onClick={() => {
                        setEditApiId(null);
                        setNewApi({ name: '', url: '', key: '', description: '' });
                        setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    REGISTER NEW API
                </button>
                <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    EXPORT INVENTORY
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find API by name or endpoint..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                        {['All', 'Active', 'Inactive'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={cn(
                                    "px-4 py-2 text-xs font-black transition-all rounded-lg",
                                    filterStatus === status
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {status.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                            <tr>
                                <th className="px-6 py-4">API Metadata</th>
                                <th className="px-6 py-4">State</th>
                                <th className="px-6 py-4">Security Key</th>
                                <th className="px-6 py-4">Inventory Date</th>
                                <th className="px-6 py-4 text-right pr-6">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredApis.map((api) => (
                                <tr key={api._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                api.status === 'Active' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            )}>
                                                <Server className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{api.name}</div>
                                                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                    {api.url} <ExternalLink className="w-3 h-3 opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => toggleStatus(api._id, api.status)}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                                api.status === 'Active'
                                                    ? 'text-green-600 bg-green-50 dark:bg-green-500/10 ring-1 ring-green-600/20'
                                                    : 'text-slate-400 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-400/20'
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", api.status === 'Active' ? 'bg-green-600 animate-pulse' : 'bg-slate-400')} />
                                            {api.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl tabular-nums border border-slate-200 dark:border-slate-700 select-all cursor-copy" onClick={() => { navigator.clipboard.writeText(api.key); toast.success('Key copied to clipboard'); }}>
                                            {api.key}
                                        </code>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tighter">{new Date(api.createdAt).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-6">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                            <button
                                                onClick={() => openEditModal(api)}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                                title="Edit Settings"
                                            >
                                                <Edit className="w-4.5 h-4.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteApi(api._id, api.name)}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Decommission API"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredApis.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                                            <Search className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">System Search Failed</h3>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No APIs matching your criteria were discovered.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add New API Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={closeModal} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-[18px] flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editApiId ? 'Update Configuration' : 'Endpoint Registration'}</h3>
                                    <p className="text-xs font-bold text-slate-400">Infrastructure Configuration</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form className="p-8 space-y-6" onSubmit={handleAddApi}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance Display Name</label>
                                    <div className="relative group">
                                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            required
                                            value={newApi.name}
                                            onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                                            placeholder="e.g. Payments Gateway"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Base URL</label>
                                    <div className="relative group">
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="url"
                                            required
                                            value={newApi.url}
                                            onChange={(e) => setNewApi({ ...newApi, url: e.target.value })}
                                            placeholder="https://api.yourdomain.com"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Authorization Key</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={newApi.key}
                                        onChange={(e) => setNewApi({ ...newApi, key: e.target.value })}
                                        placeholder="Secret key for header validation"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Description</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        rows="3"
                                        value={newApi.description}
                                        onChange={(e) => setNewApi({ ...newApi, description: e.target.value })}
                                        placeholder="Outline the purpose of this endpoint..."
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    ABORT
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95"
                                >
                                    {editApiId ? 'SAVE CHANGES' : 'AUTHORIZE DISCOVERY'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiManagement;
