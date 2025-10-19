#!/bin/bash
# Spark TA Module v1.0.0 - Production Smoke Test
# Kritik fonksiyonları test eder, hata durumunda exit 1 döner

set -e  # Exit on error

EXECUTOR_URL="${EXECUTOR_URL:-http://localhost:4001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
VERBOSE="${VERBOSE:-0}"

echo "🔍 Spark TA Module v1.0.0 - Production Smoke Test"
echo "================================================="
echo "Executor: $EXECUTOR_URL"
echo "Web:      $WEB_URL"
echo ""

# Helper function
check() {
  if [ $VERBOSE -eq 1 ]; then
    echo "   Testing: $1"
  fi
}

# 1. Health Checks
echo "1️⃣  Health Checks..."
check "Executor health"
curl -sf "$EXECUTOR_URL/health" > /dev/null || { echo "❌ Executor health failed"; exit 1; }

check "Marketdata candles"
curl -sf "$WEB_URL/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=10" > /dev/null || { echo "❌ Marketdata candles failed"; exit 1; }
echo "✅ Health OK"

# 2. SSE Stream Metrics
echo "2️⃣  SSE Stream Metrics..."
check "Stream headers"
HEADERS=$(curl -sI "$WEB_URL/api/marketdata/stream?symbol=BTCUSDT&timeframe=1m" 2>&1)
echo "$HEADERS" | grep -q "X-Streams" || { echo "❌ SSE metrics headers missing"; exit 1; }
echo "✅ SSE Metrics OK"

# 3. Copilot Tools
echo "3️⃣  Copilot Tools..."
check "Fibonacci levels"
curl -sf -X POST "$EXECUTOR_URL/tools/fibonacci_levels" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","timeframe":"1d","period":200}' > /dev/null || { echo "❌ Fibonacci tool failed"; exit 1; }

check "Bollinger bands"
curl -sf -X POST "$EXECUTOR_URL/tools/bollinger_bands" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"ETHUSDT","timeframe":"1h","period":20,"stdDev":2}' > /dev/null || { echo "❌ Bollinger tool failed"; exit 1; }
echo "✅ Copilot Tools OK"

# 4. Alert Lifecycle
echo "4️⃣  Alert Lifecycle (CRUD)..."
check "Create alert"
ALERT_RESPONSE=$(curl -sf -X POST "$EXECUTOR_URL/alerts/create" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"SMOKETEST","timeframe":"1h","type":"bb_break","params":{"side":"both","period":20,"stdDev":2}}')

ALERT_ID=$(echo "$ALERT_RESPONSE" | jq -r '.id')
[ -z "$ALERT_ID" ] || [ "$ALERT_ID" = "null" ] && { echo "❌ Alert creation failed"; exit 1; }
echo "   Created: $ALERT_ID"

check "List alerts"
sleep 1
LIST_COUNT=$(curl -sf "$EXECUTOR_URL/alerts/list" | jq '.items | length')
[ "$LIST_COUNT" -gt 0 ] || { echo "❌ Alert not in list"; exit 1; }
echo "   Listed: $LIST_COUNT alerts"

check "Get single alert"
curl -sf "$EXECUTOR_URL/alerts/get?id=$ALERT_ID" > /dev/null || { echo "❌ Get alert failed"; exit 1; }

check "Disable alert"
curl -sf -X POST "$EXECUTOR_URL/alerts/disable" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$ALERT_ID\"}" > /dev/null || { echo "❌ Disable failed"; exit 1; }

check "Delete alert"
curl -sf -X POST "$EXECUTOR_URL/alerts/delete" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$ALERT_ID\"}" > /dev/null || { echo "❌ Delete failed"; exit 1; }
echo "✅ Alert CRUD OK"

# 5. Prometheus Metrics
echo "5️⃣  Prometheus Metrics..."
check "Alerts metrics"
curl -s "$EXECUTOR_URL/metrics" | grep -q "alerts_created_total" || { echo "❌ Alerts metrics missing"; exit 1; }
curl -s "$EXECUTOR_URL/metrics" | grep -q "alerts_active" || { echo "❌ Active alerts metric missing"; exit 1; }

check "Leader metrics"
curl -s "$EXECUTOR_URL/metrics" | grep -q "leader_elected_total" || { echo "❌ Leader metrics missing"; exit 1; }

check "Notification metrics"
curl -s "$EXECUTOR_URL/metrics" | grep -q "notifications_sent_total" || { echo "❌ Notification metrics missing"; exit 1; }

check "Copilot metrics"
curl -s "$EXECUTOR_URL/metrics" | grep -q "copilot_action_total" || { echo "❌ Copilot metrics missing"; exit 1; }
echo "✅ Prometheus Metrics OK"

# 6. Notification Test (optional - won't fail if not configured)
echo "6️⃣  Notification Test (optional)..."
NOTIFY_RESPONSE=$(curl -sf -X POST "$EXECUTOR_URL/notify/test" 2>&1 || echo '{"ok":false}')
NOTIFY_OK=$(echo "$NOTIFY_RESPONSE" | jq -r '.ok')
if [ "$NOTIFY_OK" = "true" ]; then
  echo "✅ Notifications OK (delivered)"
else
  echo "⚠️  Notifications not configured (skip)"
fi

# 7. Web UI Pages (basic HTML check)
echo "7️⃣  Web UI Pages..."
check "Technical Analysis page"
curl -sf "$WEB_URL/technical-analysis" | grep -q "Teknik Analiz" || { echo "❌ TA page failed"; exit 1; }

check "Alerts page"
curl -sf "$WEB_URL/alerts" | grep -q "Alerts" || { echo "❌ Alerts page failed"; exit 1; }
echo "✅ UI Pages OK"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 ALL SMOKE TESTS PASSED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ System is production-ready"
echo ""
echo "Next steps:"
echo "  1. Import Grafana dashboard: monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json"
echo "  2. Monitor metrics for 60 minutes"
echo "  3. Verify leader election (only 1 instance should be leader)"
echo "  4. Test live streaming: $WEB_URL/technical-analysis"
echo ""

