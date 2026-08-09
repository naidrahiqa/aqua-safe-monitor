#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

struct SensorReadings {
  float ph;
  float tds;         // ppm
  float turbidity;    // NTU
  float temperature;  // Celsius
  bool  ds18b20_ok;
};

void sensors_init();
SensorReadings sensors_read();

float sensors_read_ph();
float sensors_read_tds(float temperature);
float sensors_read_turbidity();
float sensors_read_temperature();

#endif
