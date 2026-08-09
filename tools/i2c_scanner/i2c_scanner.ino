// Run this alone (separate sketch) if the LCD shows nothing / garbage
// with the backlight on. It prints every I2C address that responds -
// your PCF8574 backpack is almost always 0x27 or 0x3F. Put whatever
// it finds into LCD_ADDR in AquaSafeMonitor/config.h.

#include <Wire.h>

#define SDA_PIN 21
#define SCL_PIN 22

void setup() {
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.begin(115200);
  delay(500);
  Serial.println("\nI2C scanner - looking for devices...");
}

void loop() {
  int found = 0;
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    byte error = Wire.endTransmission();
    if (error == 0) {
      Serial.print("Found device at 0x");
      if (addr < 16) Serial.print("0");
      Serial.println(addr, HEX);
      found++;
    }
  }
  if (found == 0) {
    Serial.println("No I2C devices found - check SDA/SCL wiring, not the address.");
  }
  delay(3000);
}
