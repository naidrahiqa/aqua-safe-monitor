import { useState, useMemo } from 'react';
import {
    FlaskConical,
    Thermometer,
    Droplets,
    Eye,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertTriangle,
} from 'lucide-react';
import { useSensorContext } from '../contexts/SensorDataContext';
import { loadAlertConfig } from '../lib/alertConfig';
import GaugeCard from './GaugeCard';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    ReferenceLine,
} from 'recharts';
import type { ChartDataPoint, SensorReading, NavSection } from '../types';

// ===================================================================
// SensorDetail — Full-page view for a single sensor type.
// Shows gauge, live chart, min/max/avg stats, and recent alerts.
// ===================================================================

type TimeRange = '5M' | '15M' | '30M' | '1J' | '4J' | '8J' | '24J' | 'all';

interface SensorConfig {
    navId: NavSection;
    title: string;
    subtitle: string;
    unit: string;
    icon: React.ReactNode;
    dataKey: keyof ChartDataPoint;
    readingKey: keyof SensorReading;
    color: string;
    min: number;
    max: number;
    safeMin: number;
    safeMax: number;
    decimals: number;
    trendInverted?: boolean;
}

export const SENSOR_CONFIGS: Record<string, SensorConfig> = {
    ph: {
        navId: 'ph',
        title: 'pH Level',
        subtitle: 'Parameter Kimia Air',
        unit: 'pH',
        icon: <FlaskConical size={20} />,
        dataKey: 'pH',
        readingKey: 'pH',
        color: '#22d3ee',
        min: 0,
        max: 14,
        safeMin: 6.5,
        safeMax: 8.5,
        decimals: 2,
    },
    suhu: {
        navId: 'suhu',
        title: 'Suhu Air',
        subtitle: 'Parameter Fisik',
        unit: '°C',
        icon: <Thermometer size={20} />,
        dataKey: 'temperature',
        readingKey: 'temperature',
        color: '#f97316',
        min: 0,
        max: 50,
        safeMin: 20,
        safeMax: 30,
        decimals: 1,
    },
    tds: {
        navId: 'tds',
        title: 'TDS',
        subtitle: 'Total Dissolved Solids',
        unit: 'ppm',
        icon: <Droplets size={20} />,
        dataKey: 'tds',
        readingKey: 'tds',
        color: '#60a5fa',
        min: 0,
        max: 2000,
        safeMin: 0,
        safeMax: 500,
        decimals: 0,
        trendInverted: true,
    },
    turbidity: {
        navId: 'turbidity',
        title: 'Turbidity',
        subtitle: 'Kejernihan Air',
        unit: 'NTU',
        icon: <Eye size={20} />,
        dataKey: 'turbidity',
        readingKey: 'turbidity',
        color: '#a78bfa',
        min: 0,
        max: 200,
        safeMin: 0,
        safeMax: 5,
        decimals: 1,
        trendInverted: true,
    },
};

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
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return data.filter((d) => new Date(d.timestamp) >= cutoff);
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
    unit: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-panel rounded-xl p-3 shadow-2xl border border-white/10 min-w-[140px]">
            <p className="text-xs font-semibold text-slate-300 mb-2 border-b border-white/5 pb-1.5">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-400">{entry.name}</span>
                    </div>
                    <span className="text-xs font-data-bold text-white">
                        {entry.value}{unit ? ` ${unit}` : ''}
                    </span>
                </div>
            ))}
        </div>
    );
}

interface SensorDetailProps {
    sensorKey: string;
}

