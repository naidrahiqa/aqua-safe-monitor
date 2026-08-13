// ===================================================================
// Shared color tokens — single source of truth for all chart/UI colors.
// Import from here instead of hardcoding hex values.
// ===================================================================

export const COLORS = {
    // Primary palette
    water: '#22d3ee',
    ocean: '#0891b2',
    safe: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',

    // Sensor-specific colors
    ph: '#f59e0b',
    temperature: '#f97316',
    tds: '#22c55e',
    turbidity: '#8b5cf6',
    wqi: '#22d3ee',

    // Chart colors
    chart: {
        primary: '#22d3ee',
        secondary: '#f97316',
        tertiary: '#60a5fa',
        quaternary: '#a78bfa',
        quinary: '#22c55e',
        senary: '#f59e0b',
        muted: '#64748b',
    },

    // Map marker colors (by status)
    marker: {
        baik: '#22c55e',
        layak: '#f59e0b',
        bahaya: '#ef4444',
    },

    // UI surfaces
    surface: {
        bg: '#080d19',
        card: '#0f172a',
        border: '#1e293b',
        muted: '#475569',
        text: '#94a3b8',
        textLight: '#e2e8f0',
    },
} as const;
