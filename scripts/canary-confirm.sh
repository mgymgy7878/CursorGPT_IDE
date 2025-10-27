#!/usr/bin/env bash
set -euo pipefail
curl -sS -X POST -H 'content-type: application/json' \
  http://127.0.0.1:3003/api/public/canary/confirm \
  --data '{"mode":"shadow","allowLive":false,"dryRun":true}' | node -e "process.stdin.on('data',d=>{try{const j=JSON.parse(d.toString());console.log('NONCE='+j.nonce,'ACCEPTED='+j.accepted,'MODE='+j.mode,'REASON='+j.reason);process.exit(0);}catch(e){console.error('ERR',e.message);process.exit(1);}})" 