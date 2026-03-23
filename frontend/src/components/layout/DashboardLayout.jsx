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
                "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform lg:static lg:translate-x-0 overflow-y-auto",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        <Command className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CORSGuard</h1>
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest">Enterprise v1.2</p>
                    </div>
                </div>

                <nav className="mt-4 px-4 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold group text-xs uppercase tracking-tight",
                                isActive
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20"
                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            )}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", location.pathname === item.path ? "text-white" : "group-hover:scale-110 transition-transform")} />
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
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2.5 lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Universal Search Bar */}
                        <div className="relative hidden md:block">
                            <div className="flex items-center bg-white/5 dark:bg-slate-900/40 backdrop-blur-2xl rounded-2xl px-4 py-2.5 w-[450px] group transition-all duration-500 border border-white/10 dark:border-slate-700/50 hover:border-blue-500/30 focus-within:border-blue-500/50 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(59,130,246,0.08)] relative overflow-hidden">
                                {/* Ambient Glow Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                {/* Honeypot to catch browser autofill */}
                                <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex="-1" />
                                <input type="password" name="password_fake" style={{ display: 'none' }} tabIndex="-1" />

                                <div className="relative flex items-center gap-3 w-full">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 group-focus-within:border-blue-500/50 group-focus-within:bg-blue-500/10 transition-all duration-300">
                                        <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 group-focus-within:scale-110 transition-all" />
                                    </div>

                                    <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="w-full">
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
                                            placeholder="Search documentation, APIs, or settings..."
                                            className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-900 dark:text-white placeholder:text-slate-500/50 font-medium tracking-tight"
                                        />
                                    </form>

                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner text-[10px] font-black text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 group-focus-within:border-blue-500/30 transition-all">
                                        <span className="opacity-60">⌘</span>
                                        <span>K</span>
                                    </div>
                                </div>
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-blue-500/10 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                    <div className="p-2">
                                        {searchResults.length > 0 ? (
                                            <>
                                                <div className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                    Best Matches
                                                </div>
                                                {searchResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => executeSearchAction(result)}
                                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors text-left group"
                                                    >
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                            result.type === 'navigation' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                                                        )}>
                                                            {result.type === 'navigation' ? <result.icon className="w-5 h-5" /> : <Server className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900 dark:text-white">{result.name}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{result.type}</div>
                                                        </div>
                                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ExternalLink className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-bold">No results found for "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3 text-center border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-medium text-slate-400">
                                            Press <span className="font-bold text-slate-500 dark:text-slate-300">Enter</span> to select • <span className="font-bold text-slate-500 dark:text-slate-300">Esc</span> to close
                                        </p>
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
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950/50">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div >
        </div >
    );
};

export default DashboardLayout;
