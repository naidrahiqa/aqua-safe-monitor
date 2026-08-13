import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_LAT, DEFAULT_LNG } from '../lib/constants';
import type { TestLocation, SensorReading, SensorDataRecord, WaterStatus } from '../types';

// ===================================================================
// useTestLocations — Manages user-saved test locations in localStorage.
// Each location represents a physical water quality test site.
// ===================================================================

const STORAGE_KEY = 'watersafe-test-locations';

function generateId(): string {
    return `TL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

/** Weighted-average WQI — matches Edge Function algorithm exactly */
function computeWQI(reading: { pH: number; tds: number; turbidity: number; temperature: number }): number {
    // pH sub-index (ideal: 6.5-8.5)
    let phScore: number;
    if (reading.pH >= 6.5 && reading.pH <= 8.5) {
        phScore = 100;
    } else if (reading.pH >= 5.0 && reading.pH < 6.5) {
        phScore = 60 + ((reading.pH - 5.0) / 1.5) * 40;
    } else if (reading.pH > 8.5 && reading.pH <= 10.0) {
        phScore = 60 + ((10.0 - reading.pH) / 1.5) * 40;
    } else {
        phScore = Math.max(0, 30 - Math.abs(reading.pH - 7.0) * 5);
    }

    // TDS sub-index (ideal: < 300 ppm, max: 500 ppm)
    let tdsScore: number;
    if (reading.tds <= 300) {
        tdsScore = 100;
    } else if (reading.tds <= 500) {
        tdsScore = 100 - ((reading.tds - 300) / 200) * 50;
    } else {
        tdsScore = Math.max(0, 50 - ((reading.tds - 500) / 500) * 50);
    }

    // Turbidity sub-index (ideal: < 1 NTU, acceptable: < 5 NTU)
    let turbScore: number;
    if (reading.turbidity <= 1) {
        turbScore = 100;
    } else if (reading.turbidity <= 5) {
        turbScore = 100 - ((reading.turbidity - 1) / 4) * 30;
    } else {
        turbScore = Math.max(0, 70 - ((reading.turbidity - 5) / 10) * 70);
    }

    // Temperature sub-index (ideal: 20-30°C)
    let tempScore: number;
    if (reading.temperature >= 20 && reading.temperature <= 30) {
        tempScore = 100;
    } else {
        tempScore = Math.max(0, 100 - Math.abs(reading.temperature - 25) * 5);
    }

    // Weighted average
    const wqi = (phScore * 0.3) + (tdsScore * 0.25) + (turbScore * 0.25) + (tempScore * 0.2);
    return Math.round(Math.min(100, Math.max(0, wqi)) * 10) / 10;
}

function getStatus(wqi: number): WaterStatus {
    if (wqi >= 80) return 'SANGAT LAYAK';
    if (wqi >= 60) return 'LAYAK';
    return 'BAHAYA';
}

function loadFromStorage(): TestLocation[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getMockLocations();
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : getMockLocations();
    } catch {
        return getMockLocations();
    }
}

function saveToStorage(locations: TestLocation[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}

/** Pre-populated mock test locations for demo */
function getMockLocations(): TestLocation[] {
    const now = new Date().toISOString();
    return [
        {
            id: generateId(),
            name: 'Sumur Warga RT 05',
            location: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
            temperature: 26.4,
            pH: 7.2,
            tds: 185,
            turbidity: 2.1,
            wqiScore: 97.9,
            status: 'SANGAT LAYAK',
            notes: 'Air sumur belakang rumah Pak Budi',
            createdAt: now,
        },
        {
            id: generateId(),
            name: 'Kolam Ikan Hias',
            location: { lat: -6.5850, lng: 110.6700 },
            temperature: 27.5,
            pH: 6.5,
            tds: 245,
            turbidity: 5.2,
            wqiScore: 89.3,
            status: 'SANGAT LAYAK',
            notes: 'Kolam depan sekolah',
            createdAt: now,
        },
        {
            id: generateId(),
            name: 'Saluran Irigasi Sawah',
            location: { lat: -6.5810, lng: 110.6640 },
            temperature: 28.2,
            pH: 5.9,
            tds: 320,
            turbidity: 8.6,
            wqiScore: 72.1,
            status: 'LAYAK',
            notes: 'Saluran utama dari sungai',
            createdAt: now,
        },
    ];
}

export interface UseTestLocationsResult {
    locations: TestLocation[];
    addLocation: (data: Omit<TestLocation, 'id' | 'wqiScore' | 'status' | 'createdAt'>) => TestLocation;
    updateLocation: (id: string, data: Partial<TestLocation>) => void;
    removeLocation: (id: string) => void;
    syncFromSensor: (locationId: string) => Promise<boolean>;
}

export function useTestLocations(): UseTestLocationsResult {
    const [locations, setLocations] = useState<TestLocation[]>(loadFromStorage);

    const addLocation = useCallback((data: Omit<TestLocation, 'id' | 'wqiScore' | 'status' | 'createdAt'>) => {
        const wqiScore = computeWQI(data);
        const status = getStatus(wqiScore);
        const newLocation: TestLocation = {
            ...data,
            id: generateId(),
            wqiScore,
            status,
            createdAt: new Date().toISOString(),
        };
        setLocations((prev) => {
            const next = [newLocation, ...prev];
            saveToStorage(next);
            return next;
        });
        return newLocation;
    }, []);

    const updateLocation = useCallback((id: string, data: Partial<TestLocation>) => {
        setLocations((prev) => {
            const next = prev.map((loc) => {
                if (loc.id !== id) return loc;
                const updated = { ...loc, ...data };
                // Recompute WQI if sensor values changed
                if (data.pH !== undefined || data.tds !== undefined || data.turbidity !== undefined || data.temperature !== undefined) {
                    updated.wqiScore = computeWQI(updated);
                    updated.status = getStatus(updated.wqiScore);
                }
                return updated;
            });
            saveToStorage(next);
            return next;
        });
    }, []);

    const removeLocation = useCallback((id: string) => {
        setLocations((prev) => {
            const next = prev.filter((loc) => loc.id !== id);
            saveToStorage(next);
            return next;
        });
    }, []);

    /** Fetch latest sensor reading from Supabase and sync to a test location */
    const syncFromSensor = useCallback(async (locationId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) return false;

        try {
            const { data, error } = await supabase
                .from('sensor_data')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return false;

            const record = data as SensorDataRecord;
            const reading: SensorReading = {
                id: record.id,
                timestamp: record.created_at,
                temperature: record.temperature,
                pH: record.ph,
                tds: record.tds,
                turbidity: record.turbidity,
                wqiScore: record.wqi_score,
                status: record.status,
                location: { lat: DEFAULT_LAT, lng: DEFAULT_LNG }, // default, will be overridden
            };

            setLocations((prev) => {
                const next = prev.map((loc) => {
                    if (loc.id !== locationId) return loc;
                    return {
                        ...loc,
                        syncedReading: reading,
                        lastSyncedAt: new Date().toISOString(),
                        // Update sensor values from ESP32
                        temperature: reading.temperature,
                        pH: reading.pH,
                        tds: reading.tds,
                        turbidity: reading.turbidity,
                        wqiScore: reading.wqiScore,
                        status: reading.status,
                    };
                });
                saveToStorage(next);
                return next;
            });

            return true;
        } catch {
            return false;
        }
    }, []);

    return { locations, addLocation, updateLocation, removeLocation, syncFromSensor };
}
