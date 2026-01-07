@echo off
rem 10 saniyelik teşhis (kullanıcının istediği format)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "LOGDIR=%ROOT%\tools\logs"

echo ========================================
echo WebNext Quick Diagnosis
echo ========================================
echo.

echo [1/5] Port 3003:
netstat -ano | findstr :3003
if %errorlevel%==0 (
  echo   ✅ Port 3003 is LISTENING
) else (
  echo   ❌ Port 3003 is NOT listening
)
echo.

echo [2/5] Task Status:
schtasks /Query /TN "Spark-WebNext-Daemon-User" /V /FO LIST 2>nul | findstr /C:"Task Name" /C:"Status" /C:"Last Run Result" /C:"Next Run Time" /C:"Last Run Time"
if %errorlevel%==0 (
  echo   ✅ Task exists
) else (
  echo   ❌ Task NOT found
)
echo.

echo [3/5] Log Directory:
dir "%LOGDIR%" 2>nul | findstr /C:"webnext"
if %errorlevel%==0 (
  echo   ✅ Log directory exists
) else (
  echo   ⚠️  Log directory empty or missing
)
echo.

echo [4/5] Daemon Log (last 30):
if exist "%LOGDIR%\webnext_daemon.log" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%LOGDIR%\webnext_daemon.log' | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo   (no daemon log)
)
echo.

echo [5/5] Runtime Log (last 30):
if exist "%LOGDIR%\webnext_runtime.log" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%LOGDIR%\webnext_runtime.log' | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo   (no runtime log)
)
echo.

echo ========================================
echo Diagnosis Complete
echo ========================================
echo.
echo Quick actions:
echo   Start daemon: start /min cmd.exe /c "tools\WEBNEXT_DAEMON.cmd"
echo   Install task: tools\INSTALL_WEBNEXT_DAEMON_USER.cmd
echo   Full health: tools\HEALTH_WEBNEXT.cmd
echo.

pause
exit /b 0
