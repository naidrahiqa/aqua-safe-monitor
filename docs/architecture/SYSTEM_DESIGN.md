# WaterSafe Monitor — System Architecture

> C4 Model + Data Flow diagrams for the IoT Water Quality Monitoring System.

## 1. Context Diagram (Level 1)

```mermaid
C4Context
    title WaterSafe Monitor — System Context

    Person(user, "Operator / Admin", "Monitors water quality, manages alerts")

    System(watersafe, "WaterSafe Monitor", "Real-time IoT water quality dashboard")

    System_Ext(esp32, "ESP32 Sensor Nodes", "pH, TDS, Turbidity, Temperature sensors")
    System_Ext(arduino_iot, "Arduino IoT Cloud", "Device cloud for ESP32 telemetry")
    System_Ext(telegram, "Telegram Bot API", "Push notifications for alerts")
    System_Ext(vercel, "Vercel", "Hosts the web dashboard")

    Rel(esp32, arduino_iot, "Publishes telemetry", "MQTT/HTTPS")
    Rel(arduino_iot, watersafe, "Streams sensor data", "REST API")
    Rel(watersafe, user, "Displays dashboard", "HTTPS")
    Rel(watersafe, telegram, "Sends alerts", "Bot API")
```

## 2. Container Diagram (Level 2)

```mermaid
C4Container
    title WaterSafe Monitor — Container Architecture

    Person(user, "Operator", "Monitors water quality")

    System_Boundary(watersafe, "WaterSafe Monitor") {
        Container(web, "Web Dashboard", "React, Tailwind CSS, Recharts", "Single-page app for real-time monitoring")
        Container(api, "API Layer", "TypeScript", "Fetches data from Arduino IoT Cloud")
        Container(context, "SensorContext", "React Context", "Manages global sensor state & polling")
    }

    System_Ext(esp32, "ESP32 Sensors", "Hardware nodes")
    System_Ext(arduino_cloud, "Arduino IoT Cloud", "Device telemetry backend")
    System_Ext(telegram, "Telegram Bot", "Notification service")

    Rel(esp32, arduino_cloud, "Publishes data", "MQTT")
    Rel(api, arduino_cloud, "Fetches readings", "REST API")
    Rel(context, api, "Calls API", "fetch()")
    Rel(web, context, "Consumes sensor data", "React Hook")
    Rel(user, web, "Interacts", "HTTPS")
    Rel(context, telegram, "Triggers alerts", "Bot API")
```

## 3. Component Diagram (Level 3) — Web Dashboard

```mermaid
C4Component
    title WaterSafe Monitor — Web Dashboard Components

    Container_Ext(context, "SensorContext", "Provides sensor data & state")

    Container_Boundary(web, "Web Dashboard") {
        Component(sidebar, "Sidebar", "React", "Navigation: Overview, Analytics, History, Devices, Settings")
        Component(dashboard, "Dashboard View", "React", "Overview with gauges, chart, map, table")
        Component(analytics, "Analytics View", "React", "4 individual sensor charts with auto-scaling Y-axis")
        Component(history, "History View", "React", "Paginated data table with filters & CSV export")
        Component(devices, "Device Manager", "React", "Add/edit/delete ESP32 sensor nodes")
        Component(settings, "Settings View", "React", "Alert thresholds, location, notifications")
    }

    Component(gauge, "GaugeCard", "SVG + React", "Semicircle gauge for pH, TDS, Temp, Turbidity")
    Component(chart, "AnalyticsChart", "Recharts", "Individual line charts per sensor type")
    Component(table, "DataTable", "React", "Sortable, filterable, paginated readings table")
    Component(map, "LocationMap", "Leaflet", "Sensor location on dark map tiles")
    Component(alert, "AlertPanel", "React", "Real-time alert notifications with Telegram push")

    Rel(dashboard, gauge, "Renders 4x GaugeCard")
    Rel(dashboard, chart, "Renders AnalyticsChart")
    Rel(dashboard, map, "Renders LocationMap")
    Rel(dashboard, table, "Renders DataTable")
    Rel(analytics, chart, "Renders 4 individual charts")
    Rel(context, dashboard, "Provides readings & chartData")
    Rel(context, analytics, "Provides chartData")
```

