#!/bin/bash
# Rollback Procedures for WebSocket Migration
# Emergency rollback to polling-based data collection

set -e

echo "🔄 Spark Trading Platform - Rollback Procedures"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "🚨 Emergency Rollback Options:"
echo ""

echo "1️⃣  QUICK ROLLBACK (Feature Flag):"
echo "   - Set NEXT_PUBLIC_WS_ENABLED=false"
echo "   - Rebuild and redeploy"
echo "   - Automatic fallback to 2s polling"
echo ""
echo "   Commands:"
echo "   ${BLUE}NEXT_PUBLIC_WS_ENABLED=false pnpm --filter web-next run build${NC}"
echo "   ${BLUE}docker compose up -d --build${NC}"
echo "   ${BLUE}# or${NC}"
echo "   ${BLUE}pm2 restart spark-web${NC}"

echo ""
echo "2️⃣  INSTANT ROLLBACK (PM2):"
echo "   - Restart with previous version"
echo "   - Zero-downtime rollback"
echo ""
echo "   Commands:"
echo "   ${BLUE}pm2 restart spark-web@previous-version${NC}"
echo "   ${BLUE}pm2 logs spark-web --lines 50${NC}"

echo ""
echo "3️⃣  DOCKER ROLLBACK:"
echo "   - Use previous image tag"
echo "   - Quick container restart"
echo ""
echo "   Commands:"
echo "   ${BLUE}docker compose down${NC}"
echo "   ${BLUE}docker compose -f docker-compose.yml -f docker-compose.previous.yml up -d${NC}"

echo ""
echo "🔍 Rollback Triggers:"
echo "   ❌ wsLatency > 1000ms consistently"
echo "   ❌ wsReconnectAttempts > 10/minute"
echo "   ❌ Connection state stuck in CLOSED"
echo "   ❌ UI becomes unresponsive"
echo "   ❌ 5xx error spike in logs"
echo "   ❌ Canary PASS rate < 95%"

echo ""
echo "📊 Post-Rollback Validation:"
echo "   1. Health checks: ./scripts/health-check.sh"
echo "   2. BTCTurk page loads with polling data"
echo "   3. Status pill shows 'Canlı' (not WS indicators)"
echo "   4. No WebSocket connections in browser dev tools"
echo "   5. Error logs clear"

echo ""
echo "🛠️  Rollback Execution:"
echo ""
read -p "Select rollback method (1=quick, 2=pm2, 3=docker, 0=cancel): " choice

case $choice in
    1)
        echo -e "${YELLOW}Executing quick rollback...${NC}"
        NEXT_PUBLIC_WS_ENABLED=false pnpm --filter web-next run build
        echo -e "${GREEN}Build completed with WS disabled${NC}"
        echo "Next: Deploy with docker compose up -d --build or pm2 restart"
        ;;
    2)
        echo -e "${YELLOW}Executing PM2 rollback...${NC}"
        pm2 restart spark-web
        pm2 logs spark-web --lines 20
        ;;
    3)
        echo -e "${YELLOW}Executing Docker rollback...${NC}"
        docker compose down
        docker compose up -d --build
        ;;
    0)
        echo -e "${BLUE}Rollback cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Rollback completed!${NC}"
echo "Run health checks to verify system stability."
