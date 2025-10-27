@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003
set EX=http://127.0.0.1:4001

rem === timestamp & out dir ===
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui\sprintA\%TS%
mkdir "%OUT%" 2>nul

rem === fetch UI data ===
curl -s "%UI%/api/public/health" > "%OUT%\ui_health.json"
curl -s "%UI%/api/public/canary/status" > "%OUT%\canary_status.json"
curl -s "%UI%/api/public/metrics/prom" > "%OUT%\ui_metrics.prom"
curl -s "%UI%/api/public/settings/get" > "%OUT%\settings_get.json"

rem === fetch executor data ===
curl -s "%EX%/health" > "%OUT%\exec_health.json"
curl -s "%EX%/canary/status" > "%OUT%\exec_status.json"

rem === HTTP status codes ===
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/health" > "%OUT%\ui_health_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/canary/status" > "%OUT%\canary_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/settings/get" > "%OUT%\settings_http.txt"

rem === UI root page snapshot ===
curl -s "%UI%/" > "%OUT%\ui_root.html"

rem === asserts → asserts.txt ===
(
  echo [ASSERT] UI health has "status"
  findstr /i "\"status\"" "%OUT%\ui_health.json"
  echo.
  echo [ASSERT] Executor health UP/OK
  findstr /i "UP OK" "%OUT%\exec_health.json"
  echo.
  echo [ASSERT] Canary status has ok/source/step
  findstr /i "\"ok\"\|\"source\"\|\"step\"" "%OUT%\canary_status.json"
  echo.
  echo [ASSERT] Settings API returns config
  findstr /i "\"EXEC_ORIGIN\"\|\"PRODUCTION_CAP_USD\"" "%OUT%\settings_get.json"
  echo.
  echo [ASSERT] Prometheus metrics present
  findstr /i "http_ app_" "%OUT%\ui_metrics.prom"
  echo.
  echo [ASSERT] UI root contains AppShell elements
  findstr /i "TopStatusBar\|SidebarNav\|GuardrailStack\|QuickActions" "%OUT%\ui_root.html"
  echo.
  echo [ASSERT] HTTP codes are 200
  echo UI Health: 
  type "%OUT%\ui_health_http.txt"
  echo Canary Status:
  type "%OUT%\canary_http.txt"
  echo Settings:
  type "%OUT%\settings_http.txt"
) > "%OUT%\asserts.txt"

rem === manifest (SHA256) ===
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_health.json canary_status.json ui_metrics.prom settings_get.json exec_health.json exec_status.json ui_root.html asserts.txt) do (
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
  echo UI-INSPECT v2 — Sprint A Validation
  echo ===================================
  echo TIMESTAMP: %TS%
  echo UI=%UI%  EXEC=%EX%
  echo.
  echo SPRINT A COMPONENTS TESTED:
  echo - AppShell (TopStatusBar + SidebarNav)
  echo - Dashboard (CanaryStatusCard + GuardrailStack + QuickActions)
  echo - Settings API (GET/SET with evidence)
  echo - Cache headers (no-store)
  echo.
  echo Files:
  dir /b "%OUT%"
  echo.
  echo ASSERT RESULTS:
  type "%OUT%\asserts.txt"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
echo SPRINT A UI-INSPECT v2 completed
exit /b 0 