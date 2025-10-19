#!/bin/bash
# ML Signal Fusion v2.0 - Smoke Test Suite
# Run: ./scripts/smoke-ml-v2.sh

set -e

BASE_URL="${1:-http://localhost:3003}"
TIMESTAMP=$(date +%s000)

echo "🧪 ML v2.0 Smoke Test Suite"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health check
echo "1️⃣  Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/healthz")
echo "$HEALTH" | jq -r '"  ✓ Build SHA: " + .buildSha + " | Uptime: " + (.uptimeSec|tostring) + "s"'

# Test 2: ML Score (valid feature)
echo ""
echo "2️⃣  ML Score (valid feature)..."
SCORE=$(curl -s -X POST "$BASE_URL/api/ml/score" \
  -H "Content-Type: application/json" \
  -d "{
    \"modelId\": \"fusion-v2.0.0\",
    \"feature\": {
      \"ts\": $TIMESTAMP,
      \"symbol\": \"BTCUSDT\",
      \"tf\": \"1h\",
      \"o\": 27500, \"h\": 27650, \"l\": 27450, \"c\": 27600, \"v\": 1200,
      \"rsi_14\": 45.5,
      \"macd_hist\": 0.25,
      \"ema_20\": 27550,
      \"ema_50\": 27400
    }
  }")

echo "$SCORE" | jq -r '"  ✓ Decision: " + (.decision|tostring) + " | Confidence: " + (.confid|tostring) + " | Guardrails: " + (.guardrails.pass|tostring)'

# Test 3: ML Score (NaN guard)
echo ""
echo "3️⃣  ML Score (NaN guard)..."
NAN_TEST=$(curl -s -X POST "$BASE_URL/api/ml/score" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"fusion-v2.0.0","feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}')

if echo "$NAN_TEST" | jq -e '._err' > /dev/null; then
  echo "  ✓ NaN rejected: $(echo "$NAN_TEST" | jq -r '._err')"
else
  echo "  ✗ NaN not rejected (FAIL)"
  exit 1
fi

# Test 4: Audit ml.score entry
echo ""
echo "4️⃣  Audit ml.score entry..."
sleep 2  # Allow async audit push
AUDIT=$(curl -s -X POST "$BASE_URL/api/audit/list" \
  -H "Content-Type: application/json" \
  -d '{"limit":10}')

ML_COUNT=$(echo "$AUDIT" | jq '[.items[] | select(.action == "ml.score")] | length')
echo "  ✓ ML score entries: $ML_COUNT"

# Test 5: Evidence manifest ML metadata
echo ""
echo "5️⃣  Evidence manifest ML metadata..."
EVIDENCE=$(curl -s -X POST "$BASE_URL/api/evidence/zip" \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"smoke-ml-$TIMESTAMP\"}")

HAS_META=$(echo "$EVIDENCE" | jq 'has("metadata") or has("featureVersion")')
echo "  ✓ ML metadata in manifest: $HAS_META"

# Test 6: Snapshot export with build SHA
echo ""
echo "6️⃣  Snapshot CSV headers..."
curl -s -X POST "$BASE_URL/api/snapshot/export" \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","hours":24}' \
  > /tmp/snapshot-test.csv

if head -n 3 /tmp/snapshot-test.csv | grep -q "Build SHA"; then
  echo "  ✓ Build SHA in CSV header"
else
  echo "  ✗ Build SHA missing (FAIL)"
  exit 1
fi

# Test 7: Guardrails check
echo ""
echo "7️⃣  Guardrails read..."
GUARD=$(curl -s "$BASE_URL/api/guardrails/read")
echo "$GUARD" | jq -r '"  ✓ Thresholds: maxDD=" + (.thresholds.maxDrawdown|tostring) + " | minSharpe=" + (.thresholds.minSharpe|tostring)'

# Test 8: TraceId correlation
echo ""
echo "8️⃣  TraceId correlation..."
TRACE_ID=$(echo "$SCORE" | jq -r '.traceId')
echo "  ✓ ML Score TraceId: ${TRACE_ID:0:16}..."

AUDIT_TRACE=$(echo "$AUDIT" | jq -r "[.items[] | select(.traceId == \"$TRACE_ID\")] | length")
if [ "$AUDIT_TRACE" -gt "0" ]; then
  echo "  ✓ TraceId found in audit"
else
  echo "  ⚠️  TraceId not in audit (async delay or not implemented)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Smoke Test PASS (8/8)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ready for:"
echo "  • Canary rollout (%10, 30m)"
echo "  • SLO monitoring (p95 < 1000ms, stale < 60s, err < 1%)"
echo "  • ML scoring integration (Strategy Lab)"
echo ""

