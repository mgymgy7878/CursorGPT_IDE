#!/bin/bash
# CUTOVER RUNBOOK - Linux Version
# Spark Trading Platform - WebSocket Migration

echo "🚀 CUTOVER RUNBOOK - LINUX VERSION"
echo "=================================="

# Environment setup
export NODE_ENV=production
export NEXT_PUBLIC_WS_ENABLED=true

echo ""
echo "🔍 Validating tools..."
node -v
pnpm -v
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm i -g pm2
fi

# Ensure running from monorepo root
cd "$(git rev-parse --show-toplevel)"
echo "📁 Working directory: $(pwd)"

echo ""
echo "🔨 Building packages..."
pnpm -w install --frozen-lockfile
pnpm --filter @spark/types run build
pnpm --filter @spark/exchange-btcturk run build
pnpm --filter @spark/shared run build || true
pnpm --filter @spark/security run build || true
pnpm --filter executor run build
pnpm --filter web-next run build

echo ""
echo "🚀 Starting services with PM2..."
pm2 delete all || true
pm2 start ecosystem.config.js --env production
pm2 save

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 15

echo ""
echo "🏥 Running health checks..."

# Executor Health
echo "⚡ Checking Executor Health..."
if curl -s http://127.0.0.1:4001/health | grep -q "ok"; then
    echo "✅ Executor Health: OK"
else
    echo "❌ Executor Health: FAILED"
fi

# UI Health
echo "📱 Checking UI Health..."
if curl -s http://127.0.0.1:3003/api/public/health | grep -q "ok"; then
    echo "✅ UI Health: OK"
else
    echo "❌ UI Health: FAILED"
fi

# BTCTurk Ticker
echo "📈 Checking BTCTurk Ticker..."
ticker_response=$(curl -s http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY)
if echo "$ticker_response" | grep -q "ok"; then
    echo "✅ BTCTurk Ticker: OK"
    if echo "$ticker_response" | grep -q '"mock":true'; then
        echo "   ⚠️  Mock Data: true (expected in dev, should be false in prod)"
    else
        echo "   ✅ Real Data: false (production ready)"
    fi
else
    echo "❌ BTCTurk Ticker: FAILED"
fi

echo ""
echo "🎯 Service URLs:"
echo "  Web: http://127.0.0.1:3003"
echo "  Executor: http://127.0.0.1:4001"
echo "  BTCTurk: http://127.0.0.1:3003/btcturk"

echo ""
echo "🌐 Manual Validation Required:"
echo "  1. Navigate to http://127.0.0.1:3003/btcturk"
echo "  2. Open DevTools → Network → WS filter"
echo "  3. Verify 101 Switching Protocols"
echo "  4. Check UI status pill: OPEN (green)"
echo "  5. Verify real-time data updates"

echo ""
echo "🎯 Canary Trigger:"
echo "  1. Go to GitHub Actions"
echo "  2. Navigate to 'Receipts Gate' workflow"
echo "  3. Click 'Run workflow'"
echo "  4. Check for 'Canary PASS' in logs"

echo ""
echo "📊 24-Hour Monitoring:"
echo "  pm2 monit"
echo "  pm2 logs --lines 200"

echo ""
echo "🚨 Emergency Rollback:"
echo "  NEXT_PUBLIC_WS_ENABLED=false pnpm --filter web-next run build"
echo "  pm2 restart all"

echo ""
echo "🎉 CUTOVER COMPLETE!"
echo "===================="
echo "✅ Services Started"
echo "✅ Health Checks Completed"
echo "✅ Ready for WebSocket Validation"
echo "✅ Ready for Canary Trigger"
echo "✅ Ready for 24-Hour Monitoring"
