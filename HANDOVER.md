# HANDOVER — AquaSafeMonitor (OPSI 2026)

> Berikan file ini ke AI saat mulai sesi di device baru.
> Referensi cepat: `.opencode/AGENTS.md`, `SETUP_GUIDE.md`, `PROJECT_STATUS.md`, `SETUP_CHECKLIST.md`.

## Identitas Proyek
- **Repo**: https://github.com/naidrahiqa/aqua_safe_monitor_opsi_2026 (branch `main`, sudah ter-push)
- **Stack**: ESP32 (Arduino IDE) → Supabase (Postgres + edge function `ingest-sensor-data`) → React 19 + Vite + TS + Tailwind + Leaflet
- **Supabase project ref**: `dohhcabunjojfdqcgicw` — URL: https://dohhcabunjojfdqcgicw.supabase.co
- **Web dev**: `npm run dev` → http://localhost:3000

## Status Terakhir (2026-08-10) — Wiring Re-do In Progress

### Dashboard (React)
- GaugeCard (SVG semicircle, safe-range dari AlertSettings), MapPicker (klik/drag set lokasi), Export CSV (`;` + UTF-8 BOM), sorting kolom tabel, indikator real-time (Online / Tidak update / Menunggu)
- AlertSettings → **client-side localStorage saja** (`watersafe-alert-config`); threshold edge function di server TIDAK berubah
- NotificationPanel dismiss per-item/semua, persist localStorage (`watersafe-dismissed-notifs`)
- **Build hijau** — `npm run build` = `tsc -b && vite build` (JANGAN cuma `vite build`)

### Firmware (ESP32)
- LCD I2C bekerja: alamat 0x27, SDA 21, SCL 22 (blank → run `tools/i2c_scanner`, coba 0x3F); splash + 2 layar berputar tiap 4s + layar `!! WARNING !!` saat alert
- Cloud send tiap 15 detik; `CALIBRATION_MODE 1` untuk kalibrasi (print raw ADC/voltage)
- **Pin mapping baru** (config.h, updated 2026-08-10):
  - pH → GPIO 32 (Bawah-10)
  - TDS → GPIO 34 (Bawah-12)
  - Turbidity → GPIO 35 (Bawah-11)
  - DS18B20 → GPIO 4 (Atas-5) + 4.7kΩ pull-up
  - LCD → SDA GPIO 21 (Atas-11), SCL GPIO 22 (Atas-14)
  - SD HSPI → SCK GPIO 14 (Bawah-5), MISO GPIO 12 (Bawah-4), MOSI GPIO 13 (Bawah-3), CS GPIO 5 (Atas-8)
  - Buzzer → GPIO 27 (Bawah-6, pending transistor)

### ESP32 DevKit V1 30-Pin Layout:
```
Baris Atas (dari kiri): 3V3 GND D15 D2 D4 D16 D17 D5 D18 D19 D21 RX0 TX0 D22 D23
Baris Bawah (dari kiri): VIN GND D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN
```

### Lain-lain
- Sudah di-push ke GitHub (3 commit: UI, firmware, docs); `.gitignore` sudah di-hardening
- README.md sudah diperbaiki ke UTF-8 (sebelumnya UTF-16 LE rusak)

## Blocked / Pending (butuh hardware fisik — bukan software)
1. **Rewire semua sensor & SD card** — ikuti `firmware/WIRING_PLAN.md` (pin mapping baru, color coding, urutan wiring)
2. **Kalibrasi sensor**: pH baca ~21.34 (placeholder `PH_CAL_SLOPE -5.70` / `PH_CAL_OFFSET 21.34`), TDS 0 ppm, turbidity ~3000 — butuh buffer solution (pH 4/7/10, TDS 342 ppm, turbidity 5/50 NTU)
3. **SD card init FAILED**: sudah coba 2 modul berbeda, semua CS pin, HSPI/VSPI — rewire bersih dulu, kalau masih gagal coba kartu SD berbeda
4. **Buzzer**: butuh transistor 2N2222 (firmware siap)
5. **ON/OFF switch** belum dipasang

## Yang Bisa Dikerjakan Besok (prioritas)
1. **Rewire semua** ikuti `firmware/WIRING_PLAN.md` — pin mapping baru, color coding, urutan wiring
2. Upload firmware `CALIBRATION_MODE 1`, cek semua sensor terbaca (voltage bukan 0.000V)
3. Setelah sensor OK, test SD card
4. Deploy web ke **Vercel** (user deploy manual; env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
5. Kalibrasi sensor kalau buffer solution sudah ada
6. Persiapan demo: user manual, test alur lengkap (login → data real → alert → export)

## GOTCHA — Jangan Dilanggar
- **JANGAN commit**: `firmware/AquaSafeMonitor/secrets.h`, `.env`, `pw-supabase.txt`, `supabase/.temp/`, `.opencode/` (kecuali `AGENTS.md`)
- **ESP32 core 2.0.17** — JANGAN pakai 3.x (bug WiFi library)
- Alert thresholds firmware: pH 6.5–8.5, TDS ≤500, turbidity ≤5 — harus sinkron dengan sub-index WQI di edge function
- Edge function `verify_jwt = false`; ESP32 pakai `secret_api_key` (dari tabel `devices`) sebagai bearer token
- Data dashboard = mock (`src/data/mockData.ts`) kalau belum ada data real — jangan bingung mock vs live

## Setup Device Baru
```bash
git clone https://github.com/naidrahiqa/aqua_safe_monitor_opsi_2026.git
cd aqua_safe_monitor_opsi_2026
npm install
copy .env.example .env        # isi kredensial (atau salin dari flashdrive)
```
- Arduino IDE: Board **ESP32 Dev Module**, core **2.0.17**, baud Serial Monitor 115200
- **Flashdrive G:\opsi** berisi salinan lengkap termasuk `.env` & `secrets.h` asli + `.git` (bisa langsung dipakai / pull-push)
- Catatan: salinan `.opencode/` di flashdrive **tidak lengkap** (copy di-abort) — install ulang skill dari repo GitHub: ponytail, graphify, awesome-claude-skills, agent-skills
