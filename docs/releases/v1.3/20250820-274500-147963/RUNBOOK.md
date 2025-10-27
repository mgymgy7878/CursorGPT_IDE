# V1.3 Runbook — Orderflow Guardrails (REAL, Testnet)

## Prereqs
- Set BINANCE_API_KEY, BINANCE_API_SECRET in .env.local
- Optional: BIST_FEED_URL

## Run
```bash
bash scripts/run_orderflow_real.sh
```

## Expected
- place_ack_p95_ms <= 1000ms (WARN <= 1500ms)
- guardrails: blocked_count >= 1, kill_switch = 1
- Evidence: docs/evidence/v1.3-orderflow-guardrails-real/<NONCE>/ 