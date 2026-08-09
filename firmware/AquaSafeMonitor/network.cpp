#include "network.h"
#include "config.h"
#include "secrets.h"   // WIFI_SSID, WIFI_PASSWORD, API_KEY, ENDPOINT (copy secrets.h.example -> secrets.h)
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

bool network_connect_wifi(unsigned long timeoutMs) {
  if (WiFi.status() == WL_CONNECTED) return true;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeoutMs) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

bool network_is_connected() {
  return WiFi.status() == WL_CONNECTED;
}

// POSTs one reading to the ingest-sensor-data edge function. Field
// names MUST exactly match ESP32Payload in src/types/index.ts
// (api_key, temperature, ph, tds, turbidity — lowercase). The server
// computes wqi_score and status itself; the ESP32 never needs to.
//
// Uses setInsecure() to skip TLS certificate validation — the usual
// pragmatic shortcut for hobbyist/competition ESP32 projects hitting
// a cloud HTTPS endpoint. Fine for this use case; not something you'd
// want on something security-critical.
bool network_send_reading(SensorReadings r) {
  if (!network_is_connected()) return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  if (!http.begin(client, ENDPOINT)) {
    Serial.println("[network] http.begin() failed - check ENDPOINT in secrets.h");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
#ifdef SUPABASE_ANON_KEY
  // Only needed if verify_jwt was left ON for this function
  // (see supabase/config.toml). Harmless to send either way.
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " SUPABASE_ANON_KEY);
#endif

  // Clamp values to valid ranges so edge function doesn't reject
  float ph = r.ph;
  if (ph < 0) ph = 0;
  if (ph > 14) ph = 14;
  float tds = r.tds;
  if (tds < 0) tds = 0;
  float turb = r.turbidity;
  if (turb < 0) turb = 0;

  char body[256];
  snprintf(body, sizeof(body),
    "{\"api_key\":\"%s\",\"temperature\":%.2f,\"ph\":%.2f,\"tds\":%.1f,\"turbidity\":%.1f}",
    API_KEY, r.temperature, ph, tds, turb);

  int httpCode = http.POST((uint8_t*)body, strlen(body));
  bool ok = (httpCode == 200 || httpCode == 201);

  if (ok) {
    Serial.println("[network] reading sent OK");
  } else {
    Serial.printf("[network] POST failed, http code=%d\n", httpCode);
    if (httpCode > 0) Serial.println(http.getString());
  }

  http.end();
  return ok;
}
