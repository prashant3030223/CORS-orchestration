import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Server,
    ShieldCheck,
    BarChart3,
    ListOrdered,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Search,
    Moon,
    Sun,
    ChevronDown,
    Command
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { ExternalLink } from 'lucide-react';

const DashboardLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    // Get user from localStorage
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : {
            name: 'Guest User',
            email: 'guest@corsguard.io',
            role: 'Viewer', // Fixed typo 'Viwer'
            avatar: 'GU'
        };
    });

    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'API Management', path: '/api-management', icon: Server },
        { name: 'CORS Filter Rules', path: '/cors-rules', icon: ShieldCheck },
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
        { name: 'Logs', path: '/logs', icon: ListOrdered },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        const id = toast.loading('Terminating security session...');
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setTimeout(() => {
            toast.dismiss(id);
            toast.success('Successfully logged out');
            navigate('/login');
        }, 800);
    };

    // Search Logic
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const searchInputRef = React.useRef(null);

    // Keyboard Shortcut (Cmd/Ctrl + K)
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        // 1. Search Menu Items
        const navResults = menuItems.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        ).map(item => ({ ...item, type: 'navigation' }));

        // 2. Search APIs (Async)
        try {
            // Optimistic UI - showing nav results first
            setSearchResults(navResults);
            setShowResults(true);

            // Debounce in production
            const res = await api.get('/inventory');
            const apiResults = res.data.filter(api =>
                api.name.toLowerCase().includes(query.toLowerCase()) ||
                api.url.toLowerCase().includes(query.toLowerCase())
            ).map(api => ({ ...api, type: 'api', path: '/api-management' }));

            setSearchResults([...navResults, ...apiResults]);
        } catch (err) {
            console.error("Search failed", err);
        }
    };

    const executeSearchAction = (result) => {
        navigate(result.path);
        setSearchQuery('');
        setShowResults(false);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 glass-panel transition-transform duration-300 transform lg:static lg:translate-x-0 overflow-y-auto",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-500/40 neon-glow-blue">
                        <Command className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">CORSGuard</h1>
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-[0.2em] mt-1 opacity-80">Enterprise v1.2</p>
                    </div>
                </div>

                <nav className="mt-8 px-5 space-y-2">
                    {menuItems.map((item, idx) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-black group text-[11px] uppercase tracking-wider animate-fade-in",
                                isActive
                                    ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/40 neon-glow-blue scale-[1.02]"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white"
                            )}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-all duration-300", location.pathname === item.path ? "scale-110" : "group-hover:scale-125")} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-6 left-0 w-full px-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-4 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all font-black text-xs uppercase tracking-widest"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout System</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Navbar */}
                <header className="h-24 glass-panel flex items-center justify-between px-8 z-30 sticky top-0 border-t-0 border-x-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2.5 lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Universal Search Bar */}
                        <div className="relative hidden md:block">
                            <div className="flex items-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl px-6 py-4 w-[550px] group transition-all duration-500 border border-white/20 dark:border-slate-800/50 focus-within:border-blue-500/50 focus-within:neon-glow-blue focus-within:scale-[1.02] relative overflow-hidden">
                                {/* Radiant Background Pulse */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.03] to-blue-500/0 translate-x-[-100%] group-focus-within:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                
                                <Search className={cn(
                                    "w-5 h-5 transition-all duration-300 relative z-10",
                                    searchQuery ? "text-blue-500 scale-110" : "text-slate-400 group-focus-within:text-blue-400"
                                )} />
                                
                                {/* Honeypot to catch browser autofill */}
                                <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex="-1" />
                                <input type="password" name="password_fake" style={{ display: 'none' }} tabIndex="-1" />

                                <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="w-full relative z-10">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        name="q_universal_vault_search"
                                        autoComplete="new-password"
                                        readOnly
                                        onFocus={(e) => e.target.readOnly = false}
                                        onBlur={(e) => e.target.readOnly = true}
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Command Center Search..."
                                        className="bg-transparent border-none focus:ring-0 text-sm ml-4 w-full text-slate-900 dark:text-white placeholder:text-slate-400/50 font-black tracking-tight"
                                    />
                                </form>
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/10 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black text-slate-600 dark:text-slate-300 shadow-inner relative z-10">
                                    <span className="text-xs opacity-60">⌘</span>K
                                </div>
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-4 glass-panel rounded-[32px] premium-shadow overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-50 border-white/20 dark:border-white/10">
                                    {/* Geometric Background Detail */}
                                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                                    
                                    <div className="p-3 relative z-10">
                                        {searchResults.length > 0 ? (
                                            <>
                                                <div className="px-5 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center justify-between">
                                                    Infrastructure Matches
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-lg text-[9px]">{searchResults.length} found</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {searchResults.map((result, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => executeSearchAction(result)}
                                                            className="w-full flex items-center gap-5 p-4 rounded-[20px] hover:bg-blue-500/5 dark:hover:bg-blue-500/10 transition-all text-left group/result animate-fade-in"
                                                            style={{ animationDelay: `${idx * 40}ms` }}
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover/result:scale-110 group-hover/result:rotate-3",
                                                                result.type === 'navigation' 
                                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 group-hover/result:neon-glow-blue' 
                                                                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 group-hover/result:neon-glow-green'
                                                            )}>
                                                                {result.type === 'navigation' ? <result.icon className="w-6 h-6" /> : <Server className="w-6 h-6" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-black text-slate-900 dark:text-white group-hover/result:text-blue-500 transition-colors uppercase tracking-tight">{result.name}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">{result.type} • {result.path}</div>
                                                            </div>
                                                            <div className="opacity-0 group-hover/result:opacity-100 transition-all translate-x-2 group-hover/result:translate-x-0">
                                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                                                <Search className="w-12 h-12 mx-auto mb-4 opacity-20 animate-pulse" />
                                                <p className="text-xs font-black uppercase tracking-widest">No infrastructure matches found</p>
                                                <p className="text-[10px] font-bold mt-2 opacity-50">Refine your query for deeper vault scanning</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50/50 dark:bg-slate-950/50 p-4 text-center border-t border-slate-100 dark:border-slate-800 relative z-10">
                                        <div className="flex items-center justify-center gap-6">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">ENT</span> SELECT
                                            </p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">ESC</span> CLOSE
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => {
                                toggleTheme();
                                toast.success(`${!isDarkMode ? 'Dark' : 'Light'} protocol engaged`);
                            }}
                            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-90"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border-2 border-transparent hover:border-blue-500/20 active:scale-95"
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            >
                                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 overflow-hidden">
                                    {(user.avatar && user.avatar.length <= 3) ? user.avatar : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                                </div>
                                <div className="hidden md:block text-left overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none">{user.role || 'User'}</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1 max-w-[100px] truncate">{user.name}</p>
                                </div>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 flex-shrink-0 transition-transform", profileDropdownOpen && "rotate-180")} />
                            </button>

                            {profileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/10 border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated Identity</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }}
                                            className="flex items-center gap-3 w-full px-5 py-3 text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all uppercase tracking-tight"
                                        >
                                            <User className="w-4 h-4" /> Personal Profile
                                        </button>
                                        <button
                                            onClick={() => { navigate('/settings'); setProfileDropdownOpen(false); }}
                                            className="flex items-center gap-3 w-full px-5 py-3 text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all uppercase tracking-tight"
                                        >
                                            <Settings className="w-4 h-4" /> System Control
                                        </button>
                                        <div className="h-px bg-slate-100 dark:border-slate-800 my-2 mx-3" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-5 py-3 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all uppercase tracking-tight"
                                        >
                                            <LogOut className="w-4 h-4" /> Terminate Session
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dynamic Content */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-transparent relative">
                    <div className="max-w-7xl mx-auto animate-fade-in delay-200">
                        <Outlet />
                    </div>
                </main>
            </div >
        </div >
    );
};

export default DashboardLayout;
