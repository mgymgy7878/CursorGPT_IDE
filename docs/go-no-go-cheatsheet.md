# Go/No-Go Cheat Sheet - WebSocket Migration

## D0 - Go/No-Go Hızlı Kontrol

### ✅ Environment Flags → Production

```powershell
# Windows (runbook sets these automatically)
$Env:NODE_ENV = "production"
$Env:NEXT_PUBLIC_WS_ENABLED = "true"
```

```bash
# Linux (runbook-linux handles this)
export NODE_ENV=production
export NEXT_PUBLIC_WS_ENABLED=true
```

### ✅ Service Startup

```powershell
# Windows
.\scripts\cutover-runbook.ps1
```

```bash
# Linux
bash ./scripts/cutover-runbook-linux.sh
```

### ✅ Smoke/Health (Automatic + Spot Check)

```powershell
# Executor Health
Invoke-WebRequest -Uri "http://127.0.0.1:4001/health"
# Expected: {"ok":true,"mode":"NORMAL"}

# UI Health
Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/health"
# Expected: {"ok":true,...}

# BTCTurk Ticker
Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY"
# Preferred: mock:false (if mock:true, check WS/feature flag/endpoint chain)
```

### ✅ WebSocket Validation (UI + Infrastructure)

- **UI**: Navigate to `/btcturk` → Status pill OPEN (green), data flowing, no reconnect loops
- **Nginx**: Upgrade/Connection headers passing (101 Switching Protocols)

### ✅ Canary Trigger

1. GitHub Actions → Receipts Gate → Run workflow
2. PASS/FAIL parser step PASS
3. Artifact `canary_resp.json` created

### ✅ 10-Minute Observation

```bash
pm2 logs --lines 200
# Check: No errors/fatals, WS reconnect not increasing
```

## Go Criteria ✅

- Health 200 rate ≥ 99.5%
- Canary PASS ≥ 95%
- WS P95 < 1s
- UI pill OPEN
- mock:false

## 24-Hour Monitoring (D0→D1)

### Live Monitoring

```bash
pm2 monit
# or
pm2 logs
```

### Thresholds

- Health ≥ 99.5%
- Canary PASS ≥ 95%
- WS reconnect trend not increasing

### Monitoring Script

```powershell
.\scripts\monitoring-24h.ps1
# Artifacts and summaries drop to evidence directory
```

## Common Issues → Quick Fixes

### WS Handshake 400/502

**Nginx headers required:**

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
```

- Reverse proxy target correct port (3003)

### UI Ticker mock:true Stuck

- Rebuild required with `NEXT_PUBLIC_WS_ENABLED=true` (runbook does this)
- Verify executor access to real market endpoint/firewall

### UI /btcturk Pill DEGRADED/CLOSED

- Check store wsStatus and logs
- Verify WebSocket connection state

### Port/Process Conflict

```bash
pm2 delete all
netstat -ano | findstr ":3003" / ":4001"
# Clean PID conflicts
```

### High Latency / Dropped Frames

- Check network/bandwidth
- Verify Nginx buffers and proxy_read_timeout values
- UI polling fallback logs noted (DEGRADED)

## Rollback Options (Fastest to Safest)

### Feature-Flag Rollback

```bash
NEXT_PUBLIC_WS_ENABLED=false
# Rebuild → pm2 restart all
# UI automatically falls back to polling
```

### Application Rollback (PM2)

```bash
pm2 delete all && pm2 start <previous-ecosystem/version>
# Use previously saved version
```

### Complete Rollback

```bash
# Comment out WS upgrade blocks in Nginx → nginx -s reload
# UI HTTP only
```

## Evidence & Reporting

### Automatic Evidence Collection

Runbooks automatically drop evidence files to `evidence/local/github/`:

- `cutover_runbook_complete.txt`
- `canary_resp.json`
- Smoke/health outputs

### D0 Final Status

`evidence/local/github/cutover_final_status.txt` summary → Go/No-Go signature source

## Post-Cutover (D+1) Short Plan

### Day 1 Tasks

1. **Canary Trend Report** + 24h metric summary (PASS/FAIL percentages, P95 latency)
2. **Nginx Log Analysis** - 5xx analysis from access/error logs
3. **UI/Executor Error Rate** review; minor tuning if needed (timeouts, retry backoff)
4. **Canary Alarm Thresholds** calibration (false positive/negative ratio)

### Performance Optimization

- Fine-tune reconnection logic if needed
- Optimize latency thresholds
- Document lessons learned

## Execution Sequence

1. **Runbook** → Health → WS → Canary → 24h monitoring
2. **Share initial outputs** for real-time collaboration
3. **Monitor thresholds** continuously
4. **Document results** for future improvements

---

**Status**: Ready for Go-Live
**Last Updated**: 2025-01-08
**Version**: 1.0
