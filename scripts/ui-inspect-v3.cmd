@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003
set EX=http://127.0.0.1:4001

rem === timestamp & out dir ===
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui\sprintB\%TS%
mkdir "%OUT%" 2>nul

rem === fetch UI data ===
curl -s "%UI%/api/public/health" > "%OUT%\ui_health.json"
curl -s "%UI%/api/public/canary/status" > "%OUT%\canary_status.json"
curl -s "%UI%/api/public/positions" > "%OUT%\positions.json"
curl -s "%UI%/api/public/evidence/latest" > "%OUT%\evidence_latest.json"
curl -s "%UI%/api/public/guardrails/status" > "%OUT%\guardrails_status.json"

rem === fetch executor data ===
curl -s "%EX%/health" > "%OUT%\exec_health.json"
curl -s "%EX%/positions" > "%OUT%\exec_positions.json"
curl -s "%EX%/evidence/latest" > "%OUT%\exec_evidence.json"

rem === HTTP status codes ===
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/positions" > "%OUT%\positions_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/evidence/latest" > "%OUT%\evidence_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/guardrails/status" > "%OUT%\guardrails_http.txt"

rem === SSE test (first line) ===
curl -s -N "%UI%/api/public/events/orders" | head -n 1 > "%OUT%\sse_orders_first.txt"
curl -s -N "%UI%/api/public/events/metrics" | head -n 1 > "%OUT%\sse_metrics_first.txt"

rem === UI control center page snapshot ===
curl -s "%UI%/control-center" > "%OUT%\control_center.html"

rem === TRIP simulation test ===
curl -s -X POST "%UI%/api/public/guardrails/simulate" -H "Content-Type: application/json" -d "{\"kind\":\"slippage\",\"level\":75}" > "%OUT%\trip_simulation.json"

rem === asserts → asserts.txt ===
(
  echo [ASSERT] UI health has "status"
  findstr /i "\"status\"" "%OUT%\ui_health.json"
  echo.
  echo [ASSERT] Executor health UP/OK
  findstr /i "UP OK" "%OUT%\exec_health.json"
  echo.
  echo [ASSERT] Positions API returns data
  findstr /i "\"positions\"\|\"summary\"" "%OUT%\positions.json"
  echo.
  echo [ASSERT] Evidence API returns nonce/step
  findstr /i "\"nonce\"\|\"step\"" "%OUT%\evidence_latest.json"
  echo.
  echo [ASSERT] Guardrails status returns tripState
  findstr /i "\"tripState\"" "%OUT%\guardrails_status.json"
  echo.
  echo [ASSERT] SSE orders stream returns data
  findstr /i "event\|data" "%OUT%\sse_orders_first.txt"
  echo.
  echo [ASSERT] SSE metrics stream returns data
  findstr /i "event\|data" "%OUT%\sse_metrics_first.txt"
  echo.
  echo [ASSERT] Control Center contains all components
  findstr /i "OrdersStream\|PositionsTable\|MetricsPanel\|EvidenceExplorer" "%OUT%\control_center.html"
  echo.
  echo [ASSERT] TRIP simulation works
  findstr /i "\"simulated\"\|\"tripState\"" "%OUT%\trip_simulation.json"
  echo.
  echo [ASSERT] HTTP codes are 200
  echo Positions: 
  type "%OUT%\positions_http.txt"
  echo Evidence:
  type "%OUT%\evidence_http.txt"
  echo Guardrails:
  type "%OUT%\guardrails_http.txt"
) > "%OUT%\asserts.txt"

rem === manifest (SHA256) ===
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_health.json canary_status.json positions.json evidence_latest.json guardrails_status.json exec_health.json exec_positions.json exec_evidence.json sse_orders_first.txt sse_metrics_first.txt control_center.html trip_simulation.json asserts.txt) do (
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
  echo UI-INSPECT v3 — Sprint B Validation
  echo ===================================
  echo TIMESTAMP: %TS%
  echo UI=%UI%  EXEC=%EX%
  echo.
  echo SPRINT B COMPONENTS TESTED:
  echo - Control Center (OrdersStream, PositionsTable, MetricsPanel, EvidenceExplorer)
  echo - SSE Streams (Orders, Metrics)
  echo - API Proxies (Positions, Evidence, Guardrails)
  echo - TRIP Simulation (Banner + Kill-switch)
  echo.
  echo Files:
  dir /b "%OUT%"
  echo.
  echo ASSERT RESULTS:
  type "%OUT%\asserts.txt"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
echo SPRINT B UI-INSPECT v3 completed
exit /b 0 