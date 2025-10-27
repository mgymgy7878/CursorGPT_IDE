#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")"/.. && pwd)/CursorGPT_IDE"
mkdir -p "$root/.dev"

pushd "$root" >/dev/null
echo "[*] bootstrap pnpm workspace…"
pnpm -w install

rm -rf "$root/apps/web-next/.next" || true

echo "[*] starting executor (4001)…"
( pnpm --filter ./services/executor run dev ) >"$root/.dev/executor.log" 2>&1 &
echo $! > "$root/.dev/executor.pid"

echo "[*] starting web-next (3003)…"
( pnpm --filter ./apps/web-next run dev -- --port 3003 ) >"$root/.dev/web-next.log" 2>&1 &
echo $! > "$root/.dev/web-next.pid"

sleep 5
curl -fsS "http://127.0.0.1:4001/health" && echo " [✓] executor"
curl -fsS "http://127.0.0.1:3003/api/public/healthz" && echo " [✓] web"
popd >/dev/null
