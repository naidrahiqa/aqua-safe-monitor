import { describe, it, expect, beforeEach } from 'vitest';
import { loadAlertConfig, saveAlertConfig, DEFAULT_ALERT_CONFIG } from './alertConfig';

describe('alertConfig', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns default config when nothing stored', () => {
        const config = loadAlertConfig();
        expect(config).toEqual(DEFAULT_ALERT_CONFIG);
    });

    it('saves and loads config', () => {
        const custom = { ...DEFAULT_ALERT_CONFIG, phMin: 6.0, phMax: 8.0 };
        saveAlertConfig(custom);
        const loaded = loadAlertConfig();
        expect(loaded.phMin).toBe(6.0);
        expect(loaded.phMax).toBe(8.0);
    });

    it('merges partial stored config with defaults', () => {
        localStorage.setItem('watersafe-alert-config', JSON.stringify({ phMin: 5.5 }));
        const config = loadAlertConfig();
        expect(config.phMin).toBe(5.5);
        expect(config.phMax).toBe(DEFAULT_ALERT_CONFIG.phMax);
        expect(config.tempMin).toBe(DEFAULT_ALERT_CONFIG.tempMin);
    });

    it('ignores corrupted storage', () => {
        localStorage.setItem('watersafe-alert-config', 'not-json');
        const config = loadAlertConfig();
        expect(config).toEqual(DEFAULT_ALERT_CONFIG);
    });
});
