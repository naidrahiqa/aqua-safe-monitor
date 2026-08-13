import { createContext, useContext, type ReactNode } from 'react';
import { useSensorData } from '../hooks/useSensorData';
import type { SensorReading, ChartDataPoint, LocationPin } from '../types';

// ===================================================================
// Sensor Data Context — Provides live sensor data to the entire app.
// Wraps useSensorData hook with context for global access.
// ===================================================================

interface SensorDataContextType {
    readings: SensorReading[];
    latestReading: SensorReading;
    chartData: ChartDataPoint[];
    locationPins: LocationPin[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export function SensorDataProvider({ children }: { children: ReactNode }) {
    const sensorData = useSensorData(100);

    return (
        <SensorDataContext.Provider value={sensorData}>
            {children}
        </SensorDataContext.Provider>
    );
}

export function useSensorContext(): SensorDataContextType {
    const context = useContext(SensorDataContext);
    if (!context) {
        throw new Error('useSensorContext must be used within a SensorDataProvider');
    }
    return context;
}
