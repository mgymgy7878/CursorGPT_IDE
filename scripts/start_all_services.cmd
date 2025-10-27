@echo off
setlocal enabledelayedexpansion
title [Spark] Start All Services (Windows)

REM ---- ENV Defaults ----
if "%EXECUTOR_ORIGIN%"=="" set EXECUTOR_ORIGIN=http://localhost:4001
if "%NEXT_PUBLIC_EXECUTOR_ORIGIN%"=="" set NEXT_PUBLIC_EXECUTOR_ORIGIN=%EXECUTOR_ORIGIN%

echo EXECUTOR_ORIGIN=%EXECUTOR_ORIGIN%
echo NEXT_PUBLIC_EXECUTOR_ORIGIN=%NEXT_PUBLIC_EXECUTOR_ORIGIN%

where pnpm >NUL 2>&1 || (echo [ERROR] pnpm bulunamadi. Node.js/pnpm kurun. & exit /b 1)

REM ---- Install (idempotent) ----
pnpm i --prefer-offline

REM ---- Start Executor (port 4001) ----
echo.
echo [EXECUTOR] baslatiliyor (port 4001)...
start "executor-4001" cmd /c "pnpm --filter @spark/executor dev"

REM ---- Wait for executor health ----
echo [WAIT] executor health bekleniyor...
for /l %%i in (1,1,30) do (
  powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri '%EXECUTOR_ORIGIN%/public/health' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0}else{exit 1}}catch{exit 1}"
  if not errorlevel 1 goto :executor_ok
  timeout /t 1 >NUL
)
echo [WARN] executor health gorulemedi; devam ediliyor...
goto :after_executor
:executor_ok
echo [OK] executor ayakta.
:after_executor

REM ---- Start Web (port 3003) ----
echo.
echo [WEB] baslatiliyor (port 3003)...
start "web-3003" cmd /c "pnpm --filter apps/web-next dev -p 3003 -H 0.0.0.0"

REM ---- Wait for web local health ----
echo [WAIT] web local health bekleniyor...
for /l %%i in (1,1,40) do (
  powershell -NoProfile -Command "try{$r=Invoke-WebRequest -Uri 'http://localhost:3003/api/local/health' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0}else{exit 1}}catch{exit 1}"
  if not errorlevel 1 goto :web_ok
  timeout /t 1 >NUL
)
echo [ERROR] web local health gelmedi.
exit /b 1
:web_ok
echo [OK] web ayakta: http://localhost:3003

echo.
echo [NEXT] Final testleri calistirmak icin: scripts\final_production_test.cmd
endlocal 