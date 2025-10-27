# v1.8 Analytics + ML Pipeline - Risks & Guardrails

**Sprint**: v1.8  
**Last Updated**: 2025-10-08

---

## 🚨 IDENTIFIED RISKS & MITIGATION

### 1. Feature Drift / Covariate Shift

**Risk Level**: HIGH  
**Impact**: Model degradation, poor predictions

**Indicators**:
- PSI (Population Stability Index) > 0.2
- Feature distributions shift over time
- Prediction accuracy drops

**Guardrails**:
- **Monitoring**: Daily PSI calculation for all features
- **Metric**: `ml_feature_drift_score{feature}`
- **Thresholds**: 
  - PSI > 0.2 → Warning alert
  - PSI > 0.3 → Critical alert + auto-action
- **Auto-Action**: Close prediction gate, revert to shadow mode

**Manual Actions**:
- Review drift report
- Analyze feature distributions
- Trigger model retrain
- Update feature engineering if needed

---

### 2. Model Timeout / Blocking

**Risk Level**: MEDIUM  
**Impact**: Executor latency spike, timeout errors

**Indicators**:
- Prediction latency > 60ms
- `ml_predict_timeout_total` incrementing
- Circuit breaker opens

**Guardrails**:
- **Hard Timeout**: 60ms limit per prediction
- **Circuit Breaker**: 5 consecutive failures → OPEN (1 minute)
- **Fallback**: `loadBaseline()` - fast deterministic model
- **Metric**: `ml_circuit_breaker_state{state}`

**Actions**:
- Circuit OPEN → Use fallback model
- Circuit HALF_OPEN → Test with single request
- Circuit CLOSED → Resume normal operation

---

### 3. Parameter Drift / Model Integrity

**Risk Level**: MEDIUM  
**Impact**: Model produces incorrect predictions

**Indicators**:
- Model checksum mismatch
- Unexpected prediction patterns
- `ml_model_integrity_error_total` incrementing

**Guardrails**:
- **Checksum Validation**: SHA256 on model load
- **Manifest Check**: Version, timestamp, git SHA verification
- **Metric**: `ml_model_integrity_error_total{reason}`

**Actions**:
- Reject corrupted model
- Reload from registry
- Alert operations team
- Investigate integrity breach

---

### 4. Service Overload

**Risk Level**: MEDIUM  
**Impact**: Degraded performance, request queueing

**Indicators**:
- Queue depth > 50
- Latency P95 > 80ms
- Rate limit 429 responses increasing

**Guardrails**:
- **Rate Limiting**: 20 requests/sec per client
- **Queue Depth**: Max 100 (backpressure after)
- **Backpressure**: HTTP 429 with Retry-After header
- **Metrics**: `ml_queue_depth`, `ml_rate_limit_total`

**Actions**:
- Scale workers (up to max 8)
- Increase rate limit (temporary)
- Add ml-engine instances
- Review traffic patterns

---

### 5. Circular Dependencies (Build)

**Risk Level**: LOW (Mitigated in v1.8)  
**Impact**: Cannot build/boot services

**Indicators**:
- `madge --circular` reports cycles
- ERR_REQUIRE_CYCLE_MODULE errors
- Build failures

**Guardrails**:
- **CI Check**: `pnpm run check:cycles` (madge)
- **PR Block**: Fails if cycles detected
- **Design Pattern**: contracts.ts (type-only files)
- **Lazy Loading**: Dynamic imports for plugins

**Actions**:
- Fix cycles before merge
- Use contracts pattern
- Avoid barrel exports
- Test build in CI

---

### 6. Shadow/Live Mismatch

**Risk Level**: LOW  
**Impact**: Confidence loss in ML predictions

**Indicators**:
- Match rate < 90%
- `ml_shadow_match_rate` drops
- Prediction divergence

**Guardrails**:
- **Metric**: `ml_shadow_match_rate{threshold="0.01"}`
- **Target**: >= 95% agreement
- **Alert**: < 90% triggers investigation

