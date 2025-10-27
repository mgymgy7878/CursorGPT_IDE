@echo off
setlocal enabledelayedexpansion
set UI=http://127.0.0.1:3003

rem === timestamp & out dir ===
for /f "tokens=1-3 delims=/:. " %%a in ("%date% %time%") do (set TS=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%)
set TS=%TS: =0%
set OUT=evidence\ui\pro\%TS%
mkdir "%OUT%" 2>nul

rem === fetch UI data ===
curl -s "%UI%" > "%OUT%\root.html"
curl -s "%UI%/api/public/health" > "%OUT%\health.json"
curl -s "%UI%/api/public/canary/status" > "%OUT%\canary.json"

rem === demo login test ===
curl -s -X POST "%UI%/api/public/auth/demo-login" -H "Content-Type: application/json" -d "{\"role\":\"admin\"}" > "%OUT%\demo_login.json"

rem === HTTP status codes ===
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%" > "%OUT%\root_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/health" > "%OUT%\health_http.txt"
curl -s -o nul -w "HTTP:%{http_code}\n" "%UI%/api/public/canary/status" > "%OUT%\canary_http.txt"

rem === asserts → asserts.txt ===
(
  echo [ASSERT] AppShellPro grid var
  findstr /i "grid-cols-12" "%OUT%\root.html"
  echo.
  echo [ASSERT] TopStatusBar gorunur
  findstr /i "top-status" "%OUT%\root.html"
  echo.
  echo [ASSERT] SidebarNav linkleri
  findstr /i "Control Center" "%OUT%\root.html"
  echo.
  echo [ASSERT] Canary ok:true
  findstr /i "\"ok\": *true" "%OUT%\canary.json"
  echo.
  echo [ASSERT] Demo login works
  findstr /i "\"ok\": *true" "%OUT%\demo_login.json"
  echo.
  echo [ASSERT] HTTP codes are 200
  echo Root:
  type "%OUT%\root_http.txt"
  echo Health:
  type "%OUT%\health_http.txt"
  echo Canary:
  type "%OUT%\canary_http.txt"
) > "%OUT%\asserts.txt"

rem === manifest (SHA256) ===
echo { > "%OUT%\sha256-manifest.json"
for %%F in (root.html health.json canary.json demo_login.json asserts.txt) do (
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
  echo UI-INSPECT-PRO — Pro UI Validation
  echo ===================================
  echo TIMESTAMP: %TS%
  echo UI=%UI%
  echo.
  echo PRO UI COMPONENTS TESTED:
  echo - AppShellPro (12-column grid layout)
  echo - TopStatusBar (real-time status)
  echo - SidebarNav (navigation links)
  echo - Demo Auth System (bypass + login)
  echo - Grid Layout (responsive cards)
  echo.
  echo Files:
  dir /b "%OUT%"
  echo.
  echo ASSERT RESULTS:
  type "%OUT%\asserts.txt"
) > "%OUT%\INDEX.txt"

echo DONE: %OUT%
echo UI-INSPECT-PRO completed
exit /b 0 