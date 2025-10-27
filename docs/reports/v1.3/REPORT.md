# V1.3 Executive SLO Report
- **Overall**: 🟡 YELLOW — ORDERFLOW_PARTIAL_OR_NONE
- **Nonce**: 20250820-273500-963147  
- **Started (UTC)**: 2025-08-20T27:35:00Z

## Thresholds
```json
{
  "place_ack_p95_ms_leq": 1000,
  "event_db_p95_ms_leq": 300,
  "ingest_lag_p95_s_leq": 2,
  "seq_gap_eq": 0,
  "scenB_p95_ms_leq": 2000,
  "scenC_circuit_open_expected": 1,
  "scenD_blocked_expected": 10
}
```

## Components
### Ingest → Persist: 🟢 OK
- ingest_p95_ms: 401
- event_db_p95_ms: 0
- seq_gap: 0
- evidence: docs/evidence/v1.3-bist-local-pipe/20250820-270000-852147

### Guardrails SIM: 🟢 OK
- B_p95_ms: 617
- circuit_open: 1
- blocks: 10
- evidence: docs/evidence/v1.3-guardrails-sim/20250820-271500-963852

### Orderflow REAL: ⚪ PARTIAL
- place_p95_ms: null
- blocked: null
- kill_switch: null
- evidence: docs/evidence/v1.3-orderflow-guardrails-real/20250820-272500-852963

## Environment Gate
- binance_keys_present: 0
- bist_url_present: 0
- missing: BINANCE_API_KEY, BINANCE_API_SECRET; BIST_FEED_URL

## Next
- orderflow-guardrails-real|supply-secrets 