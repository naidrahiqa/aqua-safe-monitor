import { useState } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Clock,
    Settings,
    Droplets,
    Menu,
    X,
    Waves,
    Cpu,
} from 'lucide-react';
import type { NavSection } from '../types';

interface SidebarProps {
    active: NavSection;
    onNavigate: (section: NavSection) => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { id: 'history', label: 'History', icon: <Clock size={20} /> },
    { id: 'devices', label: 'Perangkat', icon: <Cpu size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                id="sidebar-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl glass-panel text-water-300 hover:text-white transition-colors"
                aria-label="Toggle sidebar"
            >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                id="sidebar"
                className={`
          fixed top-0 left-0 h-screen z-40
          flex flex-col
          bg-panel/95 backdrop-blur-xl
          border-r border-white/5
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-water-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-water-500/20">
                            <Droplets size={22} className="text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-safe rounded-full border-2 border-panel" />
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in overflow-hidden">
                            <h1 className="text-sm font-bold text-white tracking-tight">WaterSafe</h1>
                            <p className="text-[10px] text-water-400 font-medium tracking-widest uppercase">Monitor</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        return (
                            <button
                                key={item.id}
                                id={`nav-${item.id}`}
                                onClick={() => {
                                    onNavigate(item.id);
                                    setMobileOpen(false);
                                }}
                                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 cursor-pointer
                  ${isActive
                                        ? 'bg-gradient-to-r from-water-500/20 to-ocean-500/10 text-water-300 shadow-sm shadow-water-500/10'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }
                `}
                            >
                                <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                    {item.icon}
                                </span>
                                {!collapsed && (
                                    <span className="text-sm font-medium truncate">{item.label}</span>
                                )}
                                {isActive && !collapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-water-400 animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Collapse toggle (desktop) */}
                <div className="hidden lg:flex px-3 py-4 border-t border-white/5">
                    <button
                        id="sidebar-collapse-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
              text-slate-500 hover:text-slate-300 hover:bg-white/5
              transition-all duration-200"
                    >
                        <Waves size={16} />
                        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
