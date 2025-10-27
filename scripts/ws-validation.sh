#!/bin/bash
# WebSocket Validation Script
# UI-side WebSocket connection and performance validation

set -e

echo "🔌 WebSocket Validation Starting..."

# Configuration
WEB_URL="http://127.0.0.1:3003"
TIMEOUT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "📱 UI WebSocket Validation:"
echo ""

# Check if WebSocket feature is enabled
echo -n "  Feature Flag Check... "
if curl -fsS "$WEB_URL" | grep -q "NEXT_PUBLIC_WS_ENABLED.*true" 2>/dev/null; then
    echo -e "${GREEN}✅ WS Enabled${NC}"
else
    echo -e "${YELLOW}⚠️  WS Flag not detected in HTML${NC}"
fi

echo ""
echo "🎯 Expected UI Behavior:"
echo "  1. Navigate to: $WEB_URL/btcturk"
echo "  2. Look for Status Pills:"
echo "     - ${GREEN}WS${NC} (green) = OPEN connection"
echo "     - ${YELLOW}WS!${NC} (yellow) = DEGRADED connection"  
echo "     - ${RED}WS✗${NC} (red) = CLOSED connection"
echo "  3. Check Spread Card updates (should be real-time)"
echo "  4. Verify latency tooltip on WS pill"

echo ""
echo "📊 Performance Thresholds:"
echo "  - wsLatency: < 300ms (local) / < 800ms (prod)"
echo "  - wsReconnectAttempts: should not continuously increase"
echo "  - Connection state: should reach OPEN within 5 seconds"

echo ""
echo "🔍 Manual Validation Steps:"
echo "  1. Open browser dev tools (F12)"
echo "  2. Go to Network tab → WS filter"
echo "  3. Navigate to /btcturk page"
echo "  4. Verify WebSocket connection to BTCTurk"
echo "  5. Check for ping/pong messages every 15s"
echo "  6. Test reconnection by disconnecting network briefly"

echo ""
echo "🚨 Rollback Triggers:"
echo "  - wsLatency consistently > 1000ms"
echo "  - wsReconnectAttempts > 10 in 1 minute"
echo "  - Connection state stuck in CLOSED"
echo "  - UI becomes unresponsive"

echo ""
echo -e "${BLUE}💡 Pro Tip: Use browser console to check store state:${NC}"
echo "   window.__SPARK_STORE__ = useBtcturkStore.getState()"
echo "   console.log(window.__SPARK_STORE__.wsStatus, window.__SPARK_STORE__.wsLatency)"

echo ""
echo -e "${GREEN}✅ WebSocket validation guide ready!${NC}"
echo "   Run manual tests and report results."
