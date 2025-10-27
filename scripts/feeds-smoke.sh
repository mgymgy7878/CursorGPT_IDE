#!/bin/bash
# Feeds Smoke Test - Bash
# Linux için eşdeğer (emoji yok)

set -e

BASE="http://127.0.0.1:4005"  # marketdata port (varsayılan)

echo "Feeds Smoke Test Started"

# Test canary endpoint
echo "Testing canary endpoint..."
CANARY_RESPONSE=$(curl -s "$BASE/feeds/canary?dry=true")
if ! echo "$CANARY_RESPONSE" | grep -q '"ok":true'; then
    echo "Canary test FAIL: $CANARY_RESPONSE"
    exit 1
fi
echo "Canary test PASS"

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE/feeds/health")
if ! echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "Health test FAIL: $HEALTH_RESPONSE"
    exit 1
fi

# Check for lastEventTs and lastDbWriteTs fields
if ! echo "$HEALTH_RESPONSE" | grep -q '"lastEventTs"'; then
    echo "Health test FAIL: missing lastEventTs fields"
    exit 1
fi

if ! echo "$HEALTH_RESPONSE" | grep -q '"lastDbWriteTs"'; then
    echo "Health test FAIL: missing lastDbWriteTs fields"
    exit 1
fi

echo "Health test PASS"

# Test metrics endpoint
echo "Testing metrics endpoint..."
METRICS_RESPONSE=$(curl -s "$BASE/metrics")
if ! echo "$METRICS_RESPONSE" | grep -q "feed_events_total" || 
   ! echo "$METRICS_RESPONSE" | grep -q "ws_reconnects_total" || 
   ! echo "$METRICS_RESPONSE" | grep -q "feed_latency_ms" ||
   ! echo "$METRICS_RESPONSE" | grep -q "event_to_db_ms"; then
    echo "Metrics test FAIL: Feed metrics missing"
    exit 1
fi
echo "Metrics test PASS"

echo "Feeds Smoke Test PASS"
echo "All tests completed successfully"
