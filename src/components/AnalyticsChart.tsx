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
import { TrendingUp } from 'lucide-react';
import type { ChartDataPoint } from '../types';

interface AnalyticsChartProps {
    data: ChartDataPoint[];
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;

    return (
        <div className="glass-panel rounded-xl p-3 shadow-xl border border-white/10 min-w-[160px]">
            <p className="text-xs font-semibold text-slate-300 mb-2 border-b border-white/5 pb-1.5">
                🕐 {label}
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

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
    return (
        <div id="analytics-chart" className="glass-panel rounded-2xl p-5 animate-fade-in" style={{ animationDelay: '300ms' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-water-400" />
                        Tren Kualitas Air
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">pH & TDS — 8 jam terakhir</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-water-400" />
                        <span className="text-[11px] text-slate-400 font-medium">pH</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-ocean-400" />
                        <span className="text-[11px] text-slate-400 font-medium">TDS</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="tdsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148,163,184,0.08)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                        />
                        <YAxis
                            yAxisId="pH"
                            domain={[4, 10]}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'pH', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                        />
                        <YAxis
                            yAxisId="tds"
                            orientation="right"
                            domain={[0, 400]}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'ppm', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#64748b' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 11, paddingTop: '8px' }}
                            iconType="circle"
                            iconSize={8}
                        />
                        <Line
                            yAxisId="pH"
                            type="monotone"
                            dataKey="pH"
                            name="pH Level"
                            stroke="#22d3ee"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#0c1222', stroke: '#22d3ee', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#22d3ee', stroke: '#0c1222', strokeWidth: 2 }}
                        />
                        <Line
                            yAxisId="tds"
                            type="monotone"
                            dataKey="tds"
                            name="TDS (ppm)"
                            stroke="#60a5fa"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#0c1222', stroke: '#60a5fa', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#60a5fa', stroke: '#0c1222', strokeWidth: 2 }}
                            strokeDasharray="6 3"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
