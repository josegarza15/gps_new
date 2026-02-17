import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate a slight delay for "authentication protocol" effect
        await new Promise(r => setTimeout(r, 800));

        const success = await login(username, password);

        if (success) {
            navigate('/');
        } else {
            setError('ACCESS DENIED: INVALID CREDENTIALS');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/50 to-slate-950 pointer-events-none"></div>

            {/* Scanline */}
            <div className="absolute inset-0 pointer-events-none bg-[length:100%_4px] bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-20 animate-scan"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-panel-heavy rounded-2xl p-1 border-t border-slate-700/50 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                    <div className="bg-slate-950/80 rounded-xl p-8 backdrop-blur-sm relative overflow-hidden">

                        {/* Decorative Corner Markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-lg"></div>

                        <div className="flex justify-center mb-8 relative">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg relative z-10">
                                    <ShieldCheck size={40} className="text-primary animate-pulse-slow" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-1.5 rounded-lg z-20">
                                    <Cpu size={16} className="text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white font-mono tracking-wider uppercase">System Access</h2>
                            <p className="text-slate-500 text-xs font-mono mt-1 tracking-widest">SECURE SATELLITE UPLINK</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded mb-6 text-xs font-mono text-center uppercase tracking-wide flex items-center justify-center gap-2"
                            >
                                <span className="w-2 h-2 bg-destructive rounded-full animate-ping"></span>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="OPERATOR ID"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm uppercase"
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="ACCESS CODE"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-primary/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <span>Establish Connection</span>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
                            <p className="text-[10px] text-slate-600 font-mono uppercase">
                                Restricted Area • US DoD 5220.22-M Standard
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;

