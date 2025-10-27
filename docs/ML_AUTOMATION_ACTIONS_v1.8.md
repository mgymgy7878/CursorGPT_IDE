# ML Pipeline Automation Actions (v1.8+)

**Purpose:** Automated monitoring, alerting, and daily reporting for ML pipeline  
**Policy:** All actions are read-only or monitoring-only (no production impact)  
**Confirmation:** NOT REQUIRED (safe operations only)

---

## Registered Actions

### 1. Retrain Suggestion (`/fusion/retrain.suggest`)

**Status:** 📋 PLANNED  
**Trigger:** PSI > 0.2 for 24h  
**Confirmation Required:** NO (suggestion only, no execution)

**Parameters:**
```json
{
  "action": "/fusion/retrain.suggest",
  "params": {
    "window_days": 14,
    "label": "v1.8-retrain-psi-fix",
    "features": [
      "mid_logret_1m",
      "mid_logret_5m",
      "spread_bp",
      "vol1m_log",
      "rsi14_z",
      "zscore_mid_1d"
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
    "targets": {
      "horizon_s": 60,
      "label": "sign(mid_logret_1m_future)"
    },
    "artifacts": {
      "bucket": "ml-artifacts/v1.8/retrain",
      "persist": true
    }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "PSI 1.25: price distribution shift - retrain with drift-robust features"
}
```

**Output:**
- Training configuration file
- Feature engineering script
- Data collection requirements
- Timeline estimate

---

### 2. PSI Critical Alert (`ML_PSI_Critical`)

**Status:** ✅ ACTIVE (configured in `rules/ml.yml`)  
**Trigger:** PSI > 0.3 for 10min  
**Confirmation Required:** NO (monitoring only)

**Parameters:**
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "ML_PSI_Critical",
    "expr": "ml_psi_score > 0.3",
    "for": "10m",
    "labels": {
      "severity": "critical",
      "team": "ml",
      "action_required": true
    },
    "annotations": {
      "summary": "PSI critical - promote blocked",
      "runbook": "GREEN_EVIDENCE_v1.8.md#psi"
    }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Promote blocker for drift detection"
}
```

**Alert Behavior:**
- Fires when PSI exceeds 0.3
- Blocks promote to production
- Triggers retraining workflow
- Does NOT affect observe-only mode

---

### 3. Shadow Match Rate Low (`ML_Shadow_MatchRate_Low`)

**Status:** ✅ ACTIVE (configured in `rules/ml.yml`)  
**Trigger:** Match rate < 95% for 5min  
**Confirmation Required:** NO (monitoring only)

**Parameters:**
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "ML_Shadow_MatchRate_Low",
    "expr": "avg_over_time(ml_shadow_match_rate[15m]) < 0.95",
    "for": "5m",
    "labels": {
      "severity": "warning",
      "team": "ml"
    },
    "annotations": {
      "summary": "Shadow match rate below 95%",
      "runbook": "rules/ml.yml"
    }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Shadow quality safety net"
}
```

**Alert Behavior:**
- Fires when shadow/baseline agreement drops below 95%
- Indicates model drift or baseline logic change
- Does NOT abort canary (warning only)
- Escalates to critical if <90%

---

### 4. ML Predict P95 High (`ML_Predict_P95_High`)

**Status:** ✅ ACTIVE (configured in `rules/ml.yml`)  
**Trigger:** P95 latency > 80ms for 10min  
**Confirmation Required:** NO (monitoring only)

**Parameters:**
```json
{
  "action": "/alerts/create",
  "params": {
    "name": "ML_Predict_P95_High",
    "expr": "histogram_quantile(0.95, sum(rate(ml_predict_latency_ms_bucket[5m])) by (le)) > 80",
    "for": "10m",
    "labels": {
      "severity": "critical",
      "team": "ml",
      "slo_breach": true
    },
    "annotations": {
      "summary": "ML P95 latency above SLO"
    }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "SLO protection (80ms abort threshold)"
}
```

**Alert Behavior:**
- Fires when ML prediction latency exceeds SLO
- Triggers canary abort if sustained
- Indicates performance degradation
- May require model optimization

---

### 5. Daily Risk Report (`/fusion/risk.report.daily`)

**Status:** ✅ ACTIVE (script: `scripts/ml-daily-report.cjs`)  
**Schedule:** Daily at 00:00 UTC (via cron/PM2)  
**Confirmation Required:** NO (read-only reporting)

**Parameters:**
```json
{
  "action": "/fusion/risk.report.daily",
  "params": {
    "lookback_days": 1,
    "include": [
      "psi",
      "latency",
      "errors",
      "match_rate",
      "export_status",
      "drift_gates"
    ],
    "format": ["CSV", "PDF"],
    "deliver": ["artefact_store"]
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Daily evidence package and anomaly scan"
}
```

**Output:**
- `evidence/ml/daily/report_YYYY-MM-DD.json`
- `evidence/ml/daily/report_YYYY-MM-DD.csv`
- `evidence/ml/daily/ml_daily_reports.csv` (cumulative)

**Report Sections:**
1. Metrics Summary (predictions, errors, latency)
2. Shadow Quality (match rate, error rate)
3. PSI Score (drift indicator)
4. Risk Assessment (critical/high/medium)
5. Promote Eligibility
6. Recommended Actions

