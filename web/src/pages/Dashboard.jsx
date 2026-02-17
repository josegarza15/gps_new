import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { RefreshCw, Search, Battery, Wifi, Clock, MoreVertical, Smartphone, ChevronLeft, ChevronRight, Hash, Activity, Layers } from 'lucide-react';
import clsx from 'clsx';
import api from '../services/api';
import L from 'leaflet';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';

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

// Custom Tactical Marker
const createCustomIcon = (name, online) => {
    return L.divIcon({
        className: 'custom-marker-container',
        html: `
            <div class="relative group">
                <div class="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-[10px] font-mono font-bold whitespace-nowrap border border-slate-700 shadow-xl backdrop-blur-md rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    ${name}
                    <div class="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                </div>
                <div class="w-4 h-4 rounded-full border-2 border-slate-900 shadow-lg relative z-10 ${online ? 'bg-emerald-500' : 'bg-slate-500'} box-glow"></div>
                ${online ? '<div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50"></div>' : ''}
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-emerald-500/30 rounded-full animate-pulse-slow"></div>
            </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 16, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, map]);
    return null;
};

const Dashboard = () => {
    const [devices, setDevices] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    // Stats calculation
    const stats = useMemo(() => {
        const total = devices.length;
        const online = devices.filter(d => true).length; // Mock online status for now
        const offline = total - online;
        return { total, online, offline };
    }, [devices]);

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
        const interval = setInterval(fetchData, 5000); // Faster polling for tactical feel
        return () => clearInterval(interval);
    }, []);

    const handleSelectDevice = (d) => {
        setSelectedId(d.id);
        if (d.last_location) {
            setMapCenter([d.last_location.latitude, d.last_location.longitude]);
        }
    };

    return (
        <div className="flex h-full relative overflow-hidden bg-slate-950">

            {/* FLOATING HUD STATS */}
            <div className="absolute top-4 left-4 right-4 md:left-[28rem] md:right-auto z-[400] flex gap-4 overflow-x-auto pb-2 md:pb-0 pointer-events-none">
                <div className="pointer-events-auto">
                    <StatCard
                        title="Active Units"
                        value={stats.online}
                        trend="up"
                        trendValue="+2"
                        icon={Activity}
                        color="success"
                        className="min-w-[160px] bg-slate-900/80"
                    />
                </div>
                <div className="pointer-events-auto">
                    <StatCard
                        title="Total Fleet"
                        value={stats.total}
                        icon={Hash}
                        color="primary"
                        className="min-w-[160px] bg-slate-900/80"
                    />
                </div>
                <div className="pointer-events-auto">
                    <StatCard
                        title="Signal Loss"
                        value={stats.offline}
                        trend="down"
                        trendValue="-1"
                        icon={Wifi}
                        color="destructive"
                        className="min-w-[160px] bg-slate-900/80"
                    />
                </div>
            </div>

            {/* FLOATING SIDE PANEL */}
            <div
                className={clsx(
                    "absolute top-4 bottom-4 left-4 z-[400] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
                    isPanelOpen ? "w-80 md:w-96" : "w-12"
                )}
            >
                {/* Panel Container */}
                <div className={clsx(
                    "flex-1 flex flex-col glass-panel-heavy rounded-2xl overflow-hidden border-slate-700/50 shadow-2xl transition-all duration-300",
                    !isPanelOpen && "opacity-0 pointer-events-none"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Layers size={18} className="text-primary" />
                                <h2 className="font-mono font-bold text-white uppercase tracking-wider text-sm">Unit List</h2>
                            </div>
                            <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/30">
                                LIVE
                            </span>
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="SEARCH UNIT ID..."
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-9 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all uppercase"
                            />
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {devices.map(d => {
                            const isSelected = selectedId === d.id;
                            return (
                                <div
                                    key={d.id}
                                    onClick={() => handleSelectDevice(d)}
                                    className={clsx(
                                        "p-3 rounded-lg cursor-pointer transition-all border group relative overflow-hidden",
                                        isSelected
                                            ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                                            : "bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60"
                                    )}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary box-glow"></div>}

                                    <div className="flex items-center justify-between mb-2 pl-2">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 box-glow"></div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={clsx(
                                                    "font-bold text-sm tracking-tight transition-colors",
                                                    isSelected ? "text-white text-glow" : "text-slate-300 group-hover:text-white"
                                                )}>
                                                    {d.name || "UNKNOWN UNIT"}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-mono uppercase">{d.device_id}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status="ONLINE" className="scale-75 origin-right" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pl-2 mt-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/50 border border-slate-800">
                                            <Smartphone size={10} className="text-indigo-400" />
                                            <span className="text-[10px] font-mono text-slate-400">{d.model || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/50 border border-slate-800">
                                            <Battery size={10} className="text-emerald-400" />
                                            <span className="text-[10px] font-mono text-slate-400">85%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={clsx(
                        "absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 w-8 h-16 bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary/50 hover:bg-slate-800 transition-all z-50 rounded-r-lg shadow-xl",
                        !isPanelOpen && "left-0 rounded-l-none rounded-r-lg" // Adjust if needed
                    )}
                    style={{ right: isPanelOpen ? '-1rem' : '-2rem' }} // Manual adjust for visual tab
                >
                    {isPanelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>

            {/* MAP CONTAINER */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[25.68, -100.31]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    className="bg-slate-950" // Dark background while loading
                >
                    {/* Dark Matter Tiles for Tactical Look */}
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        subdomains='abcd'
                        maxZoom={20}
                    />

                    <MapUpdater center={mapCenter} />

                    {devices.map(d => (
                        d.last_location && (
                            <Marker
                                key={d.id}
                                position={[d.last_location.latitude, d.last_location.longitude]}
                                icon={createCustomIcon(d.name, true)}
                                eventHandlers={{
                                    click: () => handleSelectDevice(d),
                                }}
                            >
                                <Popup
                                    className="custom-popup-tactical"
                                    closeButton={false}
                                    offset={[0, -20]}
                                >
                                    <div className="bg-slate-900/90 text-white p-3 rounded border border-primary/30 shadow-xl backdrop-blur min-w-[200px]">
                                        <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                            <h3 className="font-bold font-mono text-sm text-primary">{d.name}</h3>
                                            <StatusBadge status="ONLINE" className="scale-75 origin-right" />
                                        </div>
                                        <div className="space-y-1 font-mono text-xs text-slate-300">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">SPD:</span>
                                                <span>45 km/h</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">ALT:</span>
                                                <span>540 m</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">UPD:</span>
                                                <span className="text-emerald-400">JUST NOW</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={fetchData}
                className="absolute bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-primary/90 hover:scale-110 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all z-[400]"
            >
                <RefreshCw size={24} className="animate-spin-slow" />
            </button>
        </div>
    );
};

export default Dashboard;

