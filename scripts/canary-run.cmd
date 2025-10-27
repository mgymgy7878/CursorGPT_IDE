@echo off
setlocal
curl -sS -X POST -H "content-type: application/json" ^
  http://127.0.0.1:3003/api/public/canary/run ^
  --data "{}" | node -e "process.stdin.on('data',d=>{try{const j=JSON.parse(d.toString());console.log('NONCE='+j.nonce,'STATUS='+j.status,'DECISION='+j.decision);process.exit(0);}catch(e){console.error('ERR',e.message);process.exit(1);}})"
endlocal 