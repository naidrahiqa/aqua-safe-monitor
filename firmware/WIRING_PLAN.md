# AquaSafe Monitor — Wiring Plan (OPSI 2026)
# Ikuti plan ini dari awal. Satu per satu.

---

## 0. KABEL YANG DIBUTUHKAN

| Warna | Fungsi |
|-------|--------|
| **Merah** | VCC / 5V / 3.3V (power) |
| **Hitam** | GND (ground) |
| **Kuning** | Analog signal (pH, TDS, Turbidity) |
| **Biru** | I2C (SDA, SCL) |
| **Hijau** | SPI (SCK, MISO, MOSI, CS) |
| **Putih** | OneWire (DS18B20 data) |
| **Oranye** | Buzzer |

Panjang kabel sekitar 10-15cm. Jangan terlalu panjang (noise) atau terlalu pendek (susah solder).

---

## 1. ESP32 DEVKIT V1 30-PIN LAYOUT

**Dilihat dari sisi BAWAH (kaki pin), Type-C di kiri:**

### Baris Atas (15 pin, dari kiri ke kanan):

| Posisi | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|--------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|
| Pin    |3V3|GND|D15|D2 |D4 |D16|D17|D5 |D18|D19 |D21 |RX0 |TX0 |D22 |D23 |
| GPIO   | - | - |15 |2  |4  |16 |17 |5  |18 |19  |21  |3   |1   |22  |23  |

### Baris Bawah (15 pin, dari kiri ke kanan):

| Posisi | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|--------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|
| Pin    |VIN|GND|D13|D12|D14|D27|D26|D25|D33|D32 |D35 |D34 |VN  |VP  |EN  |
| GPIO   | - | - |13 |12 |14 |27 |26 |25 |33 |32  |35  |34  |39  |36  | -  |

> **Catatan:** RX0 = GPIO3, TX0 = GPIO1. Jangan pakai GPIO1 untuk MOSI (akan matikan Serial).

---

## 2. PIN MAP (Final)

| ESP32 GPIO | Posisi Board | Fungsi        | Sensor/Modul     | Kabel Warna |
|-----------|--------------|---------------|------------------|-------------|
| 32        | Bawah-10     | Analog In     | pH A0            | Kuning      |
| 34        | Bawah-12     | Analog In     | TDS A0           | Kuning      |
| 35        | Bawah-11     | Analog In     | Turbidity A0     | Kuning      |
| 4         | Atas-5       | OneWire Data  | DS18B20          | Putih       |
| 21        | Atas-11      | I2C SDA       | LCD SDA          | Biru        |
| 22        | Atas-14      | I2C SCL       | LCD SCL          | Biru        |
| 14        | Bawah-5      | SPI SCK       | SD SCK           | Hijau       |
| 12        | Bawah-4      | SPI MISO      | SD MISO          | Hijau       |
| 13        | Bawah-3      | SPI MOSI      | SD MOSI          | Hijau       |
| 5         | Atas-8       | SPI CS        | SD CS            | Hijau       |
| 27        | Bawah-6      | Digital Out   | Buzzer (+ transistor) | Oranye |
| 3.3V      | Atas-1       | Power         | LCD, pH, Turbidity, DS18B20 | Merah |
| 5V        | Bawah-1 (VIN)| Power         | SD module, TDS   | Merah       |
| GND       | Atas-2 / Bawah-2 | Ground    | Semua modul      | Hitam       |

---

## 3. URUTAN WIRING (Ikuti persis)

### Langkah 1: Power Rails
- **3V3 ESP32 (Atas posisi 1)** → rail kiri breadboard atas (untuk LCD, pH, Turbidity, DS18B20)
- **5V ESP32 (Bawah posisi 1 = VIN)** → rail kanan breadboard atas (untuk SD module, TDS)
- **GND ESP32 (Atas posisi 2 atau Bawah posisi 2)** → rail bawah breadboard (semua GND)
- Hubungkan kedua rail GND (atas + bawah) dengan kabel hitam

### Langkah 2: LCD I2C
| LCD Pin | ESP32 Pin | Posisi Board | Kabel |
|---------|-----------|--------------|-------|
| VCC     | 3.3V      | Atas-1       | Merah |
| GND     | GND       | Atas-2       | Hitam |
| SDA     | GPIO 21   | Atas-11      | Biru  |
| SCL     | GPIO 22   | Atas-14      | Biru  |

> **Verifikasi:** Upload i2c_scanner. Buka Serial Monitor. Harus muncul `Found device at 0x27` atau `0x3F`.

### Langkah 3: Sensor pH
| pH Pin    | ESP32 Pin | Posisi Board | Kabel |
|-----------|-----------|--------------|-------|
| VCC       | 3.3V      | Atas-1       | Merah |
| GND       | GND       | Atas-2       | Hitam |
| A0/Signal | GPIO 32   | Bawah-10     | Kuning|

> **Verifikasi:** Calibration mode. Serial harus baca voltage ~2.5V (dry probe) atau berubah saat dicelup. BUKAN 0.000V terus kalau modul powered.

### Langkah 4: Sensor TDS
| TDS Pin   | ESP32 Pin | Posisi Board | Kabel |
|-----------|-----------|--------------|-------|
| VCC       | 5V        | Bawah-1 (VIN)| Merah |
| GND       | GND       | Bawah-2      | Hitam |
| A0/Signal | GPIO 34   | Bawah-12     | Kuning|

> **Verifikasi:** Calibration mode. Voltage harus berubah saat probe dicelup air. 0.000V terus = signal wire lepas.

