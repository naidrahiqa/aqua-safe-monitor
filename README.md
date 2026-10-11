# AquaSafeMonitor — OPSI 2026

Real-time IoT-based water quality monitoring system.

- **ESP32** — reads pH, TDS, Turbidity, and Temperature (DS18B20) sensors, displays to LCD, sends data to the cloud
- **Supabase** — backend (PostgreSQL + edge function `ingest-sensor-data`)
- **React + Vite + TypeScript + Tailwind + Leaflet** — web dashboard
- **Kotlin + Jetpack Compose** — Android app → [aqua-safe-monitor-android](https://github.com/naidrahiqa/aqua-safe-monitor-android)

## Structure

```
├── firmware/AquaSafeMonitor/   # ESP32 firmware (Arduino IDE)
├── src/                        # Web dashboard (React + Vite)
│   ├── components/             # UI components (GaugeCard, DataTable, etc.)
│   ├── contexts/               # React context (Auth, SensorData)
│   ├── hooks/                  # Custom hooks (useTestLocations)
│   ├── lib/                    # Utilities (supabase, alertConfig, exportCSV)
│   ├── pages/                  # Route pages (Dashboard, AuthPage)
│   └── index.css               # Design system v3.1 (colors, glass, animations)
├── supabase/                   # Schema SQL + edge function + CLI config
├── tools/i2c_scanner/          # Arduino sketch for scanning I2C addresses (LCD debugging)
├── SETUP_GUIDE.md              # Full setup guide from scratch (in Indonesian)
├── SETUP_CHECKLIST.md          # Checklist for connecting the real Supabase backend
└── PROJECT_STATUS.md           # Current project status (done / pending / blocked)

**Related repos:**
- [aqua-safe-monitor-android](https://github.com/naidrahiqa/aqua-safe-monitor-android) — Android app (Kotlin + Compose)
```

## Quick Start (Web)

```bash
npm install
copy .env.example .env   # fill in VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:3000
```

## Quick Start (Firmware)

1. Arduino IDE → Board: **ESP32 Dev Module**, core **2.0.17** (not 3.x)
2. Copy `firmware/AquaSafeMonitor/secrets.h.example` → `secrets.h`, fill in WiFi + API key
3. Upload `AquaSafeMonitor.ino`, open Serial Monitor at 115200 baud

## Web + Android Integration

The web dashboard and the Android app share the same backend:

| Aspect | Web | Android |
|-------|-----|---------|
| **Backend** | Supabase (JS client) | Supabase (Ktor REST) |
| **Data Source** | `sensor_data` + `devices` (join) | `sensor_data` (REST) |
| **WQI Algorithm** | Weighted average (0.3 pH + 0.25 TDS + 0.25 Turb + 0.2 Temp) | Identical |
| **Status Threshold** | >=80 VERY SUITABLE, >=60 SUITABLE, <60 DANGER | Identical |
| **Real-time** | Supabase Realtime (push) | 10-second polling |
| **Location** | Leaflet (tile server) | osmdroid (OpenStreetMap) |

### WQI Algorithm (Unified)

```
Sub-index pH:     100 if 6.5-8.5, interpolation 5.0-6.5 & 8.5-10.0
Sub-index TDS:    100 if <=300, interpolation 300-500
Sub-index Turb:   100 if <=1, interpolation 1-5
Sub-index Temp:   100 if 20-30°C
Weighted: pH*0.3 + TDS*0.25 + Turb*0.25 + Temp*0.2
```

This algorithm runs in the Edge Function (server-side) and is copied to the web client + Android for local calculation (test locations).*

## Design System

The dashboard uses design system v3.1 with a dark glassmorphism theme:

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface` | `#040810` | Main background |
| `--color-surface-deep` | `#060D1B` | Bottom gradient |
| `--color-panel` | `#0B1526` | Panel cards |
| `--color-panel-light` | `#13203A` | Hover cards |
| `--color-accent` | `#22D3EE` | Primary accent (cyan) |
| `--color-safe` | `#22C55E` | Safe status |
| `--color-warning` | `#F59E0B` | Warning status |
| `--color-danger` | `#EF4444` | Danger status |

### Typography
- **Inter** — UI text (labels, headings)
- **JetBrains Mono** — Data/numbers (`.font-data`, `.font-data-bold`)

### Glass Effects
- `.glass-panel` — main cards with backdrop blur
- `.glass-panel-hover` — hover effect with border glow
- `.glass-panel-mesh` — mesh gradient overlay

### Animations
- `.animate-fade-in` — screen entrance
- `.animate-slide-up` — slide up from below
- `.animate-pulse-soft` — soft pulse
- `.animate-shimmer` — loading skeleton
- `.animate-glow` — glow effect
- `.stagger-1` through `.stagger-6` — staggered delays

## Performance

The dashboard uses **code splitting** for optimal load time:

| Chunk | Size | When Loaded |
|-------|------|-------------|
| `index.js` (main) | 419 KB | Initial load |
| `SensorDetail.js` (recharts) | 404 KB | pH/Temperature/TDS/Turbidity tab |
| `TileLayer.js` (leaflet) | 154 KB | Overview map or settings |
| `Dashboard.js` | 47 KB | After login |
| `DeviceManager.js` | 14 KB | Devices tab |
| `LocationMap.js` | 14 KB | Overview tab |
| `AuthPage.js` | 10 KB | Login page |
| `LocationSettings.js` | 5 KB | Settings tab |

**Initial load: 419 KB (124 KB gzipped)** — 60% smaller than before optimization.

### Optimizations Applied
- React.lazy for route pages (AuthPage, Dashboard)
- React.lazy for heavy components (recharts, leaflet, supabase)
- Memoized computations (loadAlertConfig, dangerCount)
- Extracted StatusIndicator as React.memo
- Replaced window.confirm() with inline confirmation UI

## Important Notes

- **Never commit secrets**: `secrets.h`, `.env`, `pw-supabase.txt` (already in `.gitignore`)
- The dashboard displays **mock data** until a real device sends data
- Sensor calibration (pH/TDS/turbidity) is still pending — physical buffer solutions required
- See `SETUP_GUIDE.md` for pin wiring, calibration, and troubleshooting
