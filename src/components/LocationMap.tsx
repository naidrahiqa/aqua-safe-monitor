import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Plus, X, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ZOOM } from '../lib/constants';
import type { TestLocation, WaterStatus } from '../types';

// ===================================================================
// LocationMap — Renders user-saved test locations on a map.
// Users can click to add new test locations with sensor data.
// ===================================================================

function createMarkerIcon(status: WaterStatus, index: number): L.Icon {
    const color =
        status === 'SANGAT LAYAK' ? '#22c55e' :
        status === 'LAYAK' ? '#f59e0b' :
        '#ef4444';

    // Number label for each pin
    const label = String(index + 1);

    return new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
              <defs>
                <filter id="s${index}" x="-50%" y="-30%" width="200%" height="180%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${color}" flood-opacity="0.5"/>
                </filter>
              </defs>
              <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#s${index})"/>
              <text x="18" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="white" font-family="Inter,system-ui,sans-serif">${label}</text>
            </svg>
        `),
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -46],
    });
}

function FitBounds({ locations }: { locations: TestLocation[] }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 0) return;
        if (locations.length === 1) {
            map.setView([locations[0].location.lat, locations[0].location.lng], 15);
            return;
        }
        const bounds = L.latLngBounds(
            locations.map((l) => [l.location.lat, l.location.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [locations, map]);

    return null;
}

/** Map click handler — used when adding a new location */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

/** Preview marker when adding a new location */
function PreviewMarker({ lat, lng }: { lat: number; lng: number }) {
    const icon = new L.Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
              <circle cx="20" cy="18" r="14" fill="#22d3ee" opacity="0.9"/>
              <circle cx="20" cy="18" r="8" fill="white" opacity="0.8"/>
              <circle cx="20" cy="18" r="4" fill="#22d3ee"/>
              <path d="M20 32 L14 18 A6 6 0 0 1 26 18 Z" fill="#22d3ee"/>
            </svg>
        `),
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50],
    });
    return <Marker position={[lat, lng]} icon={icon} />;
}

interface LocationMapProps {
    locations: TestLocation[];
    onAddLocation: (data: Omit<TestLocation, 'id' | 'wqiScore' | 'status' | 'createdAt'>) => void;
    onRemoveLocation: (id: string) => void;
    onSyncLocation: (id: string) => Promise<boolean>;
}

