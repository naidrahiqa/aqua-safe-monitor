import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Bell, Save, RotateCcw, Check, AlertCircle } from 'lucide-react';
import type { AlertConfig } from '../lib/alertConfig';
import { saveAlertConfig, DEFAULT_ALERT_CONFIG } from '../lib/alertConfig';

interface AlertSettingsProps {
    config: AlertConfig;
    onChange: (config: AlertConfig) => void;
}

function Row({ label, desc, children }: { label: string; desc: string; children: ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 last:border-0 gap-2">
            <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-[13px] text-slate-400 mt-0.5">{desc}</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">{children}</div>
        </div>
    );
}

const inputClass =
    'w-20 px-2.5 py-1.5 rounded-lg bg-panel-dark border border-white/10 text-white text-sm text-center focus:outline-none focus:border-water-400/50 transition';

export default function AlertSettings({ config, onChange }: AlertSettingsProps) {
    const [form, setForm] = useState<AlertConfig>(config);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => setForm(config), [config]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);

    const update = (key: keyof AlertConfig, value: string) => {
        setForm((f) => ({ ...f, [key]: value === '' ? 0 : parseFloat(value) }));
    };

    const persist = (cfg: AlertConfig) => {
        saveAlertConfig(cfg);
        onChange(cfg);
    };

    const handleSave = () => {
        const values = Object.values(form);
        if (values.some((n) => isNaN(n) || n < 0)) {
            setMsg({ type: 'err', text: 'Semua nilai harus angka positif' });
            return;
        }
        if (form.phMin >= form.phMax || form.tempMin >= form.tempMax) {
            setMsg({ type: 'err', text: 'Nilai minimum harus lebih kecil dari maksimum' });
            return;
        }
        setSaving(true);
        setMsg(null);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            persist(form);
            setSaving(false);
            setMsg({ type: 'ok', text: 'Pengaturan berhasil disimpan!' });
        }, 300);
    };

    const handleReset = () => {
        setForm(DEFAULT_ALERT_CONFIG);
        persist(DEFAULT_ALERT_CONFIG);
        setMsg({ type: 'ok', text: 'Dikembalikan ke nilai default' });
    };

    return (
        <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white mb-1">
                <Bell size={18} className="text-water-400" />
                Pengaturan Sensor & Alert
            </h2>
            <p className="text-[13px] text-slate-400 mb-2">Ubah ambang batas aman. Disimpan di perangkat ini dan dipakai untuk warna indikator.</p>

            <div>
                <Row label="Interval Pembacaan" desc="Frekuensi pengambilan data sensor">
                    <span className="px-3 py-1 rounded-lg bg-water-500/10 text-water-400 text-xs font-semibold border border-water-500/20 whitespace-nowrap">
                        5 detik
                    </span>
                </Row>
                <Row label="Batas pH Aman" desc="Range pH yang dianggap aman">
                    <input type="number" step="0.1" className={inputClass} value={form.phMin} onChange={(e) => update('phMin', e.target.value)} />
                    <span className="text-slate-500 text-sm">–</span>
                    <input type="number" step="0.1" className={inputClass} value={form.phMax} onChange={(e) => update('phMax', e.target.value)} />
                </Row>
                <Row label="Batas TDS Aman" desc="Maksimum TDS yang diizinkan">
                    <span className="text-slate-500 text-sm">&lt;</span>
                    <input type="number" step="10" className={inputClass} value={form.tdsMax} onChange={(e) => update('tdsMax', e.target.value)} />
                    <span className="text-slate-500 text-sm">ppm</span>
                </Row>
                <Row label="Batas Turbidity Aman" desc="Maksimum turbidity yang diizinkan">
                    <span className="text-slate-500 text-sm">&lt;</span>
                    <input type="number" step="0.5" className={inputClass} value={form.turbidityMax} onChange={(e) => update('turbidityMax', e.target.value)} />
                    <span className="text-slate-500 text-sm">NTU</span>
                </Row>
                <Row label="Batas Suhu Aman" desc="Range suhu yang dianggap ideal">
                    <input type="number" step="0.5" className={inputClass} value={form.tempMin} onChange={(e) => update('tempMin', e.target.value)} />
                    <span className="text-slate-500 text-sm">–</span>
                    <input type="number" step="0.5" className={inputClass} value={form.tempMax} onChange={(e) => update('tempMax', e.target.value)} />
                    <span className="text-slate-500 text-sm">°C</span>
                </Row>
                <Row label="Notifikasi" desc="Alert ketika status BAHAYA terdeteksi">
                    <span className="px-3 py-1 rounded-lg bg-safe/10 text-safe text-xs font-semibold border border-safe/20 whitespace-nowrap">
                        Aktif
                    </span>
                </Row>
            </div>

            <div className="flex items-center gap-3 mt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-water-500 hover:bg-water-600 text-white text-sm font-medium transition disabled:opacity-50"
                >
                    <Save size={14} />
                    Simpan
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 text-sm font-medium transition"
                >
                    <RotateCcw size={14} />
                    Reset
                </button>
                {msg && (
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${msg.type === 'ok' ? 'text-safe' : 'text-danger'}`}>
                        {msg.type === 'ok' ? <Check size={13} /> : <AlertCircle size={13} />}
                        {msg.text}
                    </span>
                )}
            </div>
        </div>
    );
}
