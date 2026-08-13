// ===================================================================
// Alert config — editable sensor thresholds persisted in localStorage.
// Client-side only; backend (edge function) thresholds are unchanged.
// ===================================================================

export interface AlertConfig {
    phMin: number;
    phMax: number;
    tdsMax: number;
    turbidityMax: number;
    tempMin: number;
    tempMax: number;
}

const STORAGE_KEY = 'watersafe-alert-config';

// Safe ranges based on WHO Guidelines for Drinking Water Quality (4th Ed.)
// and Permenkes No. 492/Menkes/Per/IV/2010
// pH: 6.5–8.5 (WHO/Permenkes), TDS: <500 ppm (Permenkes), <600 (WHO acceptable)
// Turbidity: <5 NTU (Permenkes), <1 NTU (WHO target)
// Temperature: 20–30°C (WHO tropical guideline)

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
    phMin: 6.5,
    phMax: 8.5,
    tdsMax: 500,
    turbidityMax: 5,
    tempMin: 20,
    tempMax: 30,
};

export function loadAlertConfig(): AlertConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_ALERT_CONFIG;
        return { ...DEFAULT_ALERT_CONFIG, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_ALERT_CONFIG;
    }
}

export function saveAlertConfig(config: AlertConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