**Actions**:
- Analyze mismatch cases
- Review feature extraction consistency
- Check model versioning
- Validate deployment

---

## 🛡️ GUARDRAIL MATRIX

| Risk | Severity | Detection | Prevention | Response |
|------|----------|-----------|------------|----------|
| Feature Drift | HIGH | PSI > 0.2 | Daily monitoring | Close gate, retrain |
| Timeout | MEDIUM | Latency > 60ms | Circuit breaker | Use fallback |
| Integrity | MEDIUM | Checksum fail | Validation | Reload model |
| Overload | MEDIUM | Queue > 50 | Rate limiting | Scale workers |
| Cycles | LOW | madge check | CI enforcement | Fix before merge |
| Mismatch | LOW | Match < 90% | Shadow testing | Investigate |

---

## 📊 MONITORING CHECKLIST

### Daily
- [ ] Check drift report (PSI scores)
- [ ] Review Grafana dashboard
- [ ] Verify no critical alerts
- [ ] Check error rates

### Weekly
- [ ] Model performance trends
- [ ] Feature importance analysis
- [ ] Capacity planning review
- [ ] Alert threshold tuning

### Bi-weekly
- [ ] Retrain evaluation
- [ ] A/B test new models
- [ ] Performance optimization
- [ ] Documentation updates

---

## 🚨 INCIDENT RESPONSE

### Alert: MLPredictLatencyP95High

**Trigger**: P95 > 80ms for 10 minutes

**Investigation**:
1. Check Grafana latency panel
2. Review `ml_predict_latency_ms_bucket` metrics
3. Check worker pool size
4. Review recent model changes

**Actions**:
- Scale workers (if < max)
- Check feature extraction performance
- Consider model optimization
- Temporary rate limit increase

---

### Alert: MLFeatureDriftCritical

**Trigger**: PSI > 0.3 for any feature

**Investigation**:
1. Review drift report
2. Check feature distributions
3. Compare to historical baseline
4. Identify drifted features

**Actions**:
- **Immediate**: Close prediction gate
- **Short-term**: Revert to shadow mode
- **Medium-term**: Retrain model with recent data
- **Long-term**: Update feature engineering

---

### Alert: MLShadowMismatchSpike

**Trigger**: Match rate < 90%

**Investigation**:
1. Compare shadow vs live predictions
2. Check model versions (should be same)
3. Review feature extraction consistency
4. Analyze mismatch patterns

**Actions**:
- Pause promotion to live
- Investigate root cause
- Fix consistency issues
- Re-run shadow testing

---

## 📋 APPROVAL REQUIREMENTS

### Model Promotion (RC → Prod)
**Requires Approval**: Yes (Admin role)

**Checklist**:
- [ ] Offline AUC >= 0.62
- [ ] Shadow match rate >= 95%
- [ ] Canary test PASS (30 min load)
- [ ] No critical alerts
- [ ] Evidence documented

### Threshold Changes
**Requires Approval**: Yes (Admin role)

**Validation**:
- Impact analysis documented
- A/B test results
- Ops team review
- Rollback plan ready

### Emergency Rollback
**Requires Approval**: No (Automated on critical alert)

**Triggers**:
- PSI > 0.3 for 10+ minutes
- Error rate > 50%
- P95 latency > 200ms for 5 minutes

---

## 📝 REPORTING STANDARD

### Daily TL;DR (Max 3 bullet points)
```
- p95 predict: 62ms ✅ | shadow match: 96% ✅ | drift: normal ✅
- Kanıt: evidence/ml/daily_2025-10-08.json
- Öneri: Maintain current model / Monitor feature_X / Consider retrain
```

### Weekly Report
```
Summary:
- Predictions: X requests, Y% success
- Performance: P95 latency, throughput
- Drift: PSI scores per feature
- Incidents: Count, resolution time

Recommendations:
- Model updates
- Threshold tuning
- Capacity adjustments
```

---

**Generated**: 2025-10-08  
**Status**: Complete guardrail framework  
**Next**: Implement during v1.8 sprint

