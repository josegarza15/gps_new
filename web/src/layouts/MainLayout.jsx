import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Menu, X, Map, Users, LogOut,
    Smartphone, Shield, ChevronLeft, ChevronRight,
    History, Activity, Signal, Globe, Wifi, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import StatusBadge from '../components/ui/StatusBadge';

const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Auto-collapse sidebar on mobile
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 border border-transparent",
                isActive
                    ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? label : ""}
        >
            <Icon size={isCollapsed ? 22 : 18} className={clsx("flex-shrink-0 transition-colors",
                ({ isActive }) => isActive ? "text-primary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" : ""
            )} />

            {!isCollapsed && (
                <span className="font-mono text-sm tracking-wide uppercase opacity-90 truncate">
                    {label}
                </span>
            )}

            {/* Active Indicator Line */}
            {({ isActive }) => isActive && !isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-l-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            )}
        </NavLink>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/30 selection:text-white">

            {/* BACKGROUND GRID OVERLAY */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>

            {/* DESKTOP SIDEBAR */}
            <aside
                className={clsx(
                    "hidden md:flex flex-col border-r border-slate-800 z-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] relative bg-slate-900/95 backdrop-blur-xl",
                    isCollapsed ? "w-16" : "w-64"
                )}
            >
                {/* LOGO AREA */}
                <div className={clsx(
                    "h-16 flex items-center border-b border-slate-800 transition-all duration-300",
                    isCollapsed ? "justify-center px-0" : "px-6 gap-3"
                )}>
                    <div className="relative group">
                        <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all">
                            <Globe size={18} className="text-primary animate-pulse-slow" />
                        </div>
                        {/* Ping effect */}
                        <div className="absolute inset-0 bg-primary/30 rounded blur-md animate-ping opacity-20"></div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-widest text-white uppercase">G.P.S. CMD</span>
                            <span className="text-[10px] text-primary/80 font-mono tracking-wider">SYSTEM ONLINE</span>
                        </div>
                    )}
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 p-3 space-y-1 py-6 overflow-y-auto custom-scrollbar">
                    {!isCollapsed && (
                        <div className="px-3 mb-2 text-[10px] font-mono uppercase text-slate-500 tracking-widest">
                            Main Modules
                        </div>
                    )}
                    <NavItem to="/" icon={Map} label="Live Map" />
                    <NavItem to="/history" icon={History} label="Playback" />
                    <NavItem to="/zones" icon={Shield} label="Geo-Zones" />

                    <div className="my-4 border-t border-slate-800/50"></div>

                    {!isCollapsed && (
                        <div className="px-3 mb-2 text-[10px] font-mono uppercase text-slate-500 tracking-widest">
                            Administration
                        </div>
                    )}
                    <NavItem to="/users" icon={Users} label="Personnel" />
                    <NavItem to="/devices" icon={Smartphone} label="Units" />
                </nav>

                {/* SIDEBAR FOOTER */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mb-2 group"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        <span className="sr-only">Toggle Sidebar</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-destructive transition-all border border-transparent hover:bg-destructive/10 hover:border-destructive/20",
                            isCollapsed && "justify-center"
                        )}
                        title="Disconnect"
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span className="font-mono text-sm">DISCONNECT</span>}
                    </button>
                </div>
            </aside>

            {/* MOBILE HEADER - HUD STYLE */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center border border-primary/50">
                        <Globe size={18} className="text-primary" />
                    </div>
                    <span className="font-bold tracking-widest text-white uppercase text-sm">G.P.S. CMD</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* MOBILE DRAWER */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden pt-16 bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-top-5 duration-200">
                    <nav className="p-4 space-y-2">
                        <NavItem to="/" icon={Map} label="Live Map" />
                        <NavItem to="/history" icon={History} label="Playback" />
                        <NavItem to="/zones" icon={Shield} label="Geo-Zones" />
                        <div className="h-px bg-slate-800 my-4"></div>
                        <NavItem to="/users" icon={Users} label="Personnel" />
                        <NavItem to="/devices" icon={Smartphone} label="Units" />
                        <div className="h-px bg-slate-800 my-4"></div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded text-destructive hover:bg-destructive/10 border border-destructive/20 font-mono text-sm"
                        >
                            <LogOut size={18} />
                            <span>DISCONNECT SYSTEM</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative overflow-hidden flex flex-col pt-16 md:pt-0">
                {/* TOP HUD BAR (Desktop) */}
                <div className="hidden md:flex h-14 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 items-center justify-between px-6 z-40">
                    {/* Left HUD: Breadcrumbs / Page Title */}
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-primary animate-pulse" />
                        <span className="text-xs font-mono text-primary/80 uppercase tracking-wider">System Monitoring</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-sm font-semibold text-white tracking-wide uppercase">{location.pathname === '/' ? 'Live Map' : location.pathname.substring(1)}</span>
                    </div>

                    {/* Right HUD: System Vitals */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700/50">
                            <Wifi size={14} className="text-emerald-500" />
                            <span className="text-xs font-mono text-slate-300">LINK: STABLE</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700/50">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-slate-300">SERVER: ONLINE</span>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                OP
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 relative overflow-hidden bg-background">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;

