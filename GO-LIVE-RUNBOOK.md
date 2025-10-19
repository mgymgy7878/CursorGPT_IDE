# 🚀 Spark TA Module v1.0.0 - 10-Minute Go-Live Runbook

**Purpose:** Fast and safe production cutover with clear Go/No-Go criteria  
**Time:** 10 minutes  
**Team:** 1 operator + 1 backup

---

## ⏱️ Timeline

| Step | Duration | Action |
|------|----------|--------|
| 0. Preflight | 30s | Health check |
| 1. Secrets | 1 min | Configure .env |
| 2. Deploy | 2 min | Build + start services |
| 3. Smoke Test | 15s | Basic validation |
| 4. Regression | 45s | Full validation |
| 5. Grafana | 1 min | Import dashboard |
| 6. CLI Validation | 1 min | Verify metrics |
| 7. UI Spot Check | 2 min | Manual verification |
| 8. Decision | 1 min | Go/No-Go |
| **TOTAL** | **~10 min** | **Complete cutover** |

---

## 📋 Cutover Steps

### 0️⃣ Preflight (30 seconds)

```bash
cd /path/to/spark-trading-platform

# Verify repository state
git status
git describe --tags  # Should be: ta-module-v1.0.0

# Check prerequisites
bash scripts/health-check.sh || exit 1

# Expected: Docker, docker-compose, jq installed
```

**Go/No-Go:** ✅ All prerequisites met

---

### 1️⃣ Secrets & Environment (1 minute)

```bash
# Create environment file
cp .env.example .env   # if not exists

# Edit configuration
nano .env

# Critical variables to set:
# - TELEGRAM_BOT_TOKEN=...
# - TELEGRAM_CHAT_ID=...
# - REDIS_URL=redis://spark-redis:6379
# - SCHEDULER_ENABLED=true
# - NOTIFY_ALLOWED_HOSTS=hooks.slack.com,discord.com

# Verify no placeholders
grep -E "your_.*_here|example\.com" .env && echo "⚠️ Update placeholders!" || echo "✅ Secrets OK"
```

**Go/No-Go:** ✅ All secrets configured

---

### 2️⃣ Build & Deploy (2 minutes)

```bash
# Run deployment script
bash scripts/deploy.sh

# Expected output:
# ✅ Environment variables OK
# ✅ Images pulled
# ✅ Build complete
# ✅ Services started
# ✅ Executor: healthy
# ✅ Web-Next: healthy
# ✅ Redis: healthy
# ✅ Leader elected
# 🎉 DEPLOYMENT SUCCESSFUL!
```

**Go/No-Go:** ✅ Deployment successful, all services healthy

---

### 3️⃣ Smoke Test (15 seconds)

```bash
bash scripts/smoke-test-v1.0.0.sh

# Expected output:
# ✅ Health OK
# ✅ SSE Metrics OK
# ✅ Copilot Tools OK
# ✅ Alert CRUD OK
# ✅ Prometheus Metrics OK
# ⚠️ Notifications not configured (skip) [optional]
# ✅ UI Pages OK
# 🎉 ALL SMOKE TESTS PASSED!
```

**Go/No-Go:** ✅ All smoke tests passed (notifications optional)

---

### 4️⃣ Regression Suite (45 seconds)

```bash
bash scripts/regression-suite.sh

# Expected output:
# ✓ A-001: Fibonacci returns 7 levels
# ✓ A-002: Bollinger bands valid (u > m > l)
# ✓ A-003: MACD returns current values
# ✓ C-001 to C-006: Alert CRUD (6 tests)
# ✓ S-001, S-003, S-004: SSE (3 tests)
# ✓ M-001, M-002: Metrics (2 tests)
# ✓ Health checks (2 tests)
# ✓ V-001, V-002: Security (2 tests)
#
# Pass Rate: 100% (18/18)
# 🎉 ALL REGRESSION TESTS PASSED!
```

**Go/No-Go:** ✅ Pass rate ≥95% (target: 100%)

---

### 5️⃣ Grafana Dashboard (1 minute)

```bash
# Open Grafana UI
open http://localhost:3000  # or your Grafana URL

# Import dashboard:
# 1. Dashboard → Import
# 2. Upload JSON: monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json
# 3. Select Prometheus data source
# 4. Import

# Configure:
# - Auto-refresh: 10 seconds
# - Time range: Last 1 hour

# Verify panels showing data
```