export default function SensorDetail({ sensorKey }: SensorDetailProps) {
    const config = SENSOR_CONFIGS[sensorKey];
    const { latestReading, readings, chartData } = useSensorContext();
    const alertCfg = useMemo(() => loadAlertConfig(), []);
    const [timeRange, setTimeRange] = useState<TimeRange>('8J');

    const filteredData = useMemo(() => filterByRange(chartData, timeRange), [chartData, timeRange]);

    const currentValue = latestReading[config.readingKey] as number;

    // Compute stats
    const values = readings.map((r) => r[config.readingKey] as number);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const min = values.length ? values.reduce((a, b) => Math.min(a, b), Infinity) : 0;
    const max = values.length ? values.reduce((a, b) => Math.max(a, b), -Infinity) : 0;
    const dangerCount = readings.filter((r) => r.status === 'BAHAYA').length;

    // Recent trend (last 10 readings)
    const recentVals = readings.slice(0, 10).map((r) => r[config.readingKey] as number);
    const trend = recentVals.length >= 2
        ? recentVals[0] - recentVals[recentVals.length - 1]
        : 0;

    // Safe range override from config
    const safeMin = config.navId === 'ph' ? alertCfg.phMin
        : config.navId === 'suhu' ? alertCfg.tempMin
        : config.safeMin;
    const safeMax = config.navId === 'ph' ? alertCfg.phMax
        : config.navId === 'suhu' ? alertCfg.tempMax
        : config.navId === 'tds' ? alertCfg.tdsMax
        : config.navId === 'turbidity' ? alertCfg.turbidityMax
        : config.safeMax;

    // Auto domain for chart
    const vals = filteredData.map((d) => d[config.dataKey] as number).filter((v) => v != null && !isNaN(v));
    const autoMin = vals.length ? vals.reduce((a, b) => Math.min(a, b), Infinity) : config.min;
    const autoMax = vals.length ? vals.reduce((a, b) => Math.max(a, b), -Infinity) : config.max;
    const padding = Math.max((autoMax - autoMin) * 0.15, 1);
    const chartDomain: [number, number] = [Math.floor(autoMin - padding), Math.ceil(autoMax + padding)];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 rounded-xl" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                            {config.icon}
                        </span>
                        {config.title}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">{config.subtitle}</p>
                </div>
                {/* Time range selector */}
                <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                    {TIME_RANGES.map((r) => (
                        <button
                            key={r.key}
                            onClick={() => setTimeRange(r.key)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                timeRange === r.key
                                    ? 'text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                            style={timeRange === r.key ? { backgroundColor: `${config.color}20`, color: config.color } : undefined}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gauge + Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Current Value Gauge */}
                <div className="lg:col-span-1">
                    <GaugeCard
                        id={`detail-${sensorKey}`}
                        title={`Saat Ini`}
                        value={currentValue}
                        unit={config.unit}
                        icon={config.icon}
                        min={config.min}
                        max={config.max}
                        safeMin={safeMin}
                        safeMax={safeMax}
                        subtitle={`Ideal: ${safeMin} – ${safeMax} ${config.unit}`}
                        delay={0}
                        decimals={config.decimals}
                    />
                </div>

                {/* Stats Cards */}
                <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-safe" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rata-rata</span>
                    </div>
                    <div>
                        <p className="text-2xl sm:text-3xl font-data-bold text-white truncate">{avg.toFixed(config.decimals)}</p>
                        <p className="text-xs text-slate-500 mt-1">{config.unit} • Semua data</p>
                    </div>
                </div>

                <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-ocean-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Min / Max</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-semibold uppercase text-slate-500 w-8">Min</span>
                            <p className="text-2xl sm:text-3xl font-data-bold text-white truncate">{min.toFixed(config.decimals)}</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-semibold uppercase text-slate-500 w-8">Max</span>
                            <p className="text-2xl sm:text-3xl font-data-bold text-white truncate">{max.toFixed(config.decimals)}</p>
                        </div>
                        <p className="text-xs text-slate-500 pt-1">{config.unit} • Rentang</p>
                    </div>
                </div>

                <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-3">
                        {trend >= 0 ? (
                            <TrendingUp size={16} className={config.trendInverted ? 'text-danger' : 'text-safe'} />
                        ) : (
                            <TrendingDown size={16} className={config.trendInverted ? 'text-safe' : 'text-danger'} />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tren</span>
                    </div>
                    <div>
                        <p className={`text-2xl sm:text-3xl font-data-bold truncate ${trend >= 0 ? (config.trendInverted ? 'text-danger' : 'text-safe') : (config.trendInverted ? 'text-safe' : 'text-danger')}`}>
                            {trend >= 0 ? '+' : ''}{trend.toFixed(config.decimals)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{config.unit} • 10 bacaan terakhir</p>
                    </div>
                </div>
            </div>

            {/* Full-width Chart */}
            <div className="glass-panel rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp size={18} style={{ color: config.color }} />
                            Grafik {config.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {timeRange === 'all' ? 'Semua data' : `${timeRange} terakhir`} • {filteredData.length} titik data
                        </p>
                    </div>
                </div>
                {/* Safe range legend */}
                <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full bg-green-500/30 border border-green-500/40" />
                        <span>Aman ({safeMin}–{safeMax} {config.unit})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full bg-amber-500/30 border border-amber-500/40" />
                        <span>Waspada</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full bg-red-500/30 border border-red-500/40" />
                        <span>Bahaya</span>
                    </div>
                </div>

                <div className="h-[320px]">
                    {filteredData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                            Tidak ada data untuk rentang ini
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id={`grad-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={config.color} stopOpacity={0.2} />
                                        <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                                {/* Safe range band */}
                                <ReferenceArea
                                    y1={safeMin}
                                    y2={safeMax}
                                    fill="#22c55e"
                                    fillOpacity={0.06}
                                    stroke="#22c55e"
                                    strokeOpacity={0.15}
                                    strokeDasharray="3 3"
                                />
                                {/* Caution band (1.5x safe range) */}
                                {safeMin > config.min && (
                                    <ReferenceArea
                                        y1={Math.max(config.min, safeMin - (safeMax - safeMin) * 0.5)}
                                        y2={safeMin}
                                        fill="#f59e0b"
                                        fillOpacity={0.04}
                                        stroke="#f59e0b"
                                        strokeOpacity={0.1}
                                        strokeDasharray="3 3"
                                    />
                                )}
                                {safeMax < config.max && (
                                    <ReferenceArea
                                        y1={safeMax}
                                        y2={Math.min(config.max, safeMax + (safeMax - safeMin) * 0.5)}
                                        fill="#f59e0b"
                                        fillOpacity={0.04}
                                        stroke="#f59e0b"
                                        strokeOpacity={0.1}
                                        strokeDasharray="3 3"
                                    />
                                )}
                                {/* Safe range boundary lines */}
                                <ReferenceLine y={safeMin} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="6 3" />
                                <ReferenceLine y={safeMax} stroke="#22c55e" strokeOpacity={0.3} strokeDasharray="6 3" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'rgba(148,163,184,0.08)' }}
                                    interval={Math.max(0, Math.ceil(filteredData.length / 8) - 1)}
                                />
                                <YAxis
                                    domain={chartDomain}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={40}
                                    tickFormatter={(v: number) => config.decimals === 0 ? String(Math.round(v)) : v.toFixed(1)}
                                />
                                <Tooltip content={<CustomTooltip unit={config.unit} />} />
                                <Line
                                    type="monotone"
                                    dataKey={config.dataKey}
                                    name={config.title}
                                    stroke={config.color}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 6, fill: config.color, stroke: '#080d19', strokeWidth: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Recent Alerts */}
            {dangerCount > 0 && (
                <div className="glass-panel rounded-2xl p-5">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-danger" />
                        Peringatan Terakhir
                    </h2>
                    <div className="space-y-2">
                        {readings.filter((r) => r.status === 'BAHAYA').slice(0, 5).map((r) => (
                            <div key={r.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-danger/5 border border-danger/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                                    <span className="text-sm text-slate-300">
                                        {config.title}: <span className="font-data-bold text-white">{(r[config.readingKey] as number).toFixed(config.decimals)}</span> {config.unit}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500 font-data">
                                    {new Date(r.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
