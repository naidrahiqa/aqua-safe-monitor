import type { SensorReading, ChartDataPoint, LocationPin } from '../types';

// ===================================================================
// Mock Data — Simulates ESP32 sensor payloads for UI development.
// All data strictly adheres to the SensorReading interface.
// ===================================================================

const BASE_LOCATION = { lat: -6.5833, lng: 110.6667 }; // Jepara, Indonesia

function generateId(): string {
    return `WSM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function hoursAgo(h: number): string {
    const d = new Date();
    d.setHours(d.getHours() - h);
    return d.toISOString();
}

export const mockReadings: SensorReading[] = [
    {
        id: generateId(),
        timestamp: hoursAgo(0),
        temperature: 26.4,
        pH: 7.2,
        tds: 185,
        turbidity: 2.1,
        wqiScore: 92,
        status: 'SANGAT LAYAK',
        location: { ...BASE_LOCATION },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(1),
        temperature: 26.8,
        pH: 7.0,
        tds: 192,
        turbidity: 2.4,
        wqiScore: 88,
        status: 'SANGAT LAYAK',
        location: { lat: BASE_LOCATION.lat + 0.002, lng: BASE_LOCATION.lng - 0.001 },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(2),
        temperature: 27.1,
        pH: 6.8,
        tds: 210,
        turbidity: 3.8,
        wqiScore: 76,
        status: 'LAYAK',
        location: { lat: BASE_LOCATION.lat - 0.001, lng: BASE_LOCATION.lng + 0.003 },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(3),
        temperature: 27.5,
        pH: 6.5,
        tds: 245,
        turbidity: 5.2,
        wqiScore: 65,
        status: 'LAYAK',
        location: { lat: BASE_LOCATION.lat + 0.004, lng: BASE_LOCATION.lng + 0.002 },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(4),
        temperature: 28.2,
        pH: 5.9,
        tds: 320,
        turbidity: 8.6,
        wqiScore: 42,
        status: 'BAHAYA',
        location: { lat: BASE_LOCATION.lat - 0.003, lng: BASE_LOCATION.lng - 0.002 },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(5),
        temperature: 26.9,
        pH: 7.1,
        tds: 178,
        turbidity: 1.9,
        wqiScore: 91,
        status: 'SANGAT LAYAK',
        location: { ...BASE_LOCATION },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(6),
        temperature: 27.3,
        pH: 6.7,
        tds: 230,
        turbidity: 4.1,
        wqiScore: 72,
        status: 'LAYAK',
        location: { lat: BASE_LOCATION.lat + 0.001, lng: BASE_LOCATION.lng + 0.001 },
    },
    {
        id: generateId(),
        timestamp: hoursAgo(7),
        temperature: 28.0,
        pH: 6.2,
        tds: 290,
        turbidity: 7.3,
        wqiScore: 48,
        status: 'BAHAYA',
        location: { lat: BASE_LOCATION.lat - 0.002, lng: BASE_LOCATION.lng + 0.004 },
    },
];

export const latestReading: SensorReading = mockReadings[0];

export const chartData: ChartDataPoint[] = mockReadings
    .slice()
    .reverse()
    .map((r) => {
        const d = new Date(r.timestamp);
        return {
            timestamp: r.timestamp,
            time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
            pH: r.pH,
            tds: r.tds,
            temperature: r.temperature,
            turbidity: r.turbidity,
        };
    });

// ===================================================================
// Mock Location Pins — 3 test locations with different sensor data.
// Each pin represents a physical ESP32 deployment site.
// ===================================================================

const LOCATIONS = {
    utama: { lat: -6.5833, lng: 110.6667 },
    kolam: { lat: -6.5850, lng: 110.6700 },
    irigasi: { lat: -6.5810, lng: 110.6640 },
};

function locReading(
    loc: { lat: number; lng: number },
    temp: number, pH: number, tds: number, turb: number,
    wqi: number, status: SensorReading['status'],
    hoursOffset: number,
): SensorReading {
    return {
        id: generateId(),
        timestamp: hoursAgo(hoursOffset),
        temperature: temp,
        pH,
        tds,
        turbidity: turb,
        wqiScore: wqi,
        status,
        location: { ...loc },
    };
}

export const mockLocationPins: LocationPin[] = [
    {
        id: 'pin-utama',
        deviceName: 'ESP32-Sumber-Air-Utama',
        location: { ...LOCATIONS.utama },
        latestReading: locReading(LOCATIONS.utama, 26.4, 7.2, 185, 2.1, 92, 'SANGAT LAYAK', 0),
        status: 'SANGAT LAYAK',
    },
    {
        id: 'pin-kolam',
        deviceName: 'ESP32-Kolam-Belakang',
        location: { ...LOCATIONS.kolam },
        latestReading: locReading(LOCATIONS.kolam, 27.5, 6.5, 245, 5.2, 65, 'LAYAK', 3),
        status: 'LAYAK',
    },
    {
        id: 'pin-irigasi',
        deviceName: 'ESP32-Saluran-Irigasi',
        location: { ...LOCATIONS.irigasi },
        latestReading: locReading(LOCATIONS.irigasi, 28.2, 5.9, 320, 8.6, 42, 'BAHAYA', 4),
        status: 'BAHAYA',
    },
];
