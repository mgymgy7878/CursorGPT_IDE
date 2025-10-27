@echo off
setlocal enabledelayedexpansion

echo ========================================
echo SPARK STRATEGY PIPELINE - BACKTEST RUN
echo ========================================
echo.

set EXECUTOR_URL=http://127.0.0.1:4001
set AUTH_TOKEN=dev-secret-change-me

echo Testing Strategy Pipeline Backtest...
echo.

REM Test MA Cross Strategy
echo [1/3] Testing MA Cross Strategy...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/backtest" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-MACROSS-TEST\",\"symbol\":\"BTCUSDT\",\"initialCapital\":10000}" > temp_ma.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to test MA Cross strategy
    goto :error
)

REM Test RSI Reversal Strategy  
echo [2/3] Testing RSI Reversal Strategy...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/backtest" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-RSIREV-TEST\",\"symbol\":\"ETHUSDT\",\"initialCapital\":10000}" > temp_rsi.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to test RSI Reversal strategy
    goto :error
)

REM Test Breakout Strategy
echo [3/3] Testing Breakout Strategy...
curl -s -X POST "%EXECUTOR_URL%/api/public/strategy/backtest" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %AUTH_TOKEN%" ^
  -d "{\"artifactId\":\"ART-BREAKOUT-TEST\",\"symbol\":\"ADAUSDT\",\"initialCapital\":10000}" > temp_breakout.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to test Breakout strategy
    goto :error
)

echo.
echo ========================================
echo BACKTEST RESULTS SUMMARY
echo ========================================
echo.

REM Parse and display results
for %%f in (temp_*.json) do (
    echo Processing %%f...
    for /f "tokens=*" %%i in ('type %%f ^| findstr "totalReturn\|maxDrawdown\|winRate\|sharpeRatio"') do (
        echo   %%i
    )
    echo.
)

echo ========================================
echo BACKTEST COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo All 3 reference strategies tested:
echo - MA Cross Strategy (BTCUSDT)
echo - RSI Reversal Strategy (ETHUSDT) 
echo - Breakout Strategy (ADAUSDT)
echo.
echo Check temp_*.json files for detailed results.
echo.

goto :cleanup

:error
echo.
echo ========================================
echo BACKTEST FAILED
echo ========================================
echo.
echo Please check:
echo 1. Executor service is running on port 4001
echo 2. Authentication token is correct
echo 3. Network connectivity
echo.

:cleanup
REM Clean up temporary files
del temp_*.json 2>nul
echo Cleanup completed.
echo.
pause 