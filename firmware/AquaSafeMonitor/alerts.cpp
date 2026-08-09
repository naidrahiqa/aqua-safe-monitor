#include "alerts.h"
#include "config.h"
#include <Arduino.h>

// PIN_BUZZER drives the base of an NPN transistor (2N2222) through a
// 1k resistor, which switches the buzzer's 5V supply. GPIO alone
// cannot safely drive the buzzer directly (3.3V logic vs 5V load).
// See .opencode/skills/HARDWARE_INTEGRATION.md for the wiring.
// Code works today; physical transistor is pending (in transit).

void alerts_init() {
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
}

void alerts_silence() {
  digitalWrite(PIN_BUZZER, LOW);
}

void alerts_beep(uint8_t times) {
  for (uint8_t i = 0; i < times; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    digitalWrite(PIN_BUZZER, LOW);
    delay(150);
  }
}

// Returns true and fills messageOut (max 16 chars + null, fits one
// LCD row) if any reading is outside the safe range. Thresholds
// mirror the server-side WQI sub-index boundaries (see config.h).
bool alerts_check(SensorReadings r, char* messageOut, size_t messageLen) {
  if (r.ph < PH_MIN_SAFE || r.ph > PH_MAX_SAFE) {
    snprintf(messageOut, messageLen, "pH: %.1f", r.ph);
    return true;
  }
  if (r.tds > TDS_MAX_SAFE) {
    snprintf(messageOut, messageLen, "TDS: %.0fppm", r.tds);
    return true;
  }
  if (r.turbidity > TURBIDITY_MAX_SAFE) {
    snprintf(messageOut, messageLen, "Turb: %.0fNTU", r.turbidity);
    return true;
  }
  return false;
}
