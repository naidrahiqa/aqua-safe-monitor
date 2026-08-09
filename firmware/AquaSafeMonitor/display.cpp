#include "display.h"
#include "config.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

static LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

static uint8_t screenIndex = 0;
static unsigned long lastScreenSwitch = 0;

void display_init() {
  Wire.begin(LCD_SDA, LCD_SCL);
  lcd.init();
  lcd.backlight();
}

void display_show_boot() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Aqua Safe Mon.");
  lcd.setCursor(0, 1);
  lcd.print("OPSI 2026 v1.0");
}

static void printUptime(unsigned long ms) {
  unsigned long totalSec = ms / 1000;
  unsigned int h = totalSec / 3600;
  unsigned int m = (totalSec % 3600) / 60;
  unsigned int s = totalSec % 60;
  char buf[12];
  snprintf(buf, sizeof(buf), "%02u:%02u:%02u", h, m, s);
  lcd.print("Up:");
  lcd.print(buf);
}

// Screen A: all four live readings at once.
// Screen B: system status (SD / WiFi / uptime), less urgent info.
void display_show_readings(SensorReadings r, bool sdOk, bool wifiOk) {
  unsigned long now = millis();
  if (now - lastScreenSwitch > LCD_SCREEN_CYCLE_MS) {
    screenIndex = (screenIndex + 1) % 2;
    lastScreenSwitch = now;
    lcd.clear();
  }

  lcd.setCursor(0, 0);
  if (screenIndex == 0) {
    lcd.print("pH:");
    lcd.print(r.ph, 1);
    lcd.print(" TDS:");
    lcd.print((int)r.tds);

    lcd.setCursor(0, 1);
    lcd.print("Turb:");
    lcd.print((int)r.turbidity);
    lcd.print(" T:");
    lcd.print(r.temperature, 1);
    lcd.print("C");
  } else {
    lcd.print("SD:");
    lcd.print(sdOk ? "OK  " : "ERR ");
    lcd.print(" WiFi:");
    lcd.print(wifiOk ? "OK" : "--");

    lcd.setCursor(0, 1);
    printUptime(now);
  }
}

void display_show_alert(const char* message) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("!! WARNING !!");
  lcd.setCursor(0, 1);
  lcd.print(message);
}
