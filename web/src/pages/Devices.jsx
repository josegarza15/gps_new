import { useState, useEffect } from 'react';
import api from '../services/api';
import { Smartphone, Trash2, Power } from 'lucide-react';

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);

    // In a real app we might want to manually add devices, but usually they auto-register via App.
    // We will just list and manage them here.

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

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#4A90E2' }}>Gestión de Dispositivos</h2>
            </div>

            <div className="card">
                {loading ? <p>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '12px' }}>ID (Hardware)</th>
                                <th style={{ padding: '12px' }}>Nombre</th>
                                <th style={{ padding: '12px' }}>Modelo</th>
                                <th style={{ padding: '12px' }}>Estado</th>
                                <th style={{ padding: '12px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map(d => (
                                <tr key={d.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '12px', fontSize: '12px', color: '#666' }}>{d.device_id}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{d.name || '-'}</td>
                                    <td style={{ padding: '12px' }}>{d.brand} {d.model}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                            background: d.is_active ? '#E8F5E9' : '#FFEBEE',
                                            color: d.is_active ? '#2E7D32' : '#C62828'
                                        }}>
                                            {d.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => handleDelete(d.device_id)}
                                            style={{ background: 'transparent', color: '#C62828' }}
                                            title="Eliminar / Desactivar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Devices;
