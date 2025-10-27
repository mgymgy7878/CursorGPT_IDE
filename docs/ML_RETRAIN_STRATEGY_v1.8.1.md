# ML Model Retraining Strategy (v1.8.1)

**Objective:** Address PSI drift (1.25 → <0.2) through drift-robust feature engineering  
**Timeline:** 2-3 weeks (data collection → training → validation)  
**Trigger:** PSI > 0.2 sustained for 24h in observe-only canary  
**Current Status:** ⏸️ Planning (v1.8.0-rc1 blocking promote)

---

## Problem Statement

### PSI Drift Analysis

**Current PSI Scores:**
- **Overall PSI**: 1.25 (critical, threshold: <0.2)
- **Mid (price) feature**: 4.87 (severe drift)
- **SpreadBp**: 0.05 (stable ✅)
- **Vol1m**: 0.01 (stable ✅)
- **RSI14**: 0.08 (stable ✅)

**Root Cause:**
- Raw price (`mid`) feature highly sensitive to market regime shifts
- Absolute price levels non-stationary
- Reference distributions from initial training period no longer representative

**Impact:**
- ✅ Shadow predictions still match baseline (97.3-99.5%)
- ✅ Model performance stable (AUC 0.64, P@20 0.59)
- ❌ PSI threshold breach blocks promote to v1.8.0

---

## Proposed Solution: Drift-Robust Features

### 1. Replace Raw Price with Log-Returns

**Current (v1.8-b0):**
```python
features = [1, mid, spreadBp, vol1m, rsi14, log1p(vol1m)]
```

**Proposed (v1.8.1):**
```python
features = [
    1,                          # bias
    log(mid_t / mid_t-1m),      # 1-min log-return (stationary)
    log(mid_t / mid_t-5m),      # 5-min log-return
    spreadBp,                   # spread (already stable)
    log1p(vol1m),               # log-volume (already stable)
    (rsi14 - 50) / 30,          # normalized RSI (z-score style)
    rolling_zscore(mid, 24h)    # price position in 24h range
]
```

**Benefits:**
- ✅ Log-returns are stationary (mean-reverting)
- ✅ Insensitive to absolute price levels
- ✅ Captures momentum without drift
- ✅ Expected PSI < 0.1 for return-based features

### 2. Rolling Z-Score Normalization

**Current:** Fixed reference distribution from training period  
**Proposed:** Rolling 24h window for online adaptation

```python
def rolling_zscore(x, window_hours=24):
    """
    Normalize feature using rolling statistics
    Adapts to market regime without full retrain
    """
    mu = rolling_mean(x, window_hours)
    sigma = rolling_std(x, window_hours)
    return (x - mu) / (sigma + 1e-8)
```

**Benefits:**
- ✅ Automatic adaptation to volatility regime
- ✅ Reduces PSI by updating reference dynamically
- ✅ No need for frequent retraining

### 3. Winsorization (Outlier Handling)

**Problem:** Extreme price moves create distribution tail drift

**Solution:**
```python
def winsorize(x, lower_bp=0.5, upper_bp=99.5):
    """
    Clip extreme values to percentiles
    Reduces impact of outliers on PSI
    """
    lower = np.percentile(x, lower_bp)
    upper = np.percentile(x, upper_bp)
    return np.clip(x, lower, upper)
```

**Benefits:**
- ✅ Robust to black swan events
- ✅ Prevents single outliers from causing drift
- ✅ Maintains model stability

---

## Implementation Plan

### Phase 1: Data Collection (Week 1)

**Duration:** 7-14 days  
**Action:** Collect market data with new features

**Data Requirements:**
- 10k+ samples across different market regimes
- Include volatile and stable periods
- Ensure representative distribution

**Script:**
```bash
# Log new features in observe-only mode
node scripts/ml-feature-logger.cjs --window 14d --output evidence/ml/features_v1.8.1.parquet
```

**Validation:**
- [ ] Check feature completeness (no missing values)
- [ ] Verify stationarity (ADF test on log-returns)
- [ ] Visualize distributions (histograms)

### Phase 2: Model Training (Week 2)

**Duration:** 3-5 days  
**Action:** Train new model with drift-robust features

