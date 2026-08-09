# WaterSafe Monitor — Project Status

## Last Updated: 2026-08-09

---

## ✅ Completed

### Backend (Supabase)
- [x] Supabase project created (`dohhcabunjojfdqcgicw`)
- [x] Database schema deployed (devices, sensor_data tables)
- [x] Edge function `ingest-sensor-data` deployed
- [x] Email confirmation disabled (bisa daftar tanpa verifikasi)
- [x] Device registered (`Aqua Safe Monitor #1`)
- [x] API key generated

### Web Dashboard (React + Vite)
- [x] Project setup (React 19, Vite, Tailwind, Supabase client)
- [x] Authentication page (login/register)
- [x] Dashboard with real-time charts
- [x] Device management
- [x] Location map (Leaflet)
- [x] `.env` configured with correct Supabase credentials
- [x] Dev server running on `localhost:3000`
- [x] Gauge cards (semicircle SVG) dengan safe-range dari AlertSettings
- [x] Map picker (klik/drag untuk set lokasi)
- [x] Export data ke CSV (separator `;` + UTF-8 BOM)
- [x] Indikator status real-time (Online / Tidak update / Menunggu)
- [x] Sorting kolom di tabel data
- [x] Alert settings (threshold pH/TDS/turbidity) — **client-side localStorage saja** (`watersafe-alert-config`); threshold edge function di server TIDAK berubah
- [x] Notifikasi bisa di-dismiss per item / semua, persist ke localStorage (`watersafe-dismissed-notifs`)

### Firmware (ESP32)
- [x] WiFi connection working
- [x] Sensor reading (pH, TDS, Turbidity, Temperature)
- [x] Data sent to Supabase every 15 seconds
- [x] LCD display working — splash + 2 layar berputar tiap 4s + layar `!! WARNING !!` saat alert
- [x] Offline mode (continues reading sensors without WiFi)
- [x] Value clamping (pH 0-14, TDS >= 0, Turbidity >= 0)

---

## ⚠️ Partially Working

### SD Card Logging
- **Status**: FAILED to initialize
- **Current pin**: GPIO 15 (CS), GPIO 14 (SCK), GPIO 13 (MOSI), GPIO 12 (MISO) - HSPI
- **Card**: V-Gen 8GB (SDHC)
- **Power**: 5V from module
- **Error**: `[SD] Initializing on CS pin 15... FAILED`
- **Tried**:
  - GPIO 5 (VSPI) → FAILED
  - GPIO 15 (VSPI) → FAILED
  - GPIO 15 (HSPI) → FAILED
  - FAT32 format (non-quick) → still FAILED
- **Next steps**:
  - Check MOSI/MISO wiring order
  - Try different CS pin (GPIO 2, 4)
  - Test with different SD card
  - Check solder joints on SD card module

---

## ❌ Not Done Yet

### Sensor Calibration (requires physical testing)
- [ ] **pH sensor calibration**
  - Current: reads 21.34 (placeholder offset)
  - Needs: buffer solutions pH 4.0 and pH 7.0
  - Status: `CALIBRATION_MODE` ready in firmware, waiting for physical access
  - Procedure:
    1. Set `CALIBRATION_MODE 1` in config.h
    2. Upload firmware
    3. Dip sensor in pH 4.0 buffer, note voltage
    4. Dip sensor in pH 7.0 buffer, note voltage
    5. Calculate slope & offset
    6. Update PH_CAL_SLOPE and PH_CAL_OFFSET

- [ ] **TDS sensor calibration**
  - Current: reads 0.0ppm
  - Needs: TDS calibration solution (known ppm)
  - Status: using standard DFRobot formula, may need adjustment

- [ ] **Turbidity sensor calibration**
  - Current: reads 3000 NTU (max/out of range)
  - Needs: clear water (~0 NTU) for zero calibration
  - Status: using SEN0189 formula, needs real calibration

### Hardware
- [ ] ON/OFF switch not installed
- [ ] Buzzer transistor (2N2222) not soldered
- [ ] Battery percentage not implemented (no voltage divider)

### Documentation
- [x] Setup guide created (`SETUP_GUIDE.md`)
- [x] This status file
- [ ] User manual for demo day

---

## 🔧 Current Configuration

### Firmware Pin Mapping (config.h):
```
pH Sensor      → GPIO 32 (ADC1_CH4)
TDS Sensor     → GPIO 34 (ADC1_CH6, input-only)
Turbidity      → GPIO 35 (ADC1_CH7, input-only)
DS18B20        → GPIO 4  (OneWire)
LCD I2C SDA    → GPIO 21
LCD I2C SCL    → GPIO 22
SD Card MISO   → GPIO 12 (HSPI)
SD Card MOSI   → GPIO 13 (HSPI)
SD Card SCK    → GPIO 14 (HSPI)
SD Card CS     → GPIO 15 (HSPI)
Buzzer         → GPIO 27 (pending)
```

### Calibration Values (config.h) - PLACEHOLDER:
```cpp
#define PH_CAL_SLOPE  -5.70
#define PH_CAL_OFFSET 21.34  // ← This is why pH reads 21.34
```

---

## 📋 Next Session Checklist

When continuing development:

1. **Test SD card** with different wiring/pins
2. **Calibrate pH sensor** (needs buffer solutions)
3. **Calibrate TDS sensor** (needs TDS solution)
4. **Calibrate turbidity** (needs clear water)
5. **Install buzzer** with transistor
6. **Test offline mode** (disconnect WiFi, verify SD logging)
7. **Demo preparation** (clean dashboard, test flow)

---

## 🗂️ Files to Backup (for device migration)

```
opsi/
├── firmware/AquaSafeMonitor/
│   ├── AquaSafeMonitor.ino
│   ├── config.h
│   ├── secrets.h          ← DO NOT COMMIT (gitignored)
│   ├── sensors.cpp/h
│   ├── display.cpp/h
│   ├── storage.cpp/h
│   ├── network.cpp/h
│   └── alerts.cpp/h
├── src/                   (web app source)
├── supabase/config.toml
├── .env                   ← DO NOT COMMIT (gitignored)
├── .env.example
├── package.json
├── SETUP_GUIDE.md
└── PROJECT_STATUS.md      ← This file
```
