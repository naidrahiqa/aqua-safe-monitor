#include "storage.h"
#include "config.h"
#include <SPI.h>
#include <SD.h>

static bool sdOk = false;
static const char* LOG_FILE = "/aqua_log.csv";

bool storage_init() {
  SPIClass spi(HSPI);
  spi.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  delay(100); //SD card power-up stabilization

  Serial.print("[SD] Initializing on CS pin ");
  Serial.print(SD_CS);
  Serial.print("... ");

  sdOk = SD.begin(SD_CS, spi);

  if (sdOk) {
    Serial.println("OK");
    Serial.print("[SD] Card type: ");
    uint8_t cardType = SD.cardType();
    if (cardType == CARD_MMC) Serial.println("MMC");
    else if (cardType == CARD_SD) Serial.println("SD");
    else if (cardType == CARD_SDHC) Serial.println("SDHC");
    else Serial.println("UNKNOWN");
    Serial.print("[SD] Size: ");
    Serial.print(SD.cardSize() / (1024 * 1024));
    Serial.println(" MB");
  } else {
    Serial.println("FAILED");
  }

  if (sdOk && !SD.exists(LOG_FILE)) {
    File f = SD.open(LOG_FILE, FILE_WRITE);
    if (f) {
      f.println("millis,pH,TDS_ppm,Turbidity_NTU,Temp_C,DS18B20_OK");
      f.close();
    }
  }
  return sdOk;
}

bool storage_is_ok() {
  return sdOk;
}

// Appends one CSV row per call. Called on a timer (SD_LOG_INTERVAL_MS),
// not on every sensor read, to limit SD wear and avoid the write
// occasionally blocking the loop for tens of milliseconds.
void storage_log(SensorReadings r) {
  if (!sdOk) return;
  File f = SD.open(LOG_FILE, FILE_APPEND);
  if (!f) return;

  f.print(millis());          f.print(",");
  f.print(r.ph, 2);           f.print(",");
  f.print(r.tds, 1);          f.print(",");
  f.print(r.turbidity, 1);    f.print(",");
  f.print(r.temperature, 2);  f.print(",");
  f.println(r.ds18b20_ok ? "1" : "0");
  f.close();
}
