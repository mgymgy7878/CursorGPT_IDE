#!/bin/bash
# preflight-check.sh - Go-live preflight checklist

set -euo pipefail

API_URL="${API_URL:-http://localhost:3003}"
EXECUTOR_URL="${EXECUTOR_URL:-http://localhost:4001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check() {
  local name="$1"
  shift
  
  echo -n "Checking $name... "
  
  if "$@" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
    return 1
  fi
}

warn() {
  local name="$1"
  shift
  
  echo -n "Checking $name... "
  
  if "$@" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  WARN${NC}"
    ((WARNINGS++))
  fi
}

# 1. API Health
check "API Health" curl -sf "${API_URL}/api/healthz" -o /dev/null

# 2. Health response structure
check_health_structure() {
  local response=$(curl -s "${API_URL}/api/healthz")
  echo "$response" | jq -e '.ok == true' >/dev/null
}
check "Health response structure" check_health_structure

# 3. Build SHA header
check_build_sha() {
  curl -sI "${API_URL}/api/healthz" | grep -q "X-Build-SHA"
}
check "Build SHA header" check_build_sha

# 4. Public endpoints (graceful degradation)
check "Public alert endpoint" curl -sf "${API_URL}/api/public/alert/last" -o /dev/null
check "Public metrics endpoint" curl -sf "${API_URL}/api/public/metrics" -o /dev/null
check "Public smoke endpoint" curl -sf "${API_URL}/api/public/smoke-last" -o /dev/null

# 5. ML Score endpoint
check_ml_score() {
  curl -sf "${API_URL}/api/ml/score" \
    -H 'content-type: application/json' \
    -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}' \
    -o /dev/null
}
check "ML Score endpoint" check_ml_score

# 6. UI Quality Locks (requires browser)
echo ""
echo "📋 Manual UI Checks (open browser):"
echo "  1. Console: No hydration warnings"
echo "  2. Console: No React errors"
echo "  3. body { overflow: hidden }"
echo "  4. main { overflow-y: auto }"
echo "  5. No red toasts on page load"
echo "  6. Amber DEMO chip visible (if executor offline)"
echo ""

# 7. Executor health (optional)
warn "Executor health" curl -sf --max-time 3 "${EXECUTOR_URL}/health" -o /dev/null

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PREFLIGHT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Passed:${NC} $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Failed:${NC} $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ PREFLIGHT FAILED - DO NOT GO LIVE${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  PREFLIGHT PASSED WITH WARNINGS${NC}"
  echo "Review warnings before proceeding"
  exit 0
else
  echo -e "${GREEN}✅ PREFLIGHT PASSED - READY FOR GO-LIVE${NC}"
  exit 0
fi

