#!/bin/bash

# Private API Smoke Test Script
# v0.3.2 - Test private API endpoints

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3003"
API_KEY="${PRIVATE_API_KEY:-test-key}"
API_SECRET="${PRIVATE_API_SECRET:-test-secret}"
TOKEN="${DEV_TOKEN:-dev-token}"

echo -e "${YELLOW}🔍 Private API Smoke Test - v0.3.2${NC}"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "API Key: ${API_KEY:0:8}..."
echo "Token: ${TOKEN:0:8}..."
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    
    echo -n "Testing $name... "
    
    # Make request
    response=$(curl -s -w "\n%{http_code}" \
        -X "$method" \
        "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    # Extract status code
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check status
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (expected $expected_status, got $status_code)"
        echo "Response: $body"
        ((TESTS_FAILED++))
    fi
}

# Test endpoints
echo "1. Testing /api/private/health"
test_endpoint "Health Check" "GET" "/api/private/health" "200"

echo ""
echo "2. Testing /api/private/account"
test_endpoint "Account Info" "GET" "/api/private/account" "200"

echo ""
echo "3. Testing /api/private/openOrders"
test_endpoint "Open Orders" "GET" "/api/private/openOrders" "200"

echo ""
echo "4. Testing /api/private/trades"
test_endpoint "Trade History" "GET" "/api/private/trades" "200"

echo ""
echo "5. Testing metrics endpoint"
test_endpoint "Metrics" "GET" "/api/public/metrics/prom" "200"

# Summary
echo ""
echo "=================================="
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi 