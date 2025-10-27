@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading - Production Canary Test
echo ========================================

set SYMBOL=BTCUSDT
set QTY=0.00012
set MODE=testnet

echo Symbol: %SYMBOL%
echo Quantity: %QTY%
echo Mode: %MODE%

:: Check environment variables
if "%BINANCE_API_KEY%"=="" (
    echo ERROR: BINANCE_API_KEY is not set
    echo Please set your Binance API key before running canary test
    pause
    exit /b 1
)

if "%BINANCE_API_SECRET%"=="" (
    echo ERROR: BINANCE_API_SECRET is not set
    echo Please set your Binance API secret before running canary test
    pause
    exit /b 1
)

if "%SPARK_EXCHANGE_MODE%"=="" (
    set SPARK_EXCHANGE_MODE=spot-testnet
    echo Set SPARK_EXCHANGE_MODE to: %SPARK_EXCHANGE_MODE%
)

echo.
echo Environment variables OK ✓

:: Check if services are running
echo.
echo Checking service health...
curl -sS -m 5 http://127.0.0.1:3003/api/public/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: UI service is not running on port 3003
    echo Please start services first: scripts\windows\start_services.cmd
    pause
    exit /b 1
)

curl -sS -m 5 http://127.0.0.1:4001/api/public/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Executor service is not running on port 4001
    echo Please start services first: scripts\windows\start_services.cmd
    pause
    exit /b 1
)

echo Services are running ✓

:: Check if pnpm and tsx are available
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pnpm is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo ========================================
echo 1. DRY-RUN TEST (execute=false)
echo ========================================

echo Running dry-run test...
echo Command: pnpm -w exec tsx packages/execution/scripts/canary.ts --mode %MODE% --symbol %SYMBOL% --qty %QTY% --arm --confirm
echo.

pnpm -w exec tsx packages/execution/scripts/canary.ts --mode %MODE% --symbol %SYMBOL% --qty %QTY% --arm --confirm

if %errorlevel% equ 0 (
    echo ✓ Dry-run test completed successfully
) else (
    echo ✗ Dry-run test failed
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo 2. REAL TESTNET TEST (execute=true)
echo ========================================

echo WARNING: This will place a REAL order on Binance testnet!
echo Symbol: %SYMBOL%
echo Quantity: %QTY%
echo.
set /p CONFIRM="Do you want to proceed with real order placement? (y/N): "

if /i not "%CONFIRM%"=="y" (
    echo Test cancelled by user
    pause
    exit /b 0
)

echo.
echo Running real testnet test...
echo Command: pnpm -w exec tsx packages/execution/scripts/canary.ts --mode %MODE% --symbol %SYMBOL% --qty %QTY% --arm --confirm --execute
echo.

pnpm -w exec tsx packages/execution/scripts/canary.ts --mode %MODE% --symbol %SYMBOL% --qty %QTY% --arm --confirm --execute

if %errorlevel% equ 0 (
    echo ✓ Real testnet test completed successfully
) else (
    echo ✗ Real testnet test failed
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo ========================================
echo 3. POST-TEST VALIDATION
echo ========================================

echo Checking metrics after test...
echo.

:: Check order metrics
echo Order metrics:
curl -sS http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "live_orders_placed_total"
curl -sS http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "live_fills_total"

echo.
echo WebSocket metrics:
curl -sS http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "ws_reconnect_total"
curl -sS http://127.0.0.1:3003/api/public/metrics/prom | findstr /I "listenkey_keepalive_total"

echo.
echo ========================================
echo Canary Test Summary
echo ========================================
echo.
echo ✓ Dry-run test: PASSED
echo ✓ Real testnet test: PASSED
echo ✓ Post-test validation: COMPLETED
echo.
echo Next steps:
echo 1. Check the UI dashboard for order status
echo 2. Review logs for any errors
echo 3. Monitor metrics for 24 hours
echo 4. Run incident drills if needed
echo.
echo Press any key to exit...
pause >nul 