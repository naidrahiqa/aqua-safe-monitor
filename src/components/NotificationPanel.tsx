import { X, AlertTriangle, Shield, Droplets, FlaskConical, Bell } from 'lucide-react';
import type { SensorReading } from '../types';

// ===================================================================
// NotificationPanel — Shows alerts for BAHAYA status readings.
// Slides in from the right as an overlay.
// ===================================================================

interface NotificationPanelProps {
    readings: SensorReading[];
    onClose: () => void;
}

export default function NotificationPanel({ readings, onClose }: NotificationPanelProps) {
    const dangerReadings = readings.filter((r) => r.status === 'BAHAYA');
    const warningReadings = readings.filter((r) => r.status === 'LAYAK');

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-panel/95 backdrop-blur-xl border-l border-white/5 shadow-2xl animate-slide-in-left overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-panel/95 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                        <Bell size={18} className="text-water-400" />
                        <h2 className="text-sm font-bold text-white">Notifikasi</h2>
                        {dangerReadings.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-bold">
                                {dangerReadings.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Danger alerts */}
                    {dangerReadings.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-danger uppercase tracking-wider mb-3">
                                <AlertTriangle size={12} />
                                Peringatan BAHAYA
                            </h3>
                            <div className="space-y-2">
                                {dangerReadings.slice(0, 10).map((r) => (
                                    <div
                                        key={r.id}
                                        className="px-4 py-3 rounded-xl bg-danger/5 border border-danger/20 animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-danger uppercase">Bahaya</span>
                                            <span className="text-[10px] text-slate-500">{formatTime(r.timestamp)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <FlaskConical size={10} className="text-slate-500" />
                                                <span className="text-slate-400">pH: <span className="text-white font-medium">{r.pH}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Droplets size={10} className="text-slate-500" />
                                                <span className="text-slate-400">TDS: <span className="text-white font-medium">{r.tds}</span></span>
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                                            <Shield size={10} className="text-danger" />
                                            <span className="text-danger font-bold">WQI: {r.wqiScore}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning alerts */}
                    {warningReadings.length > 0 && (
                        <div>
                            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-warning uppercase tracking-wider mb-3">
                                <Shield size={12} />
                                Peringatan LAYAK
                            </h3>
                            <div className="space-y-2">
                                {warningReadings.slice(0, 5).map((r) => (
                                    <div
                                        key={r.id}
                                        className="px-4 py-3 rounded-xl bg-warning/5 border border-warning/20 animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-warning uppercase">Peringatan</span>
                                            <span className="text-[10px] text-slate-500">{formatTime(r.timestamp)}</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-slate-400">WQI: </span>
                                            <span className="text-warning font-bold">{r.wqiScore}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No alerts */}
                    {dangerReadings.length === 0 && warningReadings.length === 0 && (
                        <div className="text-center py-12">
                            <Shield size={32} className="text-safe mx-auto mb-3" />
                            <p className="text-sm text-slate-400 font-medium">Semua aman!</p>
                            <p className="text-xs text-slate-600 mt-1">Tidak ada peringatan aktif</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
