# WaterSafe Monitor — Project Status

## Last Updated: 2026-08-12

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

### Android App (Kotlin + Compose)
- [x] Project setup (Gradle 8.9, AGP 8.7.3, JDK 21)
- [x] Supabase REST API integration (Ktor Client + anon key)
- [x] Dashboard: WQI Hero Card + 4 Gauge Cards (pH, Suhu, TDS, Turbidity)
- [x] Safety indicator per gauge (hijau = aman, merah = di luar batas)
- [x] WQI status berwarna (hijau SANGAT_LAYAK, kuning LAYAK, merah BAHAYA)
- [x] Filter waktu (Semua / 1 Jam / 6 Jam / 24 Jam)
- [x] Sensor detail screen (tab per sensor + chart)
- [x] Polling data tiap 10 detik
- [x] RLS policy: public read (anon tanpa login)
- [x] Build & install ke device via ADB
- [x] **Map: Google Maps → osmdroid (OpenStreetMap)** — gratis tanpa API key; pin berwarna sesuai status air; tap peta untuk tandai titik
- [x] **UI/UX + design system overhaul** ("kotlin rasa Flutter"):
  - Gradien latar "night sky" di root, semua layar transparan di atasnya
  - Design system bersama: `PanelCard`, `SectionHeader`, `StatusPill` (dot berdenyut saat live)
  - Animasi spring + count-up: ring WQI sweep, angka gauge, kartu masuk layar
  - Bottom nav pill bar: ikon aktif membesar + glow, transisi layar fade+scale
  - Chart riwayat: area gradien di bawah garis

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
- **Status**: FAILED to initialize (wiring re-done 2026-08-10)
- **Current pin**: GPIO 5 (CS), GPIO 14 (SCK), GPIO 13 (MOSI), GPIO 12 (MISO) - HSPI
- **Card**: V-Gen 8GB (SDHC)
- **Power**: 5V from module
- **Error**: `[SD] Initializing on CS pin 5... FAILED`
- **Code fixes applied**:
  - `storage.cpp` now retries init at 25 / 8 / 1 / 0.4 MHz (SPI clock is
    the #1 cause of FAILED on breadboard/jumper wiring)
  - New diagnostic: `tools/sd_scanner/sd_scanner.ino` brute-forces
    HSPI/VSPI x CS(15,5,2,4) x 4 speeds and prints what works
- **Hardware tested**:
  - 2 different SD card modules (both failed)
  - Multiple CS pins tried (5, 15, 2, 4, 33)
  - MISO/MOSI swap tried
  - Both HSPI and VSPI buses tried
- **Next steps** (hardware):
  - **Rewire everything** using `firmware/WIRING_PLAN.md` (clean wiring from scratch)
  - Verify wiring with CALIBRATION_MODE before testing SD
  - If still fails → try different SD card (not just different module)
  - If ESP32 won't boot with module connected → MISO pull-up latches
    GPIO12 (strapping pin) at boot

---

## ❌ Not Done Yet

### Sensor Calibration (requires physical testing)
- [ ] **pH sensor calibration**
  - Current: reads 21.34 (~0V ADC → module unpowered or signal wire
    unplugged — verify with CALIBRATION_MODE; dry probe on powered
    module reads ~2.5V ≈ pH 7)
  - Needs: buffer solutions pH 4.0 and pH 7.0
  - Status: `CALIBRATION_MODE` ready in firmware (now prints computed
    pH/TDS/NTU + mV, averaged 64 samples), waiting for physical access
  - Procedure:
    1. Set `CALIBRATION_MODE 1` in config.h
    2. Upload firmware
    3. Dip sensor in pH 7.0 buffer, note V7 (stable)
    4. Dip sensor in pH 4.0 buffer, note V4
    5. slope = (7-4)/(V7-V4); offset = 7 - slope*V7 → update
       PH_CAL_SLOPE / PH_CAL_OFFSET, set CALIBRATION_MODE 0 (procedure
       also documented in config.h)

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

### Firmware Pin Mapping (config.h) — Updated 2026-08-10:
```
ESP32 DevKit V1 30-pin (dilihat dari bawah, Type-C kiri):

pH Sensor      → GPIO 32 (Bawah-10, ADC1_CH4)
TDS Sensor     → GPIO 34 (Bawah-12, ADC1_CH6, input-only)
Turbidity      → GPIO 35 (Bawah-11, ADC1_CH7, input-only)
DS18B20        → GPIO 4  (Atas-5, OneWire + 4.7kΩ pull-up)
LCD I2C SDA    → GPIO 21 (Atas-11)
LCD I2C SCL    → GPIO 22 (Atas-14)
SD Card SCK    → GPIO 14 (Bawah-5, HSPI)
SD Card MISO   → GPIO 12 (Bawah-4, HSPI)
SD Card MOSI   → GPIO 13 (Bawah-3, HSPI)
SD Card CS     → GPIO 5  (Atas-8, HSPI)
Buzzer         → GPIO 27 (Bawah-6, pending transistor)
```

### ESP32 DevKit V1 30-Pin Layout:
```
Baris Atas (dari kiri): 3V3 GND D15 D2 D4 D16 D17 D5 D18 D19 D21 RX0 TX0 D22 D23
Baris Bawah (dari kiri): VIN GND D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN
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