export default function LocationMap({ locations, onAddLocation, onRemoveLocation, onSyncLocation }: LocationMapProps) {
    const defaultCenter: [number, number] = [DEFAULT_LAT, DEFAULT_LNG];
    const mapRef = useRef(null);

    const [addMode, setAddMode] = useState(false);
    const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [formName, setFormName] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formPH, setFormPH] = useState('');
    const [formTDS, setFormTDS] = useState('');
    const [formTurbidity, setFormTurbidity] = useState('');
    const [formTemp, setFormTemp] = useState('');

    const totalLocations = locations.length;
    const dangerCount = locations.filter((l) => l.status === 'BAHAYA').length;
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const handleMapClick = useCallback((lat: number, lng: number) => {
        if (addMode) {
            setPendingCoords({ lat, lng });
        }
    }, [addMode]);

    const handleSubmit = () => {
        if (!pendingCoords || !formName.trim()) return;

        const pH = parseFloat(formPH) || 7.0;
        const tds = parseFloat(formTDS) || 0;
        const turbidity = parseFloat(formTurbidity) || 0;
        const temperature = parseFloat(formTemp) || 25;

        onAddLocation({
            name: formName.trim(),
            location: pendingCoords,
            temperature,
            pH,
            tds,
            turbidity,
            notes: formNotes.trim(),
        });

        // Reset
        setAddMode(false);
        setPendingCoords(null);
        setFormName('');
        setFormNotes('');
        setFormPH('');
        setFormTDS('');
        setFormTurbidity('');
        setFormTemp('');
    };

    const cancelAdd = () => {
        setAddMode(false);
        setPendingCoords(null);
        setFormName('');
        setFormNotes('');
        setFormPH('');
        setFormTDS('');
        setFormTurbidity('');
        setFormTemp('');
    };

    const handleSync = async (id: string) => {
        setSyncingId(id);
        await onSyncLocation(id);
        setSyncingId(null);
    };

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
                        {totalLocations} lokasi • {dangerCount > 0 ? `${dangerCount} bahaya` : 'semua aman'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Legend */}
                    <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500 mr-2">
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

                    {/* Add / Cancel button */}
                    <button
                        onClick={addMode ? cancelAdd : () => setAddMode(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            addMode
                                ? 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25'
                                : 'bg-water-500/15 text-water-400 border border-water-500/30 hover:bg-water-500/25'
                        }`}
                    >
                        {addMode ? <><X size={14} /> Batal</> : <><Plus size={14} /> Tambah</>}
                    </button>
                </div>
            </div>

            {/* Add mode banner */}
            {addMode && !pendingCoords && (
                <div className="mb-3 px-4 py-2.5 rounded-xl bg-water-500/10 border border-water-500/20 text-water-300 text-xs font-medium animate-fade-in">
                    Klik di peta untuk menentukan lokasi pengujian
                </div>
            )}

            {/* Map */}
            <div className="h-72 rounded-xl overflow-hidden ring-1 ring-white/5">
                <MapContainer
                    ref={mapRef}
                    center={defaultCenter}
                    zoom={DEFAULT_ZOOM}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                    attributionControl={true}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <FitBounds locations={locations} />
                    {addMode && <MapClickHandler onMapClick={handleMapClick} />}
                    {pendingCoords && <PreviewMarker lat={pendingCoords.lat} lng={pendingCoords.lng} />}
                    {locations.map((loc, i) => (
                        <Marker
                            key={loc.id}
                            position={[loc.location.lat, loc.location.lng]}
                            icon={createMarkerIcon(loc.status, i)}
                        >
                            <Popup>
                                <div style={{
                                    background: '#1e293b',
                                    padding: '14px 18px',
                                    borderRadius: '12px',
                                    color: '#e2e8f0',
                                    minWidth: '220px',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    margin: '-14px -20px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <p style={{ fontWeight: 700, fontSize: '13px', color: '#22d3ee' }}>
                                            {loc.name}
                                        </p>
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: loc.status === 'SANGAT LAYAK' ? 'rgba(34,197,94,0.15)' :
                                                        loc.status === 'LAYAK' ? 'rgba(245,158,11,0.15)' :
                                                        'rgba(239,68,68,0.15)',
                                            color: loc.status === 'SANGAT LAYAK' ? '#22c55e' :
                                                   loc.status === 'LAYAK' ? '#f59e0b' :
                                                   '#ef4444',
                                        }}>
                                            {loc.status}
                                        </span>
                                    </div>

                                    {/* Synced indicator */}
                                    {loc.syncedReading && (
                                        <div style={{
                                            marginBottom: '8px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(34,211,238,0.08)',
                                            border: '1px solid rgba(34,211,238,0.15)',
                                            fontSize: '9px',
                                            color: '#22d3ee',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            Data dari ESP32 sensor
                                        </div>
                                    )}

                                    <div style={{ fontSize: '11px', lineHeight: '2', color: '#94a3b8' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🌡 Suhu</span>
                                            <strong style={{ color: '#e2e8f0' }}>{loc.temperature}°C</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🧪 pH</span>
                                            <strong style={{ color: '#e2e8f0' }}>{loc.pH}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>💧 TDS</span>
                                            <strong style={{ color: '#e2e8f0' }}>{loc.tds} ppm</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>👁 Turbidity</span>
                                            <strong style={{ color: '#e2e8f0' }}>{loc.turbidity} NTU</strong>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(148,163,184,0.15)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>📊 WQI</span>
                                            <strong style={{ color: '#22d3ee' }}>{loc.wqiScore}/100</strong>
                                        </div>
                                        {loc.notes && (
                                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(148,163,184,0.15)', fontSize: '10px', color: '#64748b' }}>
                                                📝 {loc.notes}
                                            </div>
                                        )}
                                        {loc.lastSyncedAt && (
                                            <div style={{ marginTop: '4px', fontSize: '9px', color: '#475569' }}>
                                                Terakhir sync: {new Date(loc.lastSyncedAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sync button */}
                                    <button
                                        onClick={() => handleSync(loc.id)}
                                        disabled={syncingId === loc.id}
                                        style={{
                                            marginTop: '8px',
                                            width: '100%',
                                            padding: '7px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(34,211,238,0.3)',
                                            background: syncingId === loc.id ? 'rgba(34,211,238,0.05)' : 'rgba(34,211,238,0.1)',
                                            color: '#22d3ee',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            cursor: syncingId === loc.id ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                            opacity: syncingId === loc.id ? 0.6 : 1,
                                        }}
                                    >
                                        <RefreshCw size={11} className={syncingId === loc.id ? 'animate-spin' : ''} />
                                        {syncingId === loc.id ? 'Syncing...' : 'Sinkron dari Sensor'}
                                    </button>

                                    {/* Delete button */}
                                    {pendingDeleteId === loc.id ? (
                                        <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => {
                                                    onRemoveLocation(loc.id);
                                                    setPendingDeleteId(null);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(239,68,68,0.5)',
                                                    background: 'rgba(239,68,68,0.2)',
                                                    color: '#ef4444',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Ya, Hapus
                                            </button>
                                            <button
                                                onClick={() => setPendingDeleteId(null)}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: '#94a3b8',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPendingDeleteId(loc.id)}
                                            style={{
                                                marginTop: '4px',
                                                width: '100%',
                                                padding: '6px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#ef4444',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Add form — shows when coords are picked */}
            {addMode && pendingCoords && (
                <div className="mt-4 p-4 rounded-xl bg-panel-light border border-water-500/20 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">Tambah Lokasi Baru</h3>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {pendingCoords.lat.toFixed(4)}, {pendingCoords.lng.toFixed(4)}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Nama Lokasi *</label>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                placeholder="Contoh: Sumur RT 05"
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Suhu (°C)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formTemp}
                                onChange={(e) => setFormTemp(e.target.value)}
                                placeholder="26.5"
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">pH</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="14"
                                value={formPH}
                                onChange={(e) => setFormPH(e.target.value)}
                                placeholder="7.0"
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">TDS (ppm)</label>
                            <input
                                type="number"
                                step="1"
                                min="0"
                                value={formTDS}
                                onChange={(e) => setFormTDS(e.target.value)}
                                placeholder="185"
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Turbidity (NTU)</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formTurbidity}
                                onChange={(e) => setFormTurbidity(e.target.value)}
                                placeholder="2.1"
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Catatan</label>
                            <input
                                type="text"
                                value={formNotes}
                                onChange={(e) => setFormNotes(e.target.value)}
                                placeholder="Opsional..."
                                className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-water-500/40 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={cancelAdd}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!formName.trim()}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-water-500 text-white hover:bg-water-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Simpan Lokasi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
