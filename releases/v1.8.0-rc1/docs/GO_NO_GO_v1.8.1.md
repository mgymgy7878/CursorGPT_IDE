# Go/No-Go Decision (v1.8.1 Promote)

**Purpose:** Single-page promote decision checklist  
**Decision:** GO ✅ / NO-GO ❌  
**Date:** _________  
**Reviewer:** _________

---

## 🚦 DECISION CRITERIA (6 Gates)

### ✅ / ❌  GATE 1: PSI Drift

**Requirement:** PSI < 0.2 (overall), < 0.3 (per-feature), 7-day rolling  
**Validation:**
```bash
node scripts/ml-psi-snapshot.cjs
cat evidence/ml/psi_snapshot.json | jq '{psi:.overall_psi, pass:.slo_check.pass}'
```

**Expected:**
- Overall PSI: **< 0.2** ✅
- Mid feature: **< 0.3** ✅
- All features: **< 0.3** ✅

**Current (v1.8.0-rc1):**
- Overall PSI: **1.25** ❌
- Status: **NO-GO**

**v1.8.1 Target:**
- Overall PSI: **< 0.2** (after retrain)
- Status: **GO** (if validated)

**Decision:** ☐ GO  ☐ NO-GO

---

### ✅ / ❌  GATE 2: Performance SLO

**Requirement:** P95 < 80ms, Error < 1%, Match >= 95% (24h rolling)  
**Validation:**
```bash
node scripts/ml-smoke.cjs
node scripts/ml-shadow-smoke.cjs
cat evidence/ml/smoke_1k.json | jq '.slo_check'
```

**Expected:**
- P95 Latency: **< 80ms**
- Error Rate: **< 1%**
- Match Rate: **>= 95%**

**Current:**
- P95: **2.57-3.09ms** ✅
- Error: **0.24-0.48%** ✅
- Match: **97.3-99.5%** ✅
- Status: **GO**

**Decision:** ☐ GO  ☐ NO-GO

---

### ✅ / ❌  GATE 3: Alert Silence

**Requirement:** Zero CRITICAL alerts in last 24h  
**Validation:**
```bash
# Prometheus query (if available)
curl "http://prometheus:9090/api/v1/query?query=ALERTS{severity=\"critical\",alertstate=\"firing\"}"

# Or Alertmanager
curl "http://alertmanager:9093/api/v1/alerts?filter=severity=critical"
```

**Expected:**
- CRITICAL alerts: **0**
- WARNING alerts: **< 3**

**Current:**
- CRITICAL: **0** ✅
- Status: **GO**

**Decision:** ☐ GO  ☐ NO-GO

---

### ✅ / ❌  GATE 4: Offline Validation

**Requirement:** AUC >= 0.62, P@20 >= 0.58 (new distribution)  
**Validation:**
```bash
node scripts/ml-eval-v1.8.1.cjs
cat evidence/ml/eval_result_v1.8.1.txt
cat evidence/ml/offline_report_v1.8.1.json | jq '{auc, precision_at_20}'
```

**Expected:**
- AUC: **>= 0.62**
- Precision@20: **>= 0.58**
- Eval Result: **PASS**

**Current (v1.8-b0):**
- AUC: **0.64** ✅
- Precision@20: **0.59** ✅
- Status: **GO**

**v1.8.1 (pending retrain):**
- Status: **NO-GO** (not yet trained)

**Decision:** ☐ GO  ☐ NO-GO

---

### ✅ / ❌  GATE 5: Shadow Delta

**Requirement:** Mean < 0.05, P99 < 0.10  
**Validation:**
```bash
cat evidence/ml/shadow_smoke_1k.json | jq '.shadow | {avg_delta, max_delta}'
```

**Expected:**
- Mean Delta: **< 0.05**
- P99 Delta: **< 0.10**

**Current:**
- Mean: **0.02** ✅
- Max: **0.04** ✅
- Status: **GO**

**Decision:** ☐ GO  ☐ NO-GO

---

### ✅ / ❌  GATE 6: Evidence Completeness

**Requirement:** All evidence files present + timestamped  
**Validation:**
```bash
ls -1 evidence/ml/*.json | wc -l  # Should be >= 7
ls -lh evidence/ml/daily/*.json | tail -5
```

**Expected:**
- Offline: ✅ (offline_report.json, eval_result.txt)
- Runtime: ✅ (smoke_1k.json, metrics_baseline_*.txt)
- Shadow: ✅ (shadow_smoke_1k.json, psi_snapshot.json)
- Canary: ✅ (canary_run_*.json, preflight, dryrun)
- Daily: ✅ (report_*.json, ml_daily_reports.csv)

**Current:**
- Evidence files: **9** ✅
- Status: **GO**

**Decision:** ☐ GO  ☐ NO-GO

---

## 📊 DECISION SUMMARY