**Training Configuration:**
```javascript
{
  "model_version": "v1.8.1-retrain",
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
    "winsorize_bp": [0.5, 99.5]
  },
  "cv": {
    "scheme": "purged_time_series",
    "folds": 5,
    "embargo_min": 60,
    "test_size": 0.2
  },
  "target": {
    "horizon_s": 60,
    "label": "sign(mid_logret_1m_future)"
  },
  "model": {
    "type": "logistic_regression",
    "regularization": "l2",
    "C": 1.0
  }
}
```

**Script:**
```bash
node scripts/ml-train-v1.8.1.cjs --config configs/retrain_v1.8.1.json
```

**Validation Criteria:**
- [ ] Offline AUC >= 0.62 (same as v1.8-b0)
- [ ] Precision@20 >= 0.58
- [ ] PSI < 0.2 on holdout set
- [ ] Feature importance stable

### Phase 3: Offline Validation (Week 2-3)

**Duration:** 2-3 days  
**Action:** Validate retrained model

**Tests:**
```bash
# 1. Offline evaluation
node scripts/ml-eval-v1.8.1.cjs

# 2. PSI check on new model
node scripts/ml-psi-v1.8.1.cjs --baseline evidence/ml/features_v1.8.1.parquet

# 3. Smoke test
node scripts/ml-smoke.cjs --model v1.8.1-retrain

# 4. Shadow test
node scripts/ml-shadow-smoke.cjs --model v1.8.1-retrain
```

**Validation Criteria:**
- [ ] All offline tests PASS
- [ ] PSI < 0.2 on validation set
- [ ] Smoke test P95 < 80ms
- [ ] Shadow match rate >= 95%

### Phase 4: Re-run Canary (Week 3-4)

**Duration:** 2.5 hours (5 phases × 30min)  
**Action:** Deploy v1.8.1 model in observe-only canary

**Same Process as v1.8.0-rc1:**
```bash
# Pre-flight
node scripts/canary-preflight.cjs

# Dry-run
node scripts/canary-observe-only.cjs --dry-run --model v1.8.1-retrain

# Confirm & Execute
node scripts/canary-observe-only.cjs --live --confirm --model v1.8.1-retrain
```

**Success Criteria:**
- [ ] All 5 phases PASS (no aborts)
- [ ] P95 < 80ms across all phases
- [ ] Error rate < 1%
- [ ] Match rate >= 95%
- [ ] **PSI < 0.2** ✅ (unblock promote)

### Phase 5: Promote to v1.8.1 (Week 4+)

**Duration:** 24-48h validation period  
**Action:** Promote to production (after final confirmation)

**Requirements:**
- [ ] v1.8.1 canary GREEN
- [ ] PSI < 0.2 sustained for 48h
- [ ] No critical alerts
- [ ] Stakeholder approval
- [ ] Final confirmation

**Commands:**
```bash
# Tag release
git tag v1.8.1 -m "ML model retrained with drift-robust features, PSI <0.2"

# Update evidence
echo "v1.8.1 promoted $(date)" >> GREEN_EVIDENCE_v1.8.md

# Enable in production (with gate)
# ... (requires separate confirmation)
```

---

## Technical Details

### Cross-Validation Strategy

**Purged Time-Series CV:**
```
Train: [----------X    ]     (purge gap)
Test:  [            -XX]
                    ^^^ embargo (60min)

Prevents look-ahead bias and label leakage
```

**Benefits:**
- ✅ Realistic performance estimates
- ✅ No data leakage
- ✅ Robust to temporal correlation

### Feature Engineering Code Snippet

```javascript
// v1.8.1 feature builder
function buildFeaturesV181(snapshot, history) {
  const mid_t = snapshot.mid;
  const mid_t1m = history.mid_1m_ago;
  const mid_t5m = history.mid_5m_ago;
  
  // Log-returns (stationary)
  const logret_1m = Math.log(mid_t / mid_t1m);
  const logret_5m = Math.log(mid_t / mid_t5m);
  
  // Rolling z-score (24h window)
  const mu_24h = history.mid_mean_24h;
  const sigma_24h = history.mid_std_24h;
  const zscore_mid = (mid_t - mu_24h) / (sigma_24h + 1e-8);
  
  // Normalized RSI
  const rsi14_z = (snapshot.rsi14 - 50) / 30;
  
  return [
    1,                           // bias
    logret_1m,                   // 1-min return
    logret_5m,                   // 5-min return
    snapshot.spreadBp,           // spread (unchanged)
    Math.log1p(snapshot.vol1m),  // log-volume (unchanged)
    rsi14_z,                     // normalized RSI
    zscore_mid                   // price z-score
  ];
}
```

