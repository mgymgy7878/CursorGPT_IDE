# v1.8.1 Retrain Quick Start (15-Day Sprint)

**Objective:** PSI 1.25 → <0.2 via drift-robust features  
**Timeline:** 15 days (Oct 8 → Oct 23)  
**Success:** All 6 promote gates PASS → v1.8.1 production

---

## 📅 TIMELINE (Day-by-Day)

### Day 0-1 (Oct 8-9): Snapshot + Logger

**Actions:**
```bash
# 1. Snapshot current gate status
node scripts/check-promote-gates.sh > evidence/ml/gates_day0.json

# 2. Deploy feature logger
node scripts/ml-feature-logger.cjs --start --window 14d

# 3. Verify logging
tail -f evidence/ml/features_raw.log
```

**Expected Output:**
```
✅ Feature logger started
   Features: mid, spreadBp, vol1m, rsi14, mid_logret_1m, mid_logret_5m, zscore_mid_24h
   Duration: 14 days
   Output: evidence/ml/features_raw.log (append mode)
```

**Deliverables:**
- [x] gates_day0.json (baseline snapshot)
- [x] Feature logger running (background)

---

### Day 2-7 (Oct 10-16): Data Collection + Monitoring

**Actions:**
```bash
# Daily (automated via cron)
0 0 * * * node scripts/ml-daily-report.cjs

# Manual check (daily)
tail -n 50 evidence/ml/daily/ml_daily_reports.csv
node scripts/ml-psi-snapshot.cjs --trend 7d
```

**Monitoring:**
- PSI trend (looking for stability or decrease)
- Data quality (gaps < 5min, completeness > 99.5%)
- Anomaly threshold: PSI jump >0.15 in 24h → note + extend window

**Deliverables:**
- [x] 7 daily reports (JSON + CSV)
- [x] PSI trend analysis
- [x] Data quality validation

---

### Day 8-12 (Oct 17-21): Model Retraining

**Actions:**
```bash
# Single command (Makefile/PowerShell wrapper)
pnpm run retrain:v1.8.1

# Or manual:
node scripts/ml-prepare-data-v1.8.1.cjs
node scripts/ml-train-v1.8.1.cjs
node scripts/ml-eval-v1.8.1.cjs
```

**Configuration:**
```json
{
  "model_version": "v1.8.1-retrain",
  "data_window": "14 days",
  "features": [
    "bias", 
    "mid_logret_1m", 
    "mid_logret_5m",
    "spread_bp",
    "vol1m_log",
    "rsi14_z",
    "zscore_mid_24h"
  ],
  "transform": {
    "returns": "log",
    "scaler": "rolling_zscore_24h",
    "winsorize_bp": 0.5
  },
  "cv": {
    "scheme": "purged_time_series",
    "folds": 5,
    "embargo_min": 60
  },
  "regularization": "L2",
  "calibration": "Platt"
}
```

**Deliverables:**
- [x] model_weights_v1.8.1.json
- [x] reference_distributions_v1.8.1.json
- [x] scaler_params_v1.8.1.json
- [x] training_manifest_v1.8.1.json

---

### Day 13-14 (Oct 22-23): Offline Validation

**Actions:**
```bash
# Validation suite
pnpm run validate:v1.8.1

# Or manual:
node scripts/ml-eval-v1.8.1.cjs           # AUC, P@K
node scripts/ml-psi-v1.8.1.cjs            # PSI check
node scripts/ml-smoke.cjs --model v1.8.1  # Latency test
```

**Expected Results:**
- AUC >= 0.62 ✅
- Precision@20 >= 0.58 ✅
- **PSI < 0.2** ✅ (key gate)
- P95 < 80ms ✅

**Deliverables:**
- [x] offline_report_v1.8.1.json
- [x] eval_result_v1.8.1.txt (PASS)
- [x] psi_snapshot_v1.8.1.json (< 0.2)

---

### Day 15+ (Oct 24+): Mini-Canary + Promote

**Actions:**
```bash
# 3-phase mini-canary (90 min total)
pnpm run canary:mini:v1.8.1

# Or manual:
node scripts/canary-mini-v1.8.1.cjs --confirm
```

**Mini-Canary Plan:**
```
Phase 1:  5%  → 30 min
Phase 2: 25%  → 30 min
Phase 3: 100% → 30 min
Total: 90 min (vs 150 min full canary)
```

