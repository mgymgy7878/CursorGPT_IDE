#!/usr/bin/env bash
set -euo pipefail
TOK="${1:-}"
if [ -z "$TOK" ]; then
  echo "Usage: bash scripts/canary-confirm-live.sh <CONFIRM_TOKEN>"
  exit 2
fi
curl -sS -X POST \
  -H 'content-type: application/json' \
  -H "x-confirm-token: ${TOK}" \
  http://127.0.0.1:3003/api/public/canary/confirm \
  --data '{"mode":"live","allowLive":true,"dryRun":true}' \
| node -e "process.stdin.on('data',d=>{try{const j=JSON.parse(d.toString());console.log('NONCE='+j.nonce,'ACCEPTED='+j.accepted,'MODE='+j.mode,'REASON='+j.reason,'TOKEN='+j.tokenVerified);process.exit(0);}catch(e){console.error('ERR',e.message);process.exit(1);}})" 