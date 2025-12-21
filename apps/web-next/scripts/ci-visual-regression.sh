#!/bin/bash
# CI Visual Regression Test Script
#
# Kullanım:
#   ./scripts/ci-visual-regression.sh
#
# PR pipeline'da çalıştırılır:
#   1. Dev server'ı başlat (background)
#   2. Golden Master testlerini çalıştır
#   3. Snapshot farkı varsa exit 1 (PR kırmızı)

set -e

echo "🔍 Visual Regression Test - CI Pipeline"

# Dev server'ı başlat (background)
echo "📦 Starting dev server..."
pnpm --filter web-next dev -- --port 3003 --hostname 127.0.0.1 &
DEV_PID=$!

# Server'ın hazır olmasını bekle (45-60sn polling)
echo "⏳ Waiting for server to be ready (healthz polling)..."
MAX_RETRIES=30
RETRY_INTERVAL=2
SERVER_READY=false

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3003/api/healthz 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server is ready (HTTP 200)"
    SERVER_READY=true
    break
  elif [ "$HTTP_CODE" = "503" ]; then
    # 503 beklenen (UI-only mode, executor kapalı)
    echo "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)"
    SERVER_READY=true
    break
  elif [ "$HTTP_CODE" = "000" ]; then
    # Connection refused, retry
    echo "⏳ Waiting for port 3003... ($i/$MAX_RETRIES)"
  else
    echo "⚠️  Unexpected HTTP code: $HTTP_CODE"
  fi

  if [ $i -lt $MAX_RETRIES ]; then
    sleep $RETRY_INTERVAL
  fi
done

if [ "$SERVER_READY" != "true" ]; then
  echo "❌ Server failed to start after $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
  echo "   Check: Is port 3003 free? (lsof -i :3003 or netstat -tuln | grep :3003)"
  # Clean stop
  kill $DEV_PID 2>/dev/null || true
  wait $DEV_PID 2>/dev/null || true
  exit 1
fi

# Golden Master testlerini çalıştır (tüm visual testler)
echo "📸 Running Golden Master tests..."
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts || TEST_FAILED=1

# Dev server'ı durdur (clean stop)
echo "🛑 Stopping dev server..."
trap "kill $DEV_PID 2>/dev/null || true" EXIT
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

# Test başarısızsa exit 1
if [ -n "$TEST_FAILED" ]; then
  echo "❌ Visual regression test failed - PR should be blocked"
  exit 1
fi

echo "✅ Visual regression test passed"
exit 0

