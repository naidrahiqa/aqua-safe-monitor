import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { TrendingUp, Clock, Waves } from 'lucide-react';
import type { ChartDataPoint } from '../types';

type TimeRange = '5M' | '15M' | '30M' | '1J' | '4J' | '8J' | '24J' | 'all';

interface AnalyticsChartProps {
    data: ChartDataPoint[];
    showAllLines?: boolean;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}

const TIME_RANGES: { key: TimeRange; label: string; minutes: number | null }[] = [
    { key: '5M', label: '5M', minutes: 5 },
    { key: '15M', label: '15M', minutes: 15 },
    { key: '30M', label: '30M', minutes: 30 },
    { key: '1J', label: '1J', minutes: 60 },
    { key: '4J', label: '4J', minutes: 240 },
    { key: '8J', label: '8J', minutes: 480 },
    { key: '24J', label: '24J', minutes: 1440 },
    { key: 'all', label: 'Semua', minutes: null },
];

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="glass-panel rounded-xl p-3 shadow-xl border border-white/10 min-w-[160px]">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2 border-b border-white/5 pb-1.5">
                <Clock size={12} /> {label}
            </p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

function filterByRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
    if (range === 'all') return data;
    const minutes = TIME_RANGES.find((r) => r.key === range)?.minutes;
    if (!minutes) return data;

    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
    return data.filter((d) => new Date(d.timestamp) >= cutoff);
}

