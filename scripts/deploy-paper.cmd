@echo off
setlocal enabledelayedexpansion

echo ========================================
echo SPARK STRATEGY PIPELINE - PAPER DEPLOY
echo ========================================
echo.

set EXECUTOR_URL=http://127.0.0.1:4001
set AUTH_TOKEN=dev-secret-change-me

echo Testing Paper Trading Deployment...
echo.

REM Test 1: Normal deployment
echo [1/3] Testing normal paper deployment...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-paper" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-TEST-001\",\"symbol\":\"BTCUSDT\",\"risk\":{\"maxPos\":1,\"dailyLossCap\":100}}" > temp_deploy1.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy strategy
    goto :error
)

echo Response: 
type temp_deploy1.json
echo.

REM Test 2: Risk limit violation (maxPos)
echo [2/3] Testing risk limit violation (maxPos)...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-paper" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-TEST-002\",\"symbol\":\"ETHUSDT\",\"risk\":{\"maxPos\":10,\"dailyLossCap\":1000}}" > temp_deploy2.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to test risk limits
    goto :error
)

echo Response:
type temp_deploy2.json
echo.

REM Test 3: Kill switch test
echo [3/3] Testing kill switch (set TRADING_KILL_SWITCH=1)...
set TRADING_KILL_SWITCH=1
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/deploy-paper" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-TEST-003\",\"symbol\":\"ADAUSDT\",\"risk\":{\"maxPos\":1,\"dailyLossCap\":100}}" > temp_deploy3.json
set TRADING_KILL_SWITCH=0

echo Response:
type temp_deploy3.json
echo.

echo ========================================
echo PAPER DEPLOYMENT TEST COMPLETED
echo ========================================
echo.
echo Test Results:
echo - Normal deployment: Should return 200 OK with runId
echo - Risk limit test: Should return 400/500 for violations
echo - Kill switch test: Should return 503 Service Unavailable
echo.
echo Check temp_deploy*.json files for detailed responses.
echo.

goto :cleanup

:error
echo.
echo ========================================
echo PAPER DEPLOYMENT TEST FAILED
echo ========================================
echo.
echo Please check:
echo 1. Executor service is running on port 4001
echo 2. Authentication token is correct
echo 3. Risk management is properly configured
echo 4. Kill switch environment variable
echo.

:cleanup
REM Clean up temporary files
del temp_deploy*.json 2>nul
echo Cleanup completed.
echo.
pause 