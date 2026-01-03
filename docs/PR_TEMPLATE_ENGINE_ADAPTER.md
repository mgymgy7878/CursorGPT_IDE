# Engine Adapter + Hardening + Full Pipeline Smoke

**Dev:** web-next port 3003  
**Evidence:** Çıktılar `evidence/` klasörüne yazılır

## Summary

This PR introduces an engine adapter layer that allows switching between stub and real engines without breaking UI/API contracts. It includes comprehensive hardening (timeout, validation, determinism, metrics docs) and full pipeline smoke testing with mode matrix evidence.

## Key Changes

### Engine Adapter Architecture
- **Interface**: `EngineAdapter` with `runBacktest()` and `runOptimize()` methods
- **Stub Implementation**: Deterministic seed-based results for dev/demo
- **Real Implementation v0**: SMA crossover strategy on klines data
- **Feature Gate**: `SPARK_ENGINE_MODE=stub|real` (default: stub)

### Hardening Checklist (7/7)
1. ✅ **Timeout & Fail-Fast**: Max runtime 1500ms (prod) / 3000ms (dev), job error on timeout
2. ✅ **Klines Validation**: Array length >= 100, monotonic timestamps, parseable prices
3. ✅ **Determinism**: Seed-based results (same input → same output for canary evidence)
4. ✅ **Metrics Documentation**: `engineMetrics.ts` with Sharpe, MaxDD, TotalReturn definitions
5. ✅ **Optimize Sweep**: Real param sweep (fast 5..20, slow 21..80), top 5 results
6. ✅ **Prod Enable Gate**: Two-key system (`SPARK_ENGINE_MODE=real` + `SPARK_ENGINE_REAL_ENABLE=1`)
7. ✅ **Mode Matrix**: `smoke_matrix.json` with engineMode → step → status mapping

### Production Safety
- **Hard Disable**: All stub/paper APIs return 404 in production
- **Real Engine Gate**: Requires both `SPARK_ENGINE_MODE=real` AND `SPARK_ENGINE_REAL_ENABLE=1` in production
- **Controlled Errors**: RequestId logging, timeout handling, validation errors

## Evidence Package

### Required Files
- `evidence/smoke_summary.txt` - Full pipeline summary with PASS/FAIL status
- `evidence/smoke_matrix.json` - Mode matrix (engineMode + steps + status)
- `evidence/health_testnet.json` - Health endpoint response
- `evidence/backtest_status.json` - Backtest job status + result
- `evidence/optimize_status.json` - Optimize job status + result
- `evidence/paper_state.json` - Paper ledger state after order

### Validation
Run merge readiness check (dev server must be running on port 3003):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/merge-readiness.ps1 -Mode both
```

**Note:** Merge readiness script expects dev server on port 3003. Evidence files are written to `evidence/` directory.

## Testing

### Stub Mode
```powershell
$env:SPARK_MODE="paper"
$env:NEXT_PUBLIC_SPARK_MODE="paper"
$env:SPARK_ENGINE_MODE="stub"
pnpm --filter web-next dev
powershell -ExecutionPolicy Bypass -File scripts/smoke-mode.ps1
```

### Real Mode
```powershell
$env:SPARK_MODE="paper"
$env:NEXT_PUBLIC_SPARK_MODE="paper"
$env:SPARK_ENGINE_MODE="real"
pnpm --filter web-next dev
powershell -ExecutionPolicy Bypass -File scripts/smoke-mode.ps1
```

## Breaking Changes
None. UI and API contracts remain unchanged.

## Next Steps

### Platform Engineering
- Job persistence (DB/queue)
- Concurrency limits
- Metrics/Prometheus observability
- SLO definitions

### Trading Accuracy
- Real strategy DSL
- Advanced backtest engine
- Optimizer algorithms

## Files Changed
- `apps/web-next/src/lib/engines/engineAdapter.ts` (new)
- `apps/web-next/src/lib/engines/stubEngineAdapter.ts` (new)
- `apps/web-next/src/lib/engines/realEngineAdapter.ts` (new)
- `apps/web-next/src/lib/engines/engineMetrics.ts` (new)
- `apps/web-next/src/lib/jobs/jobStore.ts` (engine adapter integration)
- `apps/web-next/src/app/api/backtest/run/route.ts` (timeout, validation, prod gate)
- `apps/web-next/src/app/api/optimize/run/route.ts` (prod gate)
- `scripts/smoke-mode.ps1` (mode matrix)
- `scripts/merge-readiness.ps1` (new)