| Gate | Requirement           | Status (v1.8.0-rc1) | Status (v1.8.1) | Decision |
|------|-----------------------|---------------------|-----------------|----------|
| 1    | PSI < 0.2             | ❌ 1.25             | ⏳ Pending      | ☐ GO ☐ NO-GO |
| 2    | Performance SLO       | ✅ PASS             | ✅ Expected     | ☐ GO ☐ NO-GO |
| 3    | Alert Silence         | ✅ PASS             | ✅ Expected     | ☐ GO ☐ NO-GO |
| 4    | Offline Validation    | ✅ PASS             | ⏳ Pending      | ☐ GO ☐ NO-GO |
| 5    | Shadow Delta          | ✅ PASS             | ✅ Expected     | ☐ GO ☐ NO-GO |
| 6    | Evidence Complete     | ✅ PASS             | ✅ Expected     | ☐ GO ☐ NO-GO |

**Total Passed:** _____ / 6  
**Total Failed:** _____ / 6

---

## 🎯 FINAL DECISION

**Overall Status:** ☐ GO  ☐ NO-GO

**If GO:**
- [ ] Stakeholder approval received
- [ ] Promote command confirmed
- [ ] Rollback plan documented
- [ ] Post-promote monitoring scheduled

**If NO-GO:**
- [ ] Root cause documented
- [ ] Mitigation plan created
- [ ] Re-validation timeline set
- [ ] Stakeholders notified

---

## 🛡️ ROLLBACK PLAN

**Trigger Conditions:**
- P95 > 120ms sustained 10min
- Error rate > 2% sustained 10min
- Match rate < 90% sustained 5min
- CRITICAL alert fired

**Rollback Steps:**

```bash
# 1. Immediate traffic switch
curl -X POST http://127.0.0.1:4001/canary/abort
# Or
node scripts/canary-observe-only.cjs --rollback --target 0%

# 2. Disable shadow
curl -X POST http://127.0.0.1:4001/shadow/disable

# 3. Snapshot metrics (last 30 min)
curl -s http://prometheus:9090/api/v1/query_range?query=... > evidence/ml/rollback_metrics.json

# 4. Log rollback event
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ROLLBACK v1.8.1 → v1.8-b0 (reason: ...)" >> evidence/ml/rollback_log.txt

# 5. Update CHANGELOG
# Add entry: ## [v1.8.1-rollback] - YYYY-MM-DD

# 6. Tag revert
git tag v1.8.1-rollback -m "Rollback from v1.8.1 due to [reason]"

# 7. Config diff
git diff v1.8-b0..v1.8.1 > evidence/ml/config_diff_rollback.patch
```

**Rollback Time Target:** < 1 minute (traffic switch)  
**Full Rollback:** < 5 minutes (all steps)

---

## 📋 PRE-PROMOTE CHECKLIST

**Infrastructure:**
- [ ] ML Engine health OK (port 4010)
- [ ] Prometheus scraping metrics (30s interval)
- [ ] Alertmanager routing configured
- [ ] Grafana dashboard accessible
- [ ] NTP sync verified (< 100ms skew)

**Monitoring:**
- [ ] All 17 alert rules loaded
- [ ] No alert flapping (< 3 toggles/hour)
- [ ] Metrics cardinality < 10k
- [ ] Daily reports automated (cron/PM2)

**Security:**
- [ ] Shadow isolated (no production impact)
- [ ] Baseline always used for live trading
- [ ] RBAC configured (internal-only endpoints)
- [ ] Circuit breaker armed (error > 2%)

**Documentation:**
- [ ] CHANGELOG.md updated (v1.8.1 entry)
- [ ] GREEN_EVIDENCE_v1.8.md complete
- [ ] Retrain strategy documented
- [ ] Rollback plan validated

**Artifacts:**
- [ ] Model weights saved (ml-artifacts/v1.8.1/)
- [ ] Reference distributions persisted
- [ ] Training manifest + checksums
- [ ] Evidence package complete (19+ files)

---

## ✅ APPROVAL SIGNATURES

**Technical Lead:** _________________  Date: _______  
**ML Team Lead:** _________________  Date: _______  
**Platform Lead:** _________________  Date: _______  
**Risk Manager:** _________________  Date: _______

---

## 🚀 PROMOTE COMMAND (After GO)

**Execute:**
```bash
ONAY: Promote v1.8.1 to production
      All 6 gates PASS
      PSI < 0.2 validated
      Stakeholder approval received
      Rollback plan ready
```

**Post-Promote:**
```bash
# Tag release
git tag v1.8.1 -m "ML model retrained, PSI <0.2, all gates PASS"

# Update manifest
echo "v1.8.1 promoted $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> evidence/ml/promote_log.txt

# Monitor (48h validation)
# ... (alert on any degradation)
```

---

**Generated:** 2025-10-08  
**Version:** v1.8.1 (pending retrain)  
**Status:** Pre-decision (gates being validated)

