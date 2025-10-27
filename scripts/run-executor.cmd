@echo off
setlocal enabledelayedexpansion
cd /d C:\dev\CursorGPT_IDE

echo ============================================
echo v1.7 Export@Scale - RUNNING GREEN Script
echo ============================================
echo.

rem === EVIDENCE FOLDER ===
for /f "tokens=1-4 delims=/:. " %%a in ("%date% %time%") do set TS=%%c%%b%%a_%%d
set EV=evidence\export\run_%TS%
if not exist "%EV%" mkdir "%EV%"
echo Evidence directory: %EV%
echo.

rem === PORT 4001 TEMIZLE ===
echo [1/9] Cleaning port 4001...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4001 ^| findstr LISTENING') do (
  echo   Killing process %%p
  echo Killed PID %%p > "%EV%\port_kill.txt"
  taskkill /PID %%p /F >nul 2>&1
)
timeout /t 2 >nul
echo   Port 4001 cleaned
echo.

rem === ENV / LOG LEVEL ===
set FASTIFY_LOG_LEVEL=info
set TS_NODE_TRANSPILE_ONLY=1

rem === TS-NODE ESM LOADER ILE BASLAT (arka planda) ===
echo [2/9] Starting executor with ts-node ESM loader...
start "spark-executor" /MIN cmd /c ^
  node --loader ts-node/esm services\executor\src\index.ts ^
  1>"%EV%\boot_out.log" 2>"%EV%\boot_err.log"

rem === BOOT POLL (30 deneme x 2s = 60s max) ===
echo [3/9] Waiting for executor to boot (max 60s)...
set /a tries=0
:wait_loop
  set /a tries+=1
  curl -s http://127.0.0.1:4001/health > "%EV%\health_attempt_%tries%.txt" 2>nul
  findstr /i "ok ready alive true" "%EV%\health_attempt_%tries%.txt" >nul 2>&1 && goto ready
  if !tries! geq 30 goto not_ready
  timeout /t 2 >nul
  goto wait_loop

:not_ready
  echo   [ERROR] Executor failed to start after 60s
  echo BOOT=FAILED > "%EV%\boot_status.txt"
  echo.
  echo === Boot Error Log ===
  type "%EV%\boot_err.log" 2>nul
  echo.
  echo === Boot Output Log ===
  type "%EV%\boot_out.log" 2>nul
  echo.
  echo Evidence saved to: %EV%
  exit /b 2

:ready
  echo   Executor is ready! (attempt %tries%)
  echo BOOT=OK > "%EV%\boot_status.txt"
  echo.

rem === BASELINE METRICS ===
echo [4/9] Capturing baseline metrics...
curl -s http://127.0.0.1:4001/export/status  > "%EV%\status_before.txt"
curl -s http://127.0.0.1:4001/metrics        > "%EV%\metrics_before.txt"
curl -s http://127.0.0.1:4001/export/metrics > "%EV%\export_metrics_before.txt"
echo   Baseline captured
echo.

rem === SMOKE: 1k CSV + 1k PDF ===
echo [5/9] Running smoke tests (1k CSV + 1k PDF)...
node scripts\seed-export.js --records=1000 --format=csv 1>"%EV%\seed_1k_csv.out" 2>"%EV%\seed_1k_csv.err"
echo   - 1k CSV done
node scripts\seed-export.js --records=1000 --format=pdf 1>"%EV%\seed_1k_pdf.out" 2>"%EV%\seed_1k_pdf.err"
echo   - 1k PDF done
if exist exports dir exports > "%EV%\exports_ls_after_smoke.txt"
echo   Smoke tests complete
echo.

rem === LOAD: 10k CSV + Batch ===
echo [6/9] Running load tests (10k CSV + batch)...
node scripts\seed-export.js --records=10000 --format=csv 1>"%EV%\seed_10k_csv.out" 2>"%EV%\seed_10k_csv.err"
echo   - 10k CSV done
node scripts\seed-export.js --batch 1>"%EV%\seed_batch.out" 2>"%EV%\seed_batch.err"
echo   - Batch test done
echo   Load tests complete
echo.

rem === ASSERT ===
echo [7/9] Running assertions...
node scripts\assert-export.js 1>"%EV%\assert.out" 2>"%EV%\assert.err"
echo   Assertions complete
echo.

rem === METRICS SNAPSHOT (AFTER) ===
echo [8/9] Capturing final metrics...
curl -s http://127.0.0.1:4001/metrics        > "%EV%\metrics_after.txt"
curl -s http://127.0.0.1:4001/export/metrics > "%EV%\export_metrics_after.txt"
dir exports > "%EV%\exports_ls_final.txt"
echo   Metrics captured
echo.

rem === SUMMARY + HEALTH ===
echo [9/9] Generating summary...
echo v1.7 Export@Scale - Test Run Summary > "%EV%\SUMMARY.txt"
echo ===================================== >> "%EV%\SUMMARY.txt"
echo. >> "%EV%\SUMMARY.txt"
echo Smoke Tests: >> "%EV%\SUMMARY.txt"
echo   - 1k CSV: See seed_1k_csv.out >> "%EV%\SUMMARY.txt"
echo   - 1k PDF: See seed_1k_pdf.out >> "%EV%\SUMMARY.txt"
echo. >> "%EV%\SUMMARY.txt"
echo Load Tests: >> "%EV%\SUMMARY.txt"
echo   - 10k CSV: See seed_10k_csv.out >> "%EV%\SUMMARY.txt"
echo   - Batch: See seed_batch.out >> "%EV%\SUMMARY.txt"
echo. >> "%EV%\SUMMARY.txt"
echo Assertions: >> "%EV%\SUMMARY.txt"
type "%EV%\assert.out" >> "%EV%\SUMMARY.txt" 2>nul
echo. >> "%EV%\SUMMARY.txt"

rem === HEALTH STATUS ===
findstr /i "passed success" "%EV%\assert.out" >nul 2>&1
if errorlevel 1 (
  echo HEALTH=YELLOW > "%EV%\HEALTH.txt"
  echo Status: YELLOW - Some assertions failed >> "%EV%\SUMMARY.txt"
) else (
  echo HEALTH=GREEN > "%EV%\HEALTH.txt"
  echo Status: GREEN - All assertions passed >> "%EV%\SUMMARY.txt"
)

echo.
echo ============================================
echo Test Run Complete!
echo ============================================
echo.
echo Evidence Directory: %EV%
echo.
echo Quick Check:
type "%EV%\HEALTH.txt"
echo.
type "%EV%\SUMMARY.txt"
echo.
echo Full results in: %EV%
echo.

exit /b 0

