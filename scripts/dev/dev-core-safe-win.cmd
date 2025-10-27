@echo off
setlocal enabledelayedexpansion

REM === timestamp & output dir ===
set TS=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TS=%TS: =0%
set OUT=docs\evidence\dev\v2.2-ui\run_%TS%
mkdir "%OUT%" 2>nul

echo [0/5] Port temizligi (3003/4001)...
for /f "tokens=5" %%p in ('netstat -aon ^| find ":3003" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon ^| find ":4001" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>nul

echo [1/5] types tsc (fast-lane)...
pushd packages\@spark\types
pnpm exec tsc -p tsconfig.build.json 1> "..\..\..\%OUT%\types.tsc.log" 2>&1
popd

if exist packages\@spark\shared\tsconfig.build.json (
  echo [1b/5] shared tsc (fast-lane)...
  pushd packages\@spark\shared
  pnpm exec tsc -p tsconfig.build.json 1> "..\..\..\%OUT%\shared.tsc.log" 2>&1
  popd
)

echo [2/5] ENV set...
set "NEXT_PUBLIC_UI_FUTURES_V22=true"
set "EXECUTOR_ORIGIN=http://127.0.0.1:4001"
set "PORT=3003"

echo [3/5] executor baslatiliyor (4001)...
start "executor-4001" cmd /c "pnpm -w -F executor dev 1> %OUT%\executor.stdout.log 2> %OUT%\executor.stderr.log"

echo [wait] boot...
PING -n 3 127.0.0.1 >nul

REM --- Port fallback kontrolu ---
set "WEB_PORT=3003"
set INUSE=
for /f "tokens=5" %%p in ('netstat -aon ^| find ":%WEB_PORT%" ^| find "LISTENING"') do set INUSE=1
if defined INUSE (
  echo [port] %WEB_PORT% kullanimda, 3005'e geciliyor...
  set "WEB_PORT=3005"
)

echo %WEB_PORT%> "%OUT%\WEB_PORT.txt"

REM --- web-next start (direct next dev; no extra args to package script) ---
echo [web] starting next dev on %WEB_PORT% (127.0.0.1)...
start "web-next@%WEB_PORT%" /b cmd /c ^
  "set NEXT_PUBLIC_UI_FUTURES_V22=true && ^
   set EXECUTOR_ORIGIN=http://127.0.0.1:4001 && ^
   pnpm -C apps\web-next exec next dev -p %WEB_PORT% --hostname 127.0.0.1 ^
     1>> \"%OUT%\web.stdout.log\" 2>> \"%OUT%\web.stderr.log\""

echo [5/5] Hazir olana kadar bekle (60s) ve kanit yaz...
node scripts/dev/wait-for-http.mjs --out "%OUT%" --timeout 60 --interval 1500 ^
  --url http://127.0.0.1:4001/api/futures/time ^
  --url "http://127.0.0.1:4001/api/futures/exchangeInfo?symbol=BTCUSDT" ^
  --url http://127.0.0.1:4001/api/futures/positions ^
  --url http://127.0.0.1:%WEB_PORT%/api/public/metrics

echo.
echo [DONE] Kanit klasoru: %OUT%  (port=%WEB_PORT%)
echo Hala hazir degilse loglara bak: %OUT%\executor.stderr.log ve %OUT%\web.stderr.log
endlocal
