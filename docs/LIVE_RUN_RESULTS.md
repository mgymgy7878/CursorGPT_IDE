# SPARK — CANARY LIVE RUN RESULTS

## Test Execution History

### 2024-12-19 15:30 (Europe/Istanbul) - Initial Canary Setup

**Environment Configuration:**
- `TRADE_WHITELIST`: BTCUSDT
- `LIVE_MAX_NOTIONAL`: 20 USDT
- `TRADE_WINDOW`: 07:00-23:30 (Europe/Istanbul)
- `TRADING_KILL_SWITCH`: 0 (disabled)
- `LIVE_TRADING`: 2 (CONFIRM mode)
- `SHADOW_MODE`: 0 (live execution)

**Test Results:**
- Status: PENDING (requires real API keys)
- ARM Test: Not executed
- CONFIRM Test: Not executed
- Rollback Test: Not executed

**Infrastructure Status:**
- Health Endpoint: `/api/public/live/health`
- Expected Response: `{"exchange":"up","ws":"up","drift":0,"killSwitch":0,"circuit":"closed"}`
- Snapshot Endpoint: `/api/public/live/snapshot`
- Expected Response: `{"now":"...","exchange":"up","ws":"up","drift":0,"envReady":{...},"limits":{...},"openOrders":0,"tradesLastMin":0,"positions":[],"metrics":{...}}`
- Metrics Endpoint: `/api/public/live/metrics`
- Expected Metrics: `spark_live_orders_total`, `spark_live_trades_total`, `spark_live_blocked_total`

**Smoke Test Scripts:**
- PowerShell: `scripts/live-smoke.ps1`
- CMD: `scripts/live-smoke.cmd`

**Execution Commands:**
```powershell
# PowerShell
.\scripts\live-smoke.ps1 "YOUR_API_KEY" "YOUR_API_SECRET" "YOUR_EXECUTOR_TOKEN"

# CMD
scripts\live-smoke.cmd "YOUR_API_KEY" "YOUR_API_SECRET" "YOUR_EXECUTOR_TOKEN"
```

**Manual Test Steps:**
1. Set environment variables
2. Start services: `pnpm --filter executor dev` and `pnpm --filter web-next dev`
3. Health check: `Invoke-RestMethod http://127.0.0.1:4001/api/public/live/health`
4. Snapshot check: `Invoke-RestMethod http://127.0.0.1:4001/api/public/live/snapshot`
5. ARM test: `LIVE_TRADING=1, SHADOW_MODE=1` → expect 403
6. CONFIRM test: `LIVE_TRADING=2, SHADOW_MODE=0` → expect 200 with orderId
7. Verification: Check health, metrics, and DB updates
8. Rollback test: `TRADING_KILL_SWITCH=1` → expect 503

**Success Criteria:**
- ARM test returns 403 with `arm_only` code
- CONFIRM test returns 200 with valid orderId/clientId
- WebSocket executionReport received within 5 seconds
- Database tables (Orders/Trades/Positions) updated
- Metrics show `spark_live_orders_total{status="FILLED"}` increment
- Health endpoint shows `drift=0` and `ws="up"`
- Snapshot shows `tradesLastMin >= 1` and `openOrders` count
- Environment readiness: `envReady.hasKeys=true`, `envReady.whitelistOk=true`, `envReady.windowNow=true`
- Rollback test returns 503 when kill switch active

**Log Files:**
- Results: `logs/live-smoke-[timestamp].json`
- Metrics: `logs/metrics-[timestamp].txt`

**Next Steps:**
1. Execute with real API keys
2. Monitor execution and collect metrics
3. Verify reconciliation (drift=0)
4. Test rollback mechanisms
5. Document results and any issues
6. Plan second canary with ETHUSDT

---

## Test Results Template

### [DATE] [TIME] - [TEST_NAME]

**Configuration:**
- API Keys: [MASKED]
- Environment: [DEV/STAGING/PROD]
- Test Type: [ARM/CONFIRM/ROLLBACK]

**Results:**
- Status: [SUCCESS/WARN/FAIL]
- Order ID: [if applicable]
- Client ID: [if applicable]
- Execution Time: [seconds]
- Drift: [value]

**Environment Readiness:**
- API Keys: [✓/✗]
- Token: [✓/✗]
- Whitelist: [✓/✗]
- Trade Window: [✓/✗]

**Metrics Snapshot:**
```
spark_live_orders_total{status="FILLED"}: [value]
spark_live_trades_total: [value]
spark_live_blocked_total{reason="arm_only"}: [value]
```

**Issues/Warnings:**
- [List any issues encountered]

**Next Actions:**
- [List planned next steps] 