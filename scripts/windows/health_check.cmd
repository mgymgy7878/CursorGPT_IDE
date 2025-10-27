@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading Platform - Health Check
echo ========================================

set UI_PORT=3003
set EXECUTOR_PORT=4001
set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo Timestamp: %TIMESTAMP%
echo UI Port: %UI_PORT%
echo Executor Port: %EXECUTOR_PORT%

:: Check if curl is available
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: curl is not available
    echo Please install curl or use PowerShell instead
    pause
    exit /b 1
)

echo.
echo ========================================
echo 1. Checking UI Service Health
echo ========================================

:: Check UI health endpoint
echo Checking UI health...
curl -sS -m 10 http://127.0.0.1:%UI_PORT%/api/public/health
if %errorlevel% equ 0 (
    echo ✓ UI health check passed
) else (
    echo ✗ UI health check failed
    set UI_HEALTH=FAILED
)

:: Check UI metrics
echo.
echo Checking UI metrics...
curl -sS -m 10 http://127.0.0.1:%UI_PORT%/api/public/metrics/prom | findstr /I "live_orders_placed_total live_fills_total"
if %errorlevel% equ 0 (
    echo ✓ UI metrics available
) else (
    echo ✗ UI metrics not available
    set UI_METRICS=FAILED
)

echo.
echo ========================================
echo 2. Checking Executor Service Health
echo ========================================

:: Check executor health
echo Checking executor health...
curl -sS -m 10 http://127.0.0.1:%EXECUTOR_PORT%/api/public/health
if %errorlevel% equ 0 (
    echo ✓ Executor health check passed
) else (
    echo ✗ Executor health check failed
    set EXECUTOR_HEALTH=FAILED
)

:: Check executor metrics
echo.
echo Checking executor metrics...
curl -sS -m 10 http://127.0.0.1:%EXECUTOR_PORT%/api/public/metrics/prom | findstr /I "live_orders_placed_total live_fills_total"
if %errorlevel% equ 0 (
    echo ✓ Executor metrics available
) else (
    echo ✗ Executor metrics not available
    set EXECUTOR_METRICS=FAILED
)

echo.
echo ========================================
echo 3. Checking Port Availability
echo ========================================

:: Check UI port
netstat -an | findstr ":%UI_PORT%" >nul
if %errorlevel% equ 0 (
    echo ✓ UI port %UI_PORT% is listening
) else (
    echo ✗ UI port %UI_PORT% is not listening
    set UI_PORT=FAILED
)

:: Check executor port
netstat -an | findstr ":%EXECUTOR_PORT%" >nul
if %errorlevel% equ 0 (
    echo ✓ Executor port %EXECUTOR_PORT% is listening
) else (
    echo ✗ Executor port %EXECUTOR_PORT% is not listening
    set EXECUTOR_PORT=FAILED
)

echo.
echo ========================================
echo 4. Checking Environment Variables
echo ========================================

if "%BINANCE_API_KEY%"=="" (
    echo ✗ BINANCE_API_KEY is not set
    set API_KEY=FAILED
) else (
    echo ✓ BINANCE_API_KEY is set
)

if "%BINANCE_API_SECRET%"=="" (
    echo ✗ BINANCE_API_SECRET is not set
    set API_SECRET=FAILED
) else (
    echo ✓ BINANCE_API_SECRET is set
)

if "%SPARK_EXCHANGE_MODE%"=="" (
    echo ⚠ SPARK_EXCHANGE_MODE is not set (using default: spot-testnet)
) else (
    echo ✓ SPARK_EXCHANGE_MODE is set to: %SPARK_EXCHANGE_MODE%
)

echo.
echo ========================================
echo Health Check Summary
echo ========================================

set FAILURES=0

if defined UI_HEALTH set /a FAILURES+=1
if defined UI_METRICS set /a FAILURES+=1
if defined EXECUTOR_HEALTH set /a FAILURES+=1
if defined EXECUTOR_METRICS set /a FAILURES+=1
if defined UI_PORT set /a FAILURES+=1
if defined EXECUTOR_PORT set /a FAILURES+=1
if defined API_KEY set /a FAILURES+=1
if defined API_SECRET set /a FAILURES+=1

if %FAILURES% equ 0 (
    echo 🟢 All health checks passed!
    echo System is healthy and ready for trading.
) else (
    echo 🔴 Health check failed with %FAILURES% issues
    echo Please review the errors above and fix them.
)

echo.
echo ========================================
echo Quick Access Links
echo ========================================
echo UI Dashboard:     http://localhost:%UI_PORT%
echo Health Check:     http://localhost:%UI_PORT%/api/public/health
echo Metrics:          http://localhost:%UI_PORT%/api/public/metrics/prom
echo Executor API:     http://localhost:%EXECUTOR_PORT%

echo.
echo Press any key to exit...
pause >nul 