**Go/No-Go:** ✅ Dashboard imported, data visible

---

### 6️⃣ CLI Field Validation (1 minute)

```bash
# Check active alerts
curl -s http://localhost:4001/metrics | grep -E "^alerts_active " | awk '{print $2}'
# Expected: 0 (or actual count)

# Check leader election
curl -s http://localhost:4001/metrics | grep -E "^leader_elected_total " | awk '{print $2}'
# Expected: 1 or 2 (one election)

# Check SSE streams
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams
# Expected: X-Streams-Connected, X-Streams-Messages headers present

# Check notifications
curl -s http://localhost:4001/metrics | grep "notifications_sent_total"
# Expected: Counter present (value may be 0)

# Check for errors
curl -s http://localhost:4001/metrics | grep "_errors_total"
# Expected: All counters = 0 or very low
```

**Go/No-Go:** ✅ All metrics healthy, no error spikes

---

### 7️⃣ UI Spot Check (2 minutes)

```bash
# Open UI
open http://localhost:3000/technical-analysis
```

**Manual verification:**

1. **Chart loads:**
   - ✅ Candlestick chart visible
   - ✅ Symbol: BTCUSDT, Timeframe: 1h
   - ✅ Volume bars below chart

2. **Live mode:**
   - ✅ Click "Live" toggle ON
   - ✅ See "⚡ Streaming" badge
   - ✅ Last candle updates smoothly (no stuttering)
   - ✅ No JavaScript errors in console (F12)

3. **Indicators:**
   - ✅ Click "Bollinger Bands" → 3 lines appear
   - ✅ Click "Fibonacci" → horizontal lines with % labels
   - ✅ Overlays render correctly

4. **Alerts page:**
   ```bash
   open http://localhost:3000/alerts
   ```
   - ✅ Table loads (may be empty)
   - ✅ "Create Alert" button works
   - ✅ Create test alert → appears in list
   - ✅ Enable/Disable toggle works
   - ✅ History button opens modal
   - ✅ Delete button works

**Go/No-Go:** ✅ All UI flows functional

---

### 8️⃣ Go/No-Go Decision (1 minute)

**Criteria:**

| Check | Status | Required |
|-------|--------|----------|
| Deployment successful | ✅/❌ | **YES** |
| Smoke tests passed | ✅/❌ | **YES** |
| Regression ≥95% | ✅/❌ | **YES** |
| Leader elected | ✅/❌ | **YES** |
| No critical errors | ✅/❌ | **YES** |
| UI functional | ✅/❌ | **YES** |
| Grafana dashboard | ✅/❌ | Nice to have |
| Notifications working | ✅/❌ | Nice to have |

**Decision:**

- **GO:** All required checks ✅ → Proceed to hypercare monitoring
- **NO-GO:** Any required check ❌ → Execute rollback immediately

---

## ✅ POST-GO: Hypercare (First 60 Minutes)

### Metrics to Monitor:

**1. Streaming Health:**
```bash
# Watch SSE connections
watch -n 5 'curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams'

# Expected: streams_connected stable, errors ~0
```

**2. Alert Engine:**
```bash
# Watch alert activity
watch -n 10 'curl -s http://localhost:4001/metrics | grep -E "alerts_triggered|alerts_suppressed"'

# Expected: triggers happening (if alerts exist), suppressions due to cooldown
```

**3. Notifications:**
```bash
# Watch notification delivery
watch -n 10 'curl -s http://localhost:4001/metrics | grep notifications_failed_total'

# Expected: failures ~0
```

**4. Leader Status:**
```bash
# Check leader is holding
docker logs executor-1 | grep -E "became leader|heartbeat" | tail -10

# Expected: "became leader" once, heartbeat logs every ~30s
```

**5. Resource Usage:**
```bash
# Monitor resources
docker stats --no-stream | grep -E "executor|web-next|redis"

# Expected: CPU <20%, Memory stable
```

### Escalation Thresholds:

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| `streams_errors_total` | >5 in 5min | >20 in 5min | Check Binance connectivity |
| `notifications_failed_total` | >2% | >10% | Check Telegram/Webhook config |
| `alerts_suppressed{cooldown}` | >50% | >80% | Consider reducing `ALERT_COOLDOWN_SEC` |
| Leader elections | 2 in 1h | 5 in 1h | Check Redis, network stability |
| Memory growth | +10%/10min | +50%/10min | Check for leaks, restart if needed |

