import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import {
    User,
    Shield,
    ShieldCheck,
    Bell,
    Key,
    Lock,
    Save,
    RefreshCcw,
    Trash2,
    Camera,
    Check,
    Cloud,
    Terminal,
    Eye,
    EyeOff,
    Users,
    UserPlus,
    X,
    MoreVertical,
    Link as LinkIcon,
    Copy,
    Share2,
    Fingerprint,
    Smartphone,
    History,
    Activity,
    ExternalLink,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Settings = () => {
    // ... basic states ...
    const [activeTab, setActiveTab] = useState('profile');
    const { isDarkMode, toggleTheme } = useTheme();
    const [isSaving, setIsSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedInviteRole, setSelectedInviteRole] = useState('Viewer');
    const [inviteLink, setInviteLink] = useState('');
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    // Image Upload Logic
    const fileInputRef = React.useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (e.g., 5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfile(prev => ({ ...prev, avatar: reader.result }));
            toast.success('Profile photo staged');
        };
        reader.readAsDataURL(file);
    };

    // Form states
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: 'Viewer',
        company: ''
    });

    const [team, setTeam] = useState([]);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Security Lead' });

    const roles = ['Global Admin', 'Security Lead', 'DevOps', 'Auditor'];

    const fetchSettings = React.useCallback(async () => {
        try {
            const [profileRes, teamRes] = await Promise.all([
                api.get('/settings/profile'),
                api.get('/settings/team')
            ]);
            setProfile(profileRes.data);
            // Map array of users to team format
            setTeam(teamRes.data.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status,
                avatar: u.avatar || u.name.substring(0, 2).toUpperCase()
            })));

            // Join organization room for targeted real-time updates
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.organization) {
                socket.emit('join_org', typeof user.organization === 'string' ? user.organization : user.organization._id);
            }
        } catch (err) {
            console.error('Settings sync failed');
        }
    }, []);

    useEffect(() => {
        fetchSettings();

        // Socket Listeners for Real-Time Synchronization
        socket.on('member_added', (newMember) => {
            setTeam(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === (newMember._id || newMember.id))) return prev;
                return [...prev, {
                    id: newMember._id,
                    name: newMember.name,
                    email: newMember.email,
                    role: newMember.role,
                    status: newMember.status,
                    avatar: newMember.avatar || newMember.name.substring(0, 2).toUpperCase()
                }];
            });
            toast.success(`Infrastructure report: New member ${newMember.name} detected.`);
        });

        socket.on('member_removed', (targetId) => {
            setTeam(prev => prev.filter(m => m.id !== targetId));
            toast.warning('Security Alert: Member access revoked in real-time.');
        });

        return () => {
            socket.off('member_added');
            socket.off('member_removed');
        };
    }, []);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const saver = toast.loading('Syncing profile updates...');
        try {
            await api.put('/settings/profile', profile);
            setIsSaving(false);
            toast.dismiss(saver);
            toast.success('Enterprise profile updated');
        } catch (err) {
            setIsSaving(false);
            toast.dismiss(saver);
            toast.error('Profile update failed');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!newMember.name || !newMember.email) {
            toast.error('Identity and channel are required');
            return;
        }

        try {
            const res = await api.post('/settings/team/invite', newMember);
            const addedMember = res.data;
            setTeam([...team, {
                id: addedMember._id,
                name: addedMember.name,
                email: addedMember.email,
                role: addedMember.role,
                status: addedMember.status,
                avatar: addedMember.avatar
            }]);
            setIsInviteModalOpen(false);
            setNewMember({ name: '', email: '', role: 'Security Lead' });
            toast.success(`Invitation dispatched to ${addedMember.email}`);
        } catch (err) {
            toast.error('Invitation sequence failed');
        }
    };

    const removeMember = async (id, name) => {
        if (window.confirm(`Revoke all access for ${name}?`)) {
            try {
                await api.delete(`/settings/team/${id}`);
                setTeam(team.filter(m => m.id !== id));
                toast.success(`Access revoked: ${name}`);
            } catch (err) {
                toast.error('Revocation failed');
            }
        }
    };

    const generateInviteLink = async () => {
        setIsGeneratingLink(true);
        try {
            const res = await api.post('/settings/team/invite-link', { role: selectedInviteRole });
            setInviteLink(res.data.inviteLink);
            setIsRoleModalOpen(false);
            toast.success(`Shareable ${selectedInviteRole} link generated`);
        } catch (err) {
            toast.error('Failed to generate invite link');
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to secure clipboard');
    };

    const handleKeyRotation = () => {
        if (window.confirm('Warning: Rotating the master key will break current integrations. Proceed?')) {
            const rotater = toast.loading('Generating new cryptographic key pair...');
            setTimeout(() => {
                toast.dismiss(rotater);
                toast.success('Master key successfully rotated.');
            }, 2000);
        }
    };

    const tabs = [
        { id: 'profile', label: 'User Persona', icon: User },
        { id: 'team', label: 'Team Governance', icon: Users },
        { id: 'security', label: 'Vault & Keys', icon: Shield },
        { id: 'alerts', label: 'Alert Config', icon: Bell },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">System Controls</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage infrastructure credentials, team access, and personalized settings.</p>
                </div>
                <button
                    onClick={() => {
                        const sync = toast.loading('Synchronizing infrastructure state...');
                        fetchSettings().then(() => {
                            toast.dismiss(sync);
                            toast.success('Infrastructure state synchronized');
                        });
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Force Sync State
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tab Navigation */}
                <div className="lg:w-72 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black transition-all text-left uppercase tracking-widest",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-slate-400")} />
                            {tab.label}
                        </button>
                    ))}

                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all group"
                        >
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{isDarkMode ? 'LIGHT PROTOCOL' : 'DARK PROTOCOL'}</span>
                            <div className={cn(
                                "w-10 h-6 rounded-full relative transition-colors p-1",
                                isDarkMode ? "bg-blue-600" : "bg-slate-300"
                            )}>
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                                    isDarkMode ? "translate-x-4" : "translate-x-0"
                                )} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-8 md:p-10 space-y-10 animate-in fade-in slide-in-from-right-4">
                            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <div className="md:col-span-2 flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-32 h-32 bg-blue-50 dark:bg-blue-500/10 rounded-[40px] flex items-center justify-center text-blue-600 border-2 border-dashed border-blue-200 dark:border-blue-500/30 overflow-hidden cursor-pointer"
                                        >
                                            {profile.avatar && (profile.avatar.startsWith('data:') || profile.avatar.startsWith('http')) ? (
                                                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-black">{profile.avatar || <User className="w-12 h-12" />}</span>
                                            )}
                                        </div>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-blue-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px] cursor-pointer"
                                        >
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{profile.name}</h3>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">{profile.role} • {profile.company}</p>
                                        <div className="flex items-center gap-2 mt-4">
                                            <span className="px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 text-[10px] font-black rounded-xl border border-green-600/20 uppercase tracking-widest">Global Admin</span>
                                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-black rounded-xl border border-blue-600/20 uppercase tracking-widest">MFA Secured</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Display Name</label>
                                    <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enterprise Channel</label>
                                    <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold" />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-2xl shadow-xl transition-all active:scale-95">
                                        {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Update Production Persona
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Member Directory</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Manage institutional access & permissions</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsRoleModalOpen(true)}
                                            disabled={isGeneratingLink}
                                            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Share2 className="w-4 h-4" /> Share Link
                                        </button>
                                    </div>
                                </div>

                                {inviteLink && (
                                    <div className="mx-8 mb-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/30 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0">
                                                <LinkIcon className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Invite Link (7 days)</p>
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{inviteLink}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => copyToClipboard(inviteLink)}
                                                className="p-2.5 bg-white dark:bg-slate-800 text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 dark:border-blue-700 transition-all"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setInviteLink('')}
                                                className="p-2.5 text-slate-400 hover:text-red-500 transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                            <tr>
                                                <th className="px-8 py-4">User</th>
                                                <th className="px-8 py-4">Security Role</th>
                                                <th className="px-8 py-4">State</th>
                                                <th className="px-8 py-4 text-right pr-12">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {team.map((member) => (
                                                <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-500/10 overflow-hidden">
                                                                {(member.avatar && (member.avatar.startsWith('data:') || member.avatar.startsWith('http'))) ? (
                                                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    member.avatar
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{member.name}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{member.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 uppercase tracking-widest flex items-center gap-2 w-fit">
                                                            <ShieldCheck className="w-3.5 h-3.5" />
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                            member.status === 'Active' ? 'text-green-600 bg-green-50 dark:bg-green-500/10' : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", member.status === 'Active' ? 'bg-green-500' : 'bg-amber-500')} />
                                                            {member.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right pr-12">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => toast.info(`Editing ${member.name}`)}
                                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeMember(member.id, member.name)}
                                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            {/* Security Health Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                                    <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Protection status</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">MAXIMUM SECURED</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authentication</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">MFA ACTIVE (PUSH)</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
                                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Recent Activity</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">NO ANOMALIES</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* API Credentials Section */}
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center"><Key className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Vault Access Key</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Enterprise API credentials</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                readOnly
                                                value="sk_live_51Mv9eA2SRqH7xHqH7xHqH7xHqH7xHqH7"
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-mono text-xs text-indigo-600 dark:text-indigo-400"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => copyToClipboard("sk_live_51Mv9eA2SRqH7xHqH7xHqH7xHqH7xHqH7")} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={handleKeyRotation} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                            <RefreshCcw className="w-4 h-4" /> Rotate Production key
                                        </button>
                                    </div>
                                </div>

                                {/* Password Management Section */}
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center"><Lock className="w-6 h-6" /></div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Master Credentials</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Persona access security</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold" />
                                        </div>
                                        <button onClick={() => toast.success('Password rotation sequence initiated')} className="w-full py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all">Confirm Rotation</button>
                                    </div>
                                </div>

                                {/* Login History - Rich Visualization */}
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 lg:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center"><History className="w-6 h-6" /></div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">Session Audit Log</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Verification of institutional access</p>
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:underline">Revoke All Sessions <ExternalLink className="w-3 h-3" /></button>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { device: "Chrome / macOS (Arm64)", location: "Mumbai, India (Current)", time: "Connected Now", status: "Active" },
                                            { device: "iPhone 15 Pro / iOS", location: "Mumbai, India", time: "2 hours ago", status: "Authorized" },
                                            { device: "Safari / macOS", location: "Bangalore, India", time: "Yesterday", status: "Authorized" }
                                        ].map((session, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-slate-100 dark:border-slate-800/50 group hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm"><Smartphone className="w-5 h-5 text-slate-400" /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{session.device}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{session.location} • {session.time}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "px-3 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 text-[10px] font-black rounded-lg border border-green-200 dark:border-green-800 uppercase tracking-widest flex items-center gap-1.5",
                                                        session.status !== 'Active' && 'text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                                                    )}>
                                                        {session.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                                                        {session.status}
                                                    </span>
                                                    {session.status !== 'Active' && (
                                                        <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center"><Bell className="w-6 h-6" /></div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Notification Preferences</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {['Security Incident Breach', 'New API Discovery', 'Policy Propagation', 'Clock Drift Warning'].map((title, i) => (
                                    <label key={i} className="flex items-start gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 cursor-pointer hover:border-blue-500/30 transition-all group">
                                        <input type="checkbox" defaultChecked className="w-6 h-6 rounded-lg text-blue-600 focus:ring-blue-500" />
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tight">Push + Enterprise Email</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Role Selection Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsRoleModalOpen(false)} />
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Select Link Role</h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            {roles.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedInviteRole(role)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all",
                                        selectedInviteRole === role
                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500/50"
                                    )}
                                >
                                    {role}
                                    {selectedInviteRole === role && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                            <button
                                onClick={generateInviteLink}
                                disabled={isGeneratingLink}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl mt-4 active:scale-95 transition-all shadow-xl"
                            >
                                {isGeneratingLink ? 'Generating...' : 'Confirm & Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
