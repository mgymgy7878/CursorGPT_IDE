#!/usr/bin/env bash
set -euo pipefail
TS=$(date +"%Y%m%d_%H%M%S")
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
EVI="$ROOT/evidence/smoke_$TS"
mkdir -p "$EVI"
printf "NODE=%s\nPNPM=%s\nPORT_UI=3003\nEXECUTOR_URL=%s\n" "$(node -v)" "$(pnpm -v)" "${EXECUTOR_URL:-}" > "$EVI/env.txt"

curl -fsS http://127.0.0.1:4001/health > "$EVI/executor_health.json"
curl -fsS -X POST 'http://127.0.0.1:3003/api/backtest/run'        -H 'content-type: application/json' -d '{"symbol":"BTCUSDT","timeframe":"1h","from":"2024-05-01","to":"2024-06-01"}' > "$EVI/backtest_run.json"
curl -fsS -X POST 'http://127.0.0.1:3003/api/backtest/walkforward' -H 'content-type: application/json' -d '{"symbol":"BTCUSDT","timeframe":"4h","from":"2024-01-01","to":"2024-03-01"}' > "$EVI/backtest_walkforward.json"
curl -fsS -X POST 'http://127.0.0.1:3003/api/backtest/portfolio'   -H 'content-type: application/json' -d '{"symbols":["BTCUSDT","ETHUSDT"],"timeframe":"1h","from":"2024-02-01","to":"2024-03-01"}' > "$EVI/backtest_portfolio.json"
curl -fsS 'http://127.0.0.1:3003/api/portfolio' > "$EVI/portfolio_api.json"
curl -fsS 'http://127.0.0.1:3003/api/marketdata/stream?symbol=BTCUSDT&timeframe=1m' | head -n 30 > "$EVI/sse_head.txt" || true
curl -fsS http://127.0.0.1:4001/metrics > "$EVI/executor_metrics.prom"
docker compose ps > "$EVI/docker_ps.txt" 2>/dev/null || true
docker compose logs --no-color > "$EVI/docker_logs.txt" 2>/dev/null || true
ls -la "$EVI" > "$EVI/INDEX.txt"
echo "DONE: $EVI"