## 4. Data Flow — Sensor to Dashboard

```mermaid
sequenceDiagram
    participant ESP32 as ESP32 Sensor
    participant Arduino as Arduino IoT Cloud
    participant API as API Layer
    participant CTX as SensorContext
    participant UI as Dashboard UI
    participant TG as Telegram Bot

    loop Every 30s
        ESP32->>Arduino: Publish telemetry (pH, TDS, Temp, Turbidity)
    end

    loop Every 5s (polling)
        API->>Arduino: GET /things/{id}/properties
        Arduino-->>API: Return latest readings
        API-->>CTX: Update sensor data
    end

    CTX->>CTX: Calculate WQI (Water Quality Index)
    CTX->>CTX: Check alert thresholds

    alt Threshold exceeded
        CTX->>TG: Send alert message
    end

    CTX-->>UI: Re-render with new data
    UI->>UI: Update gauges, charts, map
```

## 5. State Machine — Sensor Status

```mermaid
stateDiagram-v2
    [*] --> Normal : Reading within safe range

    Normal --> Warning : Value outside safe range (minor)
    Warning --> Danger : Value exceeds critical threshold
    Warning --> Normal : Value returns to safe range
    Danger --> Warning : Value improved but not safe
    Danger --> Normal : Value fully recovered

    state "Sensor States" as sensor_states {
        [*] --> Online : Connected
        Online --> Offline : No data > 5 min
        Offline --> Online : Data received
        Online --> Calibrating : Calibration started
        Calibrating --> Online : Calibration done
    }
```

## 6. Deployment Architecture

```mermaid
graph TB
    subgraph "ESP32 Nodes"
        E1["Node 1: pH + Temp"]
        E2["Node 2: TDS + Turbidity"]
    end

    subgraph "Cloud"
        AIC["Arduino IoT Cloud<br/>(MQTT + REST)"]
    end

    subgraph "Vercel"
        FE["React SPA<br/>(Static Assets)"]
        CF["Edge Functions<br/>(API Proxy)"]
    end

    subgraph "External"
        TG["Telegram Bot API"]
        MAP["Leaflet Tiles<br/>(CartoDB Dark)"]
    end

    E1 -->|"MQTT"| AIC
    E2 -->|"MQTT"| AIC
    AIC -->|"REST API"| CF
    CF -->|"JSON"| FE
    FE -->|"Bot API"| TG
    FE -->|"Map tiles"| MAP
    USER["User Browser"] -->|"HTTPS"| FE
```

## 7. WQI Calculation Flow

```mermaid
flowchart LR
    A[Raw Sensor Data] --> B{Parameter Check}

    B --> C[pH Score]
    B --> D[TDS Score]
    B --> E[Temp Score]
    B --> F[Turbidity Score]

    C --> G[Sub-Index Calculation]
    D --> G
    E --> G
    F --> G

    G --> H[Weighted Average]
    H --> I{WQI Score}

    I -->|"> 80"| J["SANGAT LAYAK<br/>(Excellent)"]
    I -->|"60-80"| K["LAYAK<br/>(Good)"]
    I -->|"< 60"| L["BAHAYA<br/>(Dangerous)"]
```

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React + Tailwind CSS | Fast development, utility-first styling |
| Charts | Recharts | React-native, composable, good for dashboards |
| Map | Leaflet + CartoDB Dark | Free, dark tiles match theme, lightweight |
| State | React Context + useReducer | Simple for single-page IoT dashboard |
| Polling | 5s interval | Balance between real-time & API rate limits |
| Hosting | Vercel | Auto-deploy, edge functions, free tier |
| Alerts | Telegram Bot API | Free, reliable, instant push notifications |