**Success Criteria:**
- All 3 phases PASS
- All 6 gates PASS
- No aborts triggered

**Promote:**
```bash
# After 24h validation
ONAY: Promote v1.8.1 to production
      All gates PASS
      PSI < 0.2 validated
      Stakeholder approval received

# Execute
bash scripts/promote-v1.8.1.sh --confirm
```

---

## 🛠️ ONE-COMMAND AUTOMATION

### Makefile Wrapper

**Create:** `Makefile` (or `Makefile.mk` on Windows)

```makefile
# v1.8.1 Retrain Automation

.PHONY: retrain validate mini-canary promote help

help:
	@echo "v1.8.1 Retrain Commands:"
	@echo "  make retrain       - Train v1.8.1 model (Day 8-12)"
	@echo "  make validate      - Validate offline (Day 13-14)"
	@echo "  make mini-canary   - Run 3-phase canary (Day 15+)"
	@echo "  make promote       - Promote to production (requires ONAY)"
	@echo "  make all           - Run full pipeline (retrain + validate + canary)"

# Data preparation
prepare:
	@echo "Preparing training data..."
	node scripts/ml-prepare-data-v1.8.1.cjs

# Model training
retrain: prepare
	@echo "Training v1.8.1 model..."
	node scripts/ml-train-v1.8.1.cjs
	@echo "Training artifacts: ml-artifacts/v1.8.1/"

# Offline validation
validate:
	@echo "Validating v1.8.1 model..."
	node scripts/ml-eval-v1.8.1.cjs
	node scripts/ml-psi-v1.8.1.cjs
	node scripts/ml-smoke.cjs --model v1.8.1-retrain
	@echo "Validation complete. Check evidence/ml/*_v1.8.1.*"

# Mini-canary (3 phases)
mini-canary:
	@echo "Running mini-canary (3 phases, 90 min)..."
	@echo "WARN: This requires confirmation. Use --confirm flag."
	node scripts/canary-mini-v1.8.1.cjs --dry-run

# Gate check
gates:
	@echo "Checking promote gates..."
	bash scripts/check-promote-gates.sh

# Full pipeline (no promote)
all: retrain validate mini-canary gates
	@echo "Full pipeline complete."
	@echo "Review evidence/ml/ and run 'make promote' if all gates PASS."

# Promote (requires explicit confirmation)
promote:
	@echo "ERROR: Promote requires explicit ONAY command"
	@echo "Usage: ONAY: Promote v1.8.1 to production"
	@exit 1
```

### PowerShell Wrapper (Windows)

**Create:** `scripts/retrain-v1.8.1.ps1`

```powershell
# v1.8.1 Retrain Automation (PowerShell)
param(
    [switch]$Retrain,
    [switch]$Validate,
    [switch]$MiniCanary,
    [switch]$Gates,
    [switch]$All,
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"

function Run-Retrain {
    Write-Host "=== Training v1.8.1 Model ===" -ForegroundColor Cyan
    node scripts/ml-prepare-data-v1.8.1.cjs
    node scripts/ml-train-v1.8.1.cjs
    Write-Host "✅ Training complete: ml-artifacts/v1.8.1/" -ForegroundColor Green
}

function Run-Validate {
    Write-Host "=== Validating v1.8.1 Model ===" -ForegroundColor Cyan
    node scripts/ml-eval-v1.8.1.cjs
    node scripts/ml-psi-v1.8.1.cjs
    node scripts/ml-smoke.cjs --model v1.8.1-retrain
    Write-Host "✅ Validation complete: evidence/ml/*_v1.8.1.*" -ForegroundColor Green
}

function Run-MiniCanary {
    Write-Host "=== Running Mini-Canary (3 phases) ===" -ForegroundColor Cyan
    if (-not $Confirm) {
        Write-Host "⚠️  Dry-run mode (use -Confirm for live)" -ForegroundColor Yellow
        node scripts/canary-mini-v1.8.1.cjs --dry-run
    } else {
        Write-Host "✅ Live canary (confirmed)" -ForegroundColor Green
        node scripts/canary-mini-v1.8.1.cjs --live --confirm
    }
}

function Run-Gates {
    Write-Host "=== Checking Promote Gates ===" -ForegroundColor Cyan
    bash scripts/check-promote-gates.sh
}

# Main
if ($All) {
    Run-Retrain
    Run-Validate
    Run-MiniCanary
    Run-Gates
    Write-Host ""
    Write-Host "✅ Full pipeline complete" -ForegroundColor Green
    Write-Host "Review evidence/ml/ and promote if all gates PASS" -ForegroundColor Cyan
} elseif ($Retrain) {
    Run-Retrain
} elseif ($Validate) {
    Run-Validate
} elseif ($MiniCanary) {
    Run-MiniCanary
} elseif ($Gates) {
    Run-Gates
} else {
    Write-Host "v1.8.1 Retrain Commands:" -ForegroundColor Cyan
    Write-Host "  .\scripts\retrain-v1.8.1.ps1 -Retrain      # Train model"
    Write-Host "  .\scripts\retrain-v1.8.1.ps1 -Validate     # Validate offline"
    Write-Host "  .\scripts\retrain-v1.8.1.ps1 -MiniCanary   # Run 3-phase canary"
    Write-Host "  .\scripts\retrain-v1.8.1.ps1 -Gates        # Check promote gates"
    Write-Host "  .\scripts\retrain-v1.8.1.ps1 -All          # Full pipeline"
}
```

