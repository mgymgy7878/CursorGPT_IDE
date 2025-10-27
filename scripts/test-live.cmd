@echo off
setlocal enabledelayedexpansion

echo ========================================
echo SPARK LIVE TRADING - SMOKE TEST
echo ========================================
echo.

set EXECUTOR_URL=http://127.0.0.1:4001
set AUTH_TOKEN=dev-secret-change-me

echo Testing Live Trading Endpoints...
echo.

REM Test 1: Health check
echo [1/5] Testing live health endpoint...
curl -s -H "Authorization: Bearer %AUTH_TOKEN%" "%EXECUTOR_URL%/api/public/live/health" > temp_health.json
echo Response:
type temp_health.json
echo.

REM Test 2: ARM mode (LIVE_TRADING=1)
echo [2/5] Testing ARM mode (LIVE_TRADING=1)...
set LIVE_TRADING=1
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-live" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002}" > temp_arm.json
echo Response:
type temp_arm.json
echo.

REM Test 3: CONFIRM mode (LIVE_TRADING=2) without phrase
echo [3/5] Testing CONFIRM mode without phrase (LIVE_TRADING=2)...
set LIVE_TRADING=2
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-live" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002}" > temp_confirm_no.json
echo Response:
type temp_confirm_no.json
echo.

REM Test 4: CONFIRM mode with correct phrase
echo [4/5] Testing CONFIRM mode with correct phrase...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-live" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002,\"confirmPhrase\":\"CONFIRM LIVE TRADE\"}" > temp_confirm_yes.json
echo Response:
type temp_confirm_yes.json
echo.

REM Test 5: Whitelist violation
echo [5/5] Testing whitelist violation...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-live" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"symbol\":\"INVALID\",\"side\":\"BUY\",\"type\":\"MARKET\",\"qty\":0.0002,\"confirmPhrase\":\"CONFIRM LIVE TRADE\"}" > temp_whitelist.json
echo Response:
type temp_whitelist.json
echo.

echo ========================================
echo LIVE TRADING TEST COMPLETED
echo ========================================
echo.

echo Test Results Summary:
echo - Health check: Should return live trading status
echo - ARM mode: Should return 403 arm_only
echo - CONFIRM without phrase: Should return 403 confirm_required
echo - CONFIRM with phrase: Should return 200 OK with orderId
echo - Whitelist violation: Should return 400 whitelist_violation

echo.
echo Check temp_*.json files for detailed responses.

REM Cleanup
del temp_*.json 2>nul

echo.
echo Cleanup completed.
echo.
pause 