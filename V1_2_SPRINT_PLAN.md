# 🚀 V1.2 SPRINT PLAN (2 Weeks)

**Status:** 🟢 **ACTIVE**  
**Start Date:** 2025-10-08  
**End Date:** 2025-10-22  
**Sprint Goal:** Real Backtest Engine + Market Data + Risk Management

---

## 📊 SPRINT OVERVIEW

### **Completed (v1.1)**
- ✅ Executor-Lite microservice
- ✅ Web-Next proxy
- ✅ Prometheus metrics
- ✅ Audit logging
- ✅ Rate limiting

### **Sprint Goals (v1.2)**
1. **BTCTurk Spot Reader** - Live market data feed
2. **Real Backtest Engine** - Replace mock with actual simulation
3. **Guardrails v1** - Param approval + risk gates
4. **UI Integration** - Backtest reports + Guardrails panel

---

## 🔄 ITERATION BREAKDOWN

### **Iteration 1: Backtest Engine Foundation** (Days 1-3)

**Goal:** Replace mock queue with real backtest simulation.

**Packages:**
- `packages/backtest-engine/`
  - `src/types.ts` - Core types (Candle, Order, Fill, Trade, Strategy)
  - `src/loader.ts` - Historical data loader (mock CSV first)
  - `src/sim.ts` - Order matching engine
  - `src/strategies/smaCross.ts` - Example strategy
  - `src/engine.ts` - Main orchestrator
  - `src/metrics.ts` - Prometheus metrics

**Integration:**
- `services/executor-lite/src/jobs/backtest.ts` - Job handler
- Update `/api/backtest/start` to use real engine

**Acceptance:**
- ✅ SMA-Cross strategy produces deterministic results
- ✅ Evidence JSON created: `evidence/backtest/<id>.json`
- ✅ Metrics: `bt_runs_total`, `bt_latency_ms`
- ✅ P95 latency < 2s (100k candles)

**Smoke Test:**
```bash
curl -X POST http://127.0.0.1:4010/api/backtest/start \
  -H "x-admin-token: test-secret-123" \
  -H "content-type: application/json" \
  -d '{"pair":"ETHUSDT","timeframe":"1h","strategy":"smaCross","params":{"fast":9,"slow":21}}'
```

---

### **Iteration 2: BTCTurk Spot Reader** (Days 4-7)

**Goal:** Live market data feed with reconnection and drift compensation.

**Packages:**
- `packages/marketdata-btcturk/`
  - `src/wsClient.ts` - WebSocket with exponential backoff
  - `src/restClient.ts` - REST API for OHLCV
  - `src/normalizer.ts` - Canonical types (MarketTick, Candle)
  - `src/metrics.ts` - Feed metrics
  - `src/index.ts` - Public API

**Integration:**
- `services/executor-lite/src/feeds/btcturk.ts` - Feed manager
- New endpoints: `/api/feeds/health`, `/api/feeds/symbols`

**Acceptance:**
- ✅ 30min continuous WS stream
- ✅ `ws_lag_ms` P95 < 250ms
- ✅ Auto-reconnect test PASS
- ✅ Metrics: `btcturk_ws_up`, `ticks_total`, `reconnects_total`

**Smoke Test:**
```bash
curl http://127.0.0.1:4010/api/feeds/health
curl http://127.0.0.1:4010/metrics | findstr btcturk
```

---

### **Iteration 3: Guardrails v1** (Days 8-11)

**Goal:** Param approval workflow + risk gates.

**Components:**
- `services/executor-lite/src/guardrails/`
  - `configStore.ts` - Config versioning (current vs pending)
  - `paramDiff.ts` - Diff generator
  - `approve.ts` - Approval handler
  - `riskGate.ts` - Risk limit checks
  - `metrics.ts` - `risk_gate_open` gauge

**Endpoints:**
- `POST /api/guardrails/params/propose`
- `POST /api/guardrails/params/approve` (RBAC: admin)
- `GET /api/guardrails/status`

