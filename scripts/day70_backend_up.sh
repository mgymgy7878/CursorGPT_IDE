#!/usr/bin/env bash
set -euo pipefail
echo "[DAY-70] Backend Up (Unix)"

export PORT="${PORT:-4001}"
export NODE_ENV="${NODE_ENV:-development}"

pnpm i --prefer-offline
pnpm --filter @spark/executor build

exec node packages/executor/dist/index.js 