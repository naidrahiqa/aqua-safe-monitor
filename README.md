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

## Catatan Penting

- **Jangan commit secrets**: `secrets.h`, `.env`, `pw-supabase.txt` (sudah di `.gitignore`)
- Dashboard menampilkan **mock data** sampai ada perangkat nyata yang mengirim data
- Kalibrasi sensor (pH/TDS/turbidity) masih pending — butuh buffer solution fisik
- Lihat `SETUP_GUIDE.md` untuk wiring pin, kalibrasi, dan troubleshooting
