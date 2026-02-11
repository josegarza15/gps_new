import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, Search, Battery, Wifi, Clock, MoreVertical, Smartphone } from 'lucide-react';
import clsx from 'clsx';
import api from '../services/api';
import L from 'leaflet';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker
const createCustomIcon = (name, online) => {
    return L.divIcon({
        className: 'custom-marker-container',
        html: `
            <div class="${clsx(
            "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm",
            online ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
        )}">${name}</div>
            <div class="${clsx(
            "w-4 h-4 rounded-full border-[3px] border-white shadow-md relative z-10",
            online ? "bg-emerald-500" : "bg-red-500"
        )}"></div>
            ${online ? '<div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>' : ''}
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 15);
        }
    }, [center, map]);
    return null;
};

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile toggle logic if needed
    const [mapCenter, setMapCenter] = useState(null);

    const fetchData = async () => {
        try {
            const response = await api.get('/devices/locations/');
            setDevices(response.data);
        } catch (error) {
            console.error("Error fetching", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectDevice = (d) => {
        setSelectedId(d.id);
        if (d.last_location) {
            setMapCenter([d.last_location.latitude, d.last_location.longitude]);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full relative">
            {/* DEVICE LIST - Mobile: Top (or Bottom Sheet), Desktop: Side */}
            <div className="md:w-96 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col h-1/2 md:h-full z-10">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Dispositivos</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {devices.map(d => {
                        const isOnline = true; // Replace with logic
                        return (
                            <div
                                key={d.id}
                                onClick={() => handleSelectDevice(d)}
                                className={clsx(
                                    "p-3 rounded-lg cursor-pointer transition-colors border",
                                    selectedId === d.id
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"
                                        )}></div>
                                        <span className="font-medium text-slate-900 dark:text-white">{d.name}</span>
                                    </div>
                                    <Clock size={14} className="text-slate-400" />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><Wifi size={12} /> GPS</span>
                                    <span className="flex items-center gap-1"><Battery size={12} /> 85%</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MAP AREA */}
            <div className="flex-1 h-1/2 md:h-full relative bg-slate-100 dark:bg-slate-950">
                <MapContainer center={[25.68, -100.31]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTODB'
                    />
                    <MapUpdater center={mapCenter} />

                    {devices.map(d => (
                        d.last_location && (
                            <Marker
                                key={d.id}
                                position={[d.last_location.latitude, d.last_location.longitude]}
                                icon={createCustomIcon(d.name, true)}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-2 min-w-[150px]">
                                        <h3 className="font-bold text-gray-900">{d.name}</h3>
                                        <p className="text-xs text-gray-500">Última act: Hace 5 min</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>

                {/* Floating Action Button */}
                <button
                    onClick={fetchData}
                    className="absolute bottom-6 right-6 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 z-[400]"
                >
                    <RefreshCw size={24} />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
