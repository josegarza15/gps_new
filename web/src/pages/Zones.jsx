import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Circle, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import api from '../services/api';
import { Shield, Save, Trash2 } from 'lucide-react';

const Zones = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [zones, setZones] = useState([]);
    const [newZones, setNewZones] = useState([]); // Draft zones drawn
    const featureGroupRef = useRef();

    useEffect(() => {
        // Load devices for dropdown
        const fetchDevices = async () => {
            const res = await api.get('/devices/');
            setDevices(res.data);
            if (res.data.length > 0) setSelectedDevice(res.data[0].device_id);
        };
        fetchDevices();
    }, []);

    useEffect(() => {
        if (!selectedDevice) return;
        fetchZones();
        setNewZones([]); // Clear drafts
    }, [selectedDevice]);

    const fetchZones = async () => {
        try {
            const res = await api.get(`/zones/${selectedDevice}`);
            setZones(res.data);
        } catch (error) {
            console.error("Error fetching zones", error);
        }
    };

    const _onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'circle') {
            const { lat, lng } = layer.getLatLng();
            const radius = layer.getRadius();

            const zoneName = prompt("Nombre de la Zona Segura:", "Nueva Zona");
            if (!zoneName) {
                featureGroupRef.current.removeLayer(layer);
                return;
            }

            const payload = {
                name: zoneName,
                latitude: lat,
                longitude: lng,
                radius: radius,
                device_unique_id: selectedDevice
            };

            // Save directly to backend
            api.post(`/zones/${selectedDevice}`, [payload])
                .then(() => {
                    fetchZones();
                    // Remove draft layer as it will be re-rendered from source
                    featureGroupRef.current.removeLayer(layer);
                })
                .catch(err => {
                    alert("Error guardando zona");
                    console.error(err);
                    featureGroupRef.current.removeLayer(layer);
                });
        }
    };

    const handleDelete = async (zoneId) => {
        if (!confirm("¿Eliminar zona?")) return;
        try {
            await api.delete(`/zones/${selectedDevice}/${zoneId}`);
            fetchZones();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ color: '#4A90E2', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield /> Gestión de Zonas
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label>Dispositivo:</label>
                    <select
                        value={selectedDevice}
                        onChange={e => setSelectedDevice(e.target.value)}
                        style={{ width: '250px', margin: 0 }}
                    >
                        {devices.map(d => (
                            <option key={d.id} value={d.device_id}>{d.name || d.device_id}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
                <MapContainer center={[25.68, -100.31]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FeatureGroup ref={featureGroupRef}>
                        <EditControl
                            position="topright"
                            onCreated={_onCreated}
                            draw={{
                                rectangle: false,
                                polygon: false,
                                polyline: false,
                                circlemarker: false,
                                marker: false,
                                circle: {
                                    metric: true,
                                    feet: false,
                                }
                            }}
                            edit={{
                                edit: false, // Edit existing enabled? maybe later
                                remove: false
                            }}
                        />
                    </FeatureGroup>

                    {/* Render Existing Zones */}
                    {zones.map(z => (
                        <Circle
                            key={z.id}
                            center={[z.latitude, z.longitude]}
                            radius={z.radius}
                            pathOptions={{ color: 'green', fillColor: 'green' }}
                        >
                            <Popup>
                                <strong>{z.name}</strong><br />
                                Radio: {Math.round(z.radius)}m<br />
                                <button
                                    onClick={() => handleDelete(z.id)}
                                    style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </Popup>
                        </Circle>
                    ))}

                </MapContainer>

                <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    <h4>Instrucciones:</h4>
                    <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                        <li>Selecciona un dispositivo arriba.</li>
                        <li>Usa el icono ⭕ (círculo) en el mapa para dibujar.</li>
                        <li>Define el radio arrastrando el mouse.</li>
                        <li>Suelta para guardar y nombrar la zona.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Zones;
