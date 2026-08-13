#ifndef NETWORK_H
#define NETWORK_H

#include "sensors.h"

bool network_connect_wifi(unsigned long timeoutMs);
bool network_is_connected();
bool network_send_reading(SensorReadings r);

#endif
