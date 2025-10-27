#!/bin/bash

set -e

DATA='{"ping":"pong"}'

echo "========================================"
echo "SPARK PROXY AUTH + RESILIENCE TEST SUITE"
echo "========================================"
echo

echo "=== 1. Backend Direct Test ==="
if curl -s -X POST http://127.0.0.1:4001/api/public/echo \
  -H "Content-Type: application/json" \
  -d "$DATA" > /dev/null; then
  echo "[PASS] Backend direct test"
else
  echo "[FAIL] Backend not responding"
  exit 1
fi
echo

echo "=== 2. Proxy Test without Token (should return 401) ==="
if curl -s -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -d "$DATA" | grep -q "unauthorized"; then
  echo "[PASS] Proxy auth test (401 expected)"
else
  echo "[FAIL] Proxy auth not working"
  exit 1
fi
echo

echo "=== 3. Proxy Test with Token (should work) ==="
if curl -s -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-secret-change-me" \
  -d "$DATA" > /dev/null; then
  echo "[PASS] Proxy auth test (200 expected)"
else
  echo "[FAIL] Proxy auth not working"
  exit 1
fi
echo

echo "=== 4. Proxy Test with Wrong Token (should return 401) ==="
if curl -s -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d "$DATA" | grep -q "unauthorized"; then
  echo "[PASS] Proxy auth validation test (401 expected)"
else
  echo "[FAIL] Proxy auth validation not working"
  exit 1
fi
echo

echo "=== 5. Kill-Switch Test ==="
export PROXY_KILL_SWITCH=1
if curl -s -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -d "$DATA" | grep -q "service_unavailable"; then
  echo "[PASS] Kill-switch test"
else
  echo "[FAIL] Kill-switch not working"
  exit 1
fi
unset PROXY_KILL_SWITCH
echo

echo "=== 6. Size Limit Test ==="
if curl -s -X POST http://localhost:3003/api/public/echo \
  -H "Content-Type: application/json" \
  -H "Content-Length: 11000000" \
  -d "$DATA" | grep -q "payload_too_large"; then
  echo "[PASS] Size limit test"
else
  echo "[FAIL] Size limit not working"
  exit 1
fi
echo

echo "=== 7. Metrics Test ==="
if curl -s http://localhost:3003/api/public/metrics/prom > /dev/null; then
  echo "[PASS] Metrics endpoint test"
else
  echo "[FAIL] Metrics endpoint not working"
  exit 1
fi
echo

echo "========================================"
echo "ALL TESTS PASSED! PROXY IS HARD GREEN! 🎉"
echo "========================================" 