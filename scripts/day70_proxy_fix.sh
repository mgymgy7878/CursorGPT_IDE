#!/usr/bin/env bash
set -euo pipefail
echo "[DAY-70] Proxy Fix / UI Up (Unix)"

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3003}"
export NEXT_PUBLIC_EXECUTOR_ORIGIN="${NEXT_PUBLIC_EXECUTOR_ORIGIN:-http://localhost:4001}"

echo "NEXT_PUBLIC_EXECUTOR_ORIGIN=$NEXT_PUBLIC_EXECUTOR_ORIGIN"
exec pnpm --filter apps/web-next dev -p "$PORT" -H "$HOST" 