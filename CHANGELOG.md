# Changelog

All notable changes to AquaSafe Monitor (Web + Android).

## [Unreleased] — 2026-08-13

### Fixed (Bug Fixes)
- **Web**: CSS typo `[600px]` → `h-[600px]` di Dashboard decorative element
- **Web**: `setPins` dipanggil di dalam `setReadings` state updater (React anti-pattern) — dipindah ke `useEffect`
- **Web**: `setTimeout` di AlertSettings tanpa cleanup on unmount — ditambahkan timer ref + cleanup
- **Android**: Unsafe `as RoundedCornerShape` casts di OverviewScreen, SettingsScreen, HistoryScreen — diganti dengan safe extension functions
- **Android**: Supabase credentials committed di `gradle.properties` — dipindah ke placeholder, credentials harus di `local.properties`
- **Android**: Hardcoded version `"v1.0.0"` di SettingsScreen — diganti `BuildConfig.VERSION_NAME`

### Changed (Algorithm Sync)
- **Unified WQI Algorithm**: Weighted average (0.3 pH + 0.25 TDS + 0.25 Turb + 0.2 Temp) — sync antara Edge Function, web client, dan Android
- **Unified Status Thresholds**: >=80 SANGAT LAYAK, >=60 LAYAK, <60 BAHAYA — sync di seluruh platform
- **Mock Data Updated**: WQI scores di mock data disesuaikan dengan algoritma baru

### Changed (Color Sync)
- **Web**: CSS vars `--color-ph`, `--color-tds`, `--color-turbid` disync dengan `src/lib/colors.ts`
  - pH: `#22d3ee` → `#f59e0b` (amber, matches Android)
  - TDS: `#60a5fa` → `#22c55e` (green, matches Android)
  - Turbidity: `#a78bfa` → `#8b5cf6` (purple, matches Android)

### Added (Features)
- **Android**: Exponential backoff on network errors (10s → 20s → 40s → max 60s)
- **Android**: Polling lifecycle management with `Job` cancel on ViewModel clear
- **Android**: Shared `Json` singleton across `SensorRepository` and `TestLocationStore`
- **Android**: Safe shape accessor extensions (`roundedSmall()`, `roundedMedium()`, `roundedLarge()`)
- **Android**: `BuildConfig.VERSION_NAME` displayed in Settings screen

### Added (Performance)
- **Web**: Vite manualChunks for code splitting (react, recharts, leaflet, supabase)
- **Web**: Vitest config now extends vite.config.ts (Tailwind + React plugins active in tests)
- **Web**: Vitest coverage configuration added
- **Web**: Shared constants file (`src/lib/constants.ts`) for hardcoded values (DEFAULT_LAT, DEFAULT_LNG, etc.)
- **Web**: Replaced hardcoded coordinates across 5+ files with shared constants

### Added (Documentation)
- **Web**: Integration guide section in README (web + Android comparison table)
- **Web**: WQI algorithm documentation in README
- **Android**: Integration guide section in README (comparison table, algorithm docs)
- **Both**: Shared API contract documentation (`docs/API_CONTRACT.md`)
- **Both**: Changelog file

### Architecture
- WQI computation is now identical across all 3 locations:
  1. Edge Function (server-side, authoritative)
  2. Web client (`src/hooks/useTestLocations.ts`)
  3. Android (`model/TestLocation.kt`)
- Status thresholds use 60 as LAYAK/BAHAYA boundary (was 50 in client code)
