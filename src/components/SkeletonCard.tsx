interface SkeletonCardProps {
    delay?: number;
    height?: string;
    rows?: number;
}

export default function SkeletonCard({ delay = 0, height, rows }: SkeletonCardProps) {
    if (rows) {
        return (
            <div
                className="glass-panel rounded-2xl p-5 animate-fade-in"
                style={{ animationDelay: `${delay}ms` }}
            >
                <div className="space-y-3">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-3 bg-white/5 rounded-lg flex-1 animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                            <div className="h-3 bg-white/5 rounded-lg w-16 animate-shimmer" style={{ animationDelay: `${i * 100 + 50}ms` }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`glass-panel rounded-2xl p-5 animate-fade-in ${height || ''}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="h-3 bg-white/5 rounded-lg w-24 animate-shimmer" />
                <div className="h-8 w-8 rounded-xl bg-white/5 animate-shimmer" />
            </div>
            {/* Value */}
            <div className="flex items-baseline gap-2">
                <div className="h-8 bg-white/5 rounded-lg w-16 animate-shimmer" />
                <div className="h-4 bg-white/5 rounded-lg w-8 animate-shimmer" />
            </div>
            {/* Subtitle */}
            <div className="mt-2 h-2 bg-white/5 rounded-lg w-32 animate-shimmer" />
        </div>
    );
}
