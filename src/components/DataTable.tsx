import { Clock, ArrowUpRight } from 'lucide-react';
import type { SensorReading, WaterStatus } from '../types';

interface DataTableProps {
    readings: SensorReading[];
}

function StatusBadge({ status }: { status: WaterStatus }) {
    const styles = {
        'SANGAT LAYAK': 'bg-safe/10 text-safe border-safe/20',
        'LAYAK': 'bg-warning/10 text-warning border-warning/20',
        'BAHAYA': 'bg-danger/10 text-danger border-danger/20 animate-pulse',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'SANGAT LAYAK' ? 'bg-safe' :
                    status === 'LAYAK' ? 'bg-warning' : 'bg-danger'
                }`} />
            {status}
        </span>
    );
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export default function DataTable({ readings }: DataTableProps) {
    return (
        <div id="data-table" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '500ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-water-400" />
                        Riwayat Pembacaan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Data terbaru dari sensor ESP32</p>
                </div>
                <button
                    id="view-all-button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold
            text-water-400 hover:text-water-300 bg-water-500/10 hover:bg-water-500/15
            border border-water-500/20 transition-all duration-200"
                >
                    Lihat Semua <ArrowUpRight size={12} />
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            {['Waktu', 'Suhu', 'pH', 'TDS', 'Turbidity', 'WQI', 'Status'].map((h) => (
                                <th key={h} className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {readings.map((r, i) => (
                            <tr
                                key={r.id}
                                className="group hover:bg-white/[0.02] transition-colors duration-150"
                                style={{ animationDelay: `${600 + i * 50}ms` }}
                            >
                                <td className="py-3 pr-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-300">{formatTime(r.timestamp)}</span>
                                        <span className="text-[10px] text-slate-600">{formatDate(r.timestamp)}</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-xs text-slate-300 font-medium">{r.temperature}°C</td>
                                <td className="py-3 pr-4 text-xs text-slate-300 font-medium">{r.pH}</td>
                                <td className="py-3 pr-4 text-xs text-slate-300 font-medium">{r.tds} <span className="text-slate-600">ppm</span></td>
                                <td className="py-3 pr-4 text-xs text-slate-300 font-medium">{r.turbidity} <span className="text-slate-600">NTU</span></td>
                                <td className="py-3 pr-4">
                                    <span className={`text-sm font-bold ${r.wqiScore >= 80 ? 'text-safe' :
                                            r.wqiScore >= 60 ? 'text-warning' : 'text-danger'
                                        }`}>
                                        {r.wqiScore}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <StatusBadge status={r.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
