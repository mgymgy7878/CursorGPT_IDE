@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "LOGDIR=%ROOT%\tools\logs"

echo === PORT 3003 ===
netstat -ano | findstr :3003
echo.
echo IPv6 check (::1:3003):
netstat -ano | findstr "::1:3003"

echo.
echo === TASK ===
schtasks /Query /TN "Spark-WebNext-Daemon" /V /FO LIST

echo.
echo === DAEMON LOG (last 30) ===
if exist "%LOGDIR%\webnext_daemon.log" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%LOGDIR%\webnext_daemon.log'"
) else (
  echo (no daemon log)
)

echo.
echo === RUNTIME LOG (last 30) ===
if exist "%LOGDIR%\webnext_runtime.log" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%LOGDIR%\webnext_runtime.log'"
) else (
  echo (no runtime log)
)

pause
exit /b 0
