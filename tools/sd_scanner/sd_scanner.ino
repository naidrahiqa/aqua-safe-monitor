// SD card diagnostic scanner.
//
// The main firmware tries only one bus/pin/speed, so a FAILED there
// doesn't tell you whether the problem is the CS pin, the SPI bus,
// the clock speed, or the card itself. Upload THIS sketch alone and
// it brute-forces every combination and prints what works (if any):
//
//   Buses:    HSPI (SCK 14, MOSI 13, MISO 12 - as wired in config.h)
//             VSPI (SCK 18, MOSI 23, MISO 19 - requires rewiring)
//   CS pins:  all candidates below (one at a time; move the CS wire)
//   Speeds:   25 MHz / 4 MHz / 1 MHz / 400 kHz
//
// Wiring tips before you run this:
//  - Module VCC: use the module's onboard regulator if it has one
//    (feed it 5V). Many cheap modules need 3.3V - check for an LDO.
//  - If the ESP32 won't boot/powers off with the module connected,
//    its MISO line has a pull-up: that can latch GPIO12 (strapping).
//  - Solder/chassis-pin the card holder; breadboard holders often
//    have flaky contacts.

#include <SPI.h>
#include <SD.h>

// Move the physical CS wire to each of these, one at a time, or let
// the scanner try them if the pins happen to be wired already.
const int csCandidates[] = { 15, 5, 2, 4 };

// HSPI pins match firmware/AquaSafeMonitor/config.h.
const int hspiPins[3] = { 14, 12, 13 }; // SCK, MISO, MOSI (standard)
const int hspiSwapped[3] = { 14, 13, 12 }; // SCK, MOSI, MISO (reversed wiring)
// VSPI (default SPI on most ESP32 dev boards).
const int vspiPins[3] = { 18, 19, 23 }; // SCK, MISO, MOSI

const int nCs = sizeof(csCandidates) / sizeof(csCandidates[0]);
const int nSpeeds = 4;
const uint32_t speeds[nSpeeds] = { 25000000UL, 4000000UL, 1000000UL, 400000UL };

void tryBus(const char* name, const int pins[3], int cs) {
  SPIClass spi(name[0] == 'H' ? HSPI : VSPI);
  spi.begin(pins[0], pins[1], pins[2], cs);

  for (int s = 0; s < nSpeeds; s++) {
    unsigned long t0 = millis();
    bool ok = SD.begin(cs, spi, speeds[s]);
    unsigned long dt = millis() - t0;

    if (ok) {
      Serial.printf("  PASS  %s CS=%d @ %d kHz (%lums) type=",
                    name, cs, speeds[s] / 1000UL, dt);
      uint8_t ct = SD.cardType();
      Serial.println(ct == CARD_MMC ? "MMC" :
                     ct == CARD_SD   ? "SD" :
                     ct == CARD_SDHC ? "SDHC" : "UNKNOWN");
      SD.end();
      return; // first working combo is what the firmware will use too
    }
    Serial.printf("  fail  %s CS=%d @ %d kHz (%lums)\n",
                  name, cs, speeds[s] / 1000UL, dt);
    SD.end();
    delay(50);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nSD scanner - trying bus x CS x speed combinations...");
}

void loop() {
  for (int i = 0; i < nCs; i++) {
    Serial.printf("=== CS pin %d ===\n", csCandidates[i]);
    tryBus("HSPI", hspiPins, csCandidates[i]);
    tryBus("HSPI-swap", hspiSwapped, csCandidates[i]);
    tryBus("VSPI", vspiPins, csCandidates[i]);
  }

  Serial.println("\n--- Summary: if every line says 'fail', the card or "
                 "wiring is the problem, not the pins/speed.");
  Serial.println("Check: card in FAT32, module power (5V->LDO->3.3V), soldered "
                 "contacts, MISO/MOSI not swapped.");
  while (true) delay(60000); // run once, stay quiet until reset
}