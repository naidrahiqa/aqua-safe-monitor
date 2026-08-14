#ifndef CONFIG_H
#define CONFIG_H

// ===== CALIBRATION / DEBUG MODE =====
// Set to 1 to skip normal operation and just print raw ADC + voltage
// for pH/TDS/Turbidity every 500ms, so you can dip probes in buffer
// / standard solutions and read stable values off Serial Monitor.
#define CALIBRATION_MODE 1

// ===== SENSOR PINS (must match physical wiring - see
//       .opencode/skills/HARDWARE_INTEGRATION.md) =====
#define PIN_PH        32   // ADC1_CH4, analog pH probe
#define PIN_TDS       34   // ADC1_CH6, analog TDS probe (input-only pin)
#define PIN_TURBIDITY 35   // ADC1_CH7, analog turbidity probe (input-only pin)
#define PIN_DS18B20   4    // OneWire data bus, + external 4.7k pull-up to VCC

// ===== LCD (I2C, PCF8574 backpack) =====
#define LCD_SDA  21
#define LCD_SCL  22
#define LCD_ADDR 0x27      // If display stays blank with backlight on,
                            // run tools/i2c_scanner and try 0x3F instead.
#define LCD_COLS 16
#define LCD_ROWS 2

// ===== SD CARD =====
// storage_init() retries at 25 / 8 / 1 / 0.4 MHz automatically.
// Physical wiring: SCK=9, MISO=10, MOSI=11, CS=8.
#define SD_SCK  25
#define SD_MISO 26
#define SD_MOSI 13
#define SD_CS   33

// ===== BUZZER =====
// Pending: needs 2N2222 transistor (in transit). Firmware side is
// ready — wire it up per HARDWARE_INTEGRATION.md and it just works.
#define PIN_BUZZER 27

// ===== TIMING =====
#define SERIAL_BAUD               115200
#define SENSOR_READ_INTERVAL_MS   1000
#define LCD_SCREEN_CYCLE_MS       4000
#define SD_LOG_INTERVAL_MS        30000
#define CLOUD_SEND_INTERVAL_MS    15000
#define WIFI_CONNECT_TIMEOUT_MS   8000
#define WIFI_RETRY_INTERVAL_MS    60000

// ===== ADC REFERENCE =====
#define ADC_VOLTAGE_REF  3.3
#define ADC_MAX_VALUE    4095.0

// ===== pH CALIBRATION — PLACEHOLDER, DO NOT TRUST =====
// pH = PH_CAL_SLOPE * voltage + PH_CAL_OFFSET
// Procedure (needs pH 4.0 + 7.0 buffer solutions):
//   1. Set CALIBRATION_MODE 1, upload, open Serial @ 115200.
//   2. Dip probe in pH 7.0 buffer, wait until stable, note V7.
//   3. Rinse, dip in pH 4.0 buffer, note V4.
//   4. slope = (7 - 4) / (V7 - V4);  offset = 7 - slope * V7.
//   5. Fill values in below, set CALIBRATION_MODE 0, re-upload.
// Note: pH ~21.34 exactly means the ADC reads 0V -> module unpowered
// or signal wire unplugged (dry probe on powered module reads ~2.5V).
#define PH_CAL_SLOPE  -5.70
#define PH_CAL_OFFSET 21.34

// ===== TDS =====
#define TDS_TEMP_DEFAULT 25.0   // fallback compensation temp if DS18B20 read fails

// ===== ALERT THRESHOLDS =====
// Mirrors the sub-index boundaries used by the server-side WQI
// calculator (supabase/functions/ingest-sensor-data/index.ts) so the
// on-device buzzer/LCD alert and the dashboard's "BAHAYA" status
// agree with each other.
#define PH_MIN_SAFE        6.5
#define PH_MAX_SAFE        8.5
#define TDS_MAX_SAFE       500.0
#define TURBIDITY_MAX_SAFE 5.0

#endif
