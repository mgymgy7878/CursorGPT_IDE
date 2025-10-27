# Changelog

All notable changes to the Spark Trading Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.8.0-rc1] - 2025-10-08

### Added

#### ML Pipeline (v1.8)
- **ML Core Package** (`@spark/ml-core`)
  - Feature engineering pipeline (6D feature vectors)
  - Baseline logistic regression model (v1.8-b0)
  - Type-safe contracts for predictions and training
  - Reproducible model loading with versioning

- **ML Engine Service** (port 4010)
  - Prediction API (`/ml/predict`)
  - Model metadata endpoint (`/ml/model/info`)
  - Prometheus metrics integration
  - Standalone CJS runner (cycle-free)

- **Shadow Prediction System**
  - Dual-path prediction (baseline + ML)
  - Match rate monitoring (>=95% SLO)
  - Delta calculation and logging
  - Observe-only mode (zero production impact)
  - Automatic circuit breaker (error rate >2%)

- **PSI Drift Detection**
  - Per-feature PSI calculation
  - Reference distribution tracking
  - Thresholds: <0.1 stable, 0.1-0.2 warning, >0.2 critical
  - Automatic retraining recommendations

- **Prometheus Metrics**
  - `ml_predict_requests_total` - Prediction request counter
  - `ml_predict_latency_ms_bucket` - Latency histogram
  - `ml_shadow_match_rate` - Shadow/baseline agreement gauge
  - `ml_shadow_abs_delta` - Prediction delta histogram
  - `ml_psi_score` - Feature drift indicator
  - `ml_model_version` - Active model version

- **Alert Rules** (`rules/ml.yml`, `rules/ml-canary.yml`)
  - ML prediction latency (P95 >80ms)
  - Shadow match rate (<95%)
  - Shadow error rate (>2%, ABORT)
  - PSI drift (>0.2 warning, >0.3 critical)
  - Model errors (>1%)
  - ML Engine availability

- **Grafana Dashboard** (`grafana-ml-dashboard.json`)
  - 9 panels covering latency, match rate, drift, throughput
  - Real-time PSI monitoring
  - Shadow vs baseline comparison
  - Model version tracking

#### Scripts and Tools
- `scripts/ml-train.cjs` - Offline training (deterministic)
- `scripts/ml-eval.cjs` - Offline evaluation (SLO validation)
- `scripts/ml-smoke.cjs` - ML Engine smoke test (1k requests)
- `scripts/ml-shadow-smoke.cjs` - Shadow integration test
- `scripts/ml-shadow-mock.cjs` - Mock shadow test (simulation)
- `scripts/ml-psi-snapshot.cjs` - PSI drift calculation
- `scripts/canary-preflight.cjs` - Pre-flight health check
- `scripts/canary-observe-only.cjs` - Canary deployment runner

### Changed

#### Observability
- Extended Prometheus metrics coverage for ML pipeline
- Added canary-specific alert rules with observe-only mode
- Enhanced Grafana dashboards with ML monitoring panels

### Validated

#### Performance (SLO Compliance)
- **ML Prediction Latency**: P95 2.64ms (SLO: <80ms) ✅
- **Shadow Match Rate**: 97.3-99.5% (SLO: >=95%) ✅
- **Error Rate**: 0.24-0.48% (SLO: <1%) ✅
- **Success Rate**: 100% (SLO: >=95%) ✅

#### ML Quality
- **Offline AUC**: 0.64 (threshold: >=0.62) ✅
- **Precision@20**: 0.59 (threshold: >=0.58) ✅
- **Shadow Agreement**: 100% match (1k smoke test) ✅

#### Canary Deployment (Observe-Only)
- **Phase 1 (5%)**: P95 2.74ms, Match 99.2% ✅
- **Phase 2 (10%)**: P95 2.66ms, Match 97.3% ✅
- **Phase 3 (25%)**: P95 2.57ms, Match 99.5% ✅
- **Phase 4 (50%)**: P95 3.09ms, Match 98.1% ✅
- **Phase 5 (100%)**: P95 3.00ms, Match 97.6% ✅
- **Status**: All phases passed, no aborts ✅

### Known Issues

#### PSI Drift (Blocking Promote)
- **Overall PSI**: 1.25 (critical, threshold: <0.2)
- **Mid (price) feature**: 4.87 (significant distribution shift)
- **Cause**: Market volatility, expected behavior
- **Action Required**: Model retraining with updated reference distributions
- **Impact**: Observe-only mode active, NO production promote until PSI <0.2

### Security

- Shadow predictions isolated from production decisions
- Baseline always used for live trading
- ML scores logged for analysis only
- Automatic rollback on SLO breach
- Circuit breaker protection

### Evidence Files

```
evidence/ml/
├── offline_report.json           # Offline training metrics
├── eval_result.txt               # Evaluation result (PASS)
├── smoke_1k.json                 # ML Engine smoke test
├── shadow_smoke_1k.json          # Shadow integration test
├── psi_snapshot.json             # PSI drift analysis
├── canary_preflight.json         # Pre-flight baseline
├── canary_dryrun_observe.json    # Dry-run results
├── canary_run_*.json             # Live canary evidence
├── metrics_baseline_*.txt        # Prometheus snapshots
└── metrics_shadow_*.txt          # Shadow metrics
```

### Next Steps

1. **Model Retraining** (v1.8.1)
   - Address PSI drift (mid feature: 4.87 → <0.2)
   - Update reference distributions
   - Validate with new feature engineering
   - Target: Overall PSI <0.2

2. **Promote to v1.8.0** (After retraining)
   - Requires: PSI <0.2, 24-48h validation
   - Tag: v1.8.0 (production)
   - Enable: ML predictions in live trading (with gate)

3. **Future Enhancements** (v1.9+)
   - Online learning pipeline
   - A/B testing framework
   - Multi-model ensemble
   - Automated retraining triggers

---

## [v1.7.0] - 2025-09-30

### Added
- Export@Scale service (CSV/PDF generation)
- Stream-based export with memory safety
- Prometheus metrics for export operations
- Docker sidecar deployment strategy

### Validated
- 10k/50k dataset tests: PASS
- P95 latency <10s
- Success rate >=95%

---

## [v1.6.4] - 2025-09-15

### Added
- Historical & Backtest Engine
- Golden file validation
- Backtest performance metrics
- Prometheus integration

---

## [v1.6.3] - 2025-09-10

### Added
- Paper-Trade Drift Gates
- Drift detection algorithms
- Gate policy configuration
- Grafana drift dashboard

---

## [v1.6.2] - 2025-09-05

### Added
- Optimizer Concurrency improvements
- Job queue management
- Rate limiting and backpressure
- Concurrency metrics

---

## [v1.6.1] - 2025-09-01

### Added
- Streams + Monitoring foundation
- Prometheus/Grafana integration
- Alert rules framework
- Service health checks

---

## [v1.0.0] - 2025-08-01

### Added
- Initial release
- Core trading platform
- Executor service
- Market data integration
- Basic monitoring
