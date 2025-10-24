#!/bin/bash
# NGINX Headers Verification Script
# Validates RFC 9512 YAML and security headers configuration

set -e

NGINX_CONF="deploy/nginx/spark.conf"
EXIT_CODE=0

echo "🔍 Verifying NGINX Headers Configuration..."
echo ""

# Check if config file exists
if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ NGINX config not found: $NGINX_CONF"
    exit 1
fi

# 1. Check RFC 9512 YAML media type
echo "1️⃣ Checking YAML media type (RFC 9512)..."
if grep -q "application/yaml yaml yml" "$NGINX_CONF"; then
    echo "   ✅ YAML media type configured"
else
    echo "   ❌ YAML media type missing"
    EXIT_CODE=1
fi

# 2. Check security headers with 'always' flag
echo "2️⃣ Checking security headers with 'always' flag..."

REQUIRED_HEADERS=(
    "X-Content-Type-Options"
    "X-Frame-Options"
    "Referrer-Policy"
)

for header in "${REQUIRED_HEADERS[@]}"; do
    if grep -q "add_header $header.*always" "$NGINX_CONF"; then
        echo "   ✅ $header has 'always' flag"
    else
        echo "   ❌ $header missing or no 'always' flag"
        EXIT_CODE=1
    fi
done

# 3. Check Cache-Control for metrics endpoint
echo "3️⃣ Checking Cache-Control for metrics..."
if grep -A 5 "location /api/public/metrics.prom" "$NGINX_CONF" | grep -q "Cache-Control"; then
    echo "   ✅ Metrics endpoint has Cache-Control"
else
    echo "   ⚠️  Metrics endpoint Cache-Control not found (may inherit from parent)"
fi

# 4. Check for inheritance documentation
echo "4️⃣ Checking add_header inheritance documentation..."
if grep -q "add_header inheritance" "$NGINX_CONF"; then
    echo "   ✅ Inheritance behavior documented"
else
    echo "   ⚠️  Inheritance behavior not documented"
fi

# 5. Validate YAML types block
echo "5️⃣ Checking types block..."
if grep -A 2 "^[[:space:]]*types {" "$NGINX_CONF" | grep -q "application/yaml"; then
    echo "   ✅ Types block includes YAML"
else
    echo "   ❌ Types block missing YAML entry"
    EXIT_CODE=1
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All NGINX header checks passed"
else
    echo "❌ Some NGINX header checks failed"
fi

exit $EXIT_CODE

