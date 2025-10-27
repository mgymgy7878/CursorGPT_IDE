# Spark Trading Platform - ML Pipeline (v1.8)

**Status:** 🟢 PRODUCTION-READY (Observe-Only Mode)  
**Release:** v1.8.0-rc1  
**Date:** 2025-10-08  
**Promote:** ❌ BLOCKED (PSI drift, v1.8.1 retrain required)

---

## 🚀 QUICK START

### Start ML Engine

```powershell
# Windows
cd c:\dev\CursorGPT_IDE
$env:ML_PORT=4010
node services/ml-engine/standalone-server.cjs
```

```bash
# Linux/macOS
cd /path/to/CursorGPT_IDE
ML_PORT=4010 node services/ml-engine/standalone-server.cjs
```

**Health Check:**
```bash
curl http://127.0.0.1:4010/ml/health
# {"ok":true,"model":"v1.8-b0","service":"ml-engine-standalone"}
```

### Check Promote Gates

```powershell
# Windows
.\scripts\retrain-v1.8.1.ps1 -Gates
```

```bash
# Linux/macOS
bash scripts/retrain-v1.8.1.sh -Gates
# Or
make gates
```

**Expected:** 5/6 PASS (PSI blocking)

### Daily Monitoring

```bash
# Daily risk report
node scripts/ml-daily-report.cjs

# PSI snapshot
node scripts/ml-psi-snapshot.cjs

# Check alerts (if Prometheus available)
curl "http://prometheus:9090/api/v1/query?query=ALERTS{severity=\"critical\"}"
```

---

## 📊 ARCHITECTURE

### Components

```
┌──────────────┐
│  ML Engine   │ Port 4010 (standalone, cycle-free)
│  (v1.8-b0)   │ Endpoints: /ml/health, /ml/predict, /ml/metrics
└──────┬───────┘
       │
       │ Prediction API
       │
┌──────▼────────┐
│ Shadow Plugin │ Dual-path: Baseline + ML
│ (observe-only)│ Match rate: 97-99%
└──────┬────────┘
       │
       │ Never affects production
       │
   Baseline always used
```

### Data Flow

1. **Request** → Shadow endpoint (`/predict-with-shadow`)
2. **Baseline** → Production heuristic (<1ms)
3. **ML** → ML Engine prediction (~2ms, isolated)
4. **Compare** → Match rate, delta calculation
5. **Return** → **Baseline only** (ML logged for analysis)

---

## 📈 PERFORMANCE

### SLO Compliance

| Metric            | SLO Target | Achieved     | Margin  | Status |
|-------------------|------------|--------------|---------|--------|
| **P95 Latency**   | < 80ms     | 2.57-3.09ms  | 26-31x  | ✅     |
| **Error Rate**    | < 1%       | 0.24-0.48%   | 2-4x    | ✅     |
| **Match Rate**    | >= 95%     | 97.3-99.5%   | +2-4%   | ✅     |
| **PSI Score**     | < 0.2      | 1.25         | N/A     | ❌     |

**Overall:** 5/6 PASS (PSI blocking promote)

### Test Results

**Offline (Faz 1):**
- AUC: **0.64** (threshold: >=0.62) ✅
- Precision@20: **0.59** (threshold: >=0.58) ✅

**Runtime (Faz 2):**
- Smoke test: **1000 requests, 100% success** ✅
- P95: **2.64ms** ✅

**Shadow (Faz 3):**
- Match rate: **100%** (989/989 matches) ✅
- PSI detected: **1.25** (drift working correctly) ✅

**Canary (Faz 4):**
- Phases: **5/5 PASS** (no aborts) ✅
- P95 range: **2.57-3.09ms** ✅
- Match rate: **97.3-99.5%** ✅

---

## 🛠️ OPERATIONS

### Monitoring

**Prometheus Metrics:**
- `ml_predict_requests_total` - Request counter
- `ml_predict_latency_ms_bucket` - Latency histogram
- `ml_shadow_match_rate` - Shadow/baseline agreement
- `ml_psi_score` - Feature drift indicator

**Grafana Dashboard:**
- 11 panels (import `grafana-ml-dashboard.json`)
- Refresh: 10s
- Includes: Latency, match rate, PSI trend, promote gate

**Alert Rules:**
- 17 baseline rules (`rules/ml.yml`)
- 6 canary rules (`rules/ml-canary.yml`)
- 7 test cases (`rules/ml.test.yml`)

### Daily Tasks

```bash
# Automated (cron/PM2)
0 0 * * * node scripts/ml-daily-report.cjs

# Manual checks
curl http://127.0.0.1:4010/ml/health           # Health
node scripts/ml-psi-snapshot.cjs               # PSI check
.\scripts\retrain-v1.8.1.ps1 -Gates           # Gate status
```

