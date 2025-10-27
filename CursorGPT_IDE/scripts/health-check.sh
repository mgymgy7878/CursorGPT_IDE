#!/usr/bin/env bash
set -euo pipefail
PORT_WEB=${PORT_WEB:-3003}
PORT_EXEC=${PORT_EXEC:-4001}
BASE_WEB="http://127.0.0.1:${PORT_WEB}"
BASE_EXEC="http://127.0.0.1:${PORT_EXEC}"
STAMP=$(date +%Y%m%d_%H%M%S)
EVID="evidence/local/smoke/${STAMP}"
mkdir -p "$EVID"

# helper: curl with timeout, capture code + body
curl_code() { # url outpath
  local url="$1" out="$2"
  code=$(curl -sS -m 3 -o "$out" -w "%{http_code}" "$url" || echo "000")
  echo "$code"
}

# wait until endpoints respond or timeout
wait_up() { # url label
  local url="$1" label="$2" tries=30
  for i in $(seq 1 $tries); do
    code=$(curl -sS -m 2 -o /dev/null -w "%{http_code}" "$url" || echo "000")
    if [ "$code" = "200" ]; then echo "[OK] $label up"; return 0; fi
    sleep 1
  done
  echo "[WARN] $label not ready (last=$code)"
  return 0
}

wait_up "$BASE_WEB/api/public/health" "web-next"
wait_up "$BASE_EXEC/api/public/health" "executor"

code_web=$(curl_code "$BASE_WEB/api/public/health" "$EVID/web_health.json")
code_exec=$(curl_code "$BASE_EXEC/api/public/health" "$EVID/exec_health.json")
# metrics (web-next tarafında bekleniyor)
curl -sS -m 3 "$BASE_WEB/api/public/metrics" -H "Cache-Control: no-store" | head -n 25 > "$EVID/metrics_head.txt" || true

OVERALL="False"
if [ "$code_web" = "200" ] && [ "$code_exec" = "200" ]; then OVERALL="True"; fi

{
  echo "SMOKE_OVERALL=$OVERALL"
  echo "WEB_HEALTH_CODE=$code_web"
  echo "EXEC_HEALTH_CODE=$code_exec"
  echo "EVIDENCE_DIR=$EVID"
} | tee "$EVID/summary.txt" >/dev/null

echo "$EVID"  # path echo
