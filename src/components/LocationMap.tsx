import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import type { LocationPin, WaterStatus } from '../types';

// ===================================================================
// LocationMap — Renders multiple test-location pins on a dark map.
// Each pin shows the latest sensor data for that deployment site.
// ===================================================================

/** Create a color-coded marker icon for a given status */
function createMarkerIcon(status: WaterStatus): L.Icon {
    const color =
        status === 'SANGAT LAYAK' ? '#22c55e' :
        status === 'LAYAK' ? '#f59e0b' :
        '#ef4444';

    return new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
              <defs>
                <filter id="shadow" x="-50%" y="-30%" width="200%" height="180%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.5"/>
                </filter>
              </defs>
              <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${color}" filter="url(#shadow)"/>
              <circle cx="16" cy="15" r="6" fill="white" opacity="0.9"/>
              <circle cx="16" cy="15" r="3" fill="${color}"/>
            </svg>
        `),
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -42],
    });
}

/** Pre-create icons per status */
const STATUS_ICONS: Record<WaterStatus, L.Icon> = {
    'SANGAT LAYAK': createMarkerIcon('SANGAT LAYAK'),
    'LAYAK': createMarkerIcon('LAYAK'),
    'BAHAYA': createMarkerIcon('BAHAYA'),
};

/** Component that auto-fits map bounds to all pins */
function FitBounds({ pins }: { pins: LocationPin[] }) {
    const map = useMap();

    useEffect(() => {
        if (pins.length === 0) return;
        if (pins.length === 1) {
            map.setView([pins[0].location.lat, pins[0].location.lng], 15);
            return;
        }
        const bounds = L.latLngBounds(
            pins.map((p) => [p.location.lat, p.location.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [pins, map]);

    return null;
}

interface LocationMapProps {
    locationPins: LocationPin[];
}

export default function LocationMap({ locationPins }: LocationMapProps) {
    const defaultCenter: [number, number] = [-6.5833, 110.6667];
    const mapRef = useRef(null);

    const totalPins = locationPins.length;
    const dangerCount = locationPins.filter((p) => p.status === 'BAHAYA').length;

    return (
        <div id="location-map" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <MapPin size={18} className="text-water-400" aria-hidden="true" />
                        Lokasi Pengujian
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {totalPins} lokasi aktif • {dangerCount > 0 ? `${dangerCount} bahaya` : 'semua aman'}
                    </p>
                </div>
                {/* Pin legend */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Layak</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Waspada</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Bahaya</span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="h-72 rounded-xl overflow-hidden ring-1 ring-white/5">
                <MapContainer
                    ref={mapRef}
                    center={defaultCenter}
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={true}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <FitBounds pins={locationPins} />
                    {locationPins.map((pin) => (
                        <Marker
                            key={pin.id}
                            position={[pin.location.lat, pin.location.lng]}
                            icon={STATUS_ICONS[pin.status]}
                        >
                            <Popup>
                                <div style={{
                                    background: '#1e293b',
                                    padding: '14px 18px',
                                    borderRadius: '12px',
                                    color: '#e2e8f0',
                                    minWidth: '200px',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    margin: '-14px -20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '13px', color: '#22d3ee' }}>
                                            {pin.deviceName}
                                        </p>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: pin.status === 'SANGAT LAYAK' ? 'rgba(34,197,94,0.15)' :
                                                        pin.status === 'LAYAK' ? 'rgba(245,158,11,0.15)' :
                                                        'rgba(239,68,68,0.15)',
                                            color: pin.status === 'SANGAT LAYAK' ? '#22c55e' :
                                                   pin.status === 'LAYAK' ? '#f59e0b' :
                                                   '#ef4444',
                                        }}>
                                            {pin.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', lineHeight: '2', color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🌡 Suhu</span>
                                            <strong style={{ color: '#e2e8f0' }}>{pin.latestReading.temperature}°C</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🧪 pH</span>
                                            <strong style={{ color: '#e2e8f0' }}>{pin.latestReading.pH}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>💧 TDS</span>
                                            <strong style={{ color: '#e2e8f0' }}>{pin.latestReading.tds} ppm</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>👁 Turbidity</span>
                                            <strong style={{ color: '#e2e8f0' }}>{pin.latestReading.turbidity} NTU</strong>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(148,163,184,0.15)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>📊 WQI</span>
                                            <strong style={{ color: '#22d3ee' }}>{pin.latestReading.wqiScore}/100</strong>
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
