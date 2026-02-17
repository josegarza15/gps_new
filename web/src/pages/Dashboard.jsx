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
    const [mapCenter, setMapCenter] = useState(null);
    const [isListOpen, setIsListOpen] = useState(true); // Control mobile list state

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
            // Optional: Auto-collapse on mobile when selecting?
            // setIsListOpen(false); 
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full relative overflow-hidden">
            {/* DEVICE LIST */}
            <div
                className={clsx(
                    "bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 transition-all duration-300 ease-in-out",
                    "md:w-96 md:h-full md:relative", // Desktop: Fixed width, full height
                    isListOpen ? "h-1/2" : "h-14" // Mobile: 50% height vs Header only height
                )}
            >
                {/* HEADER (Always Visible) */}
                <div
                    className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 h-14 cursor-pointer md:cursor-default"
                    onClick={() => window.innerWidth < 768 && setIsListOpen(!isListOpen)}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap">Dispositivos</h2>
                        <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {devices.length}
                        </span>
                    </div>

                    {/* SEARCH - Only visible when open on mobile, always on desktop */}
                    <div className={clsx("relative flex-1 mx-4 transition-opacity duration-200", !isListOpen && "md:block opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto")}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking search
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* TOGGLE BUTTON (Mobile Only) */}
                    <div className="md:hidden text-slate-400">
                        {isListOpen ? <MoreVertical size={20} className="rotate-90" /> : <MoreVertical size={20} />}
                    </div>
                </div>

                {/* LIST CONTENT */}
                <div className={clsx("flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/50", !isListOpen && "hidden md:block")}>
                    {devices.map(d => {
                        const isOnline = true;
                        return (
                            <div
                                key={d.id}
                                onClick={() => handleSelectDevice(d)}
                                className={clsx(
                                    "p-3 rounded-xl cursor-pointer transition-all border shadow-sm relative",
                                    selectedId === d.id
                                        ? "bg-white dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 z-10"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={clsx(
                                                "w-3 h-3 rounded-full border-2 border-white dark:border-slate-800",
                                                isOnline ? "bg-emerald-500" : "bg-red-500"
                                            )}></div>
                                            {isOnline && <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-900 dark:text-white text-sm block">{d.name || "Sin Nombre"}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{d.device_id}</span>
                                        </div>
                                    </div>
                                    <Clock size={14} className="text-slate-400" />
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300">
                                        <Smartphone size={12} className="text-indigo-500" />
                                        <span>{d.model || "Generico"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300">
                                        <Battery size={12} className="text-emerald-500" />
                                        <span>85%</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MAP AREA */}
            <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 transition-all duration-300">
                <MapContainer center={[25.68, -100.31]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTODB'
                        updateWhenZooming={false}
                        keepBuffer={20}
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
