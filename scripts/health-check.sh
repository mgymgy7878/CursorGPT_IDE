#!/bin/bash
# Spark TA Module v1.0.0 - Health Check Script

echo "❤️  Spark TA Module v1.0.0 - Health Check"
echo "=========================================="
echo ""

FAIL_COUNT=0

# Executor
echo -n "Executor (/health): "
if curl -sf http://localhost:4001/health >/dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Web-Next (marketdata proxy)
echo -n "Web-Next (marketdata): "
if curl -sf http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT\&timeframe=1h\&limit=1 >/dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Redis
echo -n "Redis (PING): "
if docker exec spark-redis redis-cli PING >/dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Metrics endpoint
echo -n "Metrics (/metrics): "
if curl -s http://localhost:4001/metrics | grep -q "alerts_active"; then
  echo "✅ OK"
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# SSE stream
echo -n "SSE Stream (headers): "
if curl -sI http://localhost:3000/api/marketdata/stream 2>&1 | grep -q "X-Streams"; then
  echo "✅ OK"
else
  echo "❌ FAIL"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Leader election
echo -n "Leader Election: "
LEADER_COUNT=$(docker logs executor-1 2>&1 | grep -c "became leader" || echo 0)
if [ "$LEADER_COUNT" -gt 0 ]; then
  echo "✅ OK (leader elected)"
else
  echo "⚠️  PENDING (no leader yet)"
fi

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ All health checks passed!"
  exit 0
else
  echo "❌ $FAIL_COUNT health check(s) failed"
  exit 1
fi

