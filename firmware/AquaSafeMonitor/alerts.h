#ifndef ALERTS_H
#define ALERTS_H

#include "sensors.h"

void alerts_init();
bool alerts_check(SensorReadings r, char* messageOut, size_t messageLen);
void alerts_beep(uint8_t times);
void alerts_silence();

#endif
