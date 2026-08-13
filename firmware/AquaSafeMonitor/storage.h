#ifndef STORAGE_H
#define STORAGE_H

#include "sensors.h"

bool storage_init();
bool storage_is_ok();
void storage_log(SensorReadings r);

#endif
