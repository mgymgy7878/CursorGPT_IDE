# Market Data Feeds Runbook

## Overview
Market data feed orchestrator with BTCTurk and BIST integration, supporting both JSONL fallback and Prisma DB modes.

## Environment Variables

### Required
- `MARKETDATA_PORT`: Service port (default: 4005)
- `BTCTURK_BASE_URL`: BTCTurk API base URL
- `BTCTURK_WS_URL`: BTCTurk WebSocket URL
- `BIST_SOURCE`: BIST data source ('file' or 'api')

### Optional
- `PRISMA_DATABASE_URL`: PostgreSQL connection string (enables Prisma mode)
- `BTCTURK_PING_PATH`: BTCTurk ping endpoint path
- `BIST_PING_PATH`: BIST ping endpoint path

## DB Modes

### JSONL Fallback (Default)
- No `PRISMA_DATABASE_URL` set
- Writes to `data/feeds/events-YYYYMMDD.jsonl` and `data/feeds/ticks-YYYYMMDD.jsonl`
- Safe for development and testing

### Prisma Mode
- Set `PRISMA_DATABASE_URL` environment variable
- Run `pnpm -w --filter services/marketdata db:push` to create tables
- Writes to PostgreSQL `market_event` and `tick` tables
- Requires database migration approval

## Setup Commands

### Prerequisites
```bash
pnpm -w install
```

### JSONL Mode (Default)
```bash
pnpm -w build
node services/marketdata/dist/index.cjs
```

### Prisma Mode
```bash
# Set database URL
export PRISMA_DATABASE_URL="postgresql://user:pass@host:5432/db"

# Generate Prisma client
pnpm -w --filter services/marketdata prisma:generate

# Push schema to database
pnpm -w --filter services/marketdata db:push

# Build and start
pnpm -w build
node services/marketdata/dist/index.cjs
```

## Health Endpoints

### Canary Check
- `GET /feeds/canary?dry=true` - Test reachability without starting feeds
- `GET /feeds/canary` - Real canary check with feed status

### Health Status
- `GET /feeds/health` - Detailed health with lastEventTs, lastDbWriteTs, lastError

### Metrics
- `GET /metrics` - Prometheus metrics including:
  - `feed_events_total{source}`
  - `ws_reconnects_total{source}`
  - `feed_latency_ms{source}`
  - `event_to_db_ms{table}`
  - `db_writes_total{table}`

## Smoke Testing

### Local Smoke Test
```bash
pwsh ./scripts/feeds-smoke.ps1
```

### DB Smoke Test (Prisma Mode)
```bash
pwsh ./scripts/db-smoke.ps1
```

## Evidence Collection
- Include `/metrics` with `db_writes_total` and `event_to_db_ms*` metrics
- Health endpoints should show current `lastDbWriteTs`
- Smoke tests should pass for both JSONL and Prisma modes

## Troubleshooting

### Common Issues
1. **Build Errors**: Ensure TypeScript configuration is correct
2. **DB Connection**: Verify `PRISMA_DATABASE_URL` format
3. **Feed Timeouts**: Check network connectivity to BTCTurk/BIST
4. **Metrics Missing**: Verify `@metrics` alias is configured

### Logs
- Service logs: `logs/marketdata-combined.log`
- Error logs: `logs/marketdata-error.log`
- Output logs: `logs/marketdata-out.log`
