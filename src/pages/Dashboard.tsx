import { useState, useEffect } from 'react';
import {
    Thermometer,
    Droplets,
    FlaskConical,
    Activity,
    Bell,
    Search,
    Wifi,
    LogOut,
    AlertTriangle,
    RefreshCw,
    Eye,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import GaugeCard from '../components/GaugeCard';
import SensorDetail from '../components/SensorDetail';
import LocationMap from '../components/LocationMap';
import DataTable from '../components/DataTable';
import DeviceManager from '../components/DeviceManager';
import NotificationPanel from '../components/NotificationPanel';
import LocationSettings from '../components/LocationSettings';
import AlertSettings from '../components/AlertSettings';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonChart from '../components/SkeletonChart';
import { useAuth } from '../contexts/AuthContext';
import { useSensorContext } from '../contexts/SensorDataContext';
import { loadAlertConfig } from '../lib/alertConfig';
import type { NavSection } from '../types';

export default function Dashboard() {
    const [activeNav, setActiveNav] = useState<NavSection>('overview');
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, signOut } = useAuth();
    const { latestReading, readings, loading, error, refresh } = useSensorContext();
    const [alertCfg, setAlertCfg] = useState(loadAlertConfig);

    const dangerCount = readings.filter((r) => r.status === 'BAHAYA').length;
    const isLoading = loading && readings.length === 0;

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 5000);
        return () => clearInterval(t);
    }, []);

    const lastTs = latestReading?.timestamp ? new Date(latestReading.timestamp).getTime() : null;
    const secondsAgo = lastTs ? Math.max(0, Math.floor((now - lastTs) / 1000)) : null;
    const isOnline = secondsAgo !== null && secondsAgo < 120;
    const onlineLabel =
        secondsAgo === null
            ? 'Menunggu data…'
            : secondsAgo < 60
                ? `Online • ${secondsAgo} dtk lalu`
                : secondsAgo < 120
                    ? 'Online • 1 mnt lalu'
                    : `Offline • ${Math.floor(secondsAgo / 60)} mnt lalu`;

    // Page title mapping
    const PAGE_TITLES: Record<NavSection, string> = {
        overview: 'Overview',
        ph: 'pH Level',
        suhu: 'Suhu Air',
        tds: 'TDS',
        turbidity: 'Turbidity',
        history: 'Riwayat',
        devices: 'Perangkat',
        settings: 'Pengaturan',
    };

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar active={activeNav} onNavigate={setActiveNav} />

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {/* ===== Top Bar ===== */}
                <header id="top-bar" className="sticky top-0 z-30 backdrop-blur-2xl bg-surface/70 border-b border-white/[0.04]">
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                        <div className="pl-10 sm:pl-12 lg:pl-0">
                            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                {PAGE_TITLES[activeNav]}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {activeNav === 'overview' ? 'Monitoring kualitas air real-time • ESP32 IoT' : 'WaterSafe Monitor'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Search */}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-slate-500 hover:border-water-500/20 focus-within:border-water-500/30 focus-within:ring-1 focus-within:ring-water-500/15 transition-all w-52">
                                <Search size={14} />
                                <input
                                    id="search-input"
                                    type="text"
                                    placeholder="Cari sensor..."
                                    className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full"
                                    aria-label="Search sensors"
                                />
                            </div>

                            {/* Refresh */}
                            <button
                                onClick={refresh}
                                className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-water-500/20 text-slate-400 hover:text-white transition-all"
                                title="Refresh data"
                                aria-label="Refresh sensor data"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>

                            {/* Status indicator */}
                            <div
                                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                                    secondsAgo === null
                                        ? 'bg-white/[0.03] border-white/[0.05]'
                                        : isOnline
                                            ? 'bg-safe/10 border-safe/15'
                                            : 'bg-warning/10 border-warning/15'
                                }`}
                                title="Update terakhir dari sensor"
                            >
                                {secondsAgo === null ? (
                                    <Wifi size={12} className="text-slate-500" />
                                ) : (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-safe animate-pulse' : 'bg-warning'}`} />
                                )}
                                <span className={`text-xs font-semibold ${secondsAgo === null ? 'text-slate-500' : isOnline ? 'text-safe' : 'text-warning'}`}>
                                    {onlineLabel}
                                </span>
                            </div>

                            {/* Notifications */}
                            <button
                                id="notification-button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-water-500/20 text-slate-400 hover:text-white transition-all"
                                aria-label={`Notifications${dangerCount > 0 ? ` (${dangerCount} alerts)` : ''}`}
                                aria-expanded={showNotifications}
                            >
                                <Bell size={16} />
                                {dangerCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full animate-pulse" aria-hidden="true" />
                                )}
                            </button>

                            {/* Sign Out */}
                            <button
                                id="sign-out-button"
                                onClick={signOut}
                                className="hidden sm:flex p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-danger/20 text-slate-400 hover:text-danger transition-all"
                                title="Keluar"
                                aria-label="Sign out"
                            >
                                <LogOut size={16} />
                            </button>

                            {/* Avatar */}
                            <div
                                id="user-avatar"
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-water-500 to-ocean-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ring-2 ring-water-500/15 cursor-pointer hover:ring-water-500/30 transition-all"
                                title={user?.email ?? 'Demo User'}
                                role="img"
                                aria-label={`User: ${user?.email ?? 'Demo User'}`}
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
                <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
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
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium mb-6" role="alert">
                            <AlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    {/* ===== OVERVIEW ===== */}
                    {!isLoading && activeNav === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            <section aria-label="Sensor readings">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    <GaugeCard
                                        id="card-wqi"
                                        title="Water Quality Index"
                                        value={latestReading.wqiScore}
                                        unit="/100"
                                        icon={<Activity size={18} />}
                                        min={0}
                                        max={100}
                                        status={latestReading.status}
                                        delay={0}
                                        decimals={0}
                                    />
                                    <GaugeCard
                                        id="card-temperature"
                                        title="Suhu Air"
                                        value={latestReading.temperature}
                                        unit="°C"
                                        icon={<Thermometer size={18} />}
                                        min={0}
                                        max={50}
                                        safeMin={alertCfg.tempMin}
                                        safeMax={alertCfg.tempMax}
                                        subtitle={`Normal: ${alertCfg.tempMin}–${alertCfg.tempMax}°C`}
                                        delay={80}
                                    />
                                    <GaugeCard
                                        id="card-ph"
                                        title="pH Level"
                                        value={latestReading.pH}
                                        unit="pH"
                                        icon={<FlaskConical size={18} />}
                                        min={0}
                                        max={14}
                                        safeMin={alertCfg.phMin}
                                        safeMax={alertCfg.phMax}
                                        subtitle={`Ideal: ${alertCfg.phMin} – ${alertCfg.phMax}`}
                                        delay={160}
                                    />
                                    <GaugeCard
                                        id="card-tds"
                                        title="TDS"
                                        value={latestReading.tds}
                                        unit="ppm"
                                        icon={<Droplets size={18} />}
                                        min={0}
                                        max={1000}
                                        safeMin={0}
                                        safeMax={alertCfg.tdsMax}
                                        subtitle={`Max aman: ${alertCfg.tdsMax} ppm`}
                                        delay={240}
                                        decimals={0}
                                    />
                                    <GaugeCard
                                        id="card-turbidity"
                                        title="Turbidity"
                                        value={latestReading.turbidity}
                                        unit="NTU"
                                        icon={<Eye size={18} />}
                                        min={0}
                                        max={100}
                                        safeMin={0}
                                        safeMax={alertCfg.turbidityMax}
                                        subtitle={`Max aman: ${alertCfg.turbidityMax} NTU`}
                                        delay={320}
                                        decimals={0}
                                    />
                                </div>
                            </section>

                            {/* Map */}
                            <section aria-label="Sensor location">
                                <LocationMap reading={latestReading} />
                            </section>

                            {/* Data Table */}
                            <DataTable readings={readings} />
                        </div>
                    )}

                    {/* ===== SENSOR DETAIL PAGES ===== */}
                    {!isLoading && (activeNav === 'ph' || activeNav === 'suhu' || activeNav === 'tds' || activeNav === 'turbidity') && (
                        <SensorDetail sensorKey={activeNav} />
                    )}

                    {/* ===== HISTORY ===== */}
                    {!isLoading && activeNav === 'history' && (
                        <div className="animate-fade-in">
                            <DataTable readings={readings} showFilters />
                        </div>
                    )}

                    {/* ===== DEVICES ===== */}
                    {!isLoading && activeNav === 'devices' && (
                        <DeviceManager />
                    )}

                    {/* ===== SETTINGS ===== */}
                    {!isLoading && activeNav === 'settings' && (
                        <div className="animate-fade-in space-y-6">
                            <AlertSettings config={alertCfg} onChange={setAlertCfg} />
                            <LocationSettings onSaved={refresh} />

                            <section className="glass-panel rounded-2xl p-5 sm:p-6" aria-label="System information">
                                <h2 className="text-base font-bold text-white mb-4">Informasi Sistem</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/[0.05]">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Pembacaan</p>
                                        <p className="text-xl font-bold text-white mt-1 tabular-nums">{readings.length}</p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/[0.05]">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status BAHAYA</p>
                                        <p className="text-xl font-bold text-danger mt-1 tabular-nums">{dangerCount}</p>
                                    </div>
                                    <div className="px-4 py-3 rounded-xl bg-panel-light border border-white/[0.05]">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status LAYAK</p>
                                        <p className="text-xl font-bold text-warning mt-1 tabular-nums">{readings.filter((r) => r.status === 'LAYAK').length}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="px-4 py-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
                    <p className="text-xs text-slate-500 text-center">
                        WaterSafe-Monitor v1.0 — IoT Water Quality Dashboard • Powered by ESP32
                    </p>
                </footer>
            </main>

            {/* Background decorative elements */}
            <div className="fixed top-0 right-0 w-[700px] h-[700px] pointer-events-none opacity-20 blur-3xl" aria-hidden="true">
                <div className="absolute top-[-250px] right-[-250px] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-water-500/15 to-ocean-600/5" />
            </div>
        </div>
    );
}
