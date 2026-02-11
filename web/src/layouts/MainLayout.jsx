import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Map, Users, LogOut, Sun, Moon, Smartphone, Shield, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import clsx from 'clsx';

const MainLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label, onClick }) => (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden",
                isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? label : ""}
        >
            <Icon size={20} className="flex-shrink-0" />
            <span className={clsx("transition-opacity duration-200", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>{label}</span>
        </NavLink>
    );

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* DESKTOP SIDEBAR */}
            <aside
                className={clsx(
                    "hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20 transition-all duration-300 ease-in-out relative",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md hover:text-indigo-600 transition-colors z-50 hidden md:flex"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={clsx("p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 transition-all", isCollapsed ? "justify-center px-2" : "")}>
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className={clsx("text-xl font-bold text-slate-900 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-200", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>GPS Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem to="/" icon={Map} label="Monitor" />
                    <NavItem to="/history" icon={History} label="Historial" />
                    <NavItem to="/users" icon={Users} label="Usuarios" />
                    <NavItem to="/devices" icon={Smartphone} label="Dispositivos" />
                    <NavItem to="/zones" icon={Shield} label="Zonas" />
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap overflow-hidden",
                            isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? (theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro') : ""}
                    >
                        {theme === 'dark' ? <Sun size={20} className="flex-shrink-0" /> : <Moon size={20} className="flex-shrink-0" />}
                        <span className={clsx("transition-opacity duration-200", isCollapsed ? "hidden" : "block")}>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors whitespace-nowrap overflow-hidden",
                            isCollapsed && "justify-center px-2"
                        )}
                        title={isCollapsed ? "Cerrar Sesión" : ""}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        <span className={clsx("transition-opacity duration-200", isCollapsed ? "hidden" : "block")}>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">GPS Admin</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* MOBILE DRAWER */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-20 md:hidden pt-16 bg-white dark:bg-slate-900 animate-in slide-in-from-top-10 duration-200">
                    <nav className="p-4 space-y-1">
                        <NavItem to="/" icon={Map} label="Monitor" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem to="/history" icon={History} label="Historial" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem to="/users" icon={Users} label="Usuarios" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem to="/devices" icon={Smartphone} label="Dispositivos" onClick={() => setIsMobileMenuOpen(false)} />
                        <NavItem to="/zones" icon={Shield} label="Zonas" onClick={() => setIsMobileMenuOpen(false)} />

                        <div className="my-4 border-t border-slate-100 dark:border-slate-800"></div>

                        <button
                            onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </nav>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative overflow-hidden flex flex-col pt-16 md:pt-0 bg-slate-50 dark:bg-slate-900">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
