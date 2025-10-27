#!/usr/bin/env bash
set -euo pipefail

echo "[Spark] Start All Services (Unix)"

export EXECUTOR_ORIGIN="${EXECUTOR_ORIGIN:-http://localhost:4001}"
export NEXT_PUBLIC_EXECUTOR_ORIGIN="${NEXT_PUBLIC_EXECUTOR_ORIGIN:-$EXECUTOR_ORIGIN}"

echo "EXECUTOR_ORIGIN=$EXECUTOR_ORIGIN"
echo "NEXT_PUBLIC_EXECUTOR_ORIGIN=$NEXT_PUBLIC_EXECUTOR_ORIGIN"

command -v pnpm >/dev/null || { echo "[ERROR] pnpm yok. Node.js/pnpm kurun."; exit 1; }

pnpm i --prefer-offline

echo "[EXECUTOR] baslatiliyor (4001)..."
pnpm --filter @spark/executor dev >/tmp/executor.log 2>&1 &

echo "[WAIT] executor health"
for i in {1..30}; do
  if curl -sSf "$EXECUTOR_ORIGIN/public/health" >/dev/null; then
    echo "[OK] executor ayakta."
    break
  fi
  sleep 1
done || true

echo "[WEB] baslatiliyor (3003)..."
pnpm --filter apps/web-next dev -p 3003 -H 0.0.0.0 >/tmp/web.log 2>&1 &

echo "[WAIT] web local health"
for i in {1..40}; do
  if curl -sSf "http://localhost:3003/api/local/health" >/dev/null; then
    echo "[OK] web ayakta: http://localhost:3003"
    break
  fi
  sleep 1
done

echo
echo "[NEXT] Final test icin: bash scripts/final_production_test.sh" 