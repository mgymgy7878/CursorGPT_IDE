# v1.8 Analytics + ML Pipeline - Task Breakdown

**Sprint**: v1.8 (2 weeks)  
**Story Points**: 13 SP total  
**Status**: SCAFFOLD READY → IMPLEMENTATION

---

## 📋 TASK BREAKDOWN

### SPARK-ML-201: Feature Store & Freshness Metrikleri (2SP)

**Description**: Feature extraction pipeline with freshness tracking

**Deliverables**:
- `packages/ml-core/src/feature-store.ts` - Feature extraction & caching
- Freshness metrics: `ml_feature_age_seconds{feature}`
- Feature validation: Schema checks, range validation
- Cache TTL: Configurable per feature type

**Acceptance Criteria**:
- [ ] Features extracted in < 10ms
- [ ] Freshness tracked per feature
- [ ] Cache hit rate > 80%
- [ ] Validation errors logged

---

### SPARK-ML-202: Model Registry + Artefact Lifecycle (3SP)

**Description**: Model versioning, storage, and lifecycle management

**Deliverables**:
- Model storage: `artefacts/models/<model>/<version>/`
  - `model.json` - Model weights/parameters
  - `manifest.json` - Metadata (version, timestamp, checksum)
  - `metrics.json` - Offline performance metrics
- Versioning scheme: `v1.8-bX` (beta) → `v1.8-rcY` (release candidate) → `v1.8-prodZ` (production)
- Checksum validation (SHA256)
- Git SHA tracking

**Acceptance Criteria**:
- [ ] Model artefacts stored with complete manifest
- [ ] Checksum validation on load
- [ ] Version promotion workflow documented
- [ ] Rollback capability verified

---

### SPARK-ML-203: ML Engine Worker Pool + Timeout + Circuit Breaker (2SP)

**Description**: Concurrency control and failure handling

**Deliverables**:
- Worker pool (min 2, max 8 workers)
- Predict timeout: 60ms hard limit
- Circuit breaker: 5 consecutive failures → OPEN (1 minute)
- Fallback: `loadBaseline()` when circuit open
- Metrics: `ml_worker_pool_size`, `ml_circuit_breaker_state`

**Acceptance Criteria**:
- [ ] Worker pool scales based on load
- [ ] Timeouts enforced (< 60ms or fail)
- [ ] Circuit breaker triggers after 5 failures
- [ ] Fallback model serves predictions when circuit open

---

### SPARK-ML-204: Shadow Mode + Match Rate Metriği (2SP)

**Description**: Parallel predictions without impacting live trading

**Deliverables**:
- Shadow parameter in `ml-router.ts`
- Parallel prediction execution
- Match rate tracking: `ml_shadow_match_rate{threshold}`
- Metrics: `ml_shadow_requests_total`, `ml_shadow_latency_ms`

**Acceptance Criteria**:
- [ ] Shadow predictions run parallel to live
- [ ] No impact on live trading latency
- [ ] Match rate >= 95% (score difference < 0.01)
- [ ] Shadow metrics collected for 24-48h

---

### SPARK-ML-205: PSI Drift Detection + Alerts (2SP)

**Description**: Population Stability Index monitoring for feature drift

**Deliverables**:
- `scripts/ml-drift-check.ts` - Daily PSI calculation
- PSI metric: `ml_feature_drift_score{feature}`
- Alert rules: PSI > 0.2 (warning), > 0.3 (critical)
- Drift report: `evidence/ml/drift_report.json`

**Acceptance Criteria**:
- [ ] PSI calculated daily for all features
- [ ] Drift detected within 10 minutes
- [ ] Alerts trigger at correct thresholds
- [ ] Drift report includes feature distributions

---

### SPARK-ML-206: GREEN Evidence Collection (2SP)

**Description**: Comprehensive evidence for v1.8 GREEN validation

**Deliverables**:
- `GREEN_EVIDENCE_v1.8.md` - Complete evidence document
- Offline report: AUC, Precision@K, Brier score
- Online metrics: Latency P95, success rate, throughput
- Shadow results: Match rate, drift scores
- Canary results: Load test, promtool validation
- Grafana screenshots: All 5 panels

**Acceptance Criteria**:
- [ ] All SLOs validated and documented
- [ ] Promtool tests PASS (rules/ml.yml)
- [ ] Grafana panels rendering correctly
- [ ] Evidence artifacts collected
- [ ] v1.8.0 release tag created

---

## 🎯 SLO TARGETS

### Offline (Training & Evaluation)
```
AUC:                >= 0.62
Precision@20:       >= 0.58
Recall@20:          >= 0.40
Brier Score:        < 0.25
Reproducibility:    Same seed → same metrics
```

