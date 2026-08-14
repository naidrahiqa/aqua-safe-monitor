import { useState, useEffect, useCallback } from 'react';
import {
    Cpu,
    Plus,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Eye,
    EyeOff,
    Power,
    Loader2,
    AlertTriangle,
    Key,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Device } from '../types';

// ===================================================================
// DeviceManager — Full device CRUD with API key management.
// Users can add, view, and delete their registered ESP32 devices.
// ===================================================================

// ---- Mock devices for demo mode ----
const MOCK_DEVICES: Device[] = [
    {
        id: 'demo-dev-001',
        user_id: 'demo-user',
        device_name: 'ESP32-Sensor-Utama',
        secret_api_key: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        location_lat: -6.9175,
        location_lng: 107.6191,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'demo-dev-002',
        user_id: 'demo-user',
        device_name: 'ESP32-Kolam-Belakang',
        secret_api_key: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
        location_lat: -6.9180,
        location_lng: 107.6195,
        is_active: false,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
];

export default function DeviceManager() {
    const { user } = useAuth();
    const configured = isSupabaseConfigured();

    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [newlyCreated, setNewlyCreated] = useState<Device | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // ---- Fetch devices ----
    const fetchDevices = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!configured) {
            // Demo mode
            setDevices(MOCK_DEVICES);
            setLoading(false);
            return;
        }

        const { data, error: fetchError } = await supabase
            .from('devices')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setDevices(data as Device[]);
        }
        setLoading(false);
    }, [configured]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // ---- Add new device ----
    const handleAddDevice = async () => {
        if (!newDeviceName.trim()) {
            setError('Nama perangkat harus diisi');
            return;
        }

        setCreating(true);
        setError(null);

        if (!configured) {
            // Demo mode
            const demoDevice: Device = {
                id: `demo-${Date.now()}`,
                user_id: 'demo-user',
                device_name: newDeviceName.trim(),
                secret_api_key: crypto.randomUUID(),
                location_lat: -6.9175,
                location_lng: 107.6191,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setDevices((prev) => [demoDevice, ...prev]);
            setNewlyCreated(demoDevice);
            setNewDeviceName('');
            setShowAddForm(false);
            setCreating(false);
            return;
        }

        const { data, error: insertError } = await supabase
            .from('devices')
            .insert({
                user_id: user?.id,
                device_name: newDeviceName.trim(),
            })
            .select()
            .single<Device>();

        if (insertError) {
            setError(insertError.message);
        } else if (data) {
            setDevices((prev) => [data, ...prev]);
            setNewlyCreated(data);
            setNewDeviceName('');
            setShowAddForm(false);
        }
        setCreating(false);
    };

    // ---- Delete device ----
    const handleDelete = async (deviceId: string) => {
        setPendingDeleteId(null);

        if (!configured) {
            setDevices((prev) => prev.filter((d) => d.id !== deviceId));
            return;
        }

        const { error: delError } = await supabase
            .from('devices')
            .delete()
            .eq('id', deviceId);

        if (delError) {
            setError(delError.message);
        } else {
            setDevices((prev) => prev.filter((d) => d.id !== deviceId));
        }
    };

    // ---- Toggle active ----
    const handleToggleActive = async (device: Device) => {
        if (!configured) {
            setDevices((prev) =>
                prev.map((d) => (d.id === device.id ? { ...d, is_active: !d.is_active } : d))
            );
            return;
        }

        const { error: updateError } = await supabase
            .from('devices')
            .update({ is_active: !device.is_active })
            .eq('id', device.id);

        if (updateError) {
            setError(updateError.message);
        } else {
            setDevices((prev) =>
                prev.map((d) => (d.id === device.id ? { ...d, is_active: !d.is_active } : d))
            );
        }
    };

    // ---- Copy to clipboard ----
    const handleCopy = (text: string, keyId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // ---- Toggle key visibility ----
    const toggleKeyVisibility = (deviceId: string) => {
        setVisibleKeys((prev) => {
            const next = new Set(prev);
            if (next.has(deviceId)) next.delete(deviceId);
            else next.add(deviceId);
            return next;
        });
    };

    // ---- Mask API key ----
    const maskKey = (key: string): string => {
        return key.substring(0, 8) + '••••••••••••••••••••' + key.substring(key.length - 4);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Cpu size={20} className="text-water-400" />
                        Perangkat ESP32
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola perangkat IoT dan API key untuk sensor kamu
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        id="refresh-devices-btn"
                        onClick={fetchDevices}
                        className="p-2.5 border-2 border-black bg-panel text-slate-400 hover:bg-water-500 hover:text-black transition-all hard-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        id="add-device-btn"
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 nb-btn text-sm"
                    >
                        <Plus size={16} /> Tambah Perangkat
                    </button>
                </div>
            </div>

            {/* Add Device Form */}
            {showAddForm && (
                <div className="nb-panel p-5 border-water-500 animate-fade-in">
                    <h3 className="text-sm font-bold text-white mb-3">Tambah Perangkat Baru</h3>
                    <div className="flex gap-3">
                        <input
                            id="new-device-name"
                            type="text"
                            value={newDeviceName}
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            placeholder="Nama perangkat, contoh: ESP32-Kolam-Utama"
                            className="flex-1 nb-input"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDevice()}
                        />
                        <button
                            id="confirm-add-device"
                            onClick={handleAddDevice}
                            disabled={creating}
                            className="px-5 py-2.5 nb-btn-dark text-sm disabled:opacity-50"
                        >
                            {creating ? <Loader2 size={16} className="animate-spin" /> : 'Buat'}
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setNewDeviceName(''); }}
                            className="px-4 py-2.5 nb-btn-dark text-sm"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Newly Created Device Alert */}
            {newlyCreated && (
                <div className="nb-panel p-5 border-safe hard-shadow-safe animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-safe text-black border-2 border-black hard-shadow-sm">
                            <Key size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-safe mb-1">
                                Perangkat "{newlyCreated.device_name}" berhasil dibuat!
                            </h3>
                            <p className="text-xs text-slate-400 mb-3">
                                Simpan kredensial ini — API key hanya ditampilkan sekali. Copy ke kode ESP32 kamu:
                            </p>

                            {/* Device ID */}
                            <div className="space-y-2 mb-3">
                                <div className="flex items-center justify-between px-3 py-2 border-2 border-black bg-panel-light">
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Device ID</span>
                                        <code className="text-xs text-water-300 font-mono">{newlyCreated.id}</code>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(newlyCreated.id, 'new-id')}
                                        className="p-1.5 border-2 border-black bg-panel-light text-slate-400 hover:text-white transition-colors"
                                    >
                                        {copiedKey === 'new-id' ? <Check size={14} className="text-safe" /> : <Copy size={14} />}
                                    </button>
                                </div>

                                {/* API Key */}
                                <div className="flex items-center justify-between px-3 py-2 border-2 border-black bg-panel-light">
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Secret API Key</span>
                                        <code className="text-xs text-warning font-mono">{newlyCreated.secret_api_key}</code>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(newlyCreated.secret_api_key, 'new-key')}
                                        className="p-1.5 border-2 border-black bg-panel-light text-slate-400 hover:text-white transition-colors"
                                    >
                                        {copiedKey === 'new-key' ? <Check size={14} className="text-safe" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* ESP32 Code Snippet */}
                            <div className="px-3 py-2 border-2 border-black bg-panel-light">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">ESP32 Arduino Code</span>
                                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{`// WiFi & HTTP headers
#define API_KEY "${newlyCreated.secret_api_key}"
#define ENDPOINT "https://<project>.supabase.co/functions/v1/ingest-sensor-data"

// JSON payload
String payload = "{\\"api_key\\":\\"" + String(API_KEY) + "\\","
  + "\\"temperature\\":" + String(temp) + ","
  + "\\"ph\\":" + String(ph) + ","
  + "\\"tds\\":" + String(tds) + ","
  + "\\"turbidity\\":" + String(turb) + "}";`}</pre>
                            </div>

                            <button
                                onClick={() => setNewlyCreated(null)}
                                className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 border-2 border-black bg-danger text-black text-xs font-bold animate-fade-in hard-shadow-sm">
                    <AlertTriangle size={14} />
                    {error}
                </div>
            )}

            {/* Device List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="text-water-400 animate-spin" />
                </div>
            ) : devices.length === 0 ? (
                <div className="nb-panel p-12 text-center">
                    <Cpu size={40} className="text-slate-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-bold">Belum ada perangkat terdaftar</p>
                    <p className="text-xs text-slate-500 mt-1">Klik "Tambah Perangkat" untuk mendaftarkan ESP32 kamu</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {devices.map((device) => (
                        <div
                            key={device.id}
                            className={`nb-panel p-5 transition-all duration-150
                                ${device.is_active ? '' : 'opacity-60'}
                            `}
                        >
                            {/* Device Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 border-2 border-black hard-shadow-sm ${device.is_active ? 'bg-water-500 text-black' : 'bg-panel-light text-slate-500'}`}>
                                        <Cpu size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{device.device_name}</h3>
                                        <p className="text-[10px] text-slate-500 font-mono">{device.id.substring(0, 8)}...</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {device.is_active ? (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-safe">
                                            <Wifi size={10} /> Aktif
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                            <WifiOff size={10} /> Nonaktif
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* API Key */}
                            <div className="px-3 py-2.5 border-2 border-black bg-panel-light mb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">API Key</span>
                                        <code className="text-xs text-slate-400 font-mono block truncate">
                                            {visibleKeys.has(device.id) ? device.secret_api_key : maskKey(device.secret_api_key)}
                                        </code>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        <button
                                            onClick={() => toggleKeyVisibility(device.id)}
                                            className="p-1.5 border-2 border-black bg-panel-light text-slate-500 hover:text-white transition-colors"
                                            title={visibleKeys.has(device.id) ? 'Sembunyikan' : 'Tampilkan'}
                                        >
                                            {visibleKeys.has(device.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </button>
                                        <button
                                            onClick={() => handleCopy(device.secret_api_key, device.id)}
                                            className="p-1.5 border-2 border-black bg-panel-light text-slate-500 hover:text-white transition-colors"
                                            title="Copy API Key"
                                        >
                                            {copiedKey === device.id ? <Check size={12} className="text-safe" /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Meta & Actions */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">
                                    Dibuat: {new Date(device.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleToggleActive(device)}
                                        className={`p-1.5 border-2 border-black transition-colors ${device.is_active
                                                ? 'bg-panel-light text-warning hover:bg-warning hover:text-black'
                                                : 'bg-panel-light text-safe/60 hover:bg-safe hover:text-black'
                                            }`}
                                        title={device.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    >
                                        <Power size={14} />
                                    </button>
                                    {pendingDeleteId === device.id ? (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleDelete(device.id)}
                                                className="px-2 py-1 nb-chip nb-chip-danger text-[10px]"
                                            >
                                                Hapus
                                            </button>
                                            <button
                                                onClick={() => setPendingDeleteId(null)}
                                                className="px-2 py-1 nb-chip nb-chip-neutral text-[10px]"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setPendingDeleteId(device.id)}
                                            className="p-1.5 border-2 border-black bg-panel-light text-danger/40 hover:bg-danger hover:text-white transition-colors"
                                            title="Hapus perangkat"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