---

## Automation Schedule

### Daily (00:00 UTC)

```bash
# Cron entry
0 0 * * * cd /app && node scripts/ml-daily-report.cjs >> logs/ml-daily-report.log 2>&1
```

**Or PM2 cron:**
```javascript
// ecosystem.config.cjs
{
  name: 'ml-daily-report',
  script: 'scripts/ml-daily-report.cjs',
  cron_restart: '0 0 * * *',
  autorestart: false
}
```

### Hourly (PSI Check)

```bash
# Run PSI snapshot every hour
0 * * * * cd /app && node scripts/ml-psi-snapshot.cjs >> logs/ml-psi-hourly.log 2>&1
```

### On-Demand (Manual)

```bash
# Trigger retrain suggestion
node scripts/ml-retrain-suggest.cjs

# Generate ad-hoc report
node scripts/ml-daily-report.cjs --date 2025-10-07
```

---

## Alert Routing

### Severity Levels

| Severity   | Team | Response Time | Action                  |
|------------|------|---------------|-------------------------|
| **CRITICAL** | ML   | < 15 min      | Immediate investigation |
| **HIGH**     | ML   | < 1 hour      | Triage within shift     |
| **MEDIUM**   | ML   | < 4 hours     | Review next day         |
| **INFO**     | ML   | Best effort   | Logged only             |

### Alert Matrix

| Alert                        | Severity | Triggers                  | Action                     |
|------------------------------|----------|---------------------------|----------------------------|
| ML_PSI_Critical              | CRITICAL | PSI > 0.3 for 10min       | Start retrain pipeline     |
| ML_PSI_Warning               | WARNING  | PSI > 0.15 for 1h         | Plan retraining            |
| ML_Shadow_MatchRate_Critical | CRITICAL | Match < 90% for 5min      | Investigate logic          |
| ML_Shadow_MatchRate_Low      | WARNING  | Match < 95% for 5min      | Monitor                    |
| ML_Predict_P95_High          | CRITICAL | P95 > 80ms for 10min      | Abort canary               |
| ML_Predict_P95_Warning       | WARNING  | P95 > 60ms for 10min      | Monitor performance        |
| MLModelErrorsHigh            | WARNING  | Error rate > 1% for 5min  | Check error logs           |
| MLEngineDown                 | CRITICAL | ML Engine down for 2min   | Restart service            |

---

## Safety Policies

### Actions NOT Requiring Confirmation

✅ **Safe Actions (Monitoring & Reporting):**
- Read metrics from Prometheus
- Generate daily/hourly reports
- Create/update alerts (monitoring only)
- Run PSI calculations
- Log feature distributions
- Collect evidence files
- Suggest retraining (planning only)

### Actions REQUIRING Confirmation

⛔ **Production-Impacting Actions:**
- Deploy new model version
- Change canary traffic split
- Modify SLO thresholds
- Enable/disable shadow mode
- Promote to production
- Execute model retraining
- Change alert severities
- Modify abort thresholds

---

## Evidence Collection

### Daily Artifacts

**Collected Automatically:**
```
evidence/ml/daily/
├── report_2025-10-08.json     # Today's metrics
├── report_2025-10-08.csv      # CSV format
├── ml_daily_reports.csv       # Cumulative history
└── psi_snapshots/
    └── psi_2025-10-08.json    # Daily PSI
```

**Retention:** 90 days (auto-archive to S3/artifact store)

### Weekly Summary

**Generated:** Sunday 23:59 UTC  
**Contents:**
- 7-day metrics trend
- PSI time series
- Match rate statistics
- Latency percentiles
- Error analysis
- Recommendations

---

## Integration with Existing Services

### Export@Scale (v1.7)

**Status:** ✅ Running on port 4001  
**Daily Report Includes:**
- Export request counts
- Export latency (P95)
- Export errors
- Queue depth

### Drift Gates (v1.6-p3)

**Status:** ✅ Active  
**Daily Report Includes:**
- Drift detection events
- Gate trigger counts
- Paper-trade performance

### Optimizer (v1.6-p2)

**Status:** ✅ Active  
**Daily Report Includes:**
- Optimization job counts
- Optimizer latency
- Concurrent job stats

---

## Execution Log (Today)

**Date:** 2025-10-08  
**Actions Executed:**

1. ✅ **Alert Created:** `ML_PSI_Critical` (rules/ml.yml)
2. ✅ **Alert Created:** `ML_Shadow_MatchRate_Low` (rules/ml.yml)
3. ✅ **Alert Created:** `ML_Predict_P95_High` (rules/ml.yml)
4. ✅ **Daily Report Generated:** `evidence/ml/daily/report_2025-10-08.json`
5. 📋 **Retrain Suggestion:** Documented in `ML_RETRAIN_STRATEGY_v1.8.1.md`

**Status:** All monitoring actions active ✅  
**Promote:** Blocked (PSI 1.25) ❌  
**Next:** Data collection for v1.8.1 retrain

---

**Updated:** 2025-10-08  
**Owner:** ML Team  
**Policy:** Safe automation (no confirm required)

