import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import api from '../services/api';
import { History as HistoryIcon, Search, Calendar, MapPin } from 'lucide-react';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Component to fit bounds
const FitBounds = ({ route }) => {
    const map = useMap();
    useEffect(() => {
        if (route.length > 0) {
            map.fitBounds(route);
        }
    }, [route, map]);
    return null;
};

const History = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [route, setRoute] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await api.get('/devices/');
                setDevices(res.data);
                if (res.data.length > 0) setSelectedDevice(res.data[0].device_id);
            } catch (error) {
                console.error("Error fetching devices", error);
            }
        };
        fetchDevices();

        // Set default date to today (Monterrey time approx)
        const now = new Date();
        const mon_offset = -6 * 60; // CST is UTC-6
        // Simple trick to get local YYYY-MM-DD
        const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        setSelectedDate(local.toISOString().split('T')[0]);
    }, []);

    const handleSearch = async () => {
        if (!selectedDevice || !selectedDate) return;
        setLoading(true);
        try {
            // Construct start and end day timestamps
            const start = `${selectedDate}T00:00:00`;
            const end = `${selectedDate}T23:59:59`;

            const res = await api.get(`/locations/${selectedDevice}/history`, {
                params: {
                    start_date: start,
                    end_date: end
                }
            });

            // Transform to Leaflet [lat, lng] format
            const points = res.data.map(loc => [loc.latitude, loc.longitude, loc.timestamp]);
            setRoute(points);

            if (points.length === 0) {
                alert("No hay historial para este día.");
            }
        } catch (error) {
            console.error("Error fetching history", error);
            alert("Error buscando historial");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* HEADERS & CONTROLS */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <HistoryIcon className="text-indigo-600" />
                        Historial de Rutas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Consulta el recorrido de tus dispositivos por fecha</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">

                    {/* DEVICE SELECT */}
                    <div className="flex items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-2 md:pb-0 md:pr-4">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dispositivo:</span>
                        <select
                            value={selectedDevice}
                            onChange={e => setSelectedDevice(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none min-w-[150px]"
                        >
                            {devices.map(d => (
                                <option key={d.id} value={d.device_id} className="dark:bg-slate-800">{d.name || d.device_id}</option>
                            ))}
                        </select>
                    </div>

                    {/* DATE PICKER */}
                    <div className="flex items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 pb-2 md:pb-0 md:pr-4">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fecha:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-900 dark:text-white outline-none"
                        />
                    </div>

                    {/* SEARCH BUTTON */}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 font-medium text-sm"
                    >
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Search size={16} />}
                        Buscar Recorrido
                    </button>
                </div>
            </div>

            {/* MAP AREA */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <MapContainer center={[25.68, -100.31]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTODB'
                        updateWhenZooming={false}
                        keepBuffer={20}
                    />

                    {/* ROUTE LINE (Blue) */}
                    {route.length > 0 && <Polyline positions={route} color="#4f46e5" weight={4} opacity={0.8} />}

                    {/* START MARKER (Green) */}
                    {route.length > 0 && (
                        <Marker position={route[0]} icon={DefaultIcon}>
                            <Popup>Inicio del recorrido: {new Date(route[0][2]).toLocaleTimeString()}</Popup>
                        </Marker>
                    )}

                    {/* END MARKER (Red) */}
                    {route.length > 0 && (
                        <Marker position={route[route.length - 1]} icon={DefaultIcon}>
                            <Popup>Fin del recorrido: {new Date(route[route.length - 1][2]).toLocaleTimeString()}</Popup>
                        </Marker>
                    )}

                    <FitBounds route={route} />
                </MapContainer>

                {/* STATS OVERLAY */}
                {route.length > 0 && (
                    <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h4 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-2 text-sm">
                            <MapPin size={16} className="text-indigo-500" /> Resumen del Día
                        </h4>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            <p><strong>Puntos:</strong> {route.length} registros</p>
                            <p><strong>Inicio:</strong> {new Date(route[0][2]).toLocaleTimeString()}</p>
                            <p><strong>Fin:</strong> {new Date(route[route.length - 1][2]).toLocaleTimeString()}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