---

## 🧯 Rollback Procedures

### Option 1: Emergency Scheduler Stop (30 seconds)

**When:** Alert spam or evaluation issues

```bash
# Stop scheduler immediately
docker exec executor-1 sh -c "export SCHEDULER_ENABLED=false && kill -HUP 1"

# Verify stopped
docker logs executor-1 | grep scheduler | tail -5
# Should NOT see new "pollOnce" logs
```

---

### Option 2: Reduce SSE Load (1 minute)

**When:** SSE connection overload

```bash
# Update .env
sed -i 's/MAX_SSE_CONNECTIONS=3/MAX_SSE_CONNECTIONS=1/' .env

# Restart web-next
docker restart web-next-1

# Wait 10 seconds
sleep 10

# Verify
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams-Connected
```

---

### Option 3: Full Rollback (2 minutes)

**When:** Critical failure, system unstable

```bash
# Stop current deployment
docker compose down

# Checkout previous version
git fetch --tags
git checkout ta-module-v0.9.0  # or your previous stable tag

# Redeploy
docker compose up -d --build

# Wait for services
sleep 30

# Verify
bash scripts/health-check.sh

# Notify team
echo "⚠️ ROLLBACK EXECUTED to v0.9.0 at $(date)"
```

---

## 🔍 Field Diagnostics (Most Useful 6 Commands)

### 1. Who is the leader?
```bash
docker logs executor-1 | grep "became leader" | tail -1
# Expected: Timestamp + "became leader" message from ONE instance only
```

### 2. Active alert count?
```bash
curl -s http://localhost:4001/metrics | awk '/^alerts_active /{print $2}'
# Expected: Integer ≥0
```

### 3. SSE status?
```bash
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams
# Expected: X-Streams-Connected, X-Streams-Messages, X-Streams-Errors
```

### 4. Notification failures?
```bash
curl -s http://localhost:4001/metrics | grep notifications_failed_total | tail -3
# Expected: Low or zero counts
```

### 5. Alert trigger trend?
```bash
curl -s http://localhost:4001/metrics | grep alerts_triggered_total | tail -5
# Expected: Counters incrementing over time (if alerts active)
```

### 6. Redis health?
```bash
docker exec spark-redis redis-cli --scan --pattern "spark:alerts:*" | wc -l
# Expected: Number of keys (1 alert ≈ 3-4 keys: hash, set entry, history)
```

---

## ✅ Final Reminders

### Critical Configuration:

- [x] **Nginx SSE:** `proxy_buffering off` + `X-Accel-Buffering: no`
- [x] **Redis AOF:** `appendfsync everysec`
- [x] **Secrets:** Telegram/Webhook tokens only in `.env` (NOT in code)
- [x] **Docker preferred** over PM2 for production

### Post-Go-Live:

- [x] Follow `docs/operations/HYPERCARE-CHECKLIST.md` for 48-hour monitoring
- [x] Set up Prometheus alerts (see `config/prometheus.yml`)
- [x] Schedule regular backups (Redis AOF + code repo)
- [x] Plan next sprint (PATCH-5B for v1.1.0)

---

## 📞 Escalation Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Critical failure | On-call DevOps | <15 minutes |
| Performance degradation | Platform Team | <1 hour |
| Feature questions | Product Lead | <4 hours |
| General support | support@your-org.com | <24 hours |

---

## 📊 Success Criteria (Post-Cutover)

**Immediate (T+10 minutes):**
- ✅ All services running
- ✅ Smoke + regression passed
- ✅ UI functional
- ✅ No critical errors

**Short-term (T+60 minutes):**
- ✅ Leader holding lock
- ✅ Alerts evaluating (if configured)
- ✅ Notifications delivering
- ✅ SSE streaming stable

**Long-term (T+48 hours):**
- ✅ All SLOs met (Availability ≥99.5%, Latency ≤2s, Success ≥98%)
- ✅ No memory leaks
- ✅ User feedback positive
- ✅ Ready for next sprint

---

**Status:** ✅ Ready for Production  
**Version:** 1.0.0  
**Last Updated:** 2025-10-11  
**Approved By:** [Platform Team]

