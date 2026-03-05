import type { ReactNode } from 'react';
import type { WaterStatus } from '../types';

interface MetricCardProps {
    id: string;
    title: string;
    value: string | number;
    unit: string;
    icon: ReactNode;
    /** If provided, applies conditional WQI styling */
    status?: WaterStatus;
    /** Optional subtitle or extra info */
    subtitle?: string;
    /** Delay for staggered animation (ms) */
    delay?: number;
}

function getStatusStyles(status: WaterStatus) {
    switch (status) {
        case 'SANGAT LAYAK':
            return {
                border: 'border-safe/30',
                bg: 'from-safe/10 to-safe/5',
                glow: 'shadow-safe/10',
                text: 'text-safe',
                badge: 'bg-safe/15 text-safe border-safe/20',
                ring: 'ring-safe/20',
            };
        case 'LAYAK':
            return {
                border: 'border-warning/30',
                bg: 'from-warning/10 to-warning/5',
                glow: 'shadow-warning/10',
                text: 'text-warning',
                badge: 'bg-warning/15 text-warning border-warning/20',
                ring: 'ring-warning/20',
            };
        case 'BAHAYA':
            return {
                border: 'border-danger/30',
                bg: 'from-danger/10 to-danger/5',
                glow: 'shadow-danger/10',
                text: 'text-danger',
                badge: 'bg-danger/15 text-danger border-danger/20',
                ring: 'ring-danger/20',
            };
    }
}

export default function MetricCard({ id, title, value, unit, icon, status, subtitle, delay = 0 }: MetricCardProps) {
    const isWqi = !!status;
    const styles = status ? getStatusStyles(status) : null;

    return (
        <div
            id={id}
            className={`
        relative overflow-hidden rounded-2xl p-5
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        animate-fade-in
        ${isWqi
                    ? `glass-panel border ${styles!.border} shadow-lg ${styles!.glow} ring-1 ${styles!.ring}`
                    : 'glass-panel glass-panel-hover'
                }
      `}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Decorative gradient blob */}
            <div
                className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30
          ${isWqi
                        ? `bg-gradient-to-br ${styles!.bg}`
                        : 'bg-gradient-to-br from-water-500/20 to-ocean-500/10'
                    }`
                }
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {title}
                </span>
                <div className={`p-2 rounded-xl ${isWqi ? styles!.badge : 'bg-water-500/10 text-water-400'} border transition-colors`}>
                    {icon}
                </div>
            </div>

            {/* Value */}
            <div className="relative z-10">
                <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-extrabold tracking-tight ${isWqi ? styles!.text : 'text-white'}`}>
                        {value}
                    </span>
                    <span className="text-sm font-medium text-slate-400">{unit}</span>
                </div>

                {/* Status Badge or Subtitle */}
                {isWqi && status ? (
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${styles!.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status === 'SANGAT LAYAK' ? 'bg-safe' :
                                    status === 'LAYAK' ? 'bg-warning' : 'bg-danger animate-pulse'
                                }`} />
                            {status}
                        </span>
                    </div>
                ) : subtitle ? (
                    <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
                ) : null}
            </div>

            {/* Bottom shimmer line */}
            {isWqi && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] animate-shimmer"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${status === 'SANGAT LAYAK' ? 'rgba(16,185,129,0.4)' :
                                status === 'LAYAK' ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'
                            }, transparent)`,
                        backgroundSize: '200% 100%',
                    }}
                />
            )}
        </div>
    );
}
