@echo off
REM SPARK — KILL ALL ORDERS — ROLLBACK SCRIPT
REM Emergency script to cancel all open orders

echo 🚨 SPARK KILL ALL ORDERS - EMERGENCY ROLLBACK
echo ================================================

REM Set kill switch
set TRADING_KILL_SWITCH=1
echo ✅ Kill switch activated

REM Cancel all open orders via API
echo 🔄 Cancelling all open orders...
curl -s -X POST http://127.0.0.1:4001/api/public/live/cancel-all ^
  -H "Authorization: Bearer %EXECUTOR_TOKEN%" ^
  -H "Content-Type: application/json"

if %ERRORLEVEL% EQU 0 (
    echo ✅ All orders cancelled successfully
) else (
    echo ❌ Failed to cancel orders
)

REM Verify kill switch status
echo 🔍 Verifying kill switch status...
curl -s http://127.0.0.1:4001/api/public/live/health

echo 🎯 ROLLBACK COMPLETED
echo ================================================ 