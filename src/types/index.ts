// ===================================================================
// WaterSafe-Monitor — Strict TypeScript Interfaces
// Defines the shape of all data structures across the application.
// ===================================================================

/** Geographic coordinates for sensor location */
export interface SensorLocation {
    lat: number;
    lng: number;
}

/** Water quality status labels (Indonesian) */
export type WaterStatus = 'SANGAT LAYAK' | 'LAYAK' | 'BAHAYA';

/**
 * Core sensor reading payload from ESP32.
 * Every field is required and strictly typed.
 */
export interface SensorReading {
    /** Unique identifier for this specific reading */
    id: string;
    /** ISO-8601 timestamp of when the reading was taken */
    timestamp: string;
    /** Water temperature in degrees Celsius */
    temperature: number;
    /** pH level (0–14 scale) */
    pH: number;
    /** Total Dissolved Solids in parts per million */
    tds: number;
    /** Turbidity in Nephelometric Turbidity Units */
    turbidity: number;
    /** Computed Water Quality Index score (0–100) */
    wqiScore: number;
    /** Human-readable quality status */
    status: WaterStatus;
    /** GPS location of the sensor */
    location: SensorLocation;
}

/** A map pin representing one test location with its latest sensor data */
export interface LocationPin {
    id: string;
    deviceName: string;
    location: SensorLocation;
    latestReading: SensorReading;
    status: WaterStatus;
}

/** Data point for time-series charts */
export interface ChartDataPoint {
    /** ISO-8601 timestamp for filtering */
    timestamp: string;
    /** Display label e.g. "14:30" */
    time: string;
    pH: number;
    tds: number;
    temperature: number;
    turbidity: number;
}

/** Navigation section identifiers */
export type NavSection = 'overview' | 'ph' | 'suhu' | 'tds' | 'turbidity' | 'history' | 'settings' | 'devices';

// ===================================================================
// Supabase Database Types
// ===================================================================

/** Device record from the `devices` table */
export interface Device {
    id: string;
    user_id: string;
    device_name: string;
    secret_api_key: string;
    location_lat: number;
    location_lng: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Sensor data record from the `sensor_data` table */
export interface SensorDataRecord {
    id: string;
    device_id: string;
    temperature: number;
    ph: number;
    tds: number;
    turbidity: number;
    wqi_score: number;
    status: WaterStatus;
    created_at: string;
}

/** Payload sent by ESP32 to the Edge Function */
export interface ESP32Payload {
    api_key: string;
    temperature: number;
    ph: number;
    tds: number;
    turbidity: number;
}

/** Auth user profile for UI display */
export interface UserProfile {
    id: string;
    email: string;
    created_at: string;
}
