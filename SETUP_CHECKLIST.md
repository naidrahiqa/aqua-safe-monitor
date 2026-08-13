# Setup Checklist — Getting Off "Demo Mode"

The web app currently runs on mock data because no real Supabase
project is connected yet. These steps need your own Supabase account —
no AI agent can do this part for you. Everything else (firmware,
skill docs) is already prepared and just needs this backend to exist.

## 1. Create the Supabase project
1. Go to supabase.com -> New project.
2. Note the **Project URL** and **anon public key**
   (Settings -> API) — you'll need both shortly.

## 2. Apply the database schema
1. Supabase dashboard -> SQL Editor -> New query.
2. Paste the entire contents of `supabase/schema.sql`, run it.
3. Confirm `devices` and `sensor_data` tables now exist under
   Table Editor.

## 3. Deploy the edge function (needs Supabase CLI)
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy ingest-sensor-data
```
The `verify_jwt = false` setting in `supabase/config.toml` (already in
this package) is picked up automatically — it lets the ESP32 call the
function using its own `api_key`, without needing a Supabase user
session.

## 4. Connect the web app
1. Copy `.env.example` to `.env` in the repo root.
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 1.
3. `npm install && npm run dev`
4. Sign up for an account inside the app (this is a normal Supabase
   Auth user, separate from any device credentials).

## 5. Register the ESP32 as a device
1. In the running web app: Devices -> Add Device.
2. It shows a one-time copy-paste snippet:
   ```
   #define API_KEY "..."
   #define ENDPOINT "https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-sensor-data"
   ```
3. In `firmware/AquaSafeMonitor/`, copy `secrets.h.example` to
   `secrets.h`, paste those two lines in, fill in `WIFI_SSID` /
   `WIFI_PASSWORD` too.

## 6. Flash and verify
1. Open `firmware/AquaSafeMonitor/AquaSafeMonitor.ino` in Arduino IDE.
2. Board: ESP32 Dev Module, correct COM port, upload.
3. Open Serial Monitor at 115200 baud — you should see WiFi connect,
   then sensor readings, then `[network] reading sent OK` every
   `CLOUD_SEND_INTERVAL_MS`.
4. Refresh the web dashboard — the new reading should appear within
   a few seconds, and the device's status should flip from mock to live.

## Still pending regardless of the above (hardware, not software)
- ON/OFF switch not yet installed
- Buzzer transistor (2N2222) in transit, not yet soldered in
- pH / Turbidity calibration not yet done (placeholders in `config.h`)
- Battery percentage not implemented (no voltage divider wired)
