import { useState } from 'react';
import {
    Thermometer,
    Droplets,
    FlaskConical,
    Waves,
    Activity,
    Bell,
    Search,
    Wifi,
    LogOut,
    Settings,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import AnalyticsChart from '../components/AnalyticsChart';
import LocationMap from '../components/LocationMap';
import DataTable from '../components/DataTable';
import DeviceManager from '../components/DeviceManager';
import NotificationPanel from '../components/NotificationPanel';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonChart from '../components/SkeletonChart';
import { useAuth } from '../contexts/AuthContext';
import { useSensorContext } from '../contexts/SensorDataContext';
import type { NavSection } from '../types';

export default function Dashboard() {
    const [activeNav, setActiveNav] = useState<NavSection>('overview');
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, signOut } = useAuth();
    const { latestReading, readings, chartData, loading, error, refresh } = useSensorContext();

    const dangerCount = readings.filter((r) => r.status === 'BAHAYA').length;
    const isLoading = loading && readings.length === 0;

    return (
        <div className="flex min-h-screen bg-surface">
            {/* Sidebar */}
            <Sidebar active={activeNav} onNavigate={setActiveNav} />

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {/* ===== Top Bar ===== */}
                <header id="top-bar" className="sticky top-0 z-30 backdrop-blur-xl bg-surface/80 border-b border-white/5">
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                        <div className="pl-10 sm:pl-12 lg:pl-0">
                            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                Dashboard{' '}
                                <span className="bg-gradient-to-r from-water-400 to-ocean-400 bg-clip-text text-transparent">
                                    WaterSafe
                                </span>
                            </h1>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                Monitoring kualitas air real-time • ESP32 IoT
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Search (desktop) */}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:border-water-500/30 transition-colors w-52">
                                <Search size={14} />
                                <input
                                    id="search-input"
                                    type="text"
                                    placeholder="Cari sensor..."
                                    className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-full"
                                />
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={refresh}
                                className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-water-500/30 text-slate-400 hover:text-white transition-all"
                                title="Refresh data"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>

                            {/* Status indicator */}
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-safe/10 border border-safe/20">
                                <Wifi size={12} className="text-safe" />
                                <span className="text-[11px] font-semibold text-safe">Online</span>
                            </div>

                            {/* Notifications */}
                            <button
                                id="notification-button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-water-500/30 text-slate-400 hover:text-white transition-all"
                            >
                                <Bell size={16} />
                                {dangerCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full animate-pulse" />
                                )}
                            </button>

                            {/* Sign Out */}
                            <button
                                id="sign-out-button"
                                onClick={signOut}
                                className="hidden sm:flex p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-danger/30 text-slate-400 hover:text-danger transition-all"
                                title="Keluar"
                            >
                                <LogOut size={16} />
                            </button>

                            {/* Avatar */}
                            <div
                                id="user-avatar"
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-water-500 to-ocean-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-water-500/20 cursor-pointer hover:ring-water-500/40 transition-all"
                                title={user?.email ?? 'Demo User'}
                            >
                                {user?.email?.substring(0, 2).toUpperCase() ?? 'WS'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Notification Panel */}
                {showNotifications && (
                    <NotificationPanel
                        readings={readings}
                        onClose={() => setShowNotifications(false)}
                    />
                )}

                {/* ===== Page Content ===== */}
                <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1440px] mx-auto">
                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonCard key={i} delay={i * 80} />
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <SkeletonChart />
                                </div>
                                <div>
                                    <SkeletonCard height="h-72" />
                                </div>
                            </div>
                            <SkeletonCard rows={8} />
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium mb-6">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    {!isLoading && activeNav === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Metric Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                <MetricCard
                                    id="card-wqi"
                                    title="Water Quality Index"
                                    value={latestReading.wqiScore}
                                    unit="/ 100"
                                    icon={<Activity size={18} />}
                                    status={latestReading.status}
                                    delay={0}
                                />
                                <MetricCard
                                    id="card-temperature"
                                    title="Suhu Air"
                                    value={latestReading.temperature}
                                    unit="°C"
                                    icon={<Thermometer size={18} />}
                                    subtitle="Normal range: 20–30°C"
                                    delay={80}
                                />
                                <MetricCard
                                    id="card-ph"
                                    title="pH Level"
                                    value={latestReading.pH}
                                    unit="pH"
                                    icon={<FlaskConical size={18} />}
                                    subtitle="Ideal: 6.5 – 8.5"
                                    delay={160}
                                />
                                <MetricCard
                                    id="card-tds"
                                    title="TDS"
                                    value={latestReading.tds}
                                    unit="ppm"
                                    icon={<Droplets size={18} />}
                                    subtitle="Max aman: 500 ppm"
                                    delay={240}
                                />
                                <MetricCard
                                    id="card-turbidity"
                                    title="Turbidity"
                                    value={latestReading.turbidity}
                                    unit="NTU"
                                    icon={<Waves size={18} />}
                                    subtitle="Max aman: 5 NTU"
                                    delay={320}
                                />
                            </div>

                            {/* Charts & Map Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <AnalyticsChart data={chartData} />
                                </div>
                                <div>
                                    <LocationMap reading={latestReading} />
                                </div>
                            </div>

                            {/* Data Table */}
                            <DataTable readings={readings} />
                        </div>
                    )}

                    {!isLoading && activeNav === 'analytics' && (
                        <div className="space-y-6 animate-fade-in">
                            <AnalyticsChart data={chartData} showAllLines />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    id="card-avg-ph"
                                    title="Rata-Rata pH"
                                    value={readings.length > 0 ? (readings.reduce((s, r) => s + r.pH, 0) / readings.length).toFixed(1) : '—'}
                                    unit="pH"
                                    icon={<FlaskConical size={18} />}
                                    subtitle="Seluruh data"
                                    delay={100}
                                />
                                <MetricCard
                                    id="card-avg-tds"
                                    title="Rata-Rata TDS"
                                    value={readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.tds, 0) / readings.length) : '—'}
                                    unit="ppm"
                                    icon={<Droplets size={18} />}
                                    subtitle="Seluruh data"
                                    delay={200}
                                />
                                <MetricCard
                                    id="card-avg-temp"
                                    title="Rata-Rata Suhu"
                                    value={readings.length > 0 ? (readings.reduce((s, r) => s + r.temperature, 0) / readings.length).toFixed(1) : '—'}
                                    unit="°C"
                                    icon={<Thermometer size={18} />}
                                    subtitle="Seluruh data"
                                    delay={300}
                                />
                                <MetricCard
                                    id="card-avg-turbidity"
                                    title="Rata-Rata Turbidity"
                                    value={readings.length > 0 ? (readings.reduce((s, r) => s + r.turbidity, 0) / readings.length).toFixed(1) : '—'}
                                    unit="NTU"
                                    icon={<Waves size={18} />}
                                    subtitle="Seluruh data"
                                    delay={400}
                                />
                            </div>
                        </div>
                    )}

                    {!isLoading && activeNav === 'history' && (
                        <div className="animate-fade-in">
                            <DataTable readings={readings} showFilters />
                        </div>
                    )}

                    {!isLoading && activeNav === 'devices' && (
                        <DeviceManager />
                    )}

                    {!isLoading && activeNav === 'settings' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="glass-panel rounded-2xl p-5 sm:p-6">
                                <h2 className="flex items-center gap-2 text-base font-bold text-white mb-4">
                                    <Settings size={18} className="text-water-400" />
                                    Pengaturan Sensor
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Interval Pembacaan', value: '5 detik', desc: 'Frekuensi pengambilan data sensor' },
                                        { label: 'Batas pH Aman', value: '6.5 – 8.5', desc: 'Range pH yang dianggap aman' },
                                        { label: 'Batas TDS Aman', value: '< 500 ppm', desc: 'Maksimum TDS yang diizinkan' },
                                        { label: 'Batas Turbidity Aman', value: '< 5 NTU', desc: 'Maksimum turbidity yang diizinkan' },
                                        { label: 'Batas Suhu Aman', value: '20 – 30°C', desc: 'Range suhu yang dianggap ideal' },
                                        { label: 'Notifikasi', value: 'Aktif', desc: 'Alert ketika status BAHAYA terdeteksi' },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 last:border-0 gap-2"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <span className="self-start sm:self-auto px-3 py-1 rounded-lg bg-water-500/10 text-water-400 text-xs font-semibold border border-water-500/20 whitespace-nowrap">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Info */}
                            <div className="glass-panel rounded-2xl p-5 sm:p-6">
                                <h2 className="text-base font-bold text-white mb-4">Informasi Sistem</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Pembacaan</p>
                                        <p className="text-xl font-bold text-white mt-1">{readings.length}</p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status BAHAYA</p>
                                        <p className="text-xl font-bold text-danger mt-1">{dangerCount}</p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status LAYAK</p>
                                        <p className="text-xl font-bold text-warning mt-1">{readings.filter((r) => r.status === 'LAYAK').length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="px-4 py-4 sm:px-6 lg:px-8 border-t border-white/5">
                    <p className="text-[11px] text-slate-600 text-center">
                        WaterSafe-Monitor v1.0 — IoT Water Quality Dashboard • Powered by ESP32
                    </p>
                </footer>
            </main>

            {/* Background decorative elements */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-30 blur-3xl">
                <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-water-500/10 to-ocean-500/5" />
            </div>
        </div>
    );
}
