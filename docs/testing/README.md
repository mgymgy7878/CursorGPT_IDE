# Spark TA Module v1.0.0 - Testing Guide

## 📦 Test Suites

### 1. Smoke Tests (Production Readiness)
**Purpose:** Quick validation that critical paths work  
**Duration:** ~15 seconds  
**When:** Before deployment, after deployment  

```bash
bash scripts/smoke-test-v1.0.0.sh
```

**Coverage:**
- Health endpoints
- SSE stream metrics
- Copilot tools (FIB, BB)
- Alert CRUD operations
- Prometheus metrics
- Notification delivery (optional)
- UI pages

---

### 2. Regression Tests (Stability Validation)
**Purpose:** Comprehensive validation of all functionality  
**Duration:** ~45 seconds  
**When:** After any code change, daily for first week  

```bash
bash scripts/regression-suite.sh
```

**Coverage:**
- Analytics API (A-001 to A-003)
- Alerts CRUD (C-001 to C-006)
- Streaming SSE (S-001 to S-004)
- Metrics (M-001 to M-003)
- Health checks
- Security validation (V-001 to V-002)

---

## 📊 Test Matrix

| Suite | Tests | Duration | Exit Criteria |
|-------|-------|----------|---------------|
| Smoke | 7 categories | 15s | 100% pass |
| Regression | 20+ cases | 45s | ≥95% pass |

---

## 🚀 Running Tests

### Prerequisites
```bash
# Install jq (JSON processor)
# Ubuntu/Debian:
sudo apt-get install -y jq

# macOS:
brew install jq

# Windows (Git Bash):
# Download from: https://stedolan.github.io/jq/download/
```

### Smoke Tests
```bash
# Default (localhost)
bash scripts/smoke-test-v1.0.0.sh

# Custom URLs
EXECUTOR_URL=http://executor:4001 WEB_URL=http://web:3000 bash scripts/smoke-test-v1.0.0.sh

# Verbose mode
VERBOSE=1 bash scripts/smoke-test-v1.0.0.sh
```

### Regression Tests
```bash
# Default (localhost)
bash scripts/regression-suite.sh

# Custom URLs
EXEC=http://executor:4001 WEB=http://web:3000 bash scripts/regression-suite.sh

# Verbose mode
VERBOSE=1 bash scripts/regression-suite.sh
```

---

## ✅ Expected Output

### Smoke Tests
```
🔍 Spark TA Module v1.0.0 - Production Smoke Test
=================================================
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

🎉 ALL SMOKE TESTS PASSED!
✅ System is production-ready
```

### Regression Tests
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Spark TA Module v1.0.0 - Regression Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Analytics API (A-001 to A-003)
✓ A-001: Fibonacci returns 7 levels
✓ A-002: Bollinger bands valid (u > m > l)
✓ A-003: MACD returns current values

📋 Alerts CRUD (C-001 to C-006)
✓ C-001: Alert created with ID: 01234567...
✓ C-002: Alert list contains 1 items
✓ C-003: Get alert by ID successful
✓ C-004: Alert disabled successfully
✓ C-005: Alert enabled successfully
✓ C-006: Alert deleted successfully

📡 Streaming SSE (S-001 to S-004)
✓ S-001: SSE headers present
✓ S-003: Invalid symbol returns 400
✓ S-004: Invalid timeframe returns 400

📈 Metrics (M-001 to M-003)
✓ M-001: All expected metrics present (10 checked)
✓ M-002: alerts_active gauge valid (0)

❤️  Health Checks
✓ Health: Executor responding
✓ Health: Marketdata proxy responding

🔒 Security Validation (V-001 to V-002)
✓ V-001: SQL injection rejected
✓ V-002: XSS payload rejected

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 REGRESSION TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Passed: 18
✗ Failed: 0
⊘ Skipped: 0

Pass Rate: 100% (18/18)

🎉 ALL REGRESSION TESTS PASSED!

✅ System regression validated
✅ Ready for production use
```

---

## 📋 Test Case Reference

### Analytics API
- **A-001:** Fibonacci levels endpoint
- **A-002:** Bollinger Bands endpoint
- **A-003:** MACD endpoint

### Alerts CRUD
- **C-001:** Create alert
- **C-002:** List alerts
- **C-003:** Get single alert
- **C-004:** Disable alert
- **C-005:** Enable alert
- **C-006:** Delete alert

### Streaming (SSE)
- **S-001:** SSE headers present
- **S-003:** Invalid symbol rejection
- **S-004:** Invalid timeframe rejection

### Metrics
- **M-001:** Prometheus metrics presence
- **M-002:** Gauge validation

### Security
- **V-001:** SQL injection rejection
- **V-002:** XSS payload rejection

---

## 🔍 Troubleshooting

### jq not found
```bash
# Install jq first
sudo apt-get install -y jq  # Linux
brew install jq              # macOS
```

### Connection refused
```bash
# Check services are running
docker ps | grep spark

# Check URLs
curl http://localhost:4001/health
curl http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=1
```

### Tests failing
```bash
# Run with verbose mode
VERBOSE=1 bash scripts/regression-suite.sh

# Check logs
docker logs executor-1 | tail -50
docker logs web-next-1 | tail -50
```

---

## 🎯 CI/CD Integration

### GitHub Actions Example
```yaml
name: Regression Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install jq
        run: sudo apt-get install -y jq
      - name: Start services
        run: docker compose up -d
      - name: Wait for services
        run: sleep 10
      - name: Run regression suite
        run: bash scripts/regression-suite.sh
        env:
          EXEC: http://localhost:4001
          WEB: http://localhost:3000
```

---

## 📚 Related Documentation

- **Test Plan:** `docs/testing/REGRESSION-TEST-PLAN.md`
- **Monitoring:** `docs/monitoring/README.md`
- **Hypercare:** `docs/operations/HYPERCARE-CHECKLIST.md`

---

**Last Updated:** 2025-10-11  
**Version:** v1.0.0  
**Status:** Production Ready

