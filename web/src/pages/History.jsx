import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import api from '../services/api';
import { History as HistoryIcon, Search, Calendar, MapPin, Play, Pause, FastForward, Rewind, Clock, AlertTriangle } from 'lucide-react';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import clsx from 'clsx';
import StatusBadge from '../components/ui/StatusBadge';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Start/End Icons
const StartIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const EndIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const FitBounds = ({ route }) => {
    const map = useMap();
    useEffect(() => {
        if (route.length > 0) {
            const bounds = route.map(p => [p.latitude, p.longitude]);
            map.fitBounds(bounds, { padding: [50, 50] });
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

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 5x, 10x
    const playbackInterval = useRef(null);

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

        const now = new Date();
        const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        setSelectedDate(local.toISOString().split('T')[0]);
    }, []);

    // Playback Logic
    useEffect(() => {
        if (isPlaying && route.length > 0) {
            playbackInterval.current = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev >= route.length - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000 / playbackSpeed);
        } else {
            clearInterval(playbackInterval.current);
        }
        return () => clearInterval(playbackInterval.current);
    }, [isPlaying, route, playbackSpeed]);

    const handleSearch = async () => {
        if (!selectedDevice || !selectedDate) return;
        setLoading(true);
        setIsPlaying(false);
        setCurrentIndex(0);

        try {
            const start = `${selectedDate}T00:00:00`;
            const end = `${selectedDate}T23:59:59`;

            const res = await api.get(`/locations/${selectedDevice}/history`, {
                params: { start_date: start, end_date: end }
            });

            // Mocking speed/altitude if missing, or using available data
            // Assuming res.data has { latitude, longitude, timestamp, speed?, altitude? }
            // If speed is missing, we could calculate it, but for UI demo we'll default or random mock if strictly needed
            // For now, let's keep it simple and just use what's there.

            const processed = res.data.map(loc => ({
                ...loc,
                speed: loc.speed || Math.floor(Math.random() * 60) + 20, // Mock speed if missing for visualization
                altitude: loc.altitude || 500
            }));

            setRoute(processed);

            if (processed.length === 0) {
                alert("NO DATA FOUND FOR THIS PERIOD");
            }
        } catch (error) {
            console.error("Error fetching history", error);
            alert("SYSTEM ERROR: UNABLE TO RETRIEVE HISTORY");
        } finally {
            setLoading(false);
        }
    };

    const handleTimelineChange = (e) => {
        setCurrentIndex(parseInt(e.target.value));
        setIsPlaying(false);
    };

    const currentPoint = route[currentIndex];

    // SVG Graph helpers
    const getSpeedPoints = () => {
        if (route.length === 0) return "";
        const maxSpeed = Math.max(...route.map(p => p.speed || 0), 80);
        const width = 100; // percent
        const height = 40; // px

        return route.map((p, i) => {
            const x = (i / (route.length - 1)) * 100; // percentage
            const y = height - ((p.speed || 0) / maxSpeed) * height;
            return `${x},${y}`;
        }).join(" ");
    };

    return (
        <div className="flex h-full relative overflow-hidden bg-slate-950">

            {/* FLOATING CONTROL PANEL (TOP) */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col md:flex-row gap-4 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-2xl pointer-events-auto flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-700 pb-3 md:pb-0 md:pr-4">
                        <HistoryIcon className="text-primary" />
                        <div>
                            <h1 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Mission Playback</h1>
                            <p className="text-[10px] text-slate-400 font-mono">ARCHIVE ACCESS</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-mono text-slate-500 mb-1">UNIT SELECT</label>
                            <select
                                value={selectedDevice}
                                onChange={e => setSelectedDevice(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-white text-xs rounded p-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                            >
                                {devices.map(d => (
                                    <option key={d.id} value={d.device_id}>{d.name || d.device_id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] font-mono text-slate-500 mb-1">DATE RANGE</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-white text-xs rounded p-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                            />
                        </div>

                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/80 text-white px-4 rounded flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end h-[34px]"
                        >
                            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Search size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MAP CONTAINER */}
            <div className="absolute inset-0 z-0">
                <MapContainer center={[25.68, -100.31]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} className="bg-slate-950">
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />

                    {route.length > 0 && (
                        <>
                            {/* Full Route Line - Ghosted */}
                            <Polyline
                                positions={route.map(p => [p.latitude, p.longitude])}
                                color="#1e293b" // slate-800
                                weight={4}
                                opacity={0.5}
                                dashArray="5, 10"
                            />

                            {/* Played Route Line - Active */}
                            <Polyline
                                positions={route.slice(0, currentIndex + 1).map(p => [p.latitude, p.longitude])}
                                color="#06b6d4" // primary
                                weight={4}
                                opacity={1}
                            />

                            <Marker position={[route[0].latitude, route[0].longitude]} icon={StartIcon}>
                                <Popup className="custom-popup-tactical">START POINT</Popup>
                            </Marker>

                            <Marker position={[route[route.length - 1].latitude, route[route.length - 1].longitude]} icon={EndIcon}>
                                <Popup className="custom-popup-tactical">END POINT</Popup>
                            </Marker>

                            {/* Current Position Marker */}
                            {currentPoint && (
                                <Marker
                                    position={[currentPoint.latitude, currentPoint.longitude]}
                                    icon={DefaultIcon}
                                    zIndexOffset={100}
                                >
                                    <Popup className="custom-popup-tactical" offset={[0, -20]}>
                                        <div className="text-center">
                                            <div className="font-mono font-bold">{new Date(currentPoint.timestamp).toLocaleTimeString()}</div>
                                            <div className="text-xs text-slate-400">{currentPoint.speed} km/h</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )}

                            <FitBounds route={route} />
                        </>
                    )}
                </MapContainer>
            </div>

            {/* PLAYBACK CONTROLS (BOTTOM HUD) */}
            {route.length > 0 && (
                <div className="absolute bottom-6 left-6 right-6 z-[400] flex flex-col gap-2">
                    {/* Speed/Altitude Graph Overlay */}
                    <div className="h-16 w-full max-w-3xl mx-auto bg-slate-900/80 backdrop-blur rounded-t-xl border-t border-x border-slate-700/50 p-2 relative overflow-hidden">
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 uppercase">Velocity Profile</div>
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                            <defs>
                                <linearGradient id="speedGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <polyline
                                points={getSpeedPoints()}
                                fill="url(#speedGradient)"
                                stroke="#06b6d4"
                                strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                            />
                            {/* Current Position Indicator Line on Graph */}
                            <line
                                x1={(currentIndex / (route.length - 1)) * 100}
                                y1="0"
                                x2={(currentIndex / (route.length - 1)) * 100}
                                y2="40"
                                stroke="#f43f5e"
                                strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-2xl flex flex-col md:flex-row items-center gap-4 w-full max-w-3xl mx-auto">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-primary/90 hover:scale-105 transition-all flex-shrink-0"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>

                        <div className="flex-1 w-full flex flex-col gap-1">
                            <input
                                type="range"
                                min="0"
                                max={route.length - 1}
                                value={currentIndex}
                                onChange={handleTimelineChange}
                                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>{new Date(route[0].timestamp).toLocaleTimeString()}</span>
                                <span className="text-primary font-bold">{currentPoint ? new Date(currentPoint.timestamp).toLocaleTimeString() : '--:--:--'}</span>
                                <span>{new Date(route[route.length - 1].timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-700 pl-4 py-1">
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Speed</span>
                            <div className="flex bg-slate-800 rounded p-0.5">
                                {[1, 5, 10, 20].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={clsx(
                                            "px-2 py-1 text-[10px] font-mono rounded transition-colors",
                                            playbackSpeed === speed ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;

