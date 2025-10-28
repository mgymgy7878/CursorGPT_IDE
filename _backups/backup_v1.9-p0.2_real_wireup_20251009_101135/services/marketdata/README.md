# Market Data Service

Feed Orchestrator for BTCTurk and BIST data sources.

## Environment Variables

```bash
# BTCTurk (optional)
BTCTURK_API_KEY=your_api_key
BTCTURK_API_SECRET=your_api_secret

# BIST
BIST_FILE_PATH=/tmp/bist-data.json

# Service
PORT=4005
HOST=0.0.0.0
```

## Endpoints

- `GET /health` - Service health check
- `GET /feeds/canary?dry=true` - Canary test (dry run)
- `GET /feeds/health` - Feed sources health status
- `GET /metrics` - Prometheus metrics

## Features

- BTCTurk WebSocket integration
- BIST file-based data source
- Prometheus metrics collection
- Health monitoring
- Graceful shutdown
