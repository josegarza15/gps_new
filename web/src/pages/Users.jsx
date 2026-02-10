import { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Trash2, Power, UserPlus } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Registration Form State
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/');
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/register', newUser);
            setShowForm(false);
            setNewUser({ username: '', password: '' });
            fetchUsers();
        } catch (error) {
            alert("Error creating user: " + error.response?.data?.detail);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/users/${id}/status?is_active=${!currentStatus}`);
            fetchUsers();
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    // Note: Soft delete is essentially setting status to inactive in this implementation,
    // but if we want strictly DELETE endpoint behavior:
    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que deseas desactivar este usuario?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#4A90E2' }}>Gestión de Usuarios</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <UserPlus size={18} style={{ marginRight: '8px' }} />
                    Nuevo Usuario
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '20px', maxWidth: '500px' }}>
                    <h3>Registrar Usuario</h3>
                    <form onSubmit={handleRegister}>
                        <input
                            type="text" placeholder="Usuario"
                            value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            required
                        />
                        <input
                            type="password" placeholder="Contraseña"
                            value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary">Guardar</button>
                            <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                {loading ? <p>Cargando...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '12px' }}>ID</th>
                                <th style={{ padding: '12px' }}>Usuario</th>
                                <th style={{ padding: '12px' }}>Estado</th>
                                <th style={{ padding: '12px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '12px' }}>{u.id}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{u.username}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                            background: u.is_active ? '#E8F5E9' : '#FFEBEE',
                                            color: u.is_active ? '#2E7D32' : '#C62828'
                                        }}>
                                            {u.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => toggleStatus(u.id, u.is_active)}
                                            style={{ background: 'transparent', color: u.is_active ? '#EF6C00' : '#2E7D32', marginRight: '10px' }}
                                            title={u.is_active ? "Desactivar" : "Activar"}
                                        >
                                            <Power size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            style={{ background: 'transparent', color: '#C62828' }}
                                            title="Eliminar (Soft)"
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

export default Users;
