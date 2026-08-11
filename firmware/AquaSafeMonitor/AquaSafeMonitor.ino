// ===================================================================
// Aqua Safe Monitor — OPSI 2026
// ESP32 firmware: reads pH/TDS/Turbidity/Temperature, shows on LCD,
// logs to microSD (always), and syncs to the WaterSafe-Monitor
// Supabase backend over WiFi when available.
//
// Board: ESP32 Dev Module
// Libraries required: OneWire, DallasTemperature, LiquidCrystal_I2C
//   (Frank de Brabander build), plus WiFi/HTTPClient/SD/SPI which
//   ship with the ESP32 Arduino core.
//
// Before uploading: copy secrets.h.example -> secrets.h and fill in
// your WiFi + Supabase device credentials. secrets.h is gitignored.
// ===================================================================

#include "config.h"
#include "sensors.h"
#include "display.h"
#include "storage.h"
#include "alerts.h"
#include "network.h"

unsigned long lastSensorRead = 0;
unsigned long lastSdLog = 0;
unsigned long lastAlertBeep = 0;
unsigned long lastCloudSend = 0;
unsigned long lastWifiAttempt = 0;
bool sdReady = false;
bool wifiReady = false;

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(300);
  Serial.println("Aqua Safe Monitor - OPSI 2026 booting...");

  sensors_init();

#if CALIBRATION_MODE
  Serial.println("=== CALIBRATION MODE: dip probes in buffer/standard solutions ===");
  Serial.println("See .opencode/skills/FIRMWARE.md for the calibration procedure.");
  return; // skip normal init - loop() just prints raw sensor values
#endif

  display_init();
  display_show_boot();
  delay(1500);

  alerts_init();

  sdReady = storage_init();
  if (!sdReady) {
    Serial.println("WARNING: SD card not detected/initialized! Logging disabled.");
  }

  Serial.println("Connecting WiFi...");
  wifiReady = network_connect_wifi(WIFI_CONNECT_TIMEOUT_MS);
  Serial.println(wifiReady
    ? "WiFi connected - cloud sync enabled."
    : "WiFi unavailable - running offline (SD-only, will retry WiFi periodically).");
}

void loop() {
#if CALIBRATION_MODE
  // Averaged reads so the numbers are stable enough to trust while
  // probes stabilize in buffer/standard solutions.
  const int N = 64;
  long sumPh = 0, sumTds = 0, sumTurb = 0;
  for (int i = 0; i < N; i++) {
    sumPh   += analogRead(PIN_PH);
    sumTds  += analogRead(PIN_TDS);
    sumTurb += analogRead(PIN_TURBIDITY);
    delay(2);
  }

  float voltPh   = (sumPh / N) * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);
  float voltTds  = (sumTds / N) * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);
  float voltTurb = (sumTurb / N) * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);

  // Same formulas as sensors.cpp, temp fixed at 25C for TDS.
  float ph  = PH_CAL_SLOPE * voltPh + PH_CAL_OFFSET;
  float tds = (133.42 * pow(voltTds, 3) - 255.86 * pow(voltTds, 2)
               + 857.39 * voltTds) * 0.5;
  tds = tds < 0 ? 0 : tds;
  float ntu;
  if (voltTurb < 2.5) ntu = 3000;
  else {
    ntu = -1120.4 * sq(voltTurb) + 5742.3 * voltTurb - 4352.9;
    if (ntu < 0) ntu = 0;
  }

  Serial.printf("pH V:%.3f ph:%.2f | TDS V:%.3f ppm:%.1f | Turb V:%.3f NTU:%.1f\n",
                voltPh, ph, voltTds, tds, voltTurb, ntu);
  Serial.println("Hint: if ALL voltages are ~0.000, the sensor modules are "
                 "unpowered / signal pins unplugged - not a calibration issue. "
                 "A dry pH probe on a powered module reads near V=2.5 (ph~7).");
  delay(500);
  return;
#endif

  unsigned long now = millis();

  // Non-blocking WiFi retry - device must keep reading sensors even if
  // it never gets a signal in the field.
  if (!wifiReady && (now - lastWifiAttempt >= WIFI_RETRY_INTERVAL_MS)) {
    lastWifiAttempt = now;
    wifiReady = network_connect_wifi(2000);
  }

  if (now - lastSensorRead >= SENSOR_READ_INTERVAL_MS) {
    lastSensorRead = now;
    SensorReadings r = sensors_read();

    Serial.printf("pH:%.2f TDS:%.1fppm Turb:%.1fNTU Temp:%.2fC WiFi:%s SD:%s\n",
                   r.ph, r.tds, r.turbidity, r.temperature,
                   wifiReady ? "OK" : "--", sdReady ? "OK" : "ERR");

    char alertMsg[17];
    bool alertActive = alerts_check(r, alertMsg, sizeof(alertMsg));

    if (alertActive) {
      display_show_alert(alertMsg);
      if (now - lastAlertBeep >= 2000) {
        alerts_beep(2);
        lastAlertBeep = now;
      }
    } else {
      display_show_readings(r, sdReady, wifiReady);
    }

    // Local log is unconditional - the field device must not lose data
    // just because there was no signal at the water source.
    if (sdReady && (now - lastSdLog >= SD_LOG_INTERVAL_MS)) {
      lastSdLog = now;
      storage_log(r);
    }

    // Cloud sync is opportunistic - only when WiFi is actually up.
    if (wifiReady && (now - lastCloudSend >= CLOUD_SEND_INTERVAL_MS)) {
      lastCloudSend = now;
      bool sent = network_send_reading(r);
      if (!sent) {
        wifiReady = network_is_connected(); // re-check, connection may have dropped
      }
    }
  }
}
