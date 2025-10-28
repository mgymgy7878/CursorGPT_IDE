# Spark TA Module v1.0.0 - Monitoring & Operations

## 📦 Quick Start

### 1. Import Grafana Dashboard

```bash
# Navigate to Grafana UI
open http://localhost:3000

# Import dashboard:
# 1. Click "+" → Import
# 2. Upload: monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json
# 3. Select Prometheus data source
# 4. Click "Import"
```

### 2. Run Smoke Tests

```bash
# Default (localhost)
bash scripts/smoke-test-v1.0.0.sh

# Custom URLs
EXECUTOR_URL=http://executor:4001 WEB_URL=http://web:3000 bash scripts/smoke-test-v1.0.0.sh

# Verbose mode
VERBOSE=1 bash scripts/smoke-test-v1.0.0.sh
```

### 3. Check SLO Compliance

```bash
# Open Prometheus
open http://localhost:9090

# Run queries from: docs/monitoring/SLO-QUERIES.md
# Example:
# sum(rate(notifications_sent_total[5m])) / (sum(rate(notifications_sent_total[5m])) + sum(rate(notifications_failed_total[5m]))) * 100
```

---

## 📊 Dashboard Panels

### Panel 1: Alert Lifecycle
- **Active Alerts:** Current count
- **Created/min:** Alert creation rate
- **Triggered/min:** Alert trigger rate
- **Suppressed/min:** Cooldown suppression rate

### Panel 2: Notification Delivery
- **Sent/min:** By channel (Telegram, Webhook)
- **Failed/min:** By channel + reason
- **Suppressed/min:** Rate limiting

### Panel 3: Leader Election
- **Total Elections:** Should be 1-2 (stable)
- **Held Time:** How long current leader active

### Panel 4: SSE Streams
- **Connected:** Active stream count
- **Messages/min:** Kline updates
- **Errors/min:** Should be ~0

### Panel 5-7: Breakdowns
- Alert types distribution
- Suppression reasons
- Notification success gauge (≥98%)

### Panel 8-9: Errors & Performance
- Alert evaluation errors
- Copilot tool cache hit rate

---

## 🎯 SLO Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| SSE Availability | ≥99.5% | - | 🟡 |
| Alert Latency P95 | ≤2s | - | 🟡 |
| Notification Success | ≥98% | - | 🟡 |

**Update after 48 hours hypercare**

---

## 🔥 Smoke Test Results

Expected output:
```
🔍 Spark TA Module v1.0.0 - Production Smoke Test
=================================================
Executor: http://localhost:4001
Web:      http://localhost:3000

1️⃣  Health Checks...
✅ Health OK
2️⃣  SSE Stream Metrics...
✅ SSE Metrics OK
3️⃣  Copilot Tools...
✅ Copilot Tools OK
4️⃣  Alert Lifecycle (CRUD)...
   Created: 01234567-89ab-cdef-0123-456789abcdef
   Listed: 1 alerts
✅ Alert CRUD OK
5️⃣  Prometheus Metrics...
✅ Prometheus Metrics OK
6️⃣  Notification Test (optional)...
⚠️  Notifications not configured (skip)
7️⃣  Web UI Pages...
✅ UI Pages OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ALL SMOKE TESTS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ System is production-ready
```

---

## 📋 Hypercare Checklist

Follow: `docs/operations/HYPERCARE-CHECKLIST.md`

**Key milestones:**
- T+0: Deployment complete
- T+15min: Metrics visible
- T+1h: Performance validated
- T+24h: Stability confirmed
- T+48h: Hypercare exit

---

## 🛠️ Quick Commands

```bash
# Check active alerts
curl -s http://localhost:4001/metrics | grep "^alerts_active "

# Check leader status
docker logs executor-1 | grep "became leader" | tail -1

# Check SSE connections
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams

# Check notification success rate
curl -s http://localhost:4001/metrics | grep notifications_sent_total
curl -s http://localhost:4001/metrics | grep notifications_failed_total

# Redis AOF size
docker exec spark-redis redis-cli INFO persistence | grep aof_current_size
```

---

## 📚 Related Documentation

- **SLO Queries:** `docs/monitoring/SLO-QUERIES.md`
- **Hypercare Checklist:** `docs/operations/HYPERCARE-CHECKLIST.md`
- **Runbook:** `docs/operations/RUNBOOK.md` (to be created)
- **Architecture:** `docs/ARCHITECTURE.md`

---

## 🚨 Troubleshooting

### Dashboard Not Showing Data
1. Check Prometheus data source connection
2. Verify metric names match (e.g., `alerts_active`)
3. Check time range (last 1 hour)
4. Restart Grafana if needed

### Smoke Test Fails
1. Ensure all services running (`docker ps`)
2. Check URLs (executor: 4001, web: 3000)
3. Review logs for errors
4. Verify network connectivity

### Metrics Missing
1. Check Prometheus scrape config
2. Verify `/metrics` endpoint accessible
3. Look for metric registration in code
4. Restart executor to re-register metrics

---

**Last Updated:** 2025-10-11  
**Version:** v1.0.0  
**Status:** Production Ready
