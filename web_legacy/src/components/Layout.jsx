
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Map, Users, Smartphone, Shield, LogOut, Sun, Moon } from 'lucide-react';

const Layout = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Map, label: 'Monitor' },
        { path: '/users', icon: Users, label: 'Usuarios' },
        { path: '/devices', icon: Smartphone, label: 'Dispositivos' },
        { path: '/zones', icon: Shield, label: 'Zonas' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            {/* Top Navbar */}
            <header style={{
                background: 'var(--header-bg)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                boxShadow: 'var(--shadow-sm)',
                transition: 'background 0.3s, border 0.3s'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '4rem' }}>
                    <div style={{
                        width: '40px', height: '40px', background: 'var(--primary)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: '12px', color: 'white'
                    }}>
                        <Map size={24} />
                    </div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>GPS Admin Pro</h1>
                </div>

                <nav style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '12px',
                                    textDecoration: 'none', fontWeight: '600',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={toggleTheme}
                        className="btn"
                        style={{
                            background: 'transparent',
                            color: 'var(--text-main)',
                            padding: '8px'
                        }}
                        title={theme === 'light' ? "Modo Oscuro" : "Modo Claro"}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>A</div>
                        <span style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-main)' }}>Admin</span>
                    </div>
                    <button
                        onClick={logout}
                        className="btn"
                        style={{ padding: '8px', color: 'var(--danger)', background: 'transparent' }}
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main style={{ padding: '0', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
                <Outlet />
            </main>
        </div>
    );
};
export default Layout;
