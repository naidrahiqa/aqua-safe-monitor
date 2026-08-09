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
