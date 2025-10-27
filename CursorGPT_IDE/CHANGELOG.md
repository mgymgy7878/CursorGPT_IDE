# Changelog

## [v1.5.0] - 2025-01-07 - Observability

### Added
- **Prometheus Metrics Integration**
  - Executor metrics endpoint (`/metrics`)
  - Web-next metrics endpoint (`/api/metrics`)
  - Node.js process metrics, heap, GC, event loop monitoring
- **Alert Rules & Monitoring**
  - 5 critical alert rules configured
  - BacktestSlowRunner, StrategyLabErrorRate, RiskGateHighBandBurst
  - MarketDataGapDetected, WebNext5xxRate
- **Grafana Dashboards**
  - Backtest Core dashboard (bt_runtime_ms_p95_5m, bt_runs_10m)
  - Strategy Lab dashboard (request count, error rate, runtime)
  - Executor Health dashboard (request P95, error rate, fusion gate)
- **SSE/WS Smoke Testing**
  - `/api/events` endpoint with 5-second heartbeat
  - 60-second continuous stream validation
- **Nightly Risk Reporting**
  - `/api/fusion/risk.report.daily` automated reporting
  - Fusion gate evidence, risk scores, backtest runs tracking
- **CI Guard Enhancement**
  - Enhanced backtest validation with equityHistory checks
  - SameBarFills double-validation
  - JSON guard with multiple validation layers
- **PM2 Health Checks**
  - Health check URLs for both services
  - 30-second intervals, 3 retries, 5-second timeout
  - Auto-restart with crash counters
- **Observability Runbook**
  - Complete operations guide (`docs/OBSERVABILITY_RUNBOOK.md`)
  - Prometheus reload, Grafana import, alarm management
  - Common triage checklist for 5 scenarios

### Proof-of-Ops: 6/6 ✅
- ✅ Prometheus targets UP + rules loaded
- ✅ Grafana dashboards ready for import
- ✅ BacktestSlowRunner alert configured and tested
- ✅ Strategy Lab API: ok=True, cash=10000, sameBarFills=0
- ✅ SSE Events: Heartbeat events detected
- ✅ Nightly Risk Report: Status=GREEN, Runs=8

### Technical Details
- **Metrics**: Prometheus client integration with default metrics
- **Alerts**: 5 alert rules with severity levels and annotations
- **Dashboards**: 3 dashboard sets ready for Grafana import
- **Health Checks**: PM2 health check configuration
- **Runbook**: Complete observability operations guide

## [v1.4.1] - 2025-01-07 - Hardening

### Added
- Executor health check and metrics
- Web-next Next.js module resolution fix
- Strategy Lab API with mock response
- Prometheus metrics collection
- Fusion Gate risk management
- CI Guard JSON validation

### Fixed
- ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND error
- Next.js module resolution issues
- PM2 configuration for both services
- Port handling with cross-env