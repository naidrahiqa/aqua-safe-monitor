import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, Waves, FlaskConical, Droplets, Thermometer, Eye } from 'lucide-react';
import type { ChartDataPoint } from '../types';

type TimeRange = '5M' | '15M' | '30M' | '1J' | '4J' | '8J' | '24J' | 'all';

interface AnalyticsChartProps {
    data: ChartDataPoint[];
    showAllLines?: boolean;
}

interface SingleChartProps {
    data: ChartDataPoint[];
    title: string;
    subtitle: string;
    dataKey: string;
    name: string;
    color: string;
    icon: React.ReactNode;
    unit: string;
    domain: [number, number];
    timeRange: TimeRange;
    onTimeRangeChange: (r: TimeRange) => void;
    decimals?: number;
    gradient?: boolean;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
    unit?: string;
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

function filterByRange(data: ChartDataPoint[], range: TimeRange): ChartDataPoint[] {
    if (range === 'all') return data;
    const minutes = TIME_RANGES.find((r) => r.key === range)?.minutes;
    if (!minutes) return data;
    const now = new Date();
    const cutoff = new Date(now.getTime() - minutes * 60 * 1000);
    return data.filter((d) => new Date(d.timestamp) >= cutoff);
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-panel rounded-xl p-3 shadow-xl border border-white/10 min-w-[140px]">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2 border-b border-white/5 pb-1.5">
                <Clock size={12} /> {label}
            </p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">
                        {entry.value}{unit ? ` ${unit}` : ''}
                    </span>
                </div>
            ))}
        </div>
    );
}

function RangeSelector({ timeRange, onChange }: { timeRange: TimeRange; onChange: (r: TimeRange) => void }) {
    return (
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
            {TIME_RANGES.map((r) => (
                <button
                    key={r.key}
                    onClick={() => onChange(r.key)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
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
}

function SingleSensorChart({ data, title, subtitle, dataKey, name, color, icon, unit, domain, timeRange, onTimeRangeChange, decimals = 2, gradient = false }: SingleChartProps) {
    const filteredData = useMemo(() => filterByRange(data, timeRange), [data, timeRange]);

    if (!filteredData.length) {
        return (
            <div className="glass-panel rounded-2xl p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">{title}</h3>
                            <p className="text-[10px] text-slate-500">{subtitle}</p>
                        </div>
                    </div>
                    <RangeSelector timeRange={timeRange} onChange={onTimeRangeChange} />
                </div>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <p className="text-slate-600 text-xs">Tidak ada data</p>
                </div>
            </div>
        );
    }

    const vals = filteredData.map((d) => (d as Record<string, unknown>)[dataKey] as number).filter((v) => v != null && !isNaN(v));
    const autoMin = vals.length ? Math.min(...vals) : domain[0];
    const autoMax = vals.length ? Math.max(...vals) : domain[1];
    const padding = Math.max((autoMax - autoMin) * 0.15, 1);
    const finalDomain: [number, number] = [
        Math.floor(autoMin - padding),
        Math.ceil(autoMax + padding),
    ];

    const gradientId = `gradient-${dataKey}`;

    return (
        <div className="glass-panel rounded-2xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">{title}</h3>
                        <p className="text-[10px] text-slate-500">{subtitle}</p>
                    </div>
                </div>
                <RangeSelector timeRange={timeRange} onChange={onTimeRangeChange} />
            </div>
            <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                        <defs>
                            {gradient && (
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            )}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                            interval={Math.max(0, Math.ceil(filteredData.length / 6) - 1)}
                        />
                        <YAxis
                            domain={finalDomain}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                            tickFormatter={(v: number) => decimals === 0 ? String(Math.round(v)) : v.toFixed(1)}
                        />
                        <Tooltip content={<CustomTooltip unit={unit} />} />
                        {gradient ? (
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                name={name}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 5, fill: color, stroke: '#0c1222', strokeWidth: 2 }}
                            />
                        ) : (
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                name={name}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={{ r: 2.5, fill: '#0c1222', stroke: color, strokeWidth: 1.5 }}
                                activeDot={{ r: 5, fill: color, stroke: '#0c1222', strokeWidth: 2 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

const SENSOR_CONFIG = [
    {
        key: 'pH',
        dataKey: 'pH',
        title: 'pH Air',
        name: 'pH Level',
        color: '#22d3ee',
        unit: '',
        icon: <FlaskConical size={14} style={{ color: '#22d3ee' }} />,
        domain: [0, 14] as [number, number],
        decimals: 2,
        subtitle: 'Parameter kimia',
    },
    {
        key: 'temperature',
        dataKey: 'temperature',
        title: 'Suhu Air',
        name: 'Suhu (°C)',
        color: '#f97316',
        unit: '°C',
        icon: <Thermometer size={14} style={{ color: '#f97316' }} />,
        domain: [15, 40] as [number, number],
        decimals: 1,
        subtitle: 'Parameter fisik',
    },
    {
        key: 'tds',
        dataKey: 'tds',
        title: 'TDS Air',
        name: 'TDS (ppm)',
        color: '#60a5fa',
        unit: 'ppm',
        icon: <Droplets size={14} style={{ color: '#60a5fa' }} />,
        domain: [0, 2000] as [number, number],
        decimals: 0,
        subtitle: 'Total dissolved solids',
    },
    {
        key: 'turbidity',
        dataKey: 'turbidity',
        title: 'Turbidity Air',
        name: 'Turbidity (NTU)',
        color: '#a78bfa',
        unit: 'NTU',
        icon: <Eye size={14} style={{ color: '#a78bfa' }} />,
        domain: [0, 100] as [number, number],
        decimals: 0,
        subtitle: 'Kejernihan air',
    },
];

export default function AnalyticsChart({ data, showAllLines = false }: AnalyticsChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>('8J');

    if (!showAllLines) {
        const overviewSensors = SENSOR_CONFIG.filter((s) => s.key === 'pH' || s.key === 'tds');
        return (
            <div id="analytics-chart" className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} className="text-water-400" />
                            Tren Kualitas Air
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Monitor pH & TDS secara terpisah</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overviewSensors.map((sensor) => (
                        <SingleSensorChart
                            key={sensor.key}
                            data={data}
                            title={sensor.title}
                            subtitle={sensor.subtitle}
                            dataKey={sensor.dataKey}
                            name={sensor.name}
                            color={sensor.color}
                            icon={sensor.icon}
                            unit={sensor.unit}
                            domain={sensor.domain}
                            decimals={sensor.decimals}
                            timeRange={timeRange}
                            onTimeRangeChange={setTimeRange}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div id="analytics-chart" className="space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-water-400" />
                        Detail Sensor
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Setiap parameter — {timeRange === 'all' ? 'Semua data' : `${timeRange} terakhir`}</p>
                </div>
                <RangeSelector timeRange={timeRange} onChange={setTimeRange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SENSOR_CONFIG.map((sensor) => (
                    <SingleSensorChart
                        key={sensor.key}
                        data={data}
                        title={sensor.title}
                        subtitle={sensor.subtitle}
                        dataKey={sensor.dataKey}
                        name={sensor.name}
                        color={sensor.color}
                        icon={sensor.icon}
                        unit={sensor.unit}
                        domain={sensor.domain}
                        decimals={sensor.decimals}
                        timeRange={timeRange}
                        onTimeRangeChange={setTimeRange}
                        gradient={sensor.key === 'temperature'}
                    />
                ))}
            </div>
        </div>
    );
}
