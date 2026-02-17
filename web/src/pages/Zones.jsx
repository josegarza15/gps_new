import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Circle, Popup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import api from '../services/api';
import { Shield, Save, Trash2, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Zones = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [zones, setZones] = useState([]);
    const featureGroupRef = useRef();

    useEffect(() => {
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

            api.post(`/zones/${selectedDevice}`, [payload])
                .then(() => {
                    fetchZones();
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
        <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        Gestión de Zonas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Crea geocercas para tus dispositivos</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-2">Dispositivo:</span>
                    <select
                        value={selectedDevice}
                        onChange={e => setSelectedDevice(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border-none rounded-lg text-sm p-2 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none min-w-[200px]"
                    >
                        {devices.map(d => (
                            <option key={d.id} value={d.device_id}>{d.name || d.device_id}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <MapContainer center={[25.68, -100.31]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTODB'
                        updateWhenZooming={false}
                        keepBuffer={20}
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
                                    shapeOptions: {
                                        color: '#4f46e5',
                                        fillColor: '#6366f1',
                                        fillOpacity: 0.2
                                    }
                                }
                            }}
                            edit={{ edit: false, remove: false }}
                        />
                    </FeatureGroup>

                    {zones.map(z => (
                        <Circle
                            key={z.id}
                            center={[z.latitude, z.longitude]}
                            radius={z.radius}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-2">
                                    <strong className="block text-slate-900 mb-1">{z.name}</strong>
                                    <span className="text-xs text-slate-500 block mb-2">Radio: {Math.round(z.radius)}m</span>
                                    <button
                                        onClick={() => handleDelete(z.id)}
                                        className="flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-bold"
                                    >
                                        <Trash2 size={12} /> Eliminar
                                    </button>
                                </div>
                            </Popup>
                        </Circle>
                    ))}
                </MapContainer>

                <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-xs">
                    <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-sm">
                        <Info size={16} className="text-indigo-500" /> Instrucciones
                    </h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                        <li>Selecciona el dispositivo arriba.</li>
                        <li>Usa el icono ⭕ en el mapa.</li>
                        <li>Arrastra para definir el radio.</li>
                        <li>Suelta para guardar.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Zones;
