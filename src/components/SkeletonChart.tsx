export default function SkeletonChart() {
    return (
        <div className="glass-panel rounded-2xl p-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded-lg w-40 animate-shimmer" />
                    <div className="h-2 bg-white/5 rounded-lg w-56 animate-shimmer" />
                </div>
                <div className="flex gap-2">
                    <div className="h-6 bg-white/5 rounded-lg w-12 animate-shimmer" />
                    <div className="h-6 bg-white/5 rounded-lg w-12 animate-shimmer" />
                </div>
            </div>
            {/* Chart area */}
            <div className="h-72 flex items-end gap-2 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-white/5 rounded-t-lg animate-shimmer"
                        style={{
                            height: `${30 + Math.random() * 60}%`,
                            animationDelay: `${i * 150}ms`,
                        }}
                    />
                ))}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-2 bg-white/5 rounded w-6 animate-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
            </div>
        </div>
    );
}
