@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003
set EX=http://127.0.0.1:4001

rem === timestamp & out dir ===
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui\sprintC\%TS%
mkdir "%OUT%" 2>nul

rem === fetch UI data ===
curl -s "%UI%/api/public/health" > "%OUT%\ui_health.json"
curl -s "%UI%/api/public/canary/status" > "%OUT%\canary_status.json"
curl -s "%UI%/api/public/portfolio/summary" > "%OUT%\portfolio_summary.json"

rem === fetch executor data ===
curl -s "%EX%/health" > "%OUT%\exec_health.json"
curl -s "%EX%/portfolio/summary" > "%OUT%\exec_portfolio.json"

rem === HTTP status codes ===
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/portfolio/summary" > "%OUT%\portfolio_http.txt"

rem === Lab backtest test ===
curl -s -X POST "%UI%/api/public/lab/backtest" -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"timeframe\":\"1m\",\"from\":\"2024-01-01\",\"to\":\"2024-01-02\",\"strategy\":{\"name\":\"MA_Cross_Regime\",\"params\":{\"fastMA\":20,\"slowMA\":100}}}" > "%OUT%\lab_backtest.json"

rem === Lab optimize test ===
curl -s -X POST "%UI%/api/public/lab/optimize" -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"timeframe\":\"1h\",\"paramGrid\":[{\"fastMA\":10,\"slowMA\":50},{\"fastMA\":20,\"slowMA\":100},{\"fastMA\":30,\"slowMA\":150}]}" > "%OUT%\lab_optimize.json"

rem === UI pages snapshot ===
curl -s "%UI%/strategy-lab" > "%OUT%\strategy_lab.html"
curl -s "%UI%/portfolio" > "%OUT%\portfolio.html"

rem === asserts → asserts.txt ===
(
  echo [ASSERT] UI health has "status"
  findstr /i "\"status\"" "%OUT%\ui_health.json"
  echo.
  echo [ASSERT] Executor health UP/OK
  findstr /i "UP OK" "%OUT%\exec_health.json"
  echo.
  echo [ASSERT] Portfolio API returns data
  findstr /i "\"totalNotional\"\|\"bySymbol\"" "%OUT%\portfolio_summary.json"
  echo.
  echo [ASSERT] Lab backtest returns stats
  findstr /i "\"stats\"\|\"sharpe\"" "%OUT%\lab_backtest.json"
  echo.
  echo [ASSERT] Lab optimize returns results
  findstr /i "\"results\"\|\"params\"" "%OUT%\lab_optimize.json"
  echo.
  echo [ASSERT] Strategy Lab page contains components
  findstr /i "ParameterForm\|ResultTable\|EquityChart" "%OUT%\strategy_lab.html"
  echo.
  echo [ASSERT] Portfolio page contains components
  findstr /i "PortfolioSummary\|SymbolExposure" "%OUT%\portfolio.html"
  echo.
  echo [ASSERT] HTTP codes are 200
  echo Portfolio:
  type "%OUT%\portfolio_http.txt"
) > "%OUT%\asserts.txt"

rem === manifest (SHA256) ===
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_health.json canary_status.json portfolio_summary.json exec_health.json exec_portfolio.json lab_backtest.json lab_optimize.json strategy_lab.html portfolio.html asserts.txt) do (
  if exist "%OUT%\%%F" (
    for /f "tokens=1" %%H in ('certutil -hashfile "%OUT%\%%F" SHA256 ^| findstr /r "^[0-9A-F]"') do (
      set HASH=%%H
      echo   "%%F": "!HASH!", >> "%OUT%\sha256-manifest.json"
    )
  )
)
echo   "_note": "certutil SHA256" >> "%OUT%\sha256-manifest.json"
echo } >> "%OUT%\sha256-manifest.json"

rem === index ===
(
  echo UI-INSPECT v4 — Sprint C Validation
  echo ===================================
  echo TIMESTAMP: %TS%
  echo UI=%UI%  EXEC=%EX%
  echo.
  echo SPRINT C COMPONENTS TESTED:
  echo - Strategy Lab (ParameterForm, ResultTable, EquityChart)
  echo - Portfolio (PortfolioSummary, SymbolExposure)
  echo - Lab API (Backtest, Optimize)
  echo - Portfolio API (Summary)
  echo.
  echo Files:
  dir /b "%OUT%"
  echo.
  echo ASSERT RESULTS:
  type "%OUT%\asserts.txt"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
echo SPRINT C UI-INSPECT v4 completed
exit /b 0 