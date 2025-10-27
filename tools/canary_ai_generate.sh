#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://127.0.0.1:3003}"
AUTH="${AUTH:-dev-xyz}"
BODY='{"pair":"BTCUSDT","tf":"15m","style":"trend","provider":"mock"}'
echo "[*] AI generate canary (7x)…"
for i in {1..7}; do
  curl -fsS -X POST "$BASE/api/ai/strategies/generate" \
    -H "Authorization: Bearer $AUTH" -H "Content-Type: application/json" \
    -d "$BODY" | jq -r '.ok' || true
  sleep 0.3
done

echo "[*] scrape metrics snapshot"
curl -fsS "$BASE/api/public/metrics/prom" | grep -E "ai_generate_total|ai_latency_ms|ai_tokens_total" | head -n 20