### Emergency Rollback

```bash
# < 1 minute
curl -X POST http://127.0.0.1:4001/canary/abort

# Or
node scripts/canary-observe-only.cjs --rollback --target 0%
```

---

## 📦 FILES & ARTIFACTS

### Source Code

```
packages/ml-core/          # ML core library
├── src/
│   ├── contracts.ts       # Type definitions
│   ├── features.ts        # Feature engineering (6D)
│   ├── models.ts          # Baseline model
│   └── index.ts           # Exports
└── dist/                  # Compiled outputs

services/ml-engine/        # ML prediction service
├── src/index.ts           # Main server
├── src/metrics.ts         # Prometheus metrics
└── standalone-server.cjs  # Cycle-free runner (PRODUCTION)

services/executor/plugins/
└── shadow.ts              # Shadow prediction plugin
```

### Documentation

```
docs/
├── ML_RETRAIN_STRATEGY_v1.8.1.md
├── ML_AUTOMATION_ACTIONS_v1.8.md
├── RELEASE_GATE_v1.8.1.md
├── HARDENING_CHECKLIST_v1.8.md
├── V1_8_1_QUICK_START.md
├── GO_NO_GO_v1.8.1.md
└── EVIDENCE_RETENTION_POLICY.md

GREEN_EVIDENCE_v1.8.md       # Master evidence (1100+ lines)
CHANGELOG.md                  # Release notes
```

### Automation

```
scripts/
├── ml-train.cjs              # Offline training
├── ml-eval.cjs               # Offline evaluation
├── ml-smoke.cjs              # ML Engine smoke test
├── ml-shadow-smoke.cjs       # Shadow integration test
├── ml-shadow-mock.cjs        # Mock shadow test
├── ml-psi-snapshot.cjs       # PSI drift detection
├── ml-daily-report.cjs       # Daily risk report
├── canary-*.cjs (4 files)    # Canary deployment
├── check-promote-gates.sh    # Gate validation
├── retrain-v1.8.1.ps1        # PowerShell wrapper
├── retrain-v1.8.1.sh         # Bash wrapper
├── create-release-bundle.*   # Release packager
└── ... (15 total)

Makefile                      # Cross-platform make targets
```

### Configuration

```
rules/
├── ml.yml                    # 17 alert rules
├── ml-canary.yml             # 6 canary alerts
└── ml.test.yml               # 7 test cases

grafana-ml-dashboard.json     # 11-panel dashboard
```

### Evidence

```
evidence/ml/
├── offline_report.json
├── eval_result.txt
├── smoke_1k.json
├── shadow_smoke_1k.json
├── psi_snapshot.json
├── canary_preflight.json
├── canary_dryrun_observe.json
├── canary_run_*.json
├── metrics_baseline_*.txt
├── gates_*.json
└── daily/
    ├── report_*.json
    └── ml_daily_reports.csv

releases/
└── v1.8.0-rc1.zip           # Complete bundle (0.13 MB, 86 checksums)
```

---

## 🎯 NEXT STEPS

### Week 1 (Oct 8-14)

- [x] v1.8.0-rc1 canary complete ✅
- [x] Automation deployed ✅
- [x] Release bundle created ✅
- [ ] Feature logger deployment
- [ ] Daily monitoring (automated)

### Week 2 (Oct 15-21)

- [ ] Collect 14 days feature data
- [ ] Train v1.8.1 model (drift-robust features)
- [ ] Offline validation (AUC, P@K, PSI)

### Week 3 (Oct 22-28)

- [ ] Mini-canary (3 phases, 90 min)
- [ ] Verify PSI < 0.2
- [ ] All 6 gates PASS

### Week 4 (Oct 29+)

- [ ] 48h validation period
- [ ] Stakeholder review
- [ ] Promote to v1.8.1 (if approved)

---

## 🔒 SAFETY GUARANTEES

- ✅ Shadow predictions **never** affect live trading
- ✅ Baseline **always** used for production decisions
- ✅ ML scores **logged only** for analysis
- ✅ Automatic rollback on SLO breach
- ✅ Circuit breaker armed (error > 2%)
- ✅ Observe-only mode (zero production impact)

---

## 📞 SUPPORT

**Documentation:** See `docs/` directory  
**Evidence:** See `evidence/ml/` directory  
**Issues:** Check `rules/ml.yml` for alert definitions  
**Rollback:** See emergency procedures in docs

**Quick Commands:**
```bash
# Check status
make gates

# Daily report
node scripts/ml-daily-report.cjs

# PSI check
node scripts/ml-psi-snapshot.cjs
```

---

**Release:** v1.8.0-rc1  
**Bundle:** releases/v1.8.0-rc1.zip (SHA256 verified)  
**Status:** Observe-only, production-ready  
**Next:** v1.8.1 retrain

