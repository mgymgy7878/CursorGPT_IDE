@echo off
setlocal
if "%1"=="" (
  echo Usage: scripts\canary-live-plan.cmd ^<CONFIRM_TOKEN^> [admin|viewer] [QTY]
  exit /b 2
)
set TOK=%1
set ROLE=%2
if "%ROLE%"=="" set ROLE=admin
set QTY=%3
if "%QTY%"=="" set QTY=0.00005

curl -sS -X POST ^
  -H "content-type: application/json" ^
  -H "x-confirm-token: %TOK%" ^
  -H "x-user-role: %ROLE%" ^
  http://127.0.0.1:3003/api/public/canary/live-trade ^
  --data "{\"mode\":\"live\",\"allowLive\":true,\"dryRun\":true,\"symbol\":\"BTCUSDT\",\"qty\":%QTY%,\"side\":\"BUY\"}" ^
  | node -e "process.stdin.on('data',d=>{try{const j=JSON.parse(d.toString());console.log('NONCE='+j.nonce,'ACCEPTED='+j.accepted,'REASON='+j.reason,'GATES='+j.gatesOk,'TOKEN='+j.tokenVerified,'RBAC='+j.rbacOk,'KILL='+j.killSwitch,'NOTIONAL='+j.notionalOk);process.exit(0);}catch(e){console.error('ERR',e.message);process.exit(1);}})"
endlocal 