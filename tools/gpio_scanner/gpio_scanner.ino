// GPIO scanner - finds which GPIO pin is connected to the SD card CS.
// Disconnect the SD card module first, then run this sketch.
// It will beep/blink if any GPIO is pulled LOW (connected to something).

#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nGPIO scanner - checking all pins...");
}

void loop() {
  int found = 0;
  for (int pin = 0; pin < 40; pin++) {
    if (pin == 1 || pin == 3) continue; // skip TX/RX
    pinMode(pin, INPUT_PULLUP);
    delay(1);
    int val = digitalRead(pin);
    if (val == LOW) {
      Serial.printf("GPIO %d is LOW (connected to something)\n", pin);
      found++;
    }
  }
  if (found == 0) {
    Serial.println("No GPIO pulled LOW. Check wiring.");
  }
  Serial.println("---");
  delay(3000);
}