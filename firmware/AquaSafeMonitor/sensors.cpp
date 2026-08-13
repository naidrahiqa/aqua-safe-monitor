#include "sensors.h"
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>

static OneWire oneWire(PIN_DS18B20);
static DallasTemperature ds18b20(&oneWire);

void sensors_init() {
  ds18b20.begin();
  analogReadResolution(12); // ESP32 default is already 12-bit; explicit for clarity
}

float sensors_read_temperature() {
  ds18b20.requestTemperatures();
  float t = ds18b20.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < -50 || t > 100) {
    return TDS_TEMP_DEFAULT; // probe not responding, fall back to a safe default
  }
  return t;
}

float sensors_read_ph() {
  int raw = analogRead(PIN_PH);
  float voltage = raw * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);
  return PH_CAL_SLOPE * voltage + PH_CAL_OFFSET;
}

// Standard DFRobot Gravity Analog TDS Sensor formula with temperature
// compensation. Verify against the TDS calibration standard solution
// in your kit; recalibrate PH_CAL_* style constants here only if the
// reading is consistently off by a fixed ratio.
float sensors_read_tds(float temperature) {
  int raw = analogRead(PIN_TDS);
  float voltage = raw * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);
  float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
  float compensationVoltage = voltage / compensationCoefficient;
  float tdsValue = (133.42 * pow(compensationVoltage, 3)
                    - 255.86 * pow(compensationVoltage, 2)
                    + 857.39 * compensationVoltage) * 0.5;
  return tdsValue < 0 ? 0 : tdsValue;
}

// Commonly published curve for the DFRobot SEN0189 turbidity sensor.
// NOT verified against this specific physical unit — calibrate with
// clear water (~0 NTU) and any turbid reference you have, adjust the
// coefficients below if readings look consistently wrong.
float sensors_read_turbidity() {
  int raw = analogRead(PIN_TURBIDITY);
  float voltage = raw * (ADC_VOLTAGE_REF / ADC_MAX_VALUE);
  float ntu;
  if (voltage < 2.5) {
    ntu = 3000; // very turbid / out of usable range
  } else {
    ntu = -1120.4 * sq(voltage) + 5742.3 * voltage - 4352.9;
    if (ntu < 0) ntu = 0;
  }
  return ntu;
}

SensorReadings sensors_read() {
  SensorReadings r;
  r.temperature = sensors_read_temperature();
  r.ds18b20_ok  = (r.temperature != TDS_TEMP_DEFAULT);
  r.ph          = sensors_read_ph();
  r.tds         = sensors_read_tds(r.temperature);
  r.turbidity   = sensors_read_turbidity();
  return r;
}
