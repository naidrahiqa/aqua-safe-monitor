# API Contract — AquaSafe Monitor

Dokumentasi endpoint dan data model yang digunakan oleh web dashboard dan Android app.

## Base URL

```
https://{PROJECT_ID}.supabase.co
```

## Authentication

| Header | Value | Notes |
|--------|-------|-------|
| `apikey` | `{SUPABASE_ANON_KEY}` | Public anon key |
| `Authorization` | `Bearer {SUPABASE_ANON_KEY}` | Same as apikey |

## Endpoints

### GET /rest/v1/sensor_data

Fetch sensor readings from ESP32 devices.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `select` | string | `*` | Columns to select. Use `*, devices!inner(...)` for device join |
| `order` | string | `created_at.desc` | Sort order |
| `limit` | int | `100` | Max rows returned |
| `created_at` | string | — | Filter: `gte.{ISO timestamp}` for time range |

**Response:**
```json
[
  {
    "id": "uuid",
    "device_id": "uuid",
    "temperature": 26.4,
    "ph": 7.2,
    "tds": 185,
    "turbidity": 2.1,
    "wqi_score": 97.9,
    "status": "SANGAT LAYAK",
    "created_at": "2026-08-13T10:30:00Z"
  }
]
```

**With device join (web only):**
```json
[
  {
    "id": "uuid",
    "device_id": "uuid",
    "temperature": 26.4,
    "ph": 7.2,
    "tds": 185,
    "turbidity": 2.1,
    "wqi_score": 97.9,
    "status": "SANGAT LAYAK",
    "created_at": "2026-08-13T10:30:00Z",
    "devices": {
      "device_name": "ESP32-Sumber-Air",
      "location_lat": -6.5833,
      "location_lng": 110.6667
    }
  }
]
```

### POST /functions/v1/ingest-sensor-data

Ingest sensor data from ESP32 (called by firmware, not by web/Android apps).

**Request Body:**
```json
{
  "api_key": "device-secret-key",
  "temperature": 26.4,
  "ph": 7.2,
  "tds": 185,
  "turbidity": 2.1
}
```

**Response (201):**
```json
{
  "success": true,
  "reading": {
    "id": "uuid",
    "device_id": "uuid",
    "wqi_score": 97.9,
    "status": "SANGAT LAYAK",
    "created_at": "2026-08-13T10:30:00Z"
  }
}
```

## Data Models

### SensorReading

| Field | Type | DB Column | Description |
|-------|------|-----------|-------------|
| `id` | string | `id` | UUID |
| `device_id` | string | `device_id` | FK to devices table |
| `temperature` | double | `temperature` | Water temperature (°C) |
| `ph` | double | `ph` | pH level (0-14) |
| `tds` | double | `tds` | Total Dissolved Solids (ppm) |
| `turbidity` | double | `turbidity` | Turbidity (NTU) |
| `wqi_score` | double | `wqi_score` | Water Quality Index (0-100) |
| `status` | string | `status` | "SANGAT LAYAK" / "LAYAK" / "BAHAYA" |
| `created_at` | string | `created_at` | ISO-8601 timestamp |

### Device

| Field | Type | DB Column | Description |
|-------|------|-----------|-------------|
| `id` | string | `id` | UUID |
| `user_id` | string | `user_id` | FK to auth.users |
| `device_name` | string | `device_name` | Human-readable name |
| `secret_api_key` | string | `secret_api_key` | API key for ESP32 |
| `location_lat` | double | `location_lat` | GPS latitude |
| `location_lng` | double | `location_lng` | GPS longitude |
| `is_active` | boolean | `is_active` | Device enabled/disabled |

## WQI Computation

Weighted average algorithm (runs on server + client):

```typescript
function computeWQI(ph, tds, turbidity, temperature) {
    // pH sub-index (ideal: 6.5-8.5)
    let phScore;
    if (ph >= 6.5 && ph <= 8.5) phScore = 100;
    else if (ph >= 5.0 && ph < 6.5) phScore = 60 + ((ph - 5.0) / 1.5) * 40;
    else if (ph > 8.5 && ph <= 10.0) phScore = 60 + ((10.0 - ph) / 1.5) * 40;
    else phScore = Math.max(0, 30 - Math.abs(ph - 7.0) * 5);

    // TDS sub-index (ideal: < 300 ppm)
    let tdsScore;
    if (tds <= 300) tdsScore = 100;
    else if (tds <= 500) tdsScore = 100 - ((tds - 300) / 200) * 50;
    else tdsScore = Math.max(0, 50 - ((tds - 500) / 500) * 50);

    // Turbidity sub-index (ideal: < 1 NTU)
    let turbScore;
    if (turbidity <= 1) turbScore = 100;
    else if (turbidity <= 5) turbScore = 100 - ((turbidity - 1) / 4) * 30;
    else turbScore = Math.max(0, 70 - ((turbidity - 5) / 10) * 70);

    // Temperature sub-index (ideal: 20-30°C)
    let tempScore;
    if (temperature >= 20 && temperature <= 30) tempScore = 100;
    else tempScore = Math.max(0, 100 - Math.abs(temperature - 25) * 5);

    // Weighted average
    return Math.round((phScore * 0.3 + tdsScore * 0.25 + turbScore * 0.25 + tempScore * 0.2) * 10) / 10;
}
```

## Status Thresholds

| WQI Score | Status | Color |
|-----------|--------|-------|
| >= 80 | SANGAT LAYAK | Green (#22C55E / #10B981) |
| >= 60 | LAYAK | Amber (#F59E0B) |
| < 60 | BAHAYA | Red (#EF4444) |

## Sensor Safe Ranges

| Sensor | Unit | Safe Range | Standard |
|--------|------|------------|----------|
| pH | pH | 6.5 - 8.5 | WHO |
| Temperature | °C | 20 - 30 | Normal |
| TDS | ppm | 0 - 500 | Permenkes |
| Turbidity | NTU | 0 - 5 | Permenkes 492/2010 |
