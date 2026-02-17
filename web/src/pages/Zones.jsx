import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Circle, Popup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import api from '../services/api';
import { Shield, Save, Trash2, Info, MapPin, Target, AlertTriangle, Layers } from 'lucide-react';
import clsx from 'clsx';
import StatusBadge from '../components/ui/StatusBadge';

// Helper to center map
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { animate: true, duration: 1.5 });
        }
    }, [center, map]);
    return null;
};

const Zones = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [zones, setZones] = useState([]);
    const [mapCenter, setMapCenter] = useState([25.68, -100.31]);
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
            if (res.data.length > 0) {
                // Center on the first zone
                setMapCenter([res.data[0].latitude, res.data[0].longitude]);
            }
        } catch (error) {
            console.error("Error fetching zones", error);
        }
    };

    const _onCreated = (e) => {
        const { layerType, layer } = e;
        if (layerType === 'circle') {
            const { lat, lng } = layer.getLatLng();
            const radius = layer.getRadius();

            const zoneName = prompt("ENTER SAFETY ZONE ID:", `ZONE-${Math.floor(Math.random() * 1000)}`);
            if (!zoneName) {
                featureGroupRef.current.removeLayer(layer);
                return;
            }

            const payload = {
                name: zoneName.toUpperCase(),
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
                    alert("SYSTEM ERROR: ZONE CREATION FAILED");
                    console.error(err);
                    featureGroupRef.current.removeLayer(layer);
                });
        }
    };

    const handleDelete = async (zoneId) => {
        if (!confirm("CONFIRM ZONE DELETION?")) return;
        try {
            await api.delete(`/zones/${selectedDevice}/${zoneId}`);
            fetchZones();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex h-full relative overflow-hidden bg-slate-950">

            {/* FLOATING CONTROL PANEL */}
            <div className="absolute top-4 left-4 bottom-4 w-80 md:w-96 z-[400] pointer-events-none flex flex-col">
                <div className="flex-1 flex flex-col glass-panel-heavy rounded-2xl overflow-hidden border-slate-700/50 shadow-2xl pointer-events-auto">

                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-primary" />
                            <div>
                                <h1 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Geo-Defense Perimeter</h1>
                                <p className="text-[10px] text-slate-400 font-mono">ZONE MANAGEMENT SYSTEM</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-mono text-slate-500 uppercase">Target Unit</label>
                            <select
                                value={selectedDevice}
                                onChange={e => setSelectedDevice(e.target.value)}
                                className="bg-slate-950 border border-slate-700 text-white text-xs rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
                            >
                                {devices.map(d => (
                                    <option key={d.id} value={d.device_id}>{d.name || d.device_id}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Zone List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-slate-950/30">
                        {zones.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-600 opacity-50">
                                <Target size={32} className="mb-2" />
                                <span className="text-xs font-mono uppercase">No Active Zones</span>
                            </div>
                        ) : (
                            zones.map(z => (
                                <div key={z.id} className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg hover:border-primary/30 transition-all group relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50"></div>
                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div>
                                            <h3 className="font-bold text-slate-200 text-sm font-mono tracking-tight">{z.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-500 font-mono bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-800">
                                                    RAD: {Math.round(z.radius)}m
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(z.id)}
                                            className="text-slate-600 hover:text-destructive transition-colors p-1"
                                            title="Delete Zone"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setMapCenter([z.latitude, z.longitude])}
                                        className="w-full mt-2 text-[10px] font-mono uppercase text-primary hover:text-white bg-primary/10 hover:bg-primary/20 py-1.5 rounded border border-primary/20 transition-all"
                                    >
                                        Locate Sector
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Instructions Footer */}
                    <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <div className="flex items-start gap-2">
                            <Info size={14} className="text-primary mt-0.5" />
                            <ul className="space-y-1">
                                <li>1. SELECT "CIRCLE" TOOL ON MAP</li>
                                <li>2. DRAG TO DEFINE PERIMETER</li>
                                <li>3. ASSIGN ZONE IDENTIFIER</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAP CONTAINER */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    className="bg-slate-950"
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />

                    <MapUpdater center={mapCenter} />

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
                                        color: '#06b6d4', // Cyan
                                        fillColor: '#06b6d4',
                                        fillOpacity: 0.1,
                                        weight: 2,
                                        dashArray: '5, 10'
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
                            pathOptions={{
                                color: '#10b981', // Emerald
                                fillColor: '#10b981',
                                fillOpacity: 0.1,
                                weight: 1,
                                dashArray: '2, 5'
                            }}
                        >
                            <Popup className="custom-popup-tactical">
                                <div className="p-2 min-w-[150px]">
                                    <strong className="block text-primary font-mono mb-1 uppercase text-sm tracking-wider">{z.name}</strong>
                                    <StatusBadge status="ACTIVE" className="scale-75 origin-left mb-2" />
                                    <div className="text-xs text-slate-400 font-mono">
                                        RADIUS: {Math.round(z.radius)}m
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-end">
                                        <button
                                            onClick={() => handleDelete(z.id)}
                                            className="text-[10px] text-destructive hover:text-white uppercase font-bold tracking-wider flex items-center gap-1"
                                        >
                                            <Trash2 size={10} /> Terminate
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Circle>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default Zones;

