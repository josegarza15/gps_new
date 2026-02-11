import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) {
            navigate('/');
        } else {
            setError('Credenciales inválidas');
        }
    };

    return (
        <div className="login-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-card"
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'white', padding: '12px', borderRadius: '12px' }}>
                        {/* Placeholder logo */}
                        <User size={32} color="#4f46e5" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'white', fontSize: '1.8rem' }}>Bienvenido</h2>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: '30px' }}>Ingresa tus credenciales para continuar</p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="login-input-group">
                        <User size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.6)' }} />
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="login-input-group">
                        <Lock size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.6)' }} />
                        <input
                            className="login-input"
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', background: '#6366f1', marginTop: '10px' }}>
                        INICIAR SESIÓN
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
