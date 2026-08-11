import { useState, useCallback } from 'react';
import type { TestLocation, WaterStatus } from '../types';

// ===================================================================
// useTestLocations — Manages user-saved test locations in localStorage.
// Each location represents a physical water quality test site.
// ===================================================================

const STORAGE_KEY = 'watersafe-test-locations';

function generateId(): string {
    return `TL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
}

function computeWQI(reading: { pH: number; tds: number; turbidity: number; temperature: number }): number {
    // Simplified WQI calculation
    let score = 100;

    // pH penalty (ideal 6.5-8.5)
    if (reading.pH < 6.5 || reading.pH > 8.5) score -= 20;
    if (reading.pH < 5 || reading.pH > 10) score -= 30;

    // TDS penalty (ideal <500)
    if (reading.tds > 500) score -= 15;
    if (reading.tds > 1000) score -= 20;

    // Turbidity penalty (ideal <5)
    if (reading.turbidity > 5) score -= 15;
    if (reading.turbidity > 25) score -= 25;

    // Temperature penalty (ideal 20-30)
    if (reading.temperature < 20 || reading.temperature > 30) score -= 10;

    return Math.max(0, Math.min(100, score));
}

function getStatus(wqi: number): WaterStatus {
    if (wqi >= 80) return 'SANGAT LAYAK';
    if (wqi >= 50) return 'LAYAK';
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
            location: { lat: -6.5833, lng: 110.6667 },
            temperature: 26.4,
            pH: 7.2,
            tds: 185,
            turbidity: 2.1,
            wqiScore: 92,
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
            wqiScore: 65,
            status: 'LAYAK',
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
            wqiScore: 42,
            status: 'BAHAYA',
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

    return { locations, addLocation, updateLocation, removeLocation };
}