### Langkah 5: Sensor Turbidity
| Turbidity Pin | ESP32 Pin | Posisi Board | Kabel |
|---------------|-----------|--------------|-------|
| VCC           | 3.3V / 5V| Atas-1       | Merah |
| GND           | GND       | Atas-2       | Hitam |
| A0/Signal     | GPIO 35   | Bawah-11     | Kuning|

> **Verifikasi:** Sudah terbaca V~3.0 di Serial sebelumnya.

### Langkah 6: DS18B20 (Suhu)
| DS18B20 Pin | ESP32 Pin | Posisi Board | Kabel |
|-------------|-----------|--------------|-------|
| VCC (merah) | 3.3V      | Atas-1       | Merah |
| GND (hitam) | GND       | Atas-2       | Hitam |
| Data (kuning)| GPIO 4   | Atas-5       | Putih |

> **PENTING:** Pasang resistor **4.7kΩ** antara pin Data dan VCC (pull-up). Tanpa ini DS18B20 tidak akan terbaca.

### Langkah 7: SD Card Module
| SD Module Pin | ESP32 Pin | Posisi Board | Kabel |
|---------------|-----------|--------------|-------|
| VCC           | 5V        | Bawah-1 (VIN)| Merah |
| GND           | GND       | Bawah-2      | Hitam |
| SCK           | GPIO 14   | Bawah-5      | Hijau |
| MISO (DO)     | GPIO 12   | Bawah-4      | Hijau |
| MOSI (DI)     | GPIO 13   | Bawah-3      | Hijau |
| CS (SS)       | GPIO 5    | Atas-8       | Hijau |

> **Verifikasi:** Harus muncul `[SD] Initializing on CS pin 5... OK` di Serial Monitor.

### Langkah 8: Buzzer (Opsional)
| Buzzer Pin | Via | ESP32 Pin | Posisi Board | Kabel |
|------------|-----|-----------|--------------|-------|
| +          | 2N2222 transistor | GPIO 27 | Bawah-6 | Oranye |
| -          | --  | GND       | Bawah-2      | Hitam |

> Buzzer butuh transistor driver. Kalau belum ada transistor, skip dulu.

---

## 4. CHECKLIST VERIFIKASI

Setelah semua terpasang, upload firmware dengan `CALIBRATION_MODE 1`:

```bash
# Buka config.h, set:
#define CALIBRATION_MODE 1
```

Buka Serial Monitor 115200. Harus muncul:

| Baris | Yang Diharapkan |
|-------|-----------------|
| pH V  | ~2.5V (dry) atau berubah saat dicelup buffer |
| TDS V | berubah saat probe dicelup air |
| Turb V| ~3.0V (udara) atau berubah saat ada air |

Kalau **semua voltage 0.000V** → cek power rails, pastikan semua modul mendapat 3.3V/5V.
Kalau **1 sensor 0.000V** → cek kabel **analog signal** sensor itu.

Setelah semua sensor terbaca benar:
```bash
#define CALIBRATION_MODE 0
```
Upload ulang, lalu verifikasi SD card terbaca di Serial.

---

## 5. TROUBLESHOOTING CEPAT

| Masalah | Kemungkinan | Solusi |
|---------|-------------|--------|
| LCD blank | Alamat salah | Ganti `LCD_ADDR` ke 0x3F |
| pH 21.34 | Signal wire lepas | Cek kabel GPIO 32 (Bawah-10) |
| TDS 0.0 ppm | Signal wire lepas | Cek kabel GPIO 34 (Bawah-12) |
| SD: ERR | Wiring SPI salah | Cek SCK(14)/MISO(12)/MOSI(13)/CS(5) |
| DS18B20 -127°C | Pull-up resistor hilang | Pasang 4.7kΩ Data→VCC |
| WiFi timeout | Belum config secrets.h | Isi WiFi credential |

---

## 6. REFERENCE: GPIO YANG TERSEDIA

| GPIO | Posisi | Fungsi | Catatan |
|------|--------|--------|---------|
| 1 | Atas-13 | TX0 | Jangan dipakai (Serial TX) |
| 2 | Atas-4 | Digital I/O | - |
| 3 | Atas-12 | RX0 | Jangan dipakai (Serial RX) |
| 4 | Atas-5 | Digital I/O | DS18B20 |
| 5 | Atas-8 | Digital I/O | SD CS |
| 12 | Bawah-4 | Digital I/O | SD MISO |
| 13 | Bawah-3 | Digital I/O | SD MOSI |
| 14 | Bawah-5 | Digital I/O | SD SCK |
| 15 | Atas-3 | Digital I/O | - |
| 16 | Atas-6 | Digital I/O | - |
| 17 | Atas-7 | Digital I/O | - |
| 18 | Atas-9 | Digital I/O | - |
| 19 | Atas-10 | Digital I/O | - |
| 21 | Atas-11 | Digital I/O | LCD SDA |
| 22 | Atas-14 | Digital I/O | LCD SCL |
| 23 | Atas-15 | Digital I/O | - |
| 25 | Bawah-8 | ADC2 / Digital | - |
| 26 | Bawah-7 | ADC2 / Digital | - |
| 27 | Bawah-6 | ADC2 / Digital | Buzzer |
| 32 | Bawah-10 | ADC1 / Digital | pH sensor |
| 33 | Bawah-9 | ADC1 / Digital | - |
| 34 | Bawah-12 | ADC1 (input only) | TDS sensor |
| 35 | Bawah-11 | ADC1 (input only) | Turbidity sensor |
| 36 (VP) | Bawah-14 | ADC1 (input only) | - |
| 39 (VN) | Bawah-13 | ADC1 (input only) | - |
