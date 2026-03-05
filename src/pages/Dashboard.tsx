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
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import AnalyticsChart from '../components/AnalyticsChart';
import LocationMap from '../components/LocationMap';
import DataTable from '../components/DataTable';
import DeviceManager from '../components/DeviceManager';
import { mockReadings, latestReading, chartData } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import type { NavSection } from '../types';

export default function Dashboard() {
    const [activeNav, setActiveNav] = useState<NavSection>('overview');
    const { user, signOut } = useAuth();

    return (
        <div className="flex min-h-screen bg-surface">
            {/* Sidebar */}
            <Sidebar active={activeNav} onNavigate={setActiveNav} />

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {/* ===== Top Bar ===== */}
                <header id="top-bar" className="sticky top-0 z-30 backdrop-blur-xl bg-surface/80 border-b border-white/5">
                    <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                        <div className="pl-12 lg:pl-0">
                            <h1 className="text-lg font-bold text-white tracking-tight">
                                Dashboard{' '}
                                <span className="bg-gradient-to-r from-water-400 to-ocean-400 bg-clip-text text-transparent">
                                    WaterSafe
                                </span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Monitoring kualitas air real-time • ESP32 IoT
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search (desktop) */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:border-water-500/30 transition-colors w-52">
                                <Search size={14} />
                                <input
                                    id="search-input"
                                    type="text"
                                    placeholder="Cari sensor..."
                                    className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-full"
                                />
                            </div>

                            {/* Status indicator */}
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-safe/10 border border-safe/20">
                                <Wifi size={12} className="text-safe" />
                                <span className="text-[11px] font-semibold text-safe">Online</span>
                            </div>

                            {/* Notifications */}
                            <button
                                id="notification-button"
                                className="relative p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-water-500/30 text-slate-400 hover:text-white transition-all"
                            >
                                <Bell size={16} />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-danger rounded-full animate-pulse" />
                            </button>

                            {/* Sign Out */}
                            <button
                                id="sign-out-button"
                                onClick={signOut}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-danger/30 text-slate-400 hover:text-danger transition-all"
                                title="Keluar"
                            >
                                <LogOut size={16} />
                            </button>

                            {/* Avatar */}
                            <div
                                id="user-avatar"
                                className="w-9 h-9 rounded-xl bg-gradient-to-br from-water-500 to-ocean-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-water-500/20 cursor-pointer hover:ring-water-500/40 transition-all"
                                title={user?.email ?? 'Demo User'}
                            >
                                {user?.email?.substring(0, 2).toUpperCase() ?? 'WS'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* ===== Page Content ===== */}
                <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[1440px] mx-auto">
                    {activeNav === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Metric Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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
                            <DataTable readings={mockReadings} />
                        </div>
                    )}

                    {activeNav === 'analytics' && (
                        <div className="space-y-6 animate-fade-in">
                            <AnalyticsChart data={chartData} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MetricCard
                                    id="card-avg-ph"
                                    title="Rata-Rata pH"
                                    value={(mockReadings.reduce((s, r) => s + r.pH, 0) / mockReadings.length).toFixed(1)}
                                    unit="pH"
                                    icon={<FlaskConical size={18} />}
                                    subtitle="Seluruh data"
                                    delay={100}
                                />
                                <MetricCard
                                    id="card-avg-tds"
                                    title="Rata-Rata TDS"
                                    value={Math.round(mockReadings.reduce((s, r) => s + r.tds, 0) / mockReadings.length)}
                                    unit="ppm"
                                    icon={<Droplets size={18} />}
                                    subtitle="Seluruh data"
                                    delay={200}
                                />
                            </div>
                        </div>
                    )}

                    {activeNav === 'history' && (
                        <div className="animate-fade-in">
                            <DataTable readings={mockReadings} />
                        </div>
                    )}

                    {activeNav === 'devices' && (
                        <DeviceManager />
                    )}

                    {activeNav === 'settings' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="glass-panel rounded-2xl p-6">
                                <h2 className="text-base font-bold text-white mb-4">⚙️ Pengaturan Sensor</h2>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Interval Pembacaan', value: '5 detik', desc: 'Frekuensi pengambilan data sensor' },
                                        { label: 'Batas pH Aman', value: '6.5 – 8.5', desc: 'Range pH yang dianggap aman' },
                                        { label: 'Batas TDS Aman', value: '< 500 ppm', desc: 'Maksimum TDS yang diizinkan' },
                                        { label: 'Notifikasi', value: 'Aktif', desc: 'Alert ketika status BAHAYA terdeteksi' },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                            </div>
                                            <span className="px-3 py-1 rounded-lg bg-water-500/10 text-water-400 text-xs font-semibold border border-water-500/20">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="px-6 py-4 lg:px-8 border-t border-white/5">
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
