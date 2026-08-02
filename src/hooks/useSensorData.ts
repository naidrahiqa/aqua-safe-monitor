import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockReadings, latestReading, chartData } from '../data/mockData';
import type { SensorReading, ChartDataPoint, SensorDataRecord } from '../types';

// ===================================================================
// useSensorData — Fetches and subscribes to real-time sensor data.
// Falls back to mock data when Supabase is not configured.
// ===================================================================

interface UseSensorDataResult {
    readings: SensorReading[];
    latestReading: SensorReading;
    chartData: ChartDataPoint[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/** Convert DB record to app-level SensorReading */
function dbRecordToReading(record: SensorDataRecord & { device_name?: string; location_lat?: number; location_lng?: number }): SensorReading {
    return {
        id: record.id,
        timestamp: record.created_at,
        temperature: record.temperature,
        pH: record.ph,
        tds: record.tds,
        turbidity: record.turbidity,
        wqiScore: record.wqi_score,
        status: record.status,
        location: {
            lat: record.location_lat ?? -6.9175,
            lng: record.location_lng ?? 107.6191,
        },
    };
}

/** Build chart data from readings array */
function buildChartData(readings: SensorReading[]): ChartDataPoint[] {
    return readings
        .slice()
        .reverse()
        .map((r) => {
            const d = new Date(r.timestamp);
            return {
                time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
                pH: r.pH,
                tds: r.tds,
                temperature: r.temperature,
                turbidity: r.turbidity,
            };
        });
}

export function useSensorData(limit = 50): UseSensorDataResult {
    const configured = isSupabaseConfigured();
    const [readings, setReadings] = useState<SensorReading[]>(mockReadings);
    const [latest, setLatest] = useState<SensorReading>(latestReading);
    const [chart, setChart] = useState<ChartDataPoint[]>(chartData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!configured) {
            setReadings(mockReadings);
            setLatest(latestReading);
            setChart(chartData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('sensor_data')
                .select('*, devices!inner(device_name, location_lat, location_lng)')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (fetchError) {
                setError(fetchError.message);
                setReadings(mockReadings);
                setLatest(latestReading);
                setChart(chartData);
            } else if (data && data.length > 0) {
                const parsed = data.map((row) => {
                    const device = (row as Record<string, unknown>).devices as Record<string, unknown> | null;
                    return dbRecordToReading({
                        id: row.id,
                        device_id: row.device_id,
                        temperature: row.temperature,
                        ph: row.ph,
                        tds: row.tds,
                        turbidity: row.turbidity,
                        wqi_score: row.wqi_score,
                        status: row.status,
                        created_at: row.created_at,
                        device_name: device?.device_name as string | undefined,
                        location_lat: device?.location_lat as number | undefined,
                        location_lng: device?.location_lng as number | undefined,
                    });
                });
                setReadings(parsed);
                setLatest(parsed[0]);
                setChart(buildChartData(parsed));
            } else {
                setReadings(mockReadings);
                setLatest(latestReading);
                setChart(chartData);
            }
        } catch {
            setError('Gagal memuat data sensor');
            setReadings(mockReadings);
            setLatest(latestReading);
            setChart(chartData);
        }

        setLoading(false);
    }, [configured, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time subscription
    useEffect(() => {
        if (!configured) return;

        const channel = supabase
            .channel('sensor-data-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sensor_data',
                },
                async (payload) => {
                    // Fetch the full record with device info
                    const { data } = await supabase
                        .from('sensor_data')
                        .select('*, devices!inner(device_name, location_lat, location_lng)')
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        const device = (data as Record<string, unknown>).devices as Record<string, unknown> | null;
                        const newReading = dbRecordToReading({
                            id: data.id,
                            device_id: data.device_id,
                            temperature: data.temperature,
                            ph: data.ph,
                            tds: data.tds,
                            turbidity: data.turbidity,
                            wqi_score: data.wqi_score,
                            status: data.status,
                            created_at: data.created_at,
                            device_name: device?.device_name as string | undefined,
                            location_lat: device?.location_lat as number | undefined,
                            location_lng: device?.location_lng as number | undefined,
                        });

                        setReadings((prev) => [newReading, ...prev].slice(0, limit));
                        setLatest(newReading);
                        setChart((prev) => {
                            const d = new Date(newReading.timestamp);
                            const newPoint: ChartDataPoint = {
                                time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
                                pH: newReading.pH,
                                tds: newReading.tds,
                                temperature: newReading.temperature,
                                turbidity: newReading.turbidity,
                            };
                            return [...prev, newPoint].slice(-limit);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [configured, limit]);

    return {
        readings,
        latestReading: latest,
        chartData: chart,
        loading,
        error,
        refresh: fetchData,
    };
}
