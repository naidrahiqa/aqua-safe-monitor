-- ===================================================================
-- WaterSafe-Monitor — Supabase PostgreSQL Schema
-- Safe to re-run (uses IF NOT EXISTS and DROP POLICY IF EXISTS)
-- ===================================================================

-- ========================
-- 1. EXTENSIONS
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- 2. DEVICES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL DEFAULT 'ESP32-Sensor',
    secret_api_key UUID NOT NULL DEFAULT uuid_generate_v4(),
    location_lat DOUBLE PRECISION DEFAULT -6.9175,
    location_lng DOUBLE PRECISION DEFAULT 107.6191,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_api_key ON public.devices(secret_api_key);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);

-- ========================
-- 3. SENSOR_DATA TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    temperature DOUBLE PRECISION NOT NULL,
    ph DOUBLE PRECISION NOT NULL CHECK (ph >= 0 AND ph <= 14),
    tds DOUBLE PRECISION NOT NULL CHECK (tds >= 0),
    turbidity DOUBLE PRECISION NOT NULL CHECK (turbidity >= 0),
    wqi_score DOUBLE PRECISION NOT NULL CHECK (wqi_score >= 0 AND wqi_score <= 100),
    status TEXT NOT NULL CHECK (status IN ('SANGAT LAYAK', 'LAYAK', 'BAHAYA')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time
    ON public.sensor_data(device_id, created_at DESC);

-- ========================
-- 4. ROW LEVEL SECURITY
-- ========================
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe re-run)
DROP POLICY IF EXISTS "Users can view own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can create own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can update own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can delete own devices" ON public.devices;
DROP POLICY IF EXISTS "Users can view own sensor data" ON public.sensor_data;
DROP POLICY IF EXISTS "Service role can insert sensor data" ON public.sensor_data;
DROP POLICY IF EXISTS "Public can read sensor data" ON public.sensor_data;
DROP POLICY IF EXISTS "Public can read devices" ON public.devices;

-- DEVICES POLICIES
CREATE POLICY "Users can view own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = user_id);

-- SENSOR_DATA POLICIES
CREATE POLICY "Users can view own sensor data"
    ON public.sensor_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.id = sensor_data.device_id
            AND devices.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert sensor data"
    ON public.sensor_data FOR INSERT
    WITH CHECK (true);

-- Mode demo: aplikasi Android (anon, tanpa login) boleh membaca data sensor & daftar device.
-- Untuk produksi: hapus kedua policy ini dan wajibkan login (auth.uid()).
CREATE POLICY "Public can read sensor data"
    ON public.sensor_data FOR SELECT
    USING (true);

CREATE POLICY "Public can read devices"
    ON public.devices FOR SELECT
    USING (true);

-- ========================
-- 5. AUTO-UPDATE TRIGGER
-- ========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_device_updated ON public.devices;
CREATE TRIGGER on_device_updated
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 6. LATEST READINGS VIEW
-- ========================
CREATE OR REPLACE VIEW public.latest_readings AS
SELECT DISTINCT ON (sd.device_id)
    sd.*,
    d.device_name,
    d.user_id,
    d.location_lat,
    d.location_lng
FROM public.sensor_data sd
JOIN public.devices d ON d.id = sd.device_id
ORDER BY sd.device_id, sd.created_at DESC;
