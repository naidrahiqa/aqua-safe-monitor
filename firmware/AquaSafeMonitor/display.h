#ifndef DISPLAY_H
#define DISPLAY_H

#include "sensors.h"

void display_init();
void display_show_boot();
void display_show_readings(SensorReadings r, bool sdOk, bool wifiOk);
void display_show_alert(const char* message);

#endif