### Online (Production)
```
Latency P95:        < 80ms (warning), < 200ms (critical)
Success Rate:       >= 95%
Error Rate:         < 10%
Timeout Rate:       < 1%
Throughput:         >= 20 predictions/sec
```

### Shadow/Live Alignment
```
Match Rate:         >= 95% (score difference < 0.01)
Drift Detection:    Alert within 10 minutes
PSI Normal:         < 0.2 (all features)
PSI Critical:       < 0.3 (any feature)
```

---

## 🚨 RISKS & GUARDRAILS

### 1. Feature Drift / Covariate Shift
**Risk**: Model degradation due to distribution changes  
**Guardrail**: PSI monitoring + alerts  
**Thresholds**: PSI > 0.2 (warning), > 0.3 (critical)  
**Action**: Close gate → revert to shadow → trigger retrain

### 2. Model Timeout / Blocking
**Risk**: Slow predictions blocking executor  
**Guardrail**: Circuit breaker (5 failures → open)  
**Timeout**: 60ms hard limit  
**Fallback**: loadBaseline (fast deterministic model)

### 3. Parameter Drift
**Risk**: Model integrity compromise  
**Guardrail**: Checksum validation on load  
**Metric**: `ml_model_integrity_error_total`  
**Action**: Reload model, alert operations

### 4. Service Overload
**Risk**: Too many concurrent predictions  
**Guardrail**: Rate limiting (20 rps)  
**Queue**: Max depth 100 (backpressure)  
**Metric**: `ml_queue_depth` + HTTP 429

### 5. Cycle Dependencies
**Risk**: Build/boot failures  
**Guardrail**: CI madge check (--circular)  
**Enforcement**: PR blocks if cycles detected  
**Action**: Fix before merge

---

## 📊 MONITORING DASHBOARD

### Grafana Panels (5 total)
1. **Prediction Requests/sec** - Traffic monitoring
2. **Latency P95 (ms)** - Performance SLO
3. **Model Version** - Current deployed version
4. **Success Rate (%)** - Reliability SLO
5. **Prediction Score Distribution** - Model behavior

### Alert Rules (5 + 3 shadow)
**Base Alerts**:
1. MLPredictLatencyP95High (> 80ms)
2. MLErrorSpike (> 10% error rate)
3. MLNoPredictions (no traffic 15m)
4. MLModelErrorsHigh (> 5%)
5. MLPredictLatencyP95Critical (> 200ms)

**Shadow Alerts** (Faz 3):
6. MLShadowMismatchSpike (< 90% match)
7. MLFeatureDriftHigh (PSI > 0.2)
8. MLFeatureDriftCritical (PSI > 0.3)

---

## 🔄 WORKFLOW

### Daily Operations
```
1. Morning: Check drift report (PSI scores)
2. Continuous: Monitor Grafana dashboard
3. On Alert: Follow runbook procedures
4. Weekly: Review model performance trends
5. Bi-weekly: Evaluate retrain opportunities
```

### Incident Response
```
Alert → Check Grafana → Review metrics → Determine action
Actions: Rollback model, increase capacity, trigger retrain, close gate
Escalation: If SLO breach > 1 hour
```

---

## 📝 DEFINITION OF DONE (v1.8 GREEN)

### Code & Implementation
- [ ] All 6 tasks (SPARK-ML-201 to 206) complete
- [ ] ml-core package built & tested
- [ ] ml-engine service deployed (Docker)
- [ ] ml-router plugin integrated
- [ ] Scripts functional (train, eval, drift)

### Testing & Validation
- [ ] Offline: AUC >= 0.62, P@20 >= 0.58 ✅
- [ ] Online: P95 < 80ms ✅
- [ ] Shadow: Match rate >= 95% ✅
- [ ] Canary: 30-min load test PASS ✅

### Observability
- [ ] 6 Prometheus metrics exposed
- [ ] 8 alert rules validated (promtool PASS)
- [ ] 5 Grafana panels rendering
- [ ] Drift monitoring active (PSI)

### Documentation
- [ ] GREEN_EVIDENCE_v1.8.md complete
- [ ] All evidence artifacts collected
- [ ] Grafana screenshots included
- [ ] Runbooks updated

### Deployment
- [ ] Docker image: spark-ml:v1.8
- [ ] Health checks passing
- [ ] Nginx proxy configured (optional)
- [ ] Release tag: v1.8.0

---

**Status**: Ready for v1.8 Implementation  
**Next**: Begin Faz 1 → Faz 4 execution