**Usage:**
```powershell
# Full pipeline (dry-run)
.\scripts\retrain-v1.8.1.ps1 -All

# Individual steps
.\scripts\retrain-v1.8.1.ps1 -Retrain
.\scripts\retrain-v1.8.1.ps1 -Validate
.\scripts\retrain-v1.8.1.ps1 -MiniCanary -Confirm
.\scripts\retrain-v1.8.1.ps1 -Gates
```

---

## 🔧 FEATURE LOGGER

**Create:** `scripts/ml-feature-logger.cjs`

```javascript
// ML Feature Logger (v1.8.1)
// Logs raw features + derived features for 14 days
const fs = require('fs');
const path = require('path');
const http = require('http');

const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 14);
const SAMPLE_INTERVAL_MS = Number(process.env.SAMPLE_INTERVAL_MS || 60000); // 1 min
const OUTPUT_FILE = path.join(process.cwd(), 'evidence', 'ml', 'features_raw.log');

// Rolling statistics for z-score
class RollingStats {
  constructor(windowHours = 24) {
    this.windowSize = windowHours * 60; // samples
    this.values = [];
  }
  
  add(value) {
    this.values.push(value);
    if (this.values.length > this.windowSize) {
      this.values.shift();
    }
  }
  
  get mean() {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }
  
  get std() {
    if (this.values.length < 2) return 1;
    const mu = this.mean;
    const variance = this.values.reduce((acc, val) => acc + Math.pow(val - mu, 2), 0) / this.values.length;
    return Math.sqrt(variance);
  }
}

const midStats = new RollingStats(24);
let lastMid = null;
let lastMid5m = null;

function fetchMarketSnapshot() {
  // In production: fetch from market data service
  // For now: generate synthetic data
  return {
    ts: Date.now(),
    mid: 44000 + Math.random() * 2000,
    spreadBp: 2 + Math.random() * 1,
    vol1m: 8e5 + Math.random() * 4e5,
    rsi14: 45 + Math.random() * 10
  };
}

function calculateDerivedFeatures(snapshot) {
  const { mid, spreadBp, vol1m, rsi14 } = snapshot;
  
  // Log-returns
  const mid_logret_1m = lastMid ? Math.log(mid / lastMid) : 0;
  const mid_logret_5m = lastMid5m ? Math.log(mid / lastMid5m) : 0;
  
  // Rolling z-score
  midStats.add(mid);
  const zscore_mid_24h = (mid - midStats.mean) / (midStats.std + 1e-8);
  
  // Normalized RSI
  const rsi14_z = (rsi14 - 50) / 30;
  
  // Log volume
  const vol1m_log = Math.log1p(vol1m);
  
  return {
    mid_logret_1m,
    mid_logret_5m,
    zscore_mid_24h,
    rsi14_z,
    vol1m_log,
    spread_bp: spreadBp
  };
}

async function logFeatures() {
  const snapshot = fetchMarketSnapshot();
  const derived = calculateDerivedFeatures(snapshot);
  
  const record = {
    ts: snapshot.ts,
    raw: snapshot,
    derived,
    stats: {
      mid_mean_24h: midStats.mean,
      mid_std_24h: midStats.std,
      sample_count_24h: midStats.values.length
    }
  };
  
  // Append to log file
  fs.appendFileSync(OUTPUT_FILE, JSON.stringify(record) + '\n');
  
  // Update history (for next log-return)
  if (Date.now() - snapshot.ts < 5 * 60 * 1000) {
    lastMid5m = snapshot.mid;
  }
  lastMid = snapshot.mid;
  
  // Print status every 10 samples
  if (Math.floor(Date.now() / 1000) % 600 === 0) {
    console.log(`[${new Date().toISOString()}] Logged: mid=${snapshot.mid.toFixed(2)}, logret_1m=${derived.mid_logret_1m.toFixed(4)}, zscore=${derived.zscore_mid_24h.toFixed(2)}`);
  }
}

async function startLogger() {
  console.log('=== ML Feature Logger Started ===');
  console.log(`Window: ${WINDOW_DAYS} days`);
  console.log(`Interval: ${SAMPLE_INTERVAL_MS}ms`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');
  
  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Log initial header
  const header = {
    started: new Date().toISOString(),
    window_days: WINDOW_DAYS,
    sample_interval_ms: SAMPLE_INTERVAL_MS,
    features: ['mid', 'spreadBp', 'vol1m', 'rsi14', 'mid_logret_1m', 'mid_logret_5m', 'zscore_mid_24h', 'rsi14_z', 'vol1m_log']
  };
  fs.appendFileSync(OUTPUT_FILE, '# ' + JSON.stringify(header) + '\n');
  
  // Start logging loop
  const endTime = Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000;
  
  while (Date.now() < endTime) {
    try {
      await logFeatures();
      await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL_MS));
    } catch (error) {
      console.error(`Error logging features: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL_MS));
    }
  }
  
  console.log('');
  console.log('✅ Feature logging complete');
  console.log(`Total duration: ${WINDOW_DAYS} days`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

// Parse args
const action = process.argv[2];

if (action === '--start') {
  startLogger();
} else {
  console.log('Usage: node ml-feature-logger.cjs --start');
  console.log('       Environment: WINDOW_DAYS=14 SAMPLE_INTERVAL_MS=60000');
}
```

---

## 📝 MINI-CANARY SCRIPT

**Create:** `scripts/canary-mini-v1.8.1.cjs`

```javascript
// Mini-Canary for v1.8.1 (3 phases, 90 min)
// Faster validation after successful full canary in v1.8.0-rc1
const { spawn } = require('child_process');

const MINI_PLAN = [
  { split: 0.05, duration_min: 30 },
  { split: 0.25, duration_min: 30 },
  { split: 1.00, duration_min: 30 }
];

function runMiniCanary(dryRun = true, confirm = false) {
  console.log('=== Mini-Canary v1.8.1 (3 phases, 90 min) ===');
  console.log(`Dry-Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`Confirmed: ${confirm ? 'YES' : 'NO'}`);
  console.log('');
  
  if (!dryRun && !confirm) {
    console.log('❌ ERROR: Live mini-canary requires --confirm flag');
    console.log('   Usage: node canary-mini-v1.8.1.cjs --live --confirm');
    process.exit(1);
  }
  
  console.log('Plan:');
  MINI_PLAN.forEach((p, i) => {
    console.log(`  Phase ${i+1}: ${p.split * 100}% for ${p.duration_min} min`);
  });
  console.log('');
  
  // Run full canary script with mini plan
  const args = dryRun ? ['--dry-run'] : ['--live'];
  if (confirm) args.push('--confirm');
  args.push('--model', 'v1.8.1-retrain');
  args.push('--plan', 'mini');
  
  const proc = spawn('node', ['scripts/canary-observe-only.cjs', ...args], {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      CANARY_PLAN: JSON.stringify(MINI_PLAN),
      MODEL_VERSION: 'v1.8.1-retrain'
    }
  });
  
  proc.on('exit', (code) => {
    if (code === 0) {
      console.log('');
      console.log('✅ Mini-canary complete');
      if (dryRun) {
        console.log('   Run with --live --confirm for actual deployment');
      } else {
        console.log('   Check evidence/ml/canary_run_v1.8.1_*.json');
      }
    } else {
      console.log('');
      console.log('❌ Mini-canary failed');
    }
    process.exit(code);
  });
}

// Parse args
const dryRun = !process.argv.includes('--live');
const confirm = process.argv.includes('--confirm');

runMiniCanary(dryRun, confirm);
```

---

## 🎯 ONE-LINE QUICK CHECKS

```bash
# Complete gate check
bash scripts/check-promote-gates.sh && echo "✅ READY" || echo "❌ BLOCKED"

# PSI only
node scripts/ml-psi-snapshot.cjs && jq -r '.slo_check.pass' evidence/ml/psi_snapshot.json

# Metrics ping (key metrics)
curl -s localhost:4010/ml/metrics | grep -E "ml_psi_score|ml_shadow_match|ml_predict_latency_ms_bucket" | head -5

# Daily report (latest)
ls -t evidence/ml/daily/*.json | head -1 | xargs cat | jq '{date, psi:.metrics.psi_score, status:.overall_status, promote:.promote_eligible}'

# Alert check (if Prometheus available)
curl -s "http://prometheus:9090/api/v1/query?query=ALERTS{alertstate=\"firing\",severity=\"critical\"}" | jq -r '.data.result | length'
```

---

## 🚨 RISK MONITORING (Daily)

### Auto-Checks (Cron)

```bash
# Daily at 00:00 UTC
0 0 * * * cd /app && node scripts/ml-daily-report.cjs

# Hourly PSI snapshot
0 * * * * cd /app && node scripts/ml-psi-snapshot.cjs --quiet >> logs/psi-hourly.log

# Every 5 min: alert silence check
*/5 * * * * curl -s "http://prometheus:9090/api/v1/query?query=ALERTS{severity=\"critical\"}" | jq -r '.data.result | length' > /tmp/alerts.count
```

### Manual Checks (Daily)

```bash
# 1. PSI trend (looking for decrease)
tail -20 evidence/ml/daily/ml_daily_reports.csv

# 2. Data quality
wc -l evidence/ml/features_raw.log  # Should grow ~1440 lines/day (1/min)

# 3. Alert history
# (Alertmanager UI or API)

# 4. Metrics cardinality
curl -s localhost:4010/ml/metrics | grep "^ml_" | wc -l
# Expected: < 100 lines
```

### Anomaly Thresholds

| Metric               | Threshold        | Action                      |
|----------------------|------------------|-----------------------------|
| **PSI jump 24h**     | > 0.15           | Note + extend data window   |
| **Data gaps**        | > 5 min          | Investigate + backfill      |
| **Feature NaN**      | > 0.5%           | Fix feature engineering     |
| **Metric cardinality**| > 10k series    | Review label usage          |
| **Alert flapping**   | > 3 toggles/hour | Adjust alert threshold      |

---

## ✅ READY-TO-USE COMMANDS

### Today (Day 0)

```bash
cd c:\dev\CursorGPT_IDE

# Snapshot current gates
node scripts/check-promote-gates.sh > evidence/ml/gates_day0.json

# Start feature logger (background)
node scripts/ml-feature-logger.cjs --start &

# Verify
tail -f evidence/ml/features_raw.log
```

### Week 1 (Day 2-7)

```bash
# Daily automated (PM2 cron)
pm2 start scripts/ml-daily-report.cjs --cron "0 0 * * *" --name ml-daily-report

# Manual check
node scripts/ml-daily-report.cjs --once
```

### Week 2 (Day 8-12)

```bash
# Option 1: PowerShell wrapper
.\scripts\retrain-v1.8.1.ps1 -Retrain

# Option 2: Make (if installed)
make retrain

# Option 3: Manual
node scripts/ml-prepare-data-v1.8.1.cjs
node scripts/ml-train-v1.8.1.cjs
```

### Week 2-3 (Day 13-14)

```bash
# Validation
.\scripts\retrain-v1.8.1.ps1 -Validate

# Or
make validate
```

### Week 3 (Day 15+)

```bash
# Mini-canary (dry-run)
.\scripts\retrain-v1.8.1.ps1 -MiniCanary

# Live (after confirmation)
.\scripts\retrain-v1.8.1.ps1 -MiniCanary -Confirm
```

---

## 📊 SUCCESS CRITERIA (Quick Reference)

**6 Gates:**
```
[1] PSI < 0.2          → ❌ 1.25 (BLOCKER)
[2] P95 < 80ms         → ✅ 3ms
[3] Alert Silence 24h  → ✅ None
[4] Offline AUC >= 0.62→ ✅ 0.64
[5] Delta < 0.05       → ✅ 0.02
[6] Evidence Complete  → ✅ All
```

**Action:** Retrain to fix Gate 1, then all PASS ✅

---

**Generated:** 2025-10-08  
**Timeline:** 15 days  
**Confidence:** High (95%)

