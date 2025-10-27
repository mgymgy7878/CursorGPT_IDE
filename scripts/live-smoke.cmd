@echo off
REM SPARK — CANARY LIVE RUN — SMOKE TEST (CMD)
REM Windows CMD script for live canary testing

echo 🚀 SPARK CANARY LIVE RUN - SMOKE TEST
echo ================================================

REM 1. ENV Setup
echo 📋 Setting up environment variables...
set BINANCE_MAINNET_API_KEY=%1
set BINANCE_MAINNET_API_SECRET=%2
set EXECUTOR_TOKEN=%3
set TRADE_WHITELIST=BTCUSDT
set LIVE_MAX_NOTIONAL=20
set TRADE_WINDOW=07:00-23:30
set TRADING_KILL_SWITCH=0

REM 2. Preflight Health Check
echo 🔍 Preflight health check...
curl -s http://127.0.0.1:4001/api/public/live/health
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Health check failed
    exit /b 1
)
echo ✅ Preflight check PASSED

REM 3. ARM Test (Shadow Mode)
echo 🛡️ ARM Test (Shadow Mode)...
set LIVE_TRADING=1
set SHADOW_MODE=1

curl -s -X POST http://127.0.0.1:4001/api/public/strategy/deploy-live ^
  -H "Authorization: Bearer %EXECUTOR_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002}"

if %ERRORLEVEL% EQU 0 (
    echo ❌ ARM test should have failed with 403
    exit /b 1
) else (
    echo ✅ ARM test PASSED - Order blocked as expected
)

REM 4. CONFIRM Test (Live Canary)
echo 🎯 CONFIRM Test (Live Canary)...
set LIVE_TRADING=2
set SHADOW_MODE=0

curl -s -X POST http://127.0.0.1:4001/api/public/strategy/deploy-live ^
  -H "Authorization: Bearer %EXECUTOR_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002,\"confirmPhrase\":\"CONFIRM LIVE TRADE\"}"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Canary test failed
    exit /b 1
)

echo ✅ Canary order submitted
echo ⏳ Waiting 5 seconds for order execution...
timeout /t 5 /nobreak >nul

REM 5. Post-Canary Verification
echo 🔍 Post-canary verification...
curl -s http://127.0.0.1:4001/api/public/live/health
curl -s http://127.0.0.1:4001/api/public/live/metrics

REM 6. Rollback Test
echo 🔄 Rollback test...
set TRADING_KILL_SWITCH=1

curl -s -X POST http://127.0.0.1:4001/api/public/strategy/deploy-live ^
  -H "Authorization: Bearer %EXECUTOR_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002}"

if %ERRORLEVEL% EQU 0 (
    echo ❌ Rollback test should have failed with 503
) else (
    echo ✅ Rollback test PASSED - Kill switch active
)

set TRADING_KILL_SWITCH=0

echo 🎉 CANARY LIVE RUN SMOKE TEST COMPLETED
echo ================================================ 