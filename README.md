# Fleet Telemetry Ingestion Service

A production-ready backend service for ingesting and analyzing telemetry from Smart Meters and EVs. Built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Polymorphic Ingestion**: Single endpoint (`/v1/ingest`) handles both Meter and Vehicle telemetry.
- **Hot & Cold Storage**:
  - **Hot**: Latest state for real-time dashboards (UPSERT).
  - **Cold**: Complete historical log for analytics (INSERT only).
- **Analytics**: Performance analysis endpoint calculating efficiency and aggregating data.
- **Dockerized**: One-command startup.

## Architecture & Design Decisions

### 1. Database Strategy (Hot vs Cold)

We utilize a dual-storage strategy to balance write throughput and read performance:

- **Hot Store (`devices_hot`)**:
  - **Purpose**: Fast access to the *current* state of any device (voltage, SoC, etc.).
  - **Logic**: Uses `INSERT ... ON CONFLICT (device_id) DO UPDATE`. This guarantees O(1) access by ID without scanning history.
  - **Schema**: Stores `device_id`, `type`, `latest_data` (JSONB), and `updated_at`.

- **Cold Store (`telemetry_cold`)**:
  - **Purpose**: Immutable audit trail and time-series analytics.
  - **Logic**: Append-only (`INSERT`). No updates or deletes.
  - **Schema**: `device_id`, `timestamp`, `type`, `data` (JSONB).
  - **Indexing**: Composite Primary Key `(device_id, timestamp)` ensures uniqueness and optimizes time-range queries for specific devices.

### 2. Scalability (14.4M requests/day)

- **Write Performance**: The architecture supports high ingestion rates by using simple `INSERT` statements for history. PostgreSQL corresponds well to append-only workloads.
- **Partitioning**: For production at 14.4M rows/day (~430M/month), table partitioning (by range on `timestamp`) is recommended. The current schema is compatible with `pg_partman`.
- **Validation**: `Zod` provides strict runtime validation before data hits the DB, saving resources on invalid requests.

### 3. Correlation Assumptions

The system ingests two independent streams:
- **Meter (Grid Side)**: Measures AC input.
- **Vehicle (Battery Side)**: Measures DC output.

**Assumption**: For the Analytics endpoint (`GET /v1/analytics/performance/:vehicleId`), we match records where `device_id` is identical for both streams. This assumes a 1:1 mapping where the Charger/Meter and Vehicle report under the same ID or are associated by the client before ingestion.

### 4. Indexing Strategy

- **`devices_hot`**: PK on `device_id`. Fast lookups.
- **`telemetry_cold`**: PK on `(device_id, timestamp)`. This creates a B-Tree index covering both columns, making queries like "Get data for Device X between T1 and T2" extremely efficient, avoiding full table scans.

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

### One-Command Startup

```bash
docker-compose up --build
```

This will:
1. Start PostgreSQL (Port 5432).
2. Build the Node.js app.
3. Run Database Migrations.
4. Start the API Server (Port 3000).

### Manual Setup (Dev Mode)

```bash
# Install dependencies
npm install

# Start DB
docker-compose up -d db

# Run Migrations
npm run migrate

# Start Server
npm run dev
```

## detailed Verification

You can verify the system behavior using the included script:

```bash
npx ts-node scripts/verify.ts
```

This script:
1. Ingests a sample Meter reading.
2. Ingests a corresponding Vehicle reading.
3. Fetches the performance analytics.
4. Validates the efficiency calculation (DC / AC).

## API Endpoints

### 1. Ingest Telemetry
`POST /v1/ingest`

**Payload (Meter)**:
```json
{
  "meterId": "123",
  "kwhConsumedAc": 100,
  "voltage": 230,
  "timestamp": "2023-10-27T10:00:00Z"
}
```

**Payload (Vehicle)**:
```json
{
  "vehicleId": "123",
  "soc": 80,
  "kwhDeliveredDc": 90,
  "batteryTemp": 35,
  "timestamp": "2023-10-27T10:00:00Z"
}
```

### 2. Get Analytics
`GET /v1/analytics/performance/:vehicleId`

**Response**:
```json
{
  "vehicleId": "123",
  "period": "24h",
  "totalkwhConsumedAc": 100,
  "totalkwhDeliveredDc": 90,
  "efficiencyRatio": 0.9,
  "avgBatteryTemp": 35
}
```
