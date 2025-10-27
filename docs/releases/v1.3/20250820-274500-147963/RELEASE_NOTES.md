# V1.3 Release Notes (Green-on-Keys)
- **Gate**: 🔒 BLOCKED  • **Nonce**: 20250820-274500-147963  • **UTC**: 2025-08-20T27:45:00Z

## SLO Snapshot
- Ingest→Persist: 🟢 P95=401 ms, Event→DB=0 ms, seq_gap=0
- Guardrails SIM: 🟢 B_P95=617 ms, circuit_open=1, blocks=10
- Orderflow REAL: 🟡 PARTIAL
- BIST: SKIPPED

## What unlocks GREEN
- Provide **BINANCE_API_KEY** and **BINANCE_API_SECRET** (testnet), optional **BIST_FEED_URL**.
- Then run: `bash scripts/run_orderflow_real.sh` 