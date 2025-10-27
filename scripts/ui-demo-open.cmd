@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003
set EX=http://127.0.0.1:4001

rem === timestamp & out dir ===
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui-demo\%TS%
mkdir "%OUT%" 2>nul

rem === open UI tabs ===
start "" "%UI%/"
start "" "%UI%/api/public/health"
start "" "%UI%/api/public/canary/status"
start "" "%UI%/api/public/metrics/prom"

rem (İsteğe bağlı sayfalar: var ise açar; yoksa zararsız)
start "" "%UI%/strategy-lab"
start "" "%UI%/portfolio"

rem === fetch minimal bodies for evidence ===
curl -s "%UI%/api/public/health" > "%OUT%\ui_health.json"
curl -s "%EX%/health" > "%OUT%\exec_health.json"
curl -s "%UI%/api/public/canary/status" > "%OUT%\canary_status.json"
curl -s "%UI%/api/public/metrics/prom" > "%OUT%\ui_metrics.prom"

rem === asserts → ui_codes.txt ===
(
  echo [ASSERT] ui_health has "status"
  findstr /i "\"status\"" "%OUT%\ui_health.json"
  echo [ASSERT] exec_health UP/OK
  findstr /i "UP OK" "%OUT%\exec_health.json"
  echo [ASSERT] prom has metrics
  findstr /i "http_ app_" "%OUT%\ui_metrics.prom"
) > "%OUT%\ui_codes.txt"

rem === manifest (SHA256) ===
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_health.json exec_health.json canary_status.json ui_metrics.prom ui_codes.txt) do (
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
  echo UI-DEMO-OPEN — %TS%
  echo UI=%UI%  EXEC=%EX%
  echo Opened:
  echo   %UI%/
  echo   %UI%/api/public/health
  echo   %UI%/api/public/canary/status
  echo   %UI%/api/public/metrics/prom
  echo   %UI%/strategy-lab
  echo   %UI%/portfolio
  echo Files:
  dir /b "%OUT%"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
exit /b 0 