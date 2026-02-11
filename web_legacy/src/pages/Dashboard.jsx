import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, Search, Battery, Wifi, Clock, MoreVertical } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import L from 'leaflet';

// Utility to check if online (< 5 mins)
const isOnline = (timestamp) => {
    if (!timestamp) return false;
    const diff = new Date() - new Date(timestamp);
    return diff < 5 * 60 * 1000; // 5 minutes
};

// Create custom marker icon
const createCustomIcon = (name, online) => {
    return L.divIcon({
        className: 'custom-marker-container',
        html: `
            <div class="marker-label">${name}</div>
            <div class="marker-pin ${online ? 'status-online pulsing' : 'status-offline'}"></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8] // Center
    });
};

const MapComponent = ({ devices, selectedId }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedId) {
            const dev = devices.find(d => d.id === selectedId);
            if (dev && dev.last_location) {
                map.flyTo([dev.last_location.latitude, dev.last_location.longitude], 15);
            }
        }
    }, [selectedId, devices, map]);

    return null;
}

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            const response = await api.get('/devices/locations/');
            setDevices(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Fast refresh 10s
        return () => clearInterval(interval);
    }, []);

    const filteredDevices = devices.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.device_id.includes(searchTerm)
    );

    const onlineCount = devices.filter(d => d.last_location && isOnline(d.last_location.timestamp)).length;

    const { theme } = useTheme();

    return (
        <div className="dashboard-container">

            {/* LEFT SIDEBAR - DEVICE LIST */}
            <div className="dashboard-sidebar">
                {/* Header/Stats */}
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px 0' }}>Dispositivos</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            {onlineCount} En línea
                        </span>
                        <span className="badge" style={{ background: 'var(--border)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                            {devices.length} Total
                        </span>
                    </div>

                    <div style={{ position: 'relative', marginTop: '15px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Buscar dispositivo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '35px',
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-main)',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredDevices.map(d => {
                        const hasLoc = !!d.last_location;
                        const online = hasLoc && isOnline(d.last_location.timestamp);

                        return (
                            <div
                                key={d.id}
                                onClick={() => setSelectedId(d.id)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    background: selectedId === d.id ? 'var(--hover-bg)' : 'transparent',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{d.name || d.device_id}</span>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? 'var(--success)' : 'var(--danger)', boxShadow: online ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : 'none' }}></div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} />
                                        {hasLoc ? new Date(d.last_location.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Wifi size={12} />
                                        {online ? 'GPS ON' : 'Sin señal'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* RIGHT SIDE - MAP */}
            <div className="dashboard-map">
                <MapContainer center={[25.68, -100.31]} zoom={12} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    {/* Device Markers */}
                    <MapComponent devices={devices} selectedId={selectedId} />

                    {devices.map(d => {
                        if (!d.last_location) return null;
                        const online = isOnline(d.last_location.timestamp);

                        return (
                            <Marker
                                key={d.id}
                                position={[d.last_location.latitude, d.last_location.longitude]}
                                icon={createCustomIcon(d.name || d.device_id, online)}
                            >
                                <Popup>
                                    <div style={{ padding: '5px' }}>
                                        <strong>{d.name}</strong>
                                        <br />
                                        <span style={{ color: online ? 'green' : 'red', fontSize: '12px' }}>
                                            {online ? '● Conectado' : '● Desconectado'}
                                        </span>
                                        <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                                            Bat: 85% | Speed: 0km/h
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>

                {/* Floating Controls (Example) */}
                <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={fetchData} className="btn" style={{ background: 'var(--card-bg)', padding: '10px', boxShadow: 'var(--shadow-md)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <RefreshCw size={20} color="var(--text-secondary)" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
