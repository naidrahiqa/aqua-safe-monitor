# AGENTS.md — AquaSafe Monitor

IoT water-quality monitor: ESP32 sensors → Supabase (Postgres + edge function) → React/Vite dashboard + Android app. Docs are Indonesian; keep responses user-friendly in ID.

## Repos
| Repo | Location | GitHub |
|---|---|---|
| Web dashboard | `E:\aqua-safe-monitor-web` | `naidrahiqa/aqua-safe-monitor` |
| Android app | `E:\aqua-safe-monitor-android` | `naidrahiqa/aqua-safe-monitor-android` |
| ~~Old monorepo~~ | ~~`E:\opsi`~~ | ~~Deleted~~ |
| ~~Old Android~~ | ~~`E:\opsi-andro`~~ | ~~Deleted~~ |

## Web Dashboard (`E:\aqua-safe-monitor-web`)
- **Stack**: React 19 + Vite + TypeScript + Tailwind CSS v4 + Leaflet + `@supabase/supabase-js`
- **Build**: `npm run build` = `tsc -b && vite build` (never plain `vite build`)
- **Lint**: `npm run lint` (ESLint v9 flat config)
- **Test**: `npm run test` (vitest, 12 tests passing)
- **CI**: `.github/workflows/vite.yml` — lint + test + build
- **PWA**: Service worker (`public/sw.js`), manifest, offline support
- **Fonts**: Self-hosted Inter + JetBrains Mono (no CDN)
- **Colors**: Shared constants in `src/lib/colors.ts`
- `@` alias → `./src`
- Real-time via Supabase Realtime → `src/hooks/useSensorData.ts`; mock data fallback in `src/data/mockData.ts`
- `AlertSettings` → localStorage only (`watersafe-alert-config`), does NOT change server thresholds
- Deep linking: tabs via URL search params (`?tab=ph`)

## Android App (`E:\aqua-safe-monitor-android`)
- **Stack**: Kotlin + Jetpack Compose (Material 3) + Ktor + Supabase REST + osmdroid
- **Build**: JDK 21 required, `gradlew.bat :app:assembleDebug`
- **Test**: `gradlew testDebugUnitTest` (17 tests — Formats, Repository, ViewModel)
- **CI**: `.github/workflows/android.yml` — build + lint + test
- **ProGuard**: `consumer-rules.pro` (Ktor, serialization, OkHttp, osmdroid)
- **Splash Screen**: AndroidX SplashScreen API (backward compat API 21+)
- **Backup Rules**: `data_extraction_rules.xml` + `backup_rules.xml` (security)
- **Dimens**: `ui/theme/Dimens.kt` — Spacing, Radius, IconSize, FontSize tokens
- **Strings**: Externalized to `strings.xml` (30+ strings)
- **Detekt**: Static analysis configured (`config/detekt/detekt.yml`)
- Supabase keys via `BuildConfig` (gradle.properties)

## Firmware (Arduino IDE — in web repo `firmware/`)
- Board: ESP32 Dev Module, core **2.0.17 — never 3.x** (WiFi library bug)
- `config.h` is source of truth for pins; SD pins in flux (don't fix code to match docs)
- pH→32, TDS→34, turbidity→35, DS18B20→4, LCD I2C 0x27/SDA21/SCL22, buzzer→27
- Alert thresholds: pH 6.5–8.5, TDS ≤500, turbidity ≤5 (must sync with edge function)

## Secrets
- `.env`, `firmware/AquaSafeMonitor/secrets.h` — gitignored, never paste into code/commits/logs
- `.opencode/*` — gitignored except `AGENTS.md`

## Supabase
- Project ref `dohhcabunjojfdqcgicw` (URL `https://dohhcabunjojfdqcgicw.supabase.co`)
- Edge function `ingest-sensor-data` (verify_jwt=false, SERVICE_ROLE bypasses RLS)
- Schema: `devices`, `sensor_data`, `latest_readings` view
- Deploy: `supabase login` → `supabase link --project-ref dohhcabunjojfdqcgicw` → `supabase functions deploy ingest-sensor-data`

## Skills
| Skill | Purpose |
|---|---|
| `auto-commit` | Auto-commit changes with meaningful message |
| `ponytail` | Minimal/lazy code review |
| `graphify` | Knowledge graph |
| `awesome-claude-skills` | Browse 1000+ skills |

## Deploy
- Web: Vercel (env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Edge function: Supabase CLI
