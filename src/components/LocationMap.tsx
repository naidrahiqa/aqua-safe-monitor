import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import type { SensorReading } from '../types';

// Custom marker icon using a data URI to avoid broken default icon issues
export const customIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
        <filter id="shadow" x="-50%" y="-30%" width="200%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#22d3ee" flood-opacity="0.4"/>
        </filter>
      </defs>
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="url(#g)" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="6" fill="white" opacity="0.9"/>
      <circle cx="16" cy="15" r="3" fill="#0891b2"/>
    </svg>
  `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
});

interface LocationMapProps {
    reading: SensorReading;
}

export default function LocationMap({ reading }: LocationMapProps) {
    const { location, temperature, pH, tds, status } = reading;

    return (
        <div id="location-map" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '400ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <MapPin size={18} className="text-water-400" />
                        Lokasi Sensor
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {location.lat.toFixed(4)}°S, {location.lng.toFixed(4)}°E
                    </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border
          ${status === 'SANGAT LAYAK' ? 'bg-safe/15 text-safe border-safe/20' :
                        status === 'LAYAK' ? 'bg-warning/15 text-warning border-warning/20' :
                            'bg-danger/15 text-danger border-danger/20'
                    }`}>
                    {status}
                </span>
            </div>

            {/* Map */}
            <div className="h-64 rounded-xl overflow-hidden ring-1 ring-white/5">
                <MapContainer
                    center={[location.lat, location.lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={true}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <Marker position={[location.lat, location.lng]} icon={customIcon}>
                        <Popup>
                            <div style={{
                                background: '#1e293b',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                color: '#e2e8f0',
                                minWidth: '180px',
                                fontFamily: 'Inter, system-ui, sans-serif',
                                margin: '-14px -20px',
                            }}>
                                <p style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: '#22d3ee' }}>
                                    WaterSafe Sensor
                                </p>
                                <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#94a3b8' }}>
                                    <div>Suhu: <strong style={{ color: '#e2e8f0' }}>{temperature}°C</strong></div>
                                    <div>pH: <strong style={{ color: '#e2e8f0' }}>{pH}</strong></div>
                                    <div>TDS: <strong style={{ color: '#e2e8f0' }}>{tds} ppm</strong></div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
}
