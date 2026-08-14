import { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import DataTable from '../components/DataTable';
import NotificationPanel from '../components/NotificationPanel';
import AlertSettings from '../components/AlertSettings';
import SkeletonCard from '../components/SkeletonCard';
import SkeletonChart from '../components/SkeletonChart';
import { useAuth } from '../contexts/AuthContext';
import { useSensorContext } from '../contexts/SensorDataContext';
import { useTestLocations } from '../hooks/useTestLocations';
import { loadAlertConfig } from '../lib/alertConfig';
import type { NavSection } from '../types';

// Lazy load heavy components — only downloaded when their tab is active
const SensorDetail = lazy(() => import('../components/SensorDetail'));
const LocationMap = lazy(() => import('../components/LocationMap'));
const DeviceManager = lazy(() => import('../components/DeviceManager'));
const LocationSettings = lazy(() => import('../components/LocationSettings'));

const VALID_TABS: NavSection[] = ['overview', 'ph', 'suhu', 'tds', 'turbidity', 'history', 'devices', 'settings'];

const StatusIndicator = memo(function StatusIndicator({ secondsAgo }: { secondsAgo: number | null }) {
    const isOnline = secondsAgo !== null && secondsAgo < 120;
    const label =
        secondsAgo === null
            ? 'Menunggu data…'
            : secondsAgo < 60
                ? `Online • ${secondsAgo} dtk lalu`
                : secondsAgo < 120
                    ? 'Online • 1 mnt lalu'
                    : `Offline • ${Math.floor(secondsAgo / 60)} mnt lalu`;

    return (
        <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 border-2 border-black hard-shadow-sm ${
                secondsAgo === null
                    ? 'bg-panel-light'
                    : isOnline
                        ? 'bg-safe'
                        : 'bg-warning'
            }`}
            title="Update terakhir dari sensor"
        >
            {secondsAgo === null ? (
                <Wifi size={12} className="text-slate-400" />
            ) : (
                <span className={`status-dot status-dot-pulse ${isOnline ? 'bg-black' : 'bg-black'}`} />
            )}
            <span className={`text-xs font-bold ${secondsAgo === null ? 'text-slate-400' : 'text-black'}`}>
                {label}
            </span>
        </div>
    );
});

function getTabFromSearch(params: URLSearchParams): NavSection {
    const tab = params.get('tab');
    if (tab && VALID_TABS.includes(tab as NavSection)) {
        return tab as NavSection;
    }
    return 'overview';
}

export default function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeNav = getTabFromSearch(searchParams);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user, signOut } = useAuth();
    const { latestReading, readings, loading, error, refresh } = useSensorContext();
    const { locations: testLocations, addLocation, removeLocation, syncFromSensor } = useTestLocations();
    const [alertCfg, setAlertCfg] = useState(loadAlertConfig);

    const dangerCount = useMemo(() => readings.filter((r) => r.status === 'BAHAYA').length, [readings]);
    const isLoading = loading && readings.length === 0;

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 5000);
        return () => clearInterval(t);
    }, []);

    const lastTs = latestReading?.timestamp ? new Date(latestReading.timestamp).getTime() : null;
    const secondsAgo = lastTs ? Math.max(0, Math.floor((now - lastTs) / 1000)) : null;

    const handleNavigate = (tab: NavSection) => {
        setSearchParams({ tab });
    };

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
            <Sidebar active={activeNav} onNavigate={handleNavigate} />

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {/* ===== Top Bar ===== */}
                <header id="top-bar" className="sticky top-0 z-30 bg-surface border-b-2 border-black">
                    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
                        <div className="pl-10 sm:pl-12 lg:pl-0">
                            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                {PAGE_TITLES[activeNav]}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5 font-bold tracking-wide uppercase">
                                {activeNav === 'overview' ? 'Monitoring kualitas air real-time • ESP32 IoT' : 'WaterSafe Monitor'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Search */}
                            <div className="hidden lg:flex items-center gap-2 px-3 py-2 border-2 border-black bg-panel text-slate-500 focus-within:border-water-500 transition-all w-52 hard-shadow-sm">
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
                                className="p-2 sm:p-2.5 border-2 border-black bg-panel text-slate-400 hover:bg-water-500 hover:text-black transition-all hard-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                title="Refresh data"
                                aria-label="Refresh sensor data"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            </button>

                            {/* Status indicator */}
                            <StatusIndicator secondsAgo={secondsAgo} />

                            {/* Notifications */}
                            <button
                                id="notification-button"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 sm:p-2.5 border-2 border-black bg-panel text-slate-400 hover:bg-water-500 hover:text-black transition-all hard-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                aria-label={`Notifications${dangerCount > 0 ? ` (${dangerCount} alerts)` : ''}`}
                                aria-expanded={showNotifications}
                            >
                                <Bell size={16} />
                                {dangerCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger border-2 border-black animate-pulse" aria-hidden="true" />
                                )}
                            </button>

                            {/* Sign Out */}
                            <button
                                id="sign-out-button"
                                onClick={signOut}
                                className="hidden sm:flex p-2.5 border-2 border-black bg-panel text-slate-400 hover:bg-danger hover:text-white transition-all hard-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                                title="Keluar"
                                aria-label="Sign out"
                            >
                                <LogOut size={16} />
                            </button>

                            {/* Avatar */}
                            <div
                                id="user-avatar"
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-water-500 border-2 border-black flex items-center justify-center text-black text-[10px] sm:text-xs font-bold hard-shadow-sm cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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
                        <div className="flex items-center gap-2 px-4 py-3 border-2 border-black bg-danger text-black text-xs font-bold mb-6 hard-shadow-sm" role="alert">
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
                                        max={2000}
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
                                        max={200}
                                        safeMin={0}
                                        safeMax={alertCfg.turbidityMax}
                                        subtitle={`Max aman: ${alertCfg.turbidityMax} NTU`}
                                        delay={320}
                                        decimals={1}
                                    />
                                </div>
                            </section>

                            {/* Map */}
                            <section aria-label="Sensor locations">
                                <Suspense fallback={<SkeletonCard height="h-72" />}>
                                    <LocationMap
                                        locations={testLocations}
                                        onAddLocation={addLocation}
                                        onRemoveLocation={removeLocation}
                                        onSyncLocation={syncFromSensor}
                                    />
                                </Suspense>
                            </section>

                            {/* Data Table */}
                            <DataTable readings={readings} />
                        </div>
                    )}

                    {/* ===== SENSOR DETAIL PAGES ===== */}
                    {!isLoading && (activeNav === 'ph' || activeNav === 'suhu' || activeNav === 'tds' || activeNav === 'turbidity') && (
                        <Suspense fallback={<SkeletonCard height="h-96" />}>
                            <SensorDetail sensorKey={activeNav} />
                        </Suspense>
                    )}

                    {/* ===== HISTORY ===== */}
                    {!isLoading && activeNav === 'history' && (
                        <div className="animate-fade-in">
                            <DataTable readings={readings} showFilters />
                        </div>
                    )}

                    {/* ===== DEVICES ===== */}
                    {!isLoading && activeNav === 'devices' && (
                        <Suspense fallback={<SkeletonCard rows={5} />}>
                            <DeviceManager />
                        </Suspense>
                    )}

                    {/* ===== SETTINGS ===== */}
                    {!isLoading && activeNav === 'settings' && (
                        <div className="animate-fade-in space-y-6">
                            <AlertSettings config={alertCfg} onChange={setAlertCfg} />
                            <Suspense fallback={<SkeletonCard height="h-48" />}>
                                <LocationSettings onSaved={refresh} />
                            </Suspense>

                            <section className="nb-panel p-5 sm:p-6" aria-label="System information">
                                <h2 className="text-base font-bold text-white mb-4">Informasi Sistem</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="px-4 py-3 border-2 border-black bg-panel-light hard-shadow-sm">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Pembacaan</p>
                                        <p className="text-xl font-bold text-white mt-1 tabular-nums">{readings.length}</p>
                                    </div>
                                    <div className="px-4 py-3 border-2 border-black bg-panel-light hard-shadow-sm">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Status BAHAYA</p>
                                        <p className="text-xl font-bold text-danger mt-1 tabular-nums">{dangerCount}</p>
                                    </div>
                                    <div className="px-4 py-3 border-2 border-black bg-panel-light hard-shadow-sm">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Status LAYAK</p>
                                        <p className="text-xl font-bold text-warning mt-1 tabular-nums">{readings.filter((r) => r.status === 'LAYAK').length}</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="px-4 py-4 sm:px-6 lg:px-8 border-t-2 border-black">
                    <p className="text-xs text-slate-500 text-center font-bold">
                        WaterSafe-Monitor v1.0 — IoT Water Quality Dashboard • Powered by ESP32
                    </p>
                </footer>
            </main>
        </div>
    );
}
