@echo off
setlocal enabledelayedexpansion
REM === UI-RESCUE-AND-COLLECT (Windows / CMD-only) ===
set TS=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TS=%TS: =0%
set OUT=docs\evidence\dev\v2.2-ui\rescue_%TS%
mkdir "%OUT%" 2>nul

echo [1/6] Env snapshot...
node -v > "%OUT%\env.txt" 2>&1
pnpm -v >> "%OUT%\env.txt" 2>&1

echo [2/6] Kill ports 3003/4001 if listening...
for /f "tokens=5" %%p in ('netstat -aon ^| find ":3003" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon ^| find ":4001" ^| find "LISTENING"') do taskkill /PID %%p /F >nul 2>nul

echo [3/6] Clean .next...
if exist apps\web-next\.next rd /s /q apps\web-next\.next

echo [4/6] Restart executor (4001)...
pushd services\executor
pnpm i --frozen-lockfile > "..\..\%OUT%\executor.install.log" 2>&1
pnpm build > "..\..\%OUT%\executor.build.log" 2>&1
start "executor-4001" cmd /c "pnpm dev 1> ..\..\%OUT%\executor.stdout.log 2> ..\..\%OUT%\executor.stderr.log"
popd

echo [5/6] Restart web-next (3003)...
pushd apps\web-next
set "NEXT_PUBLIC_UI_FUTURES_V22=true"
set "PORT=3003"
pnpm i --frozen-lockfile > "..\..\%OUT%\web.install.log" 2>&1
start "web-3003" cmd /c "pnpm dev 1> ..\..\%OUT%\web.stdout.log 2> ..\..\%OUT%\web.stderr.log"
popd

echo [6/6] Ports state snapshot...
netstat -aon | find ":3003" > "%OUT%\port-3003.txt"
netstat -aon | find ":4001" > "%OUT%\port-4001.txt"

echo.
echo [DONE] Evidence written to %OUT%
echo Open http://127.0.0.1:3003/ops (use /ops, not /dashboard)


