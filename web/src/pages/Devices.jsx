import { useState, useEffect } from 'react';
import api from '../services/api';
import { Smartphone, Trash2, Search, RefreshCw, Cpu, Battery, Wifi } from 'lucide-react';
import clsx from 'clsx';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/devices/');
            setDevices(response.data);
        } catch (error) {
            console.error("Error fetching devices", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que deseas desactivar este dispositivo?")) return;
        try {
            await api.delete(`/devices/${id}`);
            fetchDevices();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const filteredDevices = devices.filter(d =>
        (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.device_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="text-indigo-600" />
                        Dispositivos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Monitorea el estado de tus rastreadores</p>
                </div>
                <button
                    onClick={fetchDevices}
                    className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    title="Actualizar"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* SEARCH */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar dispositivo por ID o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-12 py-3 shadow-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-sm uppercase font-semibold">
                                    <tr>
                                        <th className="p-4">ID (Hardware)</th>
                                        <th className="p-4">Nombre</th>
                                        <th className="p-4">Modelo</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredDevices.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{d.device_id}</td>
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">{d.name || '-'}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Cpu size={14} className="text-slate-400" />
                                                    {d.brand} {d.model}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                                    d.is_active
                                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                                                )}>
                                                    {d.is_active ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="p-4 flex justify-end">
                                                <button
                                                    onClick={() => handleDelete(d.device_id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* MOBILE CARDS */}
                        <div className="md:hidden space-y-4 pb-20">
                            {filteredDevices.map(d => (
                                <div key={d.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{d.name || 'Sin Nombre'}</h3>
                                            <span className="text-xs text-slate-500 font-mono block mt-1">{d.device_id}</span>
                                        </div>
                                        <span className={clsx(
                                            "w-3 h-3 rounded-full",
                                            d.is_active ? "bg-emerald-500" : "bg-red-500"
                                        )}></span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                            <Cpu size={14} />
                                            <span>{d.model}</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                            <Battery size={14} />
                                            <span>85% (Sim)</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <button
                                            onClick={() => handleDelete(d.device_id)}
                                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm"
                                        >
                                            <Trash2 size={16} />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Devices;
