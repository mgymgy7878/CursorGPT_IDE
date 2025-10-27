@echo off
setlocal
set BASE=docs\evidence\dev\v2.2-ui
set WEB_PORT=3003
for /f "delims=" %%d in ('dir /b /ad /od "%BASE%\run_*"') do set LAST=%%d
if not "%LAST%"=="" (
  if exist "%BASE%\%LAST%\WEB_PORT.txt" (
    for /f %%p in ("%BASE%\%LAST%\WEB_PORT.txt") do set /p WEB_PORT=<"%BASE%\%LAST%\WEB_PORT.txt"
  )
)
echo [open-ui] WEB_PORT=%WEB_PORT%
start "" "http://127.0.0.1:%WEB_PORT%/ops"
endlocal