export default function AnalyticsChart({ data, showAllLines = false }: AnalyticsChartProps) {
    const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
        pH: true,
        tds: true,
        temperature: showAllLines,
        turbidity: showAllLines,
    });
    const [timeRange, setTimeRange] = useState<TimeRange>('8J');

    const toggleLine = (key: string) => {
        setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredData = useMemo(() => filterByRange(data, timeRange), [data, timeRange]);
    const rangeLabel = TIME_RANGES.find((r) => r.key === timeRange)?.label ?? '8J';

    const RangeSelector = () => (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {TIME_RANGES.map((r) => (
                <button
                    key={r.key}
                    onClick={() => setTimeRange(r.key)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        timeRange === r.key
                            ? 'bg-water-500/20 text-water-300 border border-water-500/30'
                            : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );

    // Show empty state if no data
    if (!filteredData.length) {
        return (
            <div id="analytics-chart" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-water-400" />
                            Tren Kualitas Air
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Belum ada data untuk rentang ini</p>
                    </div>
                    <RangeSelector />
                </div>
                <div className="h-72 flex items-center justify-center">
                    <p className="text-slate-500 text-sm">Tidak ada data sensor dalam rentang {rangeLabel}</p>
                </div>
            </div>
        );
    }

    // Dynamic domains from filtered data
    const phVals = filteredData.map((d) => d.pH).filter(Boolean);
    const tempVals = filteredData.map((d) => d.temperature).filter(Boolean);
    const tdsVals = filteredData.map((d) => d.tds).filter(Boolean);
    const turbVals = filteredData.map((d) => d.turbidity).filter(Boolean);

    const phDomain = [Math.floor(Math.min(...phVals, 0) - 1), Math.ceil(Math.max(...phVals, 14) + 1)];
    const tempDomain = [Math.floor(Math.min(...tempVals, 15) - 2), Math.ceil(Math.max(...tempVals, 30) + 2)];
    const tdsDomain = [0, Math.ceil(Math.max(...tdsVals, 500) * 1.2)];
    const turbDomain = [0, Math.ceil(Math.max(...turbVals, 500) * 1.2)];

    if (!showAllLines) {
        return (
            <div id="analytics-chart" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-water-400" />
                            Tren Kualitas Air
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">pH & TDS — {rangeLabel} terakhir</p>
                    </div>
                    <RangeSelector />
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} interval={Math.max(0, Math.ceil(filteredData.length / 8) - 1)} />
                            <YAxis yAxisId="pH" domain={phDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: 'pH', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }} />
                            <YAxis yAxisId="tds" orientation="right" domain={tdsDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: 'ppm', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#64748b' } }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} iconType="circle" iconSize={8} />
                            {visibleLines.pH && (
                                <Line yAxisId="pH" type="monotone" dataKey="pH" name="pH Level" stroke="#22d3ee" strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#0c1222', stroke: '#22d3ee', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#0c1222', strokeWidth: 2 }} />
                            )}
                            {visibleLines.tds && (
                                <Line yAxisId="tds" type="monotone" dataKey="tds" name="TDS (ppm)" stroke="#60a5fa" strokeWidth={2.5}
                                    dot={{ r: 4, fill: '#0c1222', stroke: '#60a5fa', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#60a5fa', stroke: '#0c1222', strokeWidth: 2 }}
                                    strokeDasharray="6 3" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // Full mode: 2 charts stacked
    return (
        <div id="analytics-chart" className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {/* Chart 1: pH + Suhu */}
            <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-water-400" />
                            pH & Suhu
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Parameter kimia — {rangeLabel} terakhir</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RangeSelector />
                        <div className="flex items-center gap-2">
                            {[
                                { key: 'pH', color: '#22d3ee', label: 'pH' },
                                { key: 'temperature', color: '#f97316', label: 'Suhu' },
                            ].map((item) => (
                                <button key={item.key} onClick={() => toggleLine(item.key)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${visibleLines[item.key] ? 'bg-white/5 text-slate-300 border border-white/10' : 'text-slate-600 hover:text-slate-400'}`}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: visibleLines[item.key] ? item.color : '#475569' }} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} interval={Math.max(0, Math.ceil(filteredData.length / 8) - 1)} />
                            <YAxis yAxisId="pH" domain={phDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: 'pH', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }} />
                            <YAxis yAxisId="temp" orientation="right" domain={tempDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: '°C', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#64748b' } }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} iconType="circle" iconSize={8} />
                            {visibleLines.pH && (
                                <Line yAxisId="pH" type="monotone" dataKey="pH" name="pH Level" stroke="#22d3ee" strokeWidth={2.5}
                                    dot={{ r: 3, fill: '#0c1222', stroke: '#22d3ee', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#22d3ee', stroke: '#0c1222', strokeWidth: 2 }} />
                            )}
                            {visibleLines.temperature && (
                                <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Suhu (°C)" stroke="#f97316" strokeWidth={2}
                                    dot={{ r: 3, fill: '#0c1222', stroke: '#f97316', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#f97316', stroke: '#0c1222', strokeWidth: 2 }} />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: TDS + Turbidity */}
            <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Waves size={18} className="text-water-400" />
                            TDS & Turbidity
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Parameter fisik — {rangeLabel} terakhir</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RangeSelector />
                        <div className="flex items-center gap-2">
                            {[
                                { key: 'tds', color: '#60a5fa', label: 'TDS' },
                                { key: 'turbidity', color: '#a78bfa', label: 'Turbidity' },
                            ].map((item) => (
                                <button key={item.key} onClick={() => toggleLine(item.key)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${visibleLines[item.key] ? 'bg-white/5 text-slate-300 border border-white/10' : 'text-slate-600 hover:text-slate-400'}`}>
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: visibleLines[item.key] ? item.color : '#475569' }} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" vertical={false} />
                            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} interval={Math.max(0, Math.ceil(filteredData.length / 8) - 1)} />
                            <YAxis yAxisId="tds" domain={tdsDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: 'ppm', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748b' } }} />
                            <YAxis yAxisId="turb" orientation="right" domain={turbDomain} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false}
                                label={{ value: 'NTU', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#64748b' } }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} iconType="circle" iconSize={8} />
                            {visibleLines.tds && (
                                <Line yAxisId="tds" type="monotone" dataKey="tds" name="TDS (ppm)" stroke="#60a5fa" strokeWidth={2.5}
                                    dot={{ r: 3, fill: '#0c1222', stroke: '#60a5fa', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#60a5fa', stroke: '#0c1222', strokeWidth: 2 }} />
                            )}
                            {visibleLines.turbidity && (
                                <Line yAxisId="turb" type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#a78bfa" strokeWidth={2}
                                    dot={{ r: 3, fill: '#0c1222', stroke: '#a78bfa', strokeWidth: 2 }}
                                    activeDot={{ r: 5, fill: '#a78bfa', stroke: '#0c1222', strokeWidth: 2 }}
                                    strokeDasharray="6 3" />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
