# Go-Live Checklist - WebSocket Migration

## Pre-Deployment Checklist

### ✅ Secrets & Environment

- [ ] `SPARK_API_URL` secret added to GitHub Actions
- [ ] `SPARK_API_TOKEN` secret added to GitHub Actions
- [ ] `NEXT_PUBLIC_WS_ENABLED=true` set for production build
- [ ] BTCTurk WebSocket endpoint URLs configured

### ✅ Infrastructure

- [ ] Nginx WebSocket upgrade configuration applied
- [ ] `map $http_upgrade $connection_upgrade` mapping added
- [ ] Proxy headers updated to use `$connection_upgrade`
- [ ] Timeout settings optimized (60s for WS connections)

### ✅ Build & Deploy

- [ ] Clean build with frozen lockfile: `pnpm -w install --frozen-lockfile`
- [ ] Package builds in dependency order
- [ ] WebSocket-enabled build: `NEXT_PUBLIC_WS_ENABLED=true pnpm --filter web-next run build`
- [ ] Docker deployment: `docker compose up -d --build`
- [ ] Or PM2 deployment: `pm2 start ecosystem.config.js --only spark-web,spark-executor`

## Post-Deployment Validation

### ✅ Smoke Tests

```bash
./scripts/health-check.sh
```

**Expected Results:**

- Web Health: ✅ 200
- Executor Health: ✅ 200
- BTCTurk Ticker: ✅ Valid JSON with data
- WebSocket Feature Flag: ✅ Enabled in build

### ✅ WebSocket UI Validation

```bash
./scripts/ws-validation.sh
```

**Manual Checks:**

1. Navigate to `/btcturk` page
2. Look for Status Pills:
   - 🟢 `WS` (green) = OPEN connection
   - 🟡 `WS!` (yellow) = DEGRADED connection
   - 🔴 `WS✗` (red) = CLOSED connection
3. Verify Spread Card real-time updates
4. Check latency tooltip on WS pill

### ✅ Performance Thresholds

- **wsLatency**: < 300ms (local) / < 800ms (prod)
- **wsReconnectAttempts**: Should not continuously increase
- **Connection state**: Should reach OPEN within 5 seconds
- **Event→Store latency**: P95 < 1s

### ✅ Canary Validation

1. Manual trigger: GitHub Actions → Receipts Gate → Run workflow
2. Check canary step PASS/FAIL parser output
3. Verify artifact: `canary_resp.json`
4. Confirm log shows "Canary PASS - latency evidence collected"

## Observability Thresholds

### ✅ Success Criteria

- UI GET `/api/public/health` 200 rate ≥ 99.5%
- Executor GET `/health` 200 rate ≥ 99.5%
- Canary PASS rate ≥ 95% (last 7 runs)
- WS event→store latency P95 < 1s
- No disconnection bursts

### ✅ Monitoring Points

- WebSocket connection state changes
- Latency measurements
- Reconnection attempt frequency
- Error rate spikes
- Canary success rate

## Rollback Procedures

### 🚨 Emergency Rollback Triggers

- wsLatency > 1000ms consistently
- wsReconnectAttempts > 10/minute
- Connection state stuck in CLOSED
- UI becomes unresponsive
- 5xx error spike in logs
- Canary PASS rate < 95%

### 🔄 Rollback Options

#### Quick Rollback (Feature Flag)

```bash
NEXT_PUBLIC_WS_ENABLED=false pnpm --filter web-next run build
docker compose up -d --build
# or
pm2 restart spark-web
```

#### Instant Rollback (PM2)

```bash
pm2 restart spark-web@previous-version
pm2 logs spark-web --lines 50
```

#### Docker Rollback

```bash
docker compose down
docker compose -f docker-compose.yml -f docker-compose.previous.yml up -d
```

### ✅ Post-Rollback Validation

1. Health checks: `./scripts/health-check.sh`
2. BTCTurk page loads with polling data
3. Status pill shows 'Canlı' (not WS indicators)
4. No WebSocket connections in browser dev tools
5. Error logs clear

## Go/No-Go Decision Matrix

| Criteria                   | Status | Action   |
| -------------------------- | ------ | -------- |
| Smoke tests PASS           | ✅     | Continue |
| WS status=OPEN, latency OK | ✅     | Continue |
| Canary PASS                | ✅     | Continue |
| No 5xx spike in logs       | ✅     | Continue |
| UI responsive              | ✅     | Continue |

**All criteria must be ✅ for Go-Live approval**

## Post Go-Live Monitoring

### First 24 Hours

- Monitor WebSocket connection stability
- Track latency metrics
- Watch for reconnection patterns
- Verify canary success rate

### First Week

- Analyze performance trends
- Optimize reconnection logic if needed
- Fine-tune latency thresholds
- Document lessons learned

## Support Contacts

- **Technical Issues**: Development Team
- **Infrastructure**: DevOps Team
- **Business Impact**: Product Team
- **Emergency Escalation**: On-call Engineer

---

**Last Updated**: 2025-01-08
**Version**: 1.0
**Status**: Ready for Go-Live
