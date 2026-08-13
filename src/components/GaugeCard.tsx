import { useEffect, useState, type ReactNode } from 'react';
import type { WaterStatus } from '../types';

// ===================================================================
// GaugeCard — Circular (semicircle) gauge for sensor values.
// Pure SVG arc using pathLength=100 normalization, no extra library.
// ===================================================================

interface GaugeCardProps {
    id: string;
    title: string;
    value: number;
    unit: string;
    icon: ReactNode;
    /** Gauge scale bounds */
    min: number;
    max: number;
    /** Safe range — colors the arc green/amber/red */
    safeMin?: number;
    safeMax?: number;
    /** If provided (e.g. WQI), colors come from status instead */
    status?: WaterStatus;
    subtitle?: string;
    delay?: number;
    decimals?: number;
}

const STATUS_COLORS: Record<WaterStatus, string> = {
    'SANGAT LAYAK': '#10b981',
    LAYAK: '#f59e0b',
    BAHAYA: '#ef4444',
};

function getGaugeColor(value: number, safeMin?: number, safeMax?: number): string {
    if (safeMin === undefined || safeMax === undefined) return '#22d3ee';
    if (value >= safeMin && value <= safeMax) return '#10b981';
    const margin = Math.max((safeMax - safeMin) * 0.5, 1);
    if (value < safeMin - margin || value > safeMax + margin) return '#ef4444';
    return '#f59e0b';
}

export default function GaugeCard({
    id,
    title,
    value,
    unit,
    icon,
    min,
    max,
    safeMin,
    safeMax,
    status,
    subtitle,
    delay = 0,
    decimals = 1,
}: GaugeCardProps) {
    const pct = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const [progress, setProgress] = useState(0);
    const color = status ? STATUS_COLORS[status] : getGaugeColor(value, safeMin, safeMax);

    // Dynamic font size based on value length; long values are also
    // compressed to a fixed width so the text never collides with the arc
    const valueStr = value.toFixed(decimals);
    const valueFontSize = valueStr.length > 6 ? 20 : valueStr.length > 4 ? 24 : 28;


    useEffect(() => {
        const t = setTimeout(() => setProgress(pct), 150 + delay);
        return () => clearTimeout(t);
    }, [pct, delay]);

    const arc = (progress / 2).toFixed(2);

    const badgeClass =
        status === 'SANGAT LAYAK'
            ? 'bg-safe/15 text-safe border-safe/20'
            : status === 'LAYAK'
                ? 'bg-warning/15 text-warning border-warning/20'
                : 'bg-danger/15 text-danger border-danger/20';

    const ariaLabel = status
        ? `${title}: ${value.toFixed(decimals)} ${unit}, status ${status}`
        : `${title}: ${value.toFixed(decimals)} ${unit}`;

    return (
        <div
            id={id}
            role="figure"
            aria-label={ariaLabel}
            className="glass-panel glass-panel-hover relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 animate-fade-in flex flex-col items-center"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-1 gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-normal text-slate-400 truncate flex-1 min-w-0">{title}</span>
                <div className="p-1.5 rounded-lg bg-water-500/10 text-water-400 border border-water-500/10 flex-shrink-0" aria-hidden="true">{icon}</div>
            </div>

            {/* Gauge */}
            <svg viewBox="0 0 120 80" className="w-full max-w-[140px]" aria-hidden="true">
                <circle
                    cx="60"
                    cy="48"
                    r="40"
                    pathLength={100}
                    fill="none"
                    stroke="rgba(148,163,184,0.12)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="50 100"
                />
                <circle
                    cx="60"
                    cy="48"
                    r="40"
                    pathLength={100}
                    fill="none"
                    stroke={color}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${arc} 100`}
                    transform="rotate(180 60 48)"
                    style={{ transition: 'stroke-dasharray 1s ease-out, stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${color}55)` }}
                />
            </svg>
            {/* Value + unit below arc */}
            <div className="flex flex-col items-center -mt-1">
                <span
                    className="font-extrabold text-slate-50 leading-none"
                    style={{ fontSize: `${valueFontSize}px`, fontVariantNumeric: 'tabular-nums' }}
                >
                    {valueStr}
                </span>
                <span className="text-[11px] font-medium text-slate-500">{unit}</span>
            </div>

            {/* Status badge / subtitle */}
            {status ? (
                <span className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${badgeClass}`} role="status">
                    <span className={`w-1.5 h-1.5 rounded-full ${status === 'SANGAT LAYAK' ? 'bg-safe' : status === 'LAYAK' ? 'bg-warning' : 'bg-danger animate-pulse'}`} aria-hidden="true" />
                    {status}
                </span>
            ) : subtitle ? (
                <p className="mt-1 text-[11px] text-slate-500 text-center">{subtitle}</p>
            ) : null}
        </div>
    );
}
