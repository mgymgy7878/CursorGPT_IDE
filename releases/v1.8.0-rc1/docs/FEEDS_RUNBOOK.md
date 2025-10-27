# Feeds Runbook

Market Data Feed Operations Guide

## Environment Variables

### Required
```bash
MARKETDATA_PORT=4005
MARKETDATA_HOST=0.0.0.0
```

### BTCTurk (Optional)
```bash
BTCTURK_BASE_URL=https://api.btcturk.com/api/v2
BTCTURK_WS_URL=wss://ws-feed.btcturk.com
BTCTURK_PING_PATH=/ping
BTCTURK_API_KEY=your_api_key
BTCTURK_API_SECRET=your_api_secret
```

### BIST
```bash
BIST_SOURCE=file
BIST_PING_PATH=/healthz
BIST_FILE_PATH=/tmp/bist-data.json
```

### Database (Optional)
```bash
# For Prisma database mode
PRISMA_DATABASE_URL=postgresql://user:password@localhost:5432/marketdata

# For JSONL fallback mode (default)
# No additional environment variables needed
```

## Smoke Test Steps

### Local Testing
```bash
# 1. Build packages
pnpm -w build

# 2. Start marketdata service
node services/marketdata/dist/index.cjs

# 3. Run smoke tests
# Windows
pwsh ./scripts/feeds-smoke.ps1

# Linux
bash ./scripts/feeds-smoke.sh
```

### Expected Results
- `GET /feeds/canary?dry=true` → `{ok:true, sources:[{name:'btcturk',ready:true},{name:'bist',ready:true}]}`
- `GET /feeds/health` → `{status:'ok', sources:{btcturk:{status:'UP', lastEventTs, lastDbWriteTs}, bist:{status:'UP', lastEventTs, lastDbWriteTs}}}`
- `GET /metrics` → Contains `feed_events_total`, `ws_reconnects_total`, `feed_latency_ms`, `event_to_db_ms`

## Common Failures

### DNS Issues
- **Symptom**: BTCTurk ping fails
- **Solution**: Check network connectivity, DNS resolution
- **Command**: `nslookup api.btcturk.com`

### Certificate Issues
- **Symptom**: SSL/TLS handshake failures
- **Solution**: Check system certificates, update if needed
- **Command**: `openssl s_client -connect api.btcturk.com:443`

### Proxy Issues
- **Symptom**: Connection timeouts
- **Solution**: Configure proxy settings or bypass
- **Environment**: `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`

### Rate Limiting
- **Symptom**: 429 Too Many Requests
- **Solution**: Implement backoff, reduce request frequency
- **Monitoring**: Check `ws_reconnects_total` metric

## Monitoring

### Key Metrics
- `feed_events_total{source}` - Total events received
- `ws_reconnects_total{source}` - WebSocket reconnection attempts
- `feed_latency_ms{source}` - Event processing latency
- `event_to_db_ms{table}` - Database write latency

### Symbol Normalization
- Symbols are normalized using `@spark/symbols` package
- `BTCUSDT` → `BTC/USDT`, `BTCTRY` → `BTC/TRY`
- Unsupported symbols are filtered out and logged
- Only symbols ending with `/USDT`, `/TRY`, `/USD`, `/EUR` are supported

### Health Checks
- Service health: `GET /health`
- Feed health: `GET /feeds/health`
- Canary test: `GET /feeds/canary?dry=true`

### Alerts
- `feed_up == 0` - Feed source down
- `ws_reconnects_total` rate > 5/min - Excessive reconnects
- `driftMs > 200` - Clock drift detected

### Database Modes
- **Prisma Mode**: Set `PRISMA_DATABASE_URL` for PostgreSQL storage
- **JSONL Mode**: Default fallback, stores events in `data/feeds/events-YYYYMMDD.jsonl`
- **File Rotation**: Daily rotation for JSONL files
- **Schema**: `MarketEvent(id, source, type, symbol, ts, payload)`, `Tick(id, source, symbol, ts, price, volume)`

## Rollback Procedures

### Service Rollback
```bash
# Stop current service
pkill -f "node.*marketdata"

# Start previous version
node services/marketdata/dist/index.cjs --version=previous
```

### Configuration Rollback
```bash
# Revert environment variables
export BTCTURK_BASE_URL=https://api.btcturk.com/api/v2
export BIST_SOURCE=file

# Restart service
systemctl restart marketdata
```

## Troubleshooting

### Log Analysis
```bash
# Check service logs
tail -f logs/marketdata.log

# Check specific errors
grep -i "error\|fail" logs/marketdata.log
```

### Network Diagnostics
```bash
# Test connectivity
curl -I https://api.btcturk.com/api/v2/ping

# Test WebSocket
wscat -c wss://ws-feed.btcturk.com
```

### Performance Analysis
```bash
# Check metrics
curl http://127.0.0.1:4005/metrics | grep feed_

# Monitor latency
curl http://127.0.0.1:4005/metrics | grep feed_latency_ms
```

## Deployment

### Production Deployment
1. Set environment variables
2. Build packages: `pnpm -w build`
3. Start service: `node services/marketdata/dist/index.cjs`
4. Run smoke tests: `./scripts/feeds-smoke.sh`
5. Monitor metrics: `curl http://127.0.0.1:4005/metrics`

### CI/CD Integration
- GitHub Actions workflow: `.github/workflows/feeds-smoke.yml`
- Automated testing on push/PR
- Metrics contract validation
- Smoke test execution
