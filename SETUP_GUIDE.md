# WaterSafe Monitor — Setup Guide Lengkap (Dari 0)

## Table of Contents
1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Supabase Setup](#3-supabase-setup)
4. [Web App Setup](#4-web-app-setup)
5. [Arduino IDE Setup](#5-arduino-ide-setup)
6. [Hardware Wiring](#6-hardware-wiring)
7. [Firmware Upload](#7-firmware-upload)
8. [Testing & Verification](#8-testing--verification)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

Sistem monitoring kualitas air real-time:
- **ESP32** → baca sensor pH, TDS, Turbidity, Suhu
- **Supabase** → backend (database + edge function)
- **React + Vite** → web dashboard
- **Kotlin + Compose** → Android app ([aqua-safe-monitor-android](https://github.com/naidrahiqa/aqua-safe-monitor-android))

---

## 2. Prerequisites

### Software yang harus di-install:
| Software | Version | Link |
|----------|---------|------|
| Arduino IDE | 2.3.x | https://www.arduino.cc/en/software |
| Node.js | 18+ | https://nodejs.org |
| Git | latest | https://git-scm.com |

### Arduino IDE yang harus di-install:
- Board package: **esp32 by Espressif Systems** versi **2.0.17**
- Libraries:
  - `OneWire` (built-in with ESP32 core)
  - `DallasTemperature` (by Miles Burton)
  - `LiquidCrystal_I2C` (by Frank de Brabander)

---

## 3. Supabase Setup

### 3.1 Buka Supabase Dashboard
```
https://supabase.com/dashboard/project/dohhcabunjojfdqcgicw
```

### 3.2 Disable Email Confirmation (biar bisa daftar tanpa verifikasi)
1. Go to **Authentication → Providers → Email**
2. Toggle OFF **"Confirm email"**
3. Save

### 3.3 Ambil API Keys
1. Go to **Settings → API**
2. Copy **Project URL**: `https://dohhcabunjojfdqcgicw.supabase.co`
3. Copy **anon public key** (format JWT panjang: `eyJhbGciOiJIUzI1NiIs...`)

### 3.4 Create Device (Register ESP32)
1. Go to **SQL Editor**
2. Paste ini, klik Run:
```sql
INSERT INTO public.devices (user_id, device_name, secret_api_key, location_lat, location_lng, is_active)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Aqua Safe Monitor #1',
  gen_random_uuid(),
  -6.9175,
  107.6191,
  true
);
```
3. Go to **Table Editor → devices**
4. Copy value di kolom `secret_api_key` (UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## 4. Web App Setup

### 4.1 Clone & Install
```bash
git clone https://github.com/naidrahiqa/aqua-safe-monitor.git
cd aqua-safe-monitor
npm install
```

### 4.2 Configure Environment
```bash
copy .env.example .env
```
Edit `.env`, isi:
```
VITE_SUPABASE_URL=https://dohhcabunjojfdqcgicw.supabase.co
VITE_SUPABASE_ANON_KEY=<paste-anon-key-dari-step-3.3>
```

### 4.3 Run Dev Server
```bash
npm run dev
```
Buka browser: `http://localhost:3000`

### 4.4 Create Account
1. Masuk email & password (bisa dummy asal format email valid, misal `test@gmail.com`)
2. Klik **Daftar**
3. Login

---

## 5. Arduino IDE Setup

### 5.1 Install ESP32 Board Package
1. Buka Arduino IDE
2. **File → Preferences**
3. Di "Additional Boards Manager URLs", paste:
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
4. Klik OK
5. **Tools → Board → Boards Manager**
6. Cari "esp32" by Espressif Systems
7. Pilih versi **2.0.17** (JANGAN 3.x, ada bug)
8. Klik **Install**

### 5.2 Install Libraries
1. **Sketch → Include Library → Manage Libraries**
2. Cari & install:
   - `DallasTemperature` by Miles Burton
   - `LiquidCrystal_I2C` by Frank de Brabander

### 5.3 Configure Board
1. **Tools → Board → esp32 → ESP32 Dev Module**
2. **Tools → Port** → pilih COM port ESP32 (colok dulu USB-nya)
3. Pastikan settings:
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Flash Size: 4MB
   - Partition Scheme: Default 4MB with spiffs

---

## 6. Hardware Wiring

### Pin Mapping ESP32 Dev Module:
```
pH Sensor (analog)    → GPIO 32 (ADC1_CH4)
TDS Sensor (analog)   → GPIO 34 (ADC1_CH6, input-only)
Turbidity (analog)    → GPIO 35 (ADC1_CH7, input-only)
DS18B20 (OneWire)     → GPIO 4  (+ 4.7kΩ pull-up ke 3.3V)
LCD I2C SDA           → GPIO 21
LCD I2C SCL           → GPIO 22
SD Card MISO          → GPIO 12 (HSPI)
SD Card MOSI          → GPIO 13 (HSPI)
SD Card SCK           → GPIO 14 (HSPI)
SD Card CS            → GPIO 15 (HSPI)
Buzzer (optional)     → GPIO 27
```

### Power:
```
Sensor VCC  → 3.3V atau 5V (cek sensor masing-masing)
Sensor GND  → GND
LCD VCC     → 5V
LCD GND     → GND
SD VCC      → 3.3V
SD GND      → GND
```

---

## 7. Firmware Upload

### 7.1 Setup Secrets
1. Buka folder `firmware/AquaSafeMonitor/`
2. Copy `secrets.h.example` → `secrets.h`
3. Edit `secrets.h`:
```cpp
#define WIFI_SSID     "nama-wifi-lo"
#define WIFI_PASSWORD "password-wifi-lo"
#define API_KEY       "paste-UUID-dari-step-3.4"
#define ENDPOINT      "https://dohhcabunjojfdqcgicw.supabase.co/functions/v1/ingest-sensor-data"
```

### 7.2 Open & Upload
1. Buka `firmware/AquaSafeMonitor/AquaSafeMonitor.ino` di Arduino IDE
2. Klik tombol **Upload** (→)
3. Tunggu sampai "Done uploading"

### 7.3 Verify
1. Buka **Serial Monitor** (magnifying glass icon)
2. Set baud rate: **115200**
3. Reset ESP32 (tekan tombol RST)
4. Output yang diharapkan:
```
Aqua Safe Monitor - OPSI 2026 booting...
Connecting WiFi...
WiFi connected - cloud sync enabled.
pH:7.02 TDS:125.3ppm Turb:2.1NTU Temp:28.50C WiFi:OK SD:OK
[network] reading sent OK
```

---

## 8. Testing & Verification

### Cek Data Masuk ke Supabase:
1. Buka Supabase Dashboard
2. Go to **Table Editor → sensor_data**
3. Harus ada data baru dengan timestamp sekarang

### Cek di Web Dashboard:
1. Buka `http://localhost:3000`
2. Login
3. Dashboard harus menampilkan data real-time

### Kalibrasi Sensor (Optional):
1. Edit `firmware/AquaSafeMonitor/config.h`:
   - Set `CALIBRATION_MODE` ke `1`
2. Upload ulang firmware
3. Buka Serial Monitor
4. Masukkan sensor pH ke buffer solution pH 4.0, catat voltage
5. Masukkan ke buffer solution pH 7.0, catat voltage
6. Hitung slope & offset:
   ```
   slope = (7.0 - 4.0) / (voltage_pH7 - voltage_pH4)
   offset = 7.0 - (slope * voltage_pH7)
   ```
7. Update di `config.h`:
   ```cpp
   #define PH_CAL_SLOPE  <slope-baru>
   #define PH_CAL_OFFSET <offset-baru>
   ```
8. Set `CALIBRATION_MODE` ke `0`, upload ulang

---

## 9. Troubleshooting

### WiFi Gak Connect:
- Cek SSID & password di `secrets.h`
- Pastikan WiFi 2.4GHz (ESP32 gak support 5GHz)
- Cek jarak dari router

### SD Card Error:
- Format SD card FAT32 (jangan quick format)
- Cek wiring: MISO/MOSI/SCK/CS
- Cek kapasitas: max 32GB

### pH Sensor Nilai Salah:
- Pastikan sudah kalibrasi (lihat step 8)
- Cek koneksi kabel analog ke GPIO 32
- Cek apakah sensor terendam air

### Data Gak Masuk Supabase:
- Cek Serial Monitor: `[network] POST failed, http code=xxx`
- Pastikan `API_KEY` di `secrets.h` sama dengan `secret_api_key` di database
- Pastikan edge function `ingest-sensor-data` sudah di-deploy

### Web App Gak Jalan:
- Pastikan `.env` sudah diisi dengan benar
- Jalankan `npm install` ulang
- Cek browser console (F12) untuk error message

### Arduino IDE Error:
- **JANGAN pake ESP32 core versi 3.x** (ada bug WiFi library)
- Pake versi **2.0.17** yang stable
- Kalau error aneh, restart Arduino IDE

---

## Quick Reference

### Folder Structure:
```
aqua-safe-monitor/
├── firmware/
│   └── AquaSafeMonitor/
│       ├── AquaSafeMonitor.ino    # Main firmware
│       ├── config.h               # Pin mapping & settings
│       ├── secrets.h              # WiFi & API credentials (GITIGNORED)
│       ├── sensors.cpp/h          # Sensor reading functions
│       ├── display.cpp/h          # LCD display functions
│       ├── storage.cpp/h          # SD card logging
│       ├── network.cpp/h          # WiFi & HTTP functions
│       └── alerts.cpp/h           # Buzzer & alert logic
├── src/                           # React web app
│   ├── pages/
│   ├── components/
│   ├── contexts/
│   └── lib/
├── supabase/
│   └── config.toml                # Edge function config
├── .env                           # Supabase credentials (GITIGNORED)
├── package.json
└── SETUP_GUIDE.md                 # This file
```

### Important Notes:
- `secrets.h` dan `.env` **JANGAN di-commit** ke git (sudah ada di .gitignore)
- WiFi harus 2.4GHz
- Sensor pH perlu kalibrasi untuk data akurat
- SD card log tetap jalan walau gak ada WiFi (offline mode)
- Data dikirim ke cloud setiap 15 detik (bisa diubah di `config.h`)
