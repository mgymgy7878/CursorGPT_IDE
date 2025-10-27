# v1.6 Exit Gates (Go/No-Go)

## 1. WS Event→DB P95 < 300ms, drop rate < 0.1% (24h)
**Metric**: `histogram_quantile(0.95, sum by (le) (rate(ingest_latency_ms_bucket[24h]))) < 300`
**Drop Rate**: `sum(rate(ws_msgs_total[24h])) - sum(rate(ingest_latency_ms_count[24h])) < 0.001`
**Status**: ✅ PASS / ❌ FAIL

## 2. StreamsLagHigh ve SeqGapBurst 48h boyunca FIRING=0
**StreamsLagHigh**: `histogram_quantile(0.95, sum by (le,exchange) (rate(ws_gap_ms_bucket[5m]))) > 1500`
**SeqGapBurst**: `rate(ws_seq_gap_total[5m]) > 0`
**Status**: ✅ PASS / ❌ FAIL

## 3. Optim runtime P95 < 45s, error rate < 1% (>=50 run)
**Runtime**: `histogram_quantile(0.95, sum by (le) (rate(opt_runtime_ms_bucket[24h]))) < 45000`
**Error Rate**: `sum(rate(opt_runs_total{status="error"}[24h])) / sum(rate(opt_runs_total[24h])) < 0.01`
**Runs**: `sum(opt_runs_total[24h]) >= 50`
**Status**: ✅ PASS / ❌ FAIL

## 4. PaperDriftHigh yok; haftalık drift ≤ 5%
**PaperDriftHigh**: `paper_pnl_drift > 0.05`
**Weekly Drift**: `max_over_time(paper_pnl_drift[7d]) <= 0.05`
**Status**: ✅ PASS / ❌ FAIL

## 5. Dashboards (Streams/Optimization/Paper) import edildi, paneller veri gösteriyor
**Streams Dashboard**: ID 2001 - ws_conn_state, ws_msgs_total, ws_gap_ms
**Optimization Dashboard**: ID 2002 - opt_runs_total, opt_runtime_ms, opt_best_sharpe
**Paper Trading Dashboard**: ID 2003 - paper_pnl, paper_pnl_drift, paper_fill_latency_ms
**Status**: ✅ PASS / ❌ FAIL

## 6. Audit: promote istekleri onay kapısından geçti (en az 1 akış)
**Model Promote**: `/model/promote` endpoint with approval workflow
**Audit Trail**: At least 1 successful promotion with audit log
**Status**: ✅ PASS / ❌ FAIL

## Go/No-Go Decision Matrix

| Gate | Status | Evidence | Action |
|------|--------|----------|--------|
| 1 | ✅/❌ | P95 latency + drop rate | Fix if > 300ms or > 0.1% |
| 2 | ✅/❌ | Alert firing status | Fix lag/gap issues |
| 3 | ✅/❌ | Runtime + error rate + runs | Scale if needed |
| 4 | ✅/❌ | Drift metrics | Tune paper trading |
| 5 | ✅/❌ | Dashboard data | Import/configure dashboards |
| 6 | ✅/❌ | Audit logs | Implement approval workflow |

## All Gates Must Pass for v1.6 Release
- **6/6 PASS**: ✅ v1.6 READY FOR RELEASE
- **< 6 PASS**: ❌ v1.6 NOT READY - Address failing gates
