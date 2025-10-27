@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003
set EX=http://127.0.0.1:4001
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui\%TS%
mkdir "%OUT%" 2>nul

rem ---- FETCH ----
curl -s %UI%/ > "%OUT%\ui_root.html"
curl -s %UI%/api/public/health > "%OUT%\ui_health.json"
curl -s %UI%/api/public/metrics/prom > "%OUT%\ui_metrics.prom"
curl -s %EX%/health > "%OUT%\exec_health.json"
curl -s %UI%/api/public/canary/status > "%OUT%\canary_status.json"
curl -s %UI%/api/public/canary/last-closeout > "%OUT%\canary_closeout.json"

rem ---- ASSERTS → ui_codes.txt ----
(
  echo [ASSERT] ui_root contains title or brand
  findstr /i "Spark Dashboard" "%OUT%\ui_root.html"
  echo [ASSERT] ui_health has "status"
  findstr /i "\"status\"" "%OUT%\ui_health.json"
  echo [ASSERT] metrics exposed
  findstr /i "http_ request app_ latency" "%OUT%\ui_metrics.prom"
  echo [ASSERT] exec health UP
  findstr /i "UP" "%OUT%\exec_health.json"
) > "%OUT%\ui_codes.txt"

rem ---- BODIES LOG ----
(
  echo ===== ui_root.html =====
  type "%OUT%\ui_root.html"
  echo.
  echo ===== ui_health.json =====
  type "%OUT%\ui_health.json"
  echo.
  echo ===== ui_metrics.prom =====
  type "%OUT%\ui_metrics.prom"
  echo.
  echo ===== exec_health.json =====
  type "%OUT%\exec_health.json"
  echo.
  echo ===== canary_status.json =====
  type "%OUT%\canary_status.json"
  echo.
  echo ===== canary_closeout.json =====
  type "%OUT%\canary_closeout.json"
) > "%OUT%\ui_bodies.log"

rem ---- SHA256 MANIFEST (certutil) ----
echo { > "%OUT%\sha256-manifest.json"
for %%F in (ui_root.html ui_health.json ui_metrics.prom exec_health.json canary_status.json canary_closeout.json ui_codes.txt ui_bodies.log) do (
  if exist "%OUT%\%%F" (
    for /f "tokens=1" %%H in ('certutil -hashfile "%OUT%\%%F" SHA256 ^| findstr /r "^[0-9A-F]"') do (
      set HASH=%%H
      echo   "%%F": "!HASH!", >> "%OUT%\sha256-manifest.json"
    )
  )
)
echo   "_note": "certutil SHA256" >> "%OUT%\sha256-manifest.json"
echo } >> "%OUT%\sha256-manifest.json"

rem ---- INDEX ----
(
  echo UI-INSPECT — %TS%
  echo UI=%UI%  EXEC=%EX%
  echo Files:
  dir /b "%OUT%"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
endlocal & exit /b 0 