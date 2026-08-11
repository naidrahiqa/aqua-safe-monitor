# AGENTS.md — AquaSafeMonitor (aqua_safe_monitor_opsi_2026)

IoT water-quality monitor: ESP32 sensors → Supabase (Postgres + edge function) → React/Vite dashboard. Docs are Indonesian; keep responses user-friendly in ID.

## Build & verify
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — **`tsc -b && vite build`**; always use this, never plain `vite build` (catches TS errors)
- `npm run lint` — eslint .
- No test suite exists. Typecheck happens via `npm run build` only.

## Web app (src/)
- React 19 + Vite + TypeScript + Tailwind + Leaflet + `@supabase/supabase-js`; `@` alias → `./src`
- Real-time via Supabase Realtime channel → `src/hooks/useSensorData.ts`; when Supabase is unconfigured or has no rows, `src/data/mockData.ts` feeds the UI — mock vs live is easy to confuse
- A device is a row in the `devices` table; its `secret_api_key` is the ESP32's bearer token to the edge function
- `AlertSettings` writes only localStorage (`watersafe-alert-config`) — it does NOT change server thresholds; GaugeCard safe ranges read that config
- Notification dismiss persists in localStorage (`watersafe-dismissed-notifs`); CSV export uses `;` separator + UTF-8 BOM

## Firmware (firmware/AquaSafeMonitor, Arduino IDE)
- Board: ESP32 Dev Module, core **2.0.17 — never 3.x** (WiFi library bug)
- `config.h` is the source of truth for pins, but **SD pins are mid-debug and in flux** (uncommitted changes): config.h currently defines SCK 25 / MISO 26 / MOSI 13 / CS 33, while `firmware/WIRING_PLAN.md` and `PROJECT_STATUS.md` describe SCK 14 / MISO 12 / MOSI 13 / CS 5. Do NOT "fix" the code to match the docs — this is a live hardware issue; ask the user. The "Physical wiring: SCK=9..." comment inside config.h is stale and contradicts its own defines
- pH→32, TDS→34, turbidity→35 (34/35 are input-only ADC1), DS18B20→4 (+4.7kΩ pull-up), LCD I2C 0x27 / SDA 21 / SCL 22 (blank → run `tools/i2c_scanner`, try 0x3F), buzzer→27 (needs 2N2222 transistor, pending)
- `CALIBRATION_MODE 1` prints averaged computed values (pH/TDS/NTU) + mV for calibration; `PH_CAL_SLOPE/OFFSET` are placeholders (pH reads ~21.34 until recalibrated — exactly 21.34 = ~0V on ADC: module unpowered/unplugged, not a calibration issue)
- LCD: splash, 2 rotating screens (LCD_SCREEN_CYCLE_MS = 4000) + `!! WARNING !!` screen on alert; cloud send every 15000 ms
- SD logging: `storage_init()` auto-retries SPI clock 25→8→1→0.4 MHz; if init still FAILED → run `tools/sd_scanner` (bus × CS × speed matrix) to isolate wiring/card/power problem
- config.h comments link `.opencode/skills/HARDWARE_INTEGRATION.md` — that file does NOT exist; don't chase the link
- Alert thresholds firmware (pH 6.5–8.5, TDS ≤500, turbidity ≤5) must stay in sync with the WQI sub-indices in the edge function

## Secrets
- `.env`, `firmware/AquaSafeMonitor/secrets.h`, `pw-supabase.txt`, `supabase/.temp/` are gitignored; `.opencode/*` is gitignored except `AGENTS.md`
- Real credentials (`.env`, `secrets.h`) exist locally — never paste their values into code, commits, or logs

## Supabase
- Project ref `dohhcabunjojfdqcgicw` (URL https://dohhcabunjojfdqcgicw.supabase.co)
- Edge function `ingest-sensor-data` (`supabase/functions/`, `verify_jwt = false`) — the ESP32 authenticates with `secret_api_key` in the JSON body, NOT a JWT; it computes WQI + status and inserts via SERVICE_ROLE (bypasses RLS)
- Schema in `supabase/schema.sql` (`devices`, `sensor_data`, `latest_readings` view) — safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS)
- Deploy: `supabase login` → `supabase link --project-ref dohhcabunjojfdqcgicw` → `supabase functions deploy ingest-sensor-data`
- `supabase/.temp/` holds linked-project metadata — gitignored, ignore it

## Docs
- `HANDOVER.md` — handover for new-device sessions; supersedes most stale notes
- `PROJECT_STATUS.md` — live status incl. blocked hardware items (SD card, sensor calibration)
- `firmware/WIRING_PLAN.md` — the intended final wiring plan
- `SETUP_GUIDE.md` (Indonesian) — full 0→setup, wiring, calibration
- `SESSION_NOTES_2026-08-10.md` — last session log

## Skills (installed in .opencode/skills/)
| Skill | Purpose |
|---|---|
| `ponytail` | Minimal/lazy code — review & simplify |
| `graphify` | Map codebase to knowledge graph (`graphify update .`) |
| `awesome-claude-skills` | Browse 1000+ skills |
| `agent-skills` | Vercel/React/web-design audits |

## Deploy
- Web: user deploys to Vercel manually (env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Edge function: Supabase CLI (see Supabase section)
