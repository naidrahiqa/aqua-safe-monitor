import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Device } from '../types';
import MapPicker from './MapPicker';

interface LocationSettingsProps {
    onSaved?: () => void;
}

export default function LocationSettings({ onSaved }: LocationSettingsProps) {
    const configured = isSupabaseConfigured();
    const [device, setDevice] = useState<Device | null>(null);
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    useEffect(() => {
        if (!configured) {
            setLoading(false);
            return;
        }
        (async () => {
            const { data } = await supabase
                .from('devices')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) {
                setDevice(data as Device);
                setLat(String(data.location_lat ?? ''));
                setLng(String(data.location_lng ?? ''));
            }
            setLoading(false);
        })();
    }, [configured]);

    const handleSave = async () => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isNaN(latNum) || isNaN(lngNum)) {
            setMsg({ type: 'err', text: 'Koordinat harus berupa angka' });
            return;
        }
        if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            setMsg({ type: 'err', text: 'Koordinat di luar range valid' });
            return;
        }

        setSaving(true);
        setMsg(null);

        const { error } = await supabase
            .from('devices')
            .update({ location_lat: latNum, location_lng: lngNum })
            .eq('id', device!.id);

        setSaving(false);
        if (error) {
            setMsg({ type: 'err', text: error.message });
        } else {
            setMsg({ type: 'ok', text: 'Lokasi berhasil diperbarui!' });
            onSaved?.();
        }
    };

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const pickerLat = !isNaN(latNum) ? latNum : (device?.location_lat ?? -6.5833);
    const pickerLng = !isNaN(lngNum) ? lngNum : (device?.location_lng ?? 110.6667);

    if (!configured) {
        return (
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-white mb-3">
                    <MapPin size={18} className="text-water-400" />
                    Lokasi Sensor
                </h2>
                <p className="text-xs text-slate-500">Mode demo — hubungkan Supabase untuk mengubah lokasi.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white mb-1">
                <MapPin size={18} className="text-water-400" />
                Lokasi Sensor
            </h2>
            <p className="text-xs text-slate-500 mb-4">Ubah koordinat GPS jika sensor dipindahkan.</p>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                    <Loader2 size={16} className="animate-spin" /> Memuat...
                </div>
            ) : !device ? (
                <p className="text-xs text-slate-500 py-4">Tidak ada device ditemukan. Buat device terlebih dahulu di tab Perangkat.</p>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                            <input
                                type="text"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder="-6.5833"
                                className="w-full px-3 py-2 rounded-lg bg-panel-dark border border-white/10 text-white text-sm focus:outline-none focus:border-water-400/50 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                            <input
                                type="text"
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                placeholder="110.6667"
                                className="w-full px-3 py-2 rounded-lg bg-panel-dark border border-white/10 text-white text-sm focus:outline-none focus:border-water-400/50 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Pilih di peta</label>
                        <MapPicker lat={pickerLat} lng={pickerLng} onPick={(l, n) => { setLat(String(l)); setLng(String(n)); }} />
                        <p className="mt-1.5 text-xs text-slate-500">Klik peta atau geser pin untuk mengisi koordinat.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-water-500 hover:bg-water-600 text-white text-sm font-medium transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Simpan
                        </button>

                        {msg && (
                            <span className={`flex items-center gap-1.5 text-xs font-medium ${msg.type === 'ok' ? 'text-safe' : 'text-danger'}`}>
                                {msg.type === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
                                {msg.text}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
