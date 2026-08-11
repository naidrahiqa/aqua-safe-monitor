# Session Notes — 2026-08-10

## Yang Dikerjakan Hari Ini

### 1. SD Card Debugging (Gagal)
- Coba ganti CS pin: 5, 15, 2, 4, 33 — semua gagal
- Coba speed fallback: 25MHz → 400kHz — semua gagal
- Coba MISO/MOSI swap — tetap gagal
- Coba 2 modul SD card berbeda — tetap gagal
- **Kesimpulan**: Masalah di wiring, bukan modul/kartu

### 2. Sensor TDS Mati
- TDS voltage 0.000V di calibration mode
- TDS sempat baca ~1500 ppm sebelumnya, lalu drop ke 0
- Kemungkinan kabel signal lepas waktu gonta-gari kabel SD

### 3. Wiring Plan Baru
- User provide pin layout ESP32 DevKit V1 30-pin:
  - Baris Atas: 3V3 GND D15 D2 D4 D16 D17 D5 D18 D19 D21 RX0 TX0 D22 D23
  - Baris Bawah: VIN GND D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN
- Buat `firmware/WIRING_PLAN.md` dengan:
  - Color coding (Merah=power, Hitam=GND, Kuning=analog, Biru=I2C, Hijau=SPI, Putih=OneWire)
  - Urutan wiring langkah demi langkah
  - Verifikasi untuk setiap sensor
  - Troubleshooting guide

### 4. Config.h Update
- SD card pins diupdate ke pin baru:
  - SCK = GPIO 14 (Bawah-5)
  - MISO = GPIO 12 (Bawah-4)
  - MOSI = GPIO 13 (Bawah-3)
  - CS = GPIO 5 (Atas-8)
- CALIBRATION_MODE di-revert ke 0

### 5. Dokumentasi Update
- `PROJECT_STATUS.md` — update pin mapping, status SD card, last updated date
- `HANDOVER.md` — update pin mapping, blocked items, yang bisa dikerjakan

## Status Akhir
- **SD Card**: BELUM BERHASIL — perlu rewire bersih
- **pH Sensor**: 0.000V — kabel signal lepas
- **TDS Sensor**: 0.000V — kabel signal lepas
- **Turbidity**: 2.991V — BEKERJA
- **LCD**: BEKERJA
- **WiFi**: BEKERJA

## Yang Perlu Dilakukan Selanjutnya
1. **Rewire semua** ikuti `firmware/WIRING_PLAN.md`
2. Upload `CALIBRATION_MODE 1`, cek semua sensor terbaca
3. Setelah sensor OK, test SD card
4. Kalibrasi sensor kalau buffer solution ada

## Referensi
- Pin mapping: `firmware/WIRING_PLAN.md`
- Config: `firmware/AquaSafeMonitor/config.h`
- Status: `PROJECT_STATUS.md`
- Handover: `HANDOVER.md`
