@echo off
setlocal enabledelayedexpansion
set OUT=docs\evidence\dev\v2.2-ui
if not exist "%OUT%" mkdir "%OUT%" 2>nul

for /f %%p in ('node scripts\dev\read-web-port.mjs') do set WEB_PORT=%%p
if "%WEB_PORT%"=="" set WEB_PORT=3003
echo [smoke] WEB_PORT=%WEB_PORT%

node scripts/dev/wait-for-http.mjs --out "%OUT%" --timeout 60 --interval 1500 ^
  --url http://127.0.0.1:4001/api/futures/time ^
  --url "http://127.0.0.1:4001/api/futures/exchangeInfo?symbol=BTCUSDT" ^
  --url http://127.0.0.1:4001/api/futures/positions ^
  --url http://127.0.0.1:%WEB_PORT%/api/public/metrics
endlocal
