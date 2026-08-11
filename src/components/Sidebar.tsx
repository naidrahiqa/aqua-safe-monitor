import { useState, useRef, useEffect } from 'react';
import {
    LayoutDashboard,
    FlaskConical,
    Thermometer,
    Droplets,
    Eye,
    Clock,
    Settings,
    Cpu,
    Menu,
    X,
    Waves,
} from 'lucide-react';
import type { NavSection } from '../types';

interface SidebarProps {
    active: NavSection;
    onNavigate: (section: NavSection) => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode; color?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'ph', label: 'pH', icon: <FlaskConical size={20} />, color: '#22d3ee' },
    { id: 'suhu', label: 'Suhu', icon: <Thermometer size={20} />, color: '#f97316' },
    { id: 'tds', label: 'TDS', icon: <Droplets size={20} />, color: '#60a5fa' },
    { id: 'turbidity', label: 'Turbidity', icon: <Eye size={20} />, color: '#a78bfa' },
    { id: 'history', label: 'History', icon: <Clock size={20} /> },
    { id: 'devices', label: 'Perangkat', icon: <Cpu size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export default function Sidebar({ active, onNavigate }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const items = Array.from(nav.querySelectorAll<HTMLButtonElement>('button[data-nav]'));
            const idx = items.indexOf(document.activeElement as HTMLButtonElement);
            if (idx === -1) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[(idx + 1) % items.length]?.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length]?.focus();
            }
        };
        nav.addEventListener('keydown', handleKeyDown);
        return () => nav.removeEventListener('keydown', handleKeyDown);
    }, [collapsed]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <>
            {/* Mobile toggle */}
            <button
                id="sidebar-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 lg:hidden p-2.5 rounded-xl glass-panel text-water-300 hover:text-white transition-colors"
                aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={mobileOpen}
                aria-controls="sidebar"
            >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                id="sidebar"
                role="navigation"
                aria-label="Main navigation"
                className={`
                    fixed top-0 left-0 h-screen z-40
                    flex flex-col
                    bg-panel/98 backdrop-blur-2xl
                    border-r border-white/[0.04]
                    transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-[72px]' : 'w-64'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:relative
                `}
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/[0.04] ${collapsed ? 'justify-center px-0' : ''}`}>
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-water-400 to-ocean-500 flex items-center justify-center shadow-lg shadow-water-500/25">
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
                <nav ref={navRef} className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Primary">
                    {NAV_ITEMS.map((item) => {
                        const isActive = active === item.id;
                        const accentColor = item.color || '#06b6d4';
                        return (
                            <div key={item.id} className="relative group">
                                <button
                                    data-nav
                                    id={`nav-${item.id}`}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setMobileOpen(false);
                                    }}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`
                                        group/btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                        transition-all duration-200 cursor-pointer
                                        ${collapsed ? 'justify-center px-2' : ''}
                                        ${isActive
                                            ? 'shadow-sm'
                                            : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                                        }
                                    `}
                                    style={isActive ? {
                                        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
                                        color: accentColor,
                                        boxShadow: `0 0 20px ${accentColor}10`,
                                    } : undefined}
                                >
                                    <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover/btn:scale-105'}`}>
                                        {item.icon}
                                    </span>
                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">{item.label}</span>
                                    )}
                                    {isActive && !collapsed && (
                                        <div
                                            className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                                            style={{ backgroundColor: accentColor }}
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>

                                {/* Tooltip for collapsed mode */}
                                {collapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-panel-light border border-white/10 text-xs text-white font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-lg" role="tooltip">
                                        {item.label}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-panel-light" aria-hidden="true" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle (desktop) */}
                <div className="hidden lg:flex px-3 py-4 border-t border-white/[0.04]">
                    <button
                        id="sidebar-collapse-toggle"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                            text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]
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
