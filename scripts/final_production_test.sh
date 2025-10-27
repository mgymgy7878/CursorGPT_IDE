#!/usr/bin/env bash
set -euo pipefail

EXECUTOR_ORIGIN="${EXECUTOR_ORIGIN:-http://localhost:4001}"
WEB_ORIGIN="${WEB_ORIGIN:-http://localhost:3003}"

fail=0

echo "[1/6] Backend Health..."
curl -fsS "$EXECUTOR_ORIGIN/public/health" | grep -q '"service":"executor"' || fail=1 && echo "  OK"

echo "[2/6] UI Local Health..."
curl -fsS "$WEB_ORIGIN/api/local/health" | grep -q '"service":"web-next"' || fail=1 && echo "  OK"

echo "[3/6] Proxy Health (rewrite)..."
curl -fsS "$WEB_ORIGIN/api/public/health" | grep -q '"service":"executor"' || fail=1 && echo "  OK"

echo "[4/6] POST Body Preservation..."
curl -fsS -X POST -H "content-type: application/json" -d '{"msg":"post-body-test"}' "$WEB_ORIGIN/api/public/echo" | grep -q 'post-body-test' || fail=1 && echo "  OK"

echo "[5/6] Parity Render..."
curl -fsS "$WEB_ORIGIN/parity" >/dev/null || fail=1 && echo "  OK"

echo "[6/6] Playwright Smoke (optional)..."
if pnpm -w exec playwright test -g "UI smoke"; then echo "  OK"; else echo "  WARN: optional"; fi

echo
if [ "$fail" -eq 0 ]; then echo "PRODUCTION_READY=TRUE"; exit 0; else echo "PRODUCTION_READY=FALSE"; exit 1; fi 