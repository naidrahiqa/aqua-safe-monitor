// @ts-nocheck — This file runs on Supabase Deno runtime, not in the local project.
// ===================================================================
// WaterSafe-Monitor — Supabase Edge Function
// Endpoint: POST /functions/v1/ingest-sensor-data
//
// This function validates the ESP32's secret_api_key, computes
// the WQI score and status, then inserts into sensor_data.
//
// The ESP32 sends a JSON body with:
//   { api_key, temperature, ph, tds, turbidity }
//
// Deploy: supabase functions deploy ingest-sensor-data
// ===================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface SensorPayload {
    api_key: string
    temperature: number
    ph: number
    tds: number
    turbidity: number
}

interface DeviceRecord {
    id: string
    user_id: string
    is_active: boolean
}

// ---- WQI Computation ----
// Simple weighted index based on WHO/Indonesian standards
function computeWqi(ph: number, tds: number, turbidity: number, temperature: number): number {
    // pH sub-index (ideal: 6.5-8.5)
    let phScore: number
    if (ph >= 6.5 && ph <= 8.5) {
        phScore = 100
    } else if (ph >= 5.0 && ph < 6.5) {
        phScore = 60 + ((ph - 5.0) / 1.5) * 40
    } else if (ph > 8.5 && ph <= 10.0) {
        phScore = 60 + ((10.0 - ph) / 1.5) * 40
    } else {
        phScore = Math.max(0, 30 - Math.abs(ph - 7.0) * 5)
    }

    // TDS sub-index (ideal: < 300 ppm, max: 500 ppm)
    let tdsScore: number
    if (tds <= 300) {
        tdsScore = 100
    } else if (tds <= 500) {
        tdsScore = 100 - ((tds - 300) / 200) * 50
    } else {
        tdsScore = Math.max(0, 50 - ((tds - 500) / 500) * 50)
    }

    // Turbidity sub-index (ideal: < 5 NTU)
    let turbScore: number
    if (turbidity <= 1) {
        turbScore = 100
    } else if (turbidity <= 5) {
        turbScore = 100 - ((turbidity - 1) / 4) * 30
    } else {
        turbScore = Math.max(0, 70 - ((turbidity - 5) / 10) * 70)
    }

    // Temperature sub-index (ideal: 20-30°C)
    let tempScore: number
    if (temperature >= 20 && temperature <= 30) {
        tempScore = 100
    } else {
        tempScore = Math.max(0, 100 - Math.abs(temperature - 25) * 5)
    }

    // Weighted average
    const wqi = (phScore * 0.3) + (tdsScore * 0.25) + (turbScore * 0.25) + (tempScore * 0.2)
    return Math.round(Math.min(100, Math.max(0, wqi)) * 10) / 10
}

function computeStatus(wqi: number): 'SANGAT LAYAK' | 'LAYAK' | 'BAHAYA' {
    if (wqi >= 80) return 'SANGAT LAYAK'
    if (wqi >= 60) return 'LAYAK'
    return 'BAHAYA'
}

// ---- CORS Headers ----
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // Parse the incoming sensor payload
        const body: SensorPayload = await req.json()

        // Validate required fields
        if (!body.api_key || body.temperature == null || body.ph == null || body.tds == null || body.turbidity == null) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: api_key, temperature, ph, tds, turbidity' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate ranges
        if (body.ph < 0 || body.ph > 14) {
            return new Response(
                JSON.stringify({ error: 'pH must be between 0 and 14' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with SERVICE ROLE key (bypasses RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        )

        // Step 1: Validate the API key — find the device
        const { data: device, error: deviceError } = await supabaseAdmin
            .from('devices')
            .select('id, user_id, is_active')
            .eq('secret_api_key', body.api_key)
            .single<DeviceRecord>()

        if (deviceError || !device) {
            return new Response(
                JSON.stringify({ error: 'Invalid API key. Device not found.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!device.is_active) {
            return new Response(
                JSON.stringify({ error: 'Device is deactivated.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Step 2: Compute WQI and status
        const wqiScore = computeWqi(body.ph, body.tds, body.turbidity, body.temperature)
        const status = computeStatus(wqiScore)

        // Step 3: Insert sensor data
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('sensor_data')
            .insert({
                device_id: device.id,
                temperature: body.temperature,
                ph: body.ph,
                tds: body.tds,
                turbidity: body.turbidity,
                wqi_score: wqiScore,
                status: status,
            })
            .select('id, created_at')
            .single()

        if (insertError) {
            console.error('Insert error:', insertError)
            return new Response(
                JSON.stringify({ error: 'Failed to insert sensor data', detail: insertError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Step 4: Return success with computed values
        return new Response(
            JSON.stringify({
                success: true,
                reading: {
                    id: inserted.id,
                    device_id: device.id,
                    wqi_score: wqiScore,
                    status: status,
                    created_at: inserted.created_at,
                },
            }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Unhandled error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