### PSI Calculation

```javascript
function calculatePSI(current, reference, bins = 10) {
  const currentDist = binData(current, bins);
  const refDist = binData(reference, bins);
  
  let psi = 0;
  for (let i = 0; i < bins; i++) {
    const curr = currentDist[i] || 0.0001;
    const ref = refDist[i] || 0.0001;
    psi += (curr - ref) * Math.log(curr / ref);
  }
  
  return psi;
}

// Expected PSI for log-returns: < 0.1
// Expected PSI for z-scores: < 0.15
// Target overall PSI: < 0.2
```

---

## Risk Mitigation

### Risks

1. **New Features Degrade Performance**
   - **Mitigation**: Offline validation with strict SLOs (AUC >= 0.62)
   - **Fallback**: Keep v1.8-b0 active in observe-only mode

2. **PSI Still >0.2 After Retrain**
   - **Mitigation**: Adjust reference window (7d → 14d)
   - **Fallback**: Implement online learning (v1.9 roadmap)

3. **Canary Fails (abort triggered)**
   - **Mitigation**: Automatic rollback to v1.8-b0
   - **Fallback**: Extended data collection (14d → 30d)

4. **Model Retraining Takes Too Long**
   - **Mitigation**: Parallel development track (v1.8.1 + v1.9)
   - **Fallback**: Continue observe-only indefinitely (safe)

### Rollback Plan

**If v1.8.1 canary fails:**
1. Automatic rollback to 0% (observe-only disabled)
2. Keep v1.8-b0 running in observe-only
3. Analyze failure root cause
4. Extend data collection period
5. Re-run with adjusted features

**Rollback Command:**
```bash
node scripts/canary-observe-only.cjs --rollback --target 0%
```

---

## Success Metrics

### Primary

- [ ] **PSI < 0.2** (overall, sustained 48h)
- [ ] **Per-feature PSI < 0.3** (all features)
- [ ] **Offline AUC >= 0.62**
- [ ] **Offline P@20 >= 0.58**

### Secondary

- [ ] Canary P95 < 80ms
- [ ] Canary error rate < 1%
- [ ] Shadow match rate >= 95%
- [ ] No aborts in 5-phase canary

### Monitoring

- [ ] Daily PSI snapshots (7-day rolling)
- [ ] Weekly model performance reports
- [ ] Alert on PSI > 0.15 (early warning)
- [ ] Dashboard with all metrics

---

## Timeline

```
Week 1 (Oct 8-14):   Data collection (14 days of features)
Week 2 (Oct 15-21):  Model training + offline validation
Week 3 (Oct 22-28):  Re-run canary (observe-only)
Week 4 (Oct 29-Nov 4): 48h validation + promote decision
```

**Target Release:** v1.8.1 by November 4, 2025  
**Confidence:** High (95%) - Strategy proven for drift mitigation

---

## Artifacts

**Generated Files:**
- `evidence/ml/features_v1.8.1.parquet` - New feature data
- `evidence/ml/offline_report_v1.8.1.json` - Training results
- `evidence/ml/psi_snapshot_v1.8.1.json` - PSI validation
- `evidence/ml/canary_run_v1.8.1_*.json` - Canary evidence
- `configs/retrain_v1.8.1.json` - Training config
- `packages/ml-core/src/features_v1.8.1.ts` - New feature code

**Documentation:**
- This document (ML_RETRAIN_STRATEGY_v1.8.1.md)
- Updated GREEN_EVIDENCE_v1.8.md (Phase 5: Retrain)
- CHANGELOG.md (v1.8.1 entry)

---

**Status:** 📋 PLANNING  
**Owner:** ML Team  
**Reviewer:** Platform Team  
**Approver:** Engineering Lead (for promote only)

