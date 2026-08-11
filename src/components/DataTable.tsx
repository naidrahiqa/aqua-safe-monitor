import { useState, useMemo } from 'react';
import { Clock, Download, Filter, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { SensorReading, WaterStatus } from '../types';

type SortKey = 'timestamp' | 'temperature' | 'pH' | 'tds' | 'turbidity' | 'wqiScore' | 'status';
type SortDir = 'asc' | 'desc';

interface DataTableProps {
    readings: SensorReading[];
    showFilters?: boolean;
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

const ITEMS_PER_PAGE = 10;

const COLUMNS: { key: SortKey; label: string }[] = [
    { key: 'timestamp', label: 'Waktu' },
    { key: 'temperature', label: 'Suhu' },
    { key: 'pH', label: 'pH' },
    { key: 'tds', label: 'TDS' },
    { key: 'turbidity', label: 'Turbidity' },
    { key: 'wqiScore', label: 'WQI' },
    { key: 'status', label: 'Status' },
];

export default function DataTable({ readings, showFilters = false }: DataTableProps) {
    const [statusFilter, setStatusFilter] = useState<WaterStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>('timestamp');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const filteredReadings = useMemo(() => {
        let filtered = readings;

        if (statusFilter !== 'all') {
            filtered = filtered.filter((r) => r.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    r.id.toLowerCase().includes(q) ||
                    r.temperature.toString().includes(q) ||
                    r.pH.toString().includes(q) ||
                    r.tds.toString().includes(q) ||
                    r.turbidity.toString().includes(q)
            );
        }

        return [...filtered].sort((a, b) => {
            let cmp: number;
            if (sortKey === 'status') {
                cmp = a.status.localeCompare(b.status);
            } else {
                const av = sortKey === 'timestamp' ? new Date(a.timestamp).getTime() : a[sortKey];
                const bv = sortKey === 'timestamp' ? new Date(b.timestamp).getTime() : b[sortKey];
                cmp = (av as number) - (bv as number);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [readings, statusFilter, searchQuery, sortKey, sortDir]);

    const totalPages = Math.ceil(filteredReadings.length / ITEMS_PER_PAGE);
    const paginatedReadings = filteredReadings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when filters change
    const handleFilterChange = (filter: WaterStatus | 'all') => {
        setStatusFilter(filter);
        setCurrentPage(1);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'timestamp' ? 'desc' : 'desc');
        }
        setCurrentPage(1);
    };

    const exportCSV = () => {
        if (filteredReadings.length === 0) return;
        const header = ['Waktu', 'Suhu (°C)', 'pH', 'TDS (ppm)', 'Turbidity (NTU)', 'WQI', 'Status'];
        const rows = filteredReadings.map((r) => [
            new Date(r.timestamp).toLocaleString('id-ID'),
            r.temperature,
            r.pH,
            r.tds,
            r.turbidity,
            r.wqiScore,
            r.status,
        ]);
        const csv = '\uFEFF' + [header, ...rows].map((row) => row.join(';')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `watersafe-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div id="data-table" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '500ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-water-400" />
                        Riwayat Pembacaan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {filteredReadings.length} data ditemukan
                    </p>
                </div>
                <button
                    id="export-button"
                    onClick={exportCSV}
                    disabled={filteredReadings.length === 0}
                    title="Export data ke CSV"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            text-water-400 hover:text-water-300 bg-water-500/10 hover:bg-water-500/15
            border border-water-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Download size={12} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-white/5">
                    {/* Status filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-500 font-medium">Status:</span>
                    </div>
                    {(['all', 'SANGAT LAYAK', 'LAYAK', 'BAHAYA'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                statusFilter === filter
                                    ? filter === 'BAHAYA'
                                        ? 'bg-danger/20 text-danger border border-danger/30'
                                        : filter === 'LAYAK'
                                            ? 'bg-warning/20 text-warning border border-warning/30'
                                            : filter === 'SANGAT LAYAK'
                                                ? 'bg-safe/20 text-safe border border-safe/30'
                                                : 'bg-water-500/20 text-water-400 border border-water-500/30'
                                    : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'
                            }`}
                        >
                            {filter === 'all' ? 'Semua' : filter}
                        </button>
                    ))}

                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-500 ml-auto w-48">
                        <Search size={12} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Cari data..."
                            className="bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none w-full"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left min-w-[640px]">
                    <thead>
                        <tr className="border-b border-white/5">
                            {COLUMNS.map((col) => (
                                <th key={col.key} className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                    <button
                                        onClick={() => handleSort(col.key)}
                                        className={`flex items-center gap-1 transition-colors ${
                                            sortKey === col.key ? 'text-water-400' : 'hover:text-slate-300'
                                        }`}
                                    >
                                        {col.label}
                                        {sortKey === col.key &&
                                            (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {paginatedReadings.map((r, i) => (
                            <tr
                                key={r.id}
                                className="group hover:bg-white/[0.02] transition-colors duration-150"
                                style={{ animationDelay: `${600 + i * 50}ms` }}
                            >
                                <td className="py-3 pr-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-300">{formatTime(r.timestamp)}</span>
                                        <span className="text-xs text-slate-500">{formatDate(r.timestamp)}</span>
                                    </div>
                                </td>
                                <td className="py-3 pr-4 text-[13px] text-slate-300 font-medium">{r.temperature}°C</td>
                                <td className="py-3 pr-4 text-[13px] text-slate-300 font-medium">{r.pH}</td>
                                <td className="py-3 pr-4 text-[13px] text-slate-300 font-medium">{r.tds} <span className="text-slate-500">ppm</span></td>
                                <td className="py-3 pr-4 text-[13px] text-slate-300 font-medium">{r.turbidity} <span className="text-slate-500">NTU</span></td>
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
                        {paginatedReadings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                                    Tidak ada data yang cocok
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-500">
                        Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                                        currentPage === pageNum
                                            ? 'bg-water-500/20 text-water-400 border border-water-500/30'
                                            : 'bg-white/5 border border-white/5 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
