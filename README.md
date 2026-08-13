# AquaSafeMonitor — OPSI 2026

Sistem monitoring kualitas air real-time berbasis IoT.

- **ESP32** — membaca sensor pH, TDS, Turbidity, dan Suhu (DS18B20), menampilkan ke LCD, mengirim data ke cloud
- **Supabase** — backend (PostgreSQL + edge function `ingest-sensor-data`)
- **React + Vite + TypeScript + Tailwind + Leaflet** — web dashboard
- **Kotlin + Jetpack Compose** — Android app ([opsi-andro](../opsi-andro/))

## Struktur

```
├── firmware/AquaSafeMonitor/   # Firmware ESP32 (Arduino IDE)
├── src/                        # Web dashboard (React + Vite)
│   ├── components/             # UI components (GaugeCard, DataTable, etc.)
│   ├── contexts/               # React context (Auth, SensorData)
│   ├── hooks/                  # Custom hooks (useTestLocations)
│   ├── lib/                    # Utilities (supabase, alertConfig, exportCSV)
│   ├── pages/                  # Route pages (Dashboard, AuthPage)
│   └── index.css               # Design system v3.1 (colors, glass, animations)
├── supabase/                   # Schema SQL + edge function + config CLI
├── tools/i2c_scanner/          # Sketsa Arduino untuk scan alamat I2C (debug LCD)
├── SETUP_GUIDE.md              # Panduan setup lengkap dari 0 (Bahasa Indonesia)
├── SETUP_CHECKLIST.md          # Checklist menghubungkan backend Supabase asli
├── PROJECT_STATUS.md           # Status proyek terkini (selesai / pending / blocked)
└── ../opsi-andro/              # Android app (Kotlin + Compose) — lihat README di sana
```

## Quick Start (Web)

```bash
npm install
copy .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:3000
```

## Quick Start (Firmware)

1. Arduino IDE → Board: **ESP32 Dev Module**, core **2.0.17** (jangan 3.x)
2. Copy `firmware/AquaSafeMonitor/secrets.h.example` → `secrets.h`, isi WiFi + API key
3. Upload `AquaSafeMonitor.ino`, buka Serial Monitor 115200 baud

## Design System

Dashboard menggunakan design system v3.1 dengan dark glassmorphism theme:

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-surface` | `#040810` | Background utama |
| `--color-surface-deep` | `#060D1B` | Gradient bawah |
| `--color-panel` | `#0B1526` | Kartu panel |
| `--color-panel-light` | `#13203A` | Kartu hover |
| `--color-accent` | `#22D3EE` | Aksen utama (cyan) |
| `--color-safe` | `#22C55E` | Status aman |
| `--color-warning` | `#F59E0B` | Status peringatan |
| `--color-danger` | `#EF4444` | Status bahaya |

### Typography
- **Inter** — UI text (labels, headings)
- **JetBrains Mono** — Data/numbers (`.font-data`, `.font-data-bold`)

### Glass Effects
- `.glass-panel` — kartu utama dengan backdrop-blur
- `.glass-panel-hover` — efek hover dengan border glow
- `.glass-panel-mesh` — mesh gradient overlay

### Animations
- `.animate-fade-in` — masuk layar
- `.animate-slide-up` — geser dari bawah
- `.animate-pulse-soft` — denyut lembut
- `.animate-shimmer` — loading skeleton
- `.animate-glow` — efek bercahaya
- `.stagger-1` hingga `.stagger-6` — delay bertahap

## Performance

Dashboard menggunakan **code splitting** untuk load time optimal:

| Chunk | Size | When Loaded |
|-------|------|-------------|
| `index.js` (main) | 419 KB | Initial load |
| `SensorDetail.js` (recharts) | 404 KB | pH/Suhu/TDS/Turbidity tab |
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

## Catatan Penting

- **Jangan commit secrets**: `secrets.h`, `.env`, `pw-supabase.txt` (sudah di `.gitignore`)
- Dashboard menampilkan **mock data** sampai ada perangkat nyata yang mengirim data
- Kalibrasi sensor (pH/TDS/turbidity) masih pending — butuh buffer solution fisik
- Lihat `SETUP_GUIDE.md` untuk wiring pin, kalibrasi, dan troubleshooting
