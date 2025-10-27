@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading - 24 Hour Validation
echo ========================================

set VALIDATION_DURATION=86400
set CHECK_INTERVAL=300
set LOG_FILE=logs\24h_validation_%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%%time:~3,2%.txt

echo Validation Duration: %VALIDATION_DURATION% seconds (24 hours)
echo Check Interval: %CHECK_INTERVAL% seconds (5 minutes)
echo Log File: %LOG_FILE%
echo.

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir "logs"

:: Initialize log file
echo === SPARK TRADING 24H VALIDATION LOG === > "%LOG_FILE%"
echo Start Time: %date% %time% >> "%LOG_FILE%"
echo Duration: %VALIDATION_DURATION% seconds >> "%LOG_FILE%"
echo Check Interval: %CHECK_INTERVAL% seconds >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

echo Starting 24-hour validation...
echo Press Ctrl+C to stop early
echo.

set START_TIME=%time%
set CHECK_COUNT=0
set ERROR_COUNT=0
set SUCCESS_COUNT=0

:validation_loop
:: Increment check count
set /a CHECK_COUNT+=1

:: Get current timestamp
set CURRENT_TIME=%time%
echo [%CURRENT_TIME%] Check #%CHECK_COUNT% - Starting validation...

:: Log timestamp
echo === Check #%CHECK_COUNT% - %CURRENT_TIME% === >> "%LOG_FILE%"

:: 1. Health Check
echo Checking service health...
curl -sS -m 10 http://127.0.0.1:3003/api/public/health >> "%LOG_FILE%" 2>&1
if %errorlevel% equ 0 (
    echo ✓ UI health check passed
    set /a SUCCESS_COUNT+=1
) else (
    echo ✗ UI health check failed
    set /a ERROR_COUNT+=1
)

curl -sS -m 10 http://127.0.0.1:4001/api/public/health >> "%LOG_FILE%" 2>&1
if %errorlevel% equ 0 (
    echo ✓ Executor health check passed
    set /a SUCCESS_COUNT+=1
) else (
    echo ✗ Executor health check failed
    set /a ERROR_COUNT+=1
)

:: 2. Metrics Collection
echo Collecting metrics...
echo --- Metrics --- >> "%LOG_FILE%"
curl -sS -m 10 http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "live_orders_placed_total live_fills_total ws_reconnect_total listenkey_keepalive_total" >> "%LOG_FILE%" 2>&1

:: 3. Latency Check
echo Checking latency...
echo --- Latency Check --- >> "%LOG_FILE%"
for /f "tokens=*" %%i in ('curl -sS -w "%%{time_total}" -o nul -m 10 http://127.0.0.1:3003/api/public/health') do set LATENCY=%%i
echo Response time: %LATENCY%s >> "%LOG_FILE%"

:: 4. Error Rate Check
echo Checking error rates...
echo --- Error Rate Check --- >> "%LOG_FILE%"
curl -sS -m 10 http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "http_requests_total" >> "%LOG_FILE%" 2>&1

:: 5. WebSocket Status
echo Checking WebSocket status...
echo --- WebSocket Status --- >> "%LOG_FILE%"
curl -sS -m 10 http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "ws_reconnect_total listenkey_keepalive_total" >> "%LOG_FILE%" 2>&1

:: 6. Database Connectivity
echo Checking database connectivity...
echo --- Database Check --- >> "%LOG_FILE%"
curl -sS -m 10 http://127.0.0.1:4001/api/public/health | findstr /I "database" >> "%LOG_FILE%" 2>&1

:: 7. Memory Usage
echo Checking memory usage...
echo --- Memory Usage --- >> "%LOG_FILE%"
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /Value | findstr /I "FreePhysicalMemory" >> "%LOG_FILE%" 2>&1

:: 8. Disk Space
echo Checking disk space...
echo --- Disk Space --- >> "%LOG_FILE%"
wmic logicaldisk get size,freespace,caption | findstr /I "C:" >> "%LOG_FILE%" 2>&1

:: Log summary for this check
echo. >> "%LOG_FILE%"
echo Check #%CHECK_COUNT% Summary: >> "%LOG_FILE%"
echo - Success Count: %SUCCESS_COUNT% >> "%LOG_FILE%"
echo - Error Count: %ERROR_COUNT% >> "%LOG_FILE%"
echo - Latency: %LATENCY%s >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

:: Display current status
echo.
echo ========================================
echo Validation Status
echo ========================================
echo Check Count: %CHECK_COUNT%
echo Success Count: %SUCCESS_COUNT%
echo Error Count: %ERROR_COUNT%
echo Current Latency: %LATENCY%s
echo.

:: Check if validation duration has elapsed
set /a ELAPSED_TIME=%CHECK_COUNT%*%CHECK_INTERVAL%
if %ELAPSED_TIME% geq %VALIDATION_DURATION% goto :validation_complete

:: Wait for next check
echo Waiting %CHECK_INTERVAL% seconds until next check...
timeout /t %CHECK_INTERVAL% /nobreak >nul

goto :validation_loop

:validation_complete
echo.
echo ========================================
echo 24-Hour Validation Complete
echo ========================================
echo.

:: Final metrics collection
echo Collecting final metrics...
echo === FINAL METRICS === >> "%LOG_FILE%"
curl -sS http://127.0.0.1:3003/api/public/metrics/prom >> "%LOG_FILE%" 2>&1

:: Calculate SLO results
echo === SLO RESULTS === >> "%LOG_FILE%"
echo Total Checks: %CHECK_COUNT% >> "%LOG_FILE%"
echo Total Success: %SUCCESS_COUNT% >> "%LOG_FILE%"
echo Total Errors: %ERROR_COUNT% >> "%LOG_FILE%"

set /a UPTIME_PERCENT=(%SUCCESS_COUNT%*100)/(%CHECK_COUNT%*2)
echo Uptime Percentage: %UPTIME_PERCENT%%% >> "%LOG_FILE%"

:: SLO Assessment
if %UPTIME_PERCENT% geq 99 (
    echo SLO Status: PASSED (≥99%% uptime) >> "%LOG_FILE%"
    echo SLO Status: PASSED ✓
) else (
    echo SLO Status: FAILED (<99%% uptime) >> "%LOG_FILE%"
    echo SLO Status: FAILED ✗
)

echo.
echo ========================================
echo Validation Summary
echo ========================================
echo.
echo ✓ 24-hour validation completed
echo ✓ Log file: %LOG_FILE%
echo ✓ Total checks: %CHECK_COUNT%
echo ✓ Success rate: %UPTIME_PERCENT%%%
echo.
echo SLO Results:
echo - Uptime: %UPTIME_PERCENT%%% (Target: ≥99%%)
echo - Error rate: %ERROR_COUNT% errors in 24h
echo - Average check interval: %CHECK_INTERVAL% seconds
echo.
echo Next steps:
echo 1. Review log file for detailed metrics
echo 2. Check for any anomalies or patterns
echo 3. Update SLO targets if needed
echo 4. Schedule next validation cycle
echo.
echo Press any key to exit...
pause >nul 