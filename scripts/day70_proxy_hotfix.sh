#!/usr/bin/env bash
set -euo pipefail
echo "[DAY-70] Proxy Hotfix Runner (Unix)"

export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-3003}
export EXECUTOR_ORIGIN=${EXECUTOR_ORIGIN:-http://localhost:4001}
export NEXT_PUBLIC_EXECUTOR_ORIGIN="${EXECUTOR_ORIGIN}"
export NEXT_TELEMETRY_DISABLED=1

command -v pnpm >/dev/null || { echo "pnpm yok"; exit 1; }

echo "[1/4] Typecheck..."
pnpm -w exec tsc -b || echo "Typecheck warnings"

echo "[2/4] Executor baslatiliyor..."
pnpm --filter @spark/executor dev >/tmp/executor.log 2>&1 & disown

echo "[3/4] Web-Next baslatiliyor..."
pnpm --filter apps/web-next dev -p "$PORT" -H "$HOST" >/tmp/web-next.log 2>&1 & disown

echo "[4/4] Hızlı testler:"
sleep 1
curl -s http://localhost:4001/public/health && echo
curl -s "http://localhost:${PORT}/api/local/health" && echo
curl -s "http://localhost:${PORT}/api/public/health" && echo
echo "POST echo:"
curl -s -H "Content-Type: application/json" -X POST -d '{"msg":"test"}' "http://localhost:${PORT}/api/public/echo" && echo 