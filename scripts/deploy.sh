#!/bin/bash
# Spark TA Module v1.0.0 - Production Deployment Script

set -e

echo "🚀 Spark TA Module v1.0.0 - Production Deployment"
echo "=================================================="
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ docker-compose is required"; exit 1; }

# Environment check
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ .env created. Please review and update before continuing."
    exit 0
  else
    echo "❌ .env.example not found. Create .env manually."
    exit 1
  fi
fi

echo "1️⃣  Checking environment variables..."
source .env

REQUIRED_VARS=(
  "REDIS_URL"
  "EXECUTOR_URL"
  "SCHEDULER_ENABLED"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required environment variable: $var"
    exit 1
  fi
done
echo "✅ Environment variables OK"

echo ""
echo "2️⃣  Pulling latest images..."
docker compose pull || docker-compose pull
echo "✅ Images pulled"

echo ""
echo "3️⃣  Building services..."
docker compose build || docker-compose build
echo "✅ Build complete"

echo ""
echo "4️⃣  Starting services..."
docker compose up -d || docker-compose up -d
echo "✅ Services started"

echo ""
echo "5️⃣  Waiting for services to be ready (30s)..."
sleep 30

echo ""
echo "6️⃣  Health checks..."

# Executor health
if curl -sf http://localhost:4001/health >/dev/null 2>&1; then
  echo "✅ Executor: healthy"
else
  echo "❌ Executor: unhealthy"
  docker logs executor-1 | tail -20
  exit 1
fi

# Web-Next health (marketdata proxy)
if curl -sf http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT\&timeframe=1h\&limit=1 >/dev/null 2>&1; then
  echo "✅ Web-Next: healthy"
else
  echo "❌ Web-Next: unhealthy"
  docker logs web-next-1 | tail -20
  exit 1
fi

# Redis health
if docker exec spark-redis redis-cli PING >/dev/null 2>&1; then
  echo "✅ Redis: healthy"
else
  echo "❌ Redis: unhealthy"
  exit 1
fi

echo ""
echo "7️⃣  Checking leader election..."
sleep 5
LEADER_COUNT=$(docker logs executor-1 2>&1 | grep -c "became leader" || echo 0)
if [ "$LEADER_COUNT" -gt 0 ]; then
  echo "✅ Leader elected (executor-1)"
else
  echo "⚠️  No leader yet (will elect within 35s)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Services:"
echo "   Executor:  http://localhost:4001"
echo "   Web-Next:  http://localhost:3000"
echo "   Metrics:   http://localhost:4001/metrics"
echo ""
echo "🔍 Next steps:"
echo "   1. Run smoke tests:"
echo "      bash scripts/smoke-test-v1.0.0.sh"
echo ""
echo "   2. Run regression tests:"
echo "      bash scripts/regression-suite.sh"
echo ""
echo "   3. Import Grafana dashboard:"
echo "      monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json"
echo ""
echo "   4. Monitor for 60 minutes (see docs/operations/HYPERCARE-CHECKLIST.md)"
echo ""
echo "📚 Documentation:"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - TROUBLESHOOTING.md"
echo "   - API_REFERENCE.md"
echo ""

