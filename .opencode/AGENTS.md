# AGENTS.md — AquaSafeMonitor (aqua_safe_monitor_opsi_2026)

IoT water-quality monitor: ESP32 sensors → Supabase (Postgres + edge function) → React/Vite dashboard.

## Build & verify
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — **`tsc -b && vite build`**; always use this, never plain `vite build` (catches TS errors)
- `npm run lint` — eslint .
- No test suite exists.

## Web app (src/)
- React 19 + Vite + TypeScript + Tailwind + Leaflet + `@supabase/supabase-js`
- Real-time via Supabase Realtime channel → `src/hooks/useSensorData.ts`; when no real rows exist, `src/data/mockData.ts` feeds the UI — mock vs live is easy to confuse
- A device is a row in the `devices` table; its `secret_api_key` is the ESP32's bearer token to the edge function
- `AlertSettings` writes only localStorage (`watersafe-alert-config`) — it does NOT change server thresholds; GaugeCard safe ranges read that config
- Notification dismiss persists in localStorage (`watersafe-dismissed-notifs`); CSV export uses `;` separator + UTF-8 BOM

## Firmware (firmware/AquaSafeMonitor, Arduino IDE)
- Board: ESP32 Dev Module, core **2.0.17 — never 3.x** (WiFi library bug)
- Pins in `config.h`: pH→GPIO 32, TDS→34, turbidity→35 (34/35 are input-only), DS18B20→4 (+4.7kΩ pull-up), LCD I2C 0x27 / SDA 21 / SCL 22 (blank → run `tools/i2c_scanner`, try 0x3F), SD HSPI (MISO 12, MOSI 13, SCK 14, CS 15), buzzer→27 (needs 2N2222 transistor, pending)
- `CALIBRATION_MODE 1` prints raw ADC/voltage every 500 ms for calibration; `PH_CAL_SLOPE/OFFSET` are placeholders (pH reads ~21.34 until recalibrated)
- LCD: splash, 2 rotating screens (LCD_SCREEN_CYCLE_MS = 4000) + `!! WARNING !!` screen on alert; cloud send every 15000 ms
- SD logging: init FAILED on CS 5 and 15 — hardware/wiring issue, code is fine
- `config.h` comments link `.opencode/skills/HARDWARE_INTEGRATION.md` / `FIRMWARE.md` — those files do NOT exist; don't chase the links

## Secrets — never commit (`git add -A` is dangerous here)
- `firmware/AquaSafeMonitor/secrets.h` — real WiFi password + API key; **NOT currently gitignored**
- `pw-supabase.txt` — Supabase DB password note; not gitignored
- `.env` — gitignored; `supabase/.temp/` — local CLI cache
- From `.opencode/`, commit only `AGENTS.md`; the rest (skills, node_modules) is local tooling

## Supabase
- Project ref `dohhcabunjojfdqcgicw` (URL https://dohhcabunjojfdqcgicw.supabase.co)
- Edge function `ingest-sensor-data` (`supabase/functions/`, `verify_jwt = false`) computes WQI; thresholds pH 6.5–8.5, TDS ≤ 500, turbidity ≤ 5
- Schema in `supabase/schema.sql` (`devices`, `sensor_data`)
- Deploy: `supabase login` → `supabase link --project-ref dohhcabunjojfdqcgicw` → `supabase functions deploy ingest-sensor-data`
- NOTE: `supabase/functions/ingest-sensor-data/index.ts`, `schema.sql`, `tsconfig.json` are currently deleted in the working tree — `git restore` them before committing

## Docs
- `SETUP_GUIDE.md` (Indonesian) — full 0→setup, wiring, calibration steps
- `SETUP_CHECKLIST.md` — connecting the real Supabase backend
- `PROJECT_STATUS.md` — live status incl. blocked items (SD card, sensor calibration)
- `README.md` — **UTF-16 LE encoded**; normal read/edit tools garble it — re-encode to UTF-8 when editing

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