**Acceptance:**
- ✅ Param proposal → pending state
- ✅ Approve → current config updated
- ✅ Risk gate blocks when limits exceeded
- ✅ Metrics: `risk_gate_open`, `param_proposals_total`

**Smoke Test:**
```bash
curl -H "x-admin-token: test-secret-123" \
  http://127.0.0.1:4010/metrics | findstr risk_gate_open
```

---

### **Iteration 4: UI Integration** (Days 12-14)

**Goal:** User-facing backtest reports and guardrails panel.

**Components:**
- `apps/web-next/app/backtest/[id]/page.tsx` - Backtest report viewer
- `apps/web-next/app/guardrails/page.tsx` - Param diff + approve UI
- Server-side API routes for data fetching

**Acceptance:**
- ✅ Backtest results displayed with charts
- ✅ Guardrails page shows pending diffs
- ✅ Approve button works (admin only)
- ✅ All API calls server-side (no token exposure)

---

## 📈 METRICS TO TRACK

### **Backtest Engine**
- `bt_runs_total` - Total backtest runs
- `bt_fail_total` - Failed runs
- `bt_latency_ms` - P95 execution time
- `bt_trades_total` - Total trades executed

### **Market Data**
- `btcturk_ws_up` - WebSocket connection status
- `btcturk_ticks_total` - Total ticks received
- `btcturk_reconnects_total` - Reconnection count
- `btcturk_ws_lag_ms` - Timestamp drift

### **Guardrails**
- `risk_gate_open` - Gate status (0=closed, 1=open)
- `param_proposals_total` - Total proposals
- `param_approvals_total` - Approved changes

---

## 🚨 NEW ALERT RULES

### **Backtest Failures**
```yaml
- alert: BacktestHighFailureRate
  expr: increase(bt_fail_total[5m]) > 0 and increase(bt_runs_total[5m]) == 0
  for: 5m
  severity: critical
```

### **High Latency**
```yaml
- alert: BacktestHighLatency
  expr: histogram_quantile(0.95, rate(bt_latency_ms_bucket[10m])) > 5000
  for: 10m
  severity: warning
```

### **Feed Down**
```yaml
- alert: BTCTurkFeedDown
  expr: btcturk_ws_up == 0
  for: 1m
  severity: critical
```

---

## 🔒 SECURITY CONSIDERATIONS

1. **Token Handling**
   - Nginx injects `x-admin-token`
   - UI never has token access
   - All admin ops server-side

2. **Port Binding**
   - 3003/4010 → 127.0.0.1 only
   - External → Nginx (443/80)

3. **Audit Logging**
   - All param changes logged
   - Risk gate triggers logged
   - Backtest starts/completions logged

---

## 📋 ACCEPTANCE CRITERIA (Sprint Exit)

### **BTCTurk Feed**
- [ ] 1+ hour stable stream
- [ ] Auto-reconnect verified
- [ ] `ws_lag_ms` P95 < 250ms
- [ ] Metrics available in Prometheus

### **Backtest Engine**
- [ ] Real data execution working
- [ ] Evidence JSON generated
- [ ] P95 latency < 2s
- [ ] 2+ strategies implemented (SMA, RSI)

### **Guardrails**
- [ ] Param-diff approval flow works
- [ ] `risk_gate_open` metric active
- [ ] UI approval button functional

### **Observability**
- [ ] New metrics in Prometheus
- [ ] 3 new alert rules active
- [ ] Grafana dashboard updated

---

## 🎯 CURRENT STATUS

**Active Iteration:** Iteration 0 (Planning)  
**Next:** Iteration 1 (Backtest Engine Foundation)

**Ready to start?** Let's begin with **Iteration 1: Backtest Engine Foundation**!

---

**Sprint Manager:** Cursor (Claude 3.5 Sonnet)  
**Last Updated:** 2025-10-08 22:55 UTC

