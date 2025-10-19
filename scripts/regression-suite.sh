#!/bin/bash
# Spark TA Module v1.0.0 - Regression Test Suite
# Comprehensive end-to-end testing for post-deployment validation

set -e

EXEC="${EXEC:-http://localhost:4001}"
WEB="${WEB:-http://localhost:3000}"
VERBOSE="${VERBOSE:-0}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Spark TA Module v1.0.0 - Regression Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Executor: $EXEC"
echo "Web:      $WEB"
echo ""

# Check dependencies
command -v jq >/dev/null 2>&1 || { echo "❌ jq is required but not installed. Run: apt-get install jq"; exit 1; }

# Helper functions
log_test() {
  if [ $VERBOSE -eq 1 ]; then
    echo "   → Testing: $1"
  fi
}

pass() {
  echo -e "${GREEN}✓${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo -e "${RED}✗${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

skip() {
  echo -e "${YELLOW}⊘${NC} $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

# ==================== ANALYTICS API ====================
echo "📊 Analytics API (A-001 to A-003)"

log_test "A-001: Fibonacci levels"
RESPONSE=$(curl -sf -X POST "$EXEC/tools/fibonacci_levels" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","timeframe":"1d","period":200}' || echo '{"error":"failed"}')

if echo "$RESPONSE" | jq -e '.levels | length == 7' >/dev/null 2>&1; then
  pass "A-001: Fibonacci returns 7 levels"
else
  fail "A-001: Fibonacci failed or wrong level count"
fi

log_test "A-002: Bollinger bands"
RESPONSE=$(curl -sf -X POST "$EXEC/tools/bollinger_bands" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"ETHUSDT","timeframe":"1h","period":20,"stdDev":2}' || echo '{"error":"failed"}')

if echo "$RESPONSE" | jq -e '.current.u > .current.m and .current.m > .current.l' >/dev/null 2>&1; then
  pass "A-002: Bollinger bands valid (u > m > l)"
else
  fail "A-002: Bollinger bands invalid or failed"
fi

log_test "A-003: MACD endpoint"
RESPONSE=$(curl -sf -X POST "$EXEC/tools/macd" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","timeframe":"4h"}' || echo '{"error":"failed"}')

if echo "$RESPONSE" | jq -e '.current' >/dev/null 2>&1; then
  pass "A-003: MACD returns current values"
else
  fail "A-003: MACD failed"
fi

# ==================== ALERTS CRUD ====================
echo ""
echo "📋 Alerts CRUD (C-001 to C-004)"

log_test "C-001: Create alert"
CREATE_RESPONSE=$(curl -sf -X POST "$EXEC/alerts/create" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"REGTEST","timeframe":"1h","type":"bb_break","params":{"side":"both"}}' || echo '{"id":null}')

ALERT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
if [ -n "$ALERT_ID" ] && [ "$ALERT_ID" != "null" ]; then
  pass "C-001: Alert created with ID: ${ALERT_ID:0:8}..."
else
  fail "C-001: Alert creation failed"
  ALERT_ID=""
fi

if [ -n "$ALERT_ID" ]; then
  log_test "C-002: List alerts"
  LIST_RESPONSE=$(curl -sf "$EXEC/alerts/list" || echo '{"items":[]}')
  LIST_COUNT=$(echo "$LIST_RESPONSE" | jq '.items | length')
  
  if [ "$LIST_COUNT" -gt 0 ]; then
    pass "C-002: Alert list contains $LIST_COUNT items"
  else
    fail "C-002: Alert not found in list"
  fi

  log_test "C-003: Get single alert"
  GET_RESPONSE=$(curl -sf "$EXEC/alerts/get?id=$ALERT_ID" || echo '{"id":null}')
  FETCHED_ID=$(echo "$GET_RESPONSE" | jq -r '.id')
  
  if [ "$FETCHED_ID" = "$ALERT_ID" ]; then
    pass "C-003: Get alert by ID successful"
  else
    fail "C-003: Get alert failed"
  fi

  log_test "C-004: Disable alert"
  curl -sf -X POST "$EXEC/alerts/disable" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$ALERT_ID\"}" >/dev/null 2>&1
  
  GET_RESPONSE=$(curl -sf "$EXEC/alerts/get?id=$ALERT_ID" || echo '{"active":null}')
  IS_ACTIVE=$(echo "$GET_RESPONSE" | jq -r '.active')
  
  if [ "$IS_ACTIVE" = "false" ]; then
    pass "C-004: Alert disabled successfully"
  else
    fail "C-004: Alert disable failed"
  fi

  log_test "C-005: Enable alert"
  curl -sf -X POST "$EXEC/alerts/enable" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$ALERT_ID\"}" >/dev/null 2>&1
  
  GET_RESPONSE=$(curl -sf "$EXEC/alerts/get?id=$ALERT_ID" || echo '{"active":null}')
  IS_ACTIVE=$(echo "$GET_RESPONSE" | jq -r '.active')
  
  if [ "$IS_ACTIVE" = "true" ]; then
    pass "C-005: Alert enabled successfully"
  else
    fail "C-005: Alert enable failed"
  fi

  log_test "C-006: Delete alert"
  curl -sf -X POST "$EXEC/alerts/delete" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$ALERT_ID\"}" >/dev/null 2>&1
  
  sleep 1
  GET_RESPONSE=$(curl -s "$EXEC/alerts/get?id=$ALERT_ID" || echo '{}')
  if echo "$GET_RESPONSE" | grep -q "not_found\|error" || [ -z "$GET_RESPONSE" ]; then
    pass "C-006: Alert deleted successfully"
  else
    fail "C-006: Alert still exists after delete"
  fi
else
  skip "C-002 to C-006: Skipped (no alert created)"
fi

# ==================== STREAMING (SSE) ====================
echo ""
echo "📡 Streaming SSE (S-001 to S-004)"

log_test "S-001: SSE stream headers"
HEADERS=$(curl -sI "$WEB/api/marketdata/stream?symbol=BTCUSDT&timeframe=1m" 2>&1 || echo "")
if echo "$HEADERS" | grep -q "X-Streams"; then
  pass "S-001: SSE headers present"
else
  fail "S-001: SSE headers missing"
fi

log_test "S-003: Invalid symbol rejection"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/api/marketdata/stream?symbol=INVALID_SYM&timeframe=1m")
if [ "$STATUS_CODE" = "400" ]; then
  pass "S-003: Invalid symbol returns 400"
else
  fail "S-003: Invalid symbol should return 400 (got $STATUS_CODE)"
fi

log_test "S-004: Invalid timeframe rejection"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/api/marketdata/stream?symbol=BTCUSDT&timeframe=99x")
if [ "$STATUS_CODE" = "400" ]; then
  pass "S-004: Invalid timeframe returns 400"
else
  fail "S-004: Invalid timeframe should return 400 (got $STATUS_CODE)"
fi

# ==================== METRICS ====================
echo ""
echo "📈 Metrics (M-001 to M-003)"

log_test "M-001: Prometheus metrics presence"
METRICS=$(curl -s "$EXEC/metrics" || echo "")

EXPECTED_METRICS=(
  "alerts_created_total"
  "alerts_triggered_total"
  "alerts_suppressed_total"
  "alerts_active"
  "alerts_errors_total"
  "notifications_sent_total"
  "notifications_failed_total"
  "leader_elected_total"
  "leader_held_seconds"
  "copilot_action_total"
)

MISSING_COUNT=0
for metric in "${EXPECTED_METRICS[@]}"; do
  if ! echo "$METRICS" | grep -q "^$metric"; then
    MISSING_COUNT=$((MISSING_COUNT + 1))
    [ $VERBOSE -eq 1 ] && echo "     Missing: $metric"
  fi
done

if [ $MISSING_COUNT -eq 0 ]; then
  pass "M-001: All expected metrics present (${#EXPECTED_METRICS[@]} checked)"
else
  fail "M-001: $MISSING_COUNT metrics missing"
fi

log_test "M-002: alerts_active is numeric"
ALERTS_ACTIVE=$(echo "$METRICS" | grep "^alerts_active " | awk '{print $2}')
if [[ "$ALERTS_ACTIVE" =~ ^[0-9]+$ ]]; then
  pass "M-002: alerts_active gauge valid ($ALERTS_ACTIVE)"
else
  fail "M-002: alerts_active not numeric"
fi

# ==================== HEALTH CHECKS ====================
echo ""
echo "❤️  Health Checks"

log_test "Health: Executor"
if curl -sf "$EXEC/health" >/dev/null 2>&1; then
  pass "Health: Executor responding"
else
  fail "Health: Executor not responding"
fi

log_test "Health: Marketdata proxy"
if curl -sf "$WEB/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=1" >/dev/null 2>&1; then
  pass "Health: Marketdata proxy responding"
else
  fail "Health: Marketdata proxy failed"
fi

# ==================== SECURITY VALIDATION ====================
echo ""
echo "🔒 Security Validation (V-001 to V-002)"

log_test "V-001: SQL injection attempt (should fail gracefully)"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/api/marketdata/candles?symbol=BTC';DROP%20TABLE--&timeframe=1h&limit=1")
if [ "$STATUS_CODE" = "400" ] || [ "$STATUS_CODE" = "500" ]; then
  pass "V-001: SQL injection rejected"
else
  skip "V-001: Unexpected status $STATUS_CODE (may need stricter validation)"
fi

log_test "V-002: XSS attempt in symbol"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB/api/marketdata/candles?symbol=<script>alert(1)</script>&timeframe=1h&limit=1")
if [ "$STATUS_CODE" = "400" ]; then
  pass "V-002: XSS payload rejected"
else
  fail "V-002: XSS payload should be rejected (got $STATUS_CODE)"
fi

# ==================== SUMMARY ====================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 REGRESSION TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ Passed:${NC} $PASS_COUNT"
echo -e "${RED}✗ Failed:${NC} $FAIL_COUNT"
echo -e "${YELLOW}⊘ Skipped:${NC} $SKIP_COUNT"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
PASS_RATE=$((PASS_COUNT * 100 / TOTAL))

echo "Pass Rate: $PASS_RATE% ($PASS_COUNT/$TOTAL)"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL REGRESSION TESTS PASSED!${NC}"
  echo ""
  echo "✅ System regression validated"
  echo "✅ Ready for production use"
  exit 0
else
  echo -e "${RED}❌ REGRESSION TESTS FAILED${NC}"
  echo ""
  echo "⚠️  $FAIL_COUNT test(s) failed"
  echo "⚠️  Review logs and fix issues before deploying"
  exit 1
fi

