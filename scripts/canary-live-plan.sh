#!/usr/bin/env bash
set -euo pipefail
TOK="${1:-}"; ROLE="${2:-admin}"; QTY="${3:-0.00005}"
if [ -z "$TOK" ]; then echo "Usage: bash scripts/canary-live-plan.sh <CONFIRM_TOKEN> [admin|viewer] [QTY]"; exit 2; fi
curl -sS -X POST \
  -H 'content-type: application/json' \
  -H "x-confirm-token: ${TOK}" \
  -H "x-user-role: ${ROLE}" \
  http://127.0.0.1:3003/api/public/canary/live-trade \
  --data "{\"mode\":\"live\",\"allowLive\":true,\"dryRun\":true,\"symbol\":\"BTCUSDT\",\"qty\":${QTY},\"side\":\"BUY\"}" \
| node -e "process.stdin.on('data',d=>{try{const j=JSON.parse(d.toString());console.log('NONCE='+j.nonce,'ACCEPTED='+j.accepted,'REASON='+j.reason,'GATES='+j.gatesOk,'TOKEN='+j.tokenVerified,'RBAC='+j.rbacOk,'KILL='+j.killSwitch,'NOTIONAL='+j.notionalOk);process.exit(0);}catch(e){console.error('ERR',e.message);process.exit(1);}})" 