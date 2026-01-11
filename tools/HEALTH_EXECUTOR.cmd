@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "LOGDIR=%ROOT%\tools\logs"

echo ========================================
echo Executor Daemon Health Check
echo ========================================
echo.

echo [1/4] Port 4001 Status:
echo ----------------------------------------
netstat -ano | findstr /R /C:":4001" >nul
if %errorlevel%==0 (
  echo ✅ Port 4001 is in use:
  netstat -ano | findstr /R /C:":4001"
) else (
  echo ❌ Port 4001 is NOT listening
)
echo.

echo [2/4] IPv6 Port (::1:4001):
echo ----------------------------------------
netstat -ano | findstr "::1:4001" >nul
if %errorlevel%==0 (
  echo ✅ IPv6 port active:
  netstat -ano | findstr "::1:4001"
) else (
  echo ⚠️  IPv6 port not active (may be normal)
)
echo.

echo [3/4] Startup Script:
echo ----------------------------------------
set "STARTUP_SCRIPT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SparkExecutorStartup.cmd"
if exist "%STARTUP_SCRIPT%" (
  echo ✅ Startup script exists: SparkExecutorStartup.cmd
) else (
  echo ❌ Startup script NOT found
  echo    Install: tools\INSTALL_EXECUTOR_STARTUP.cmd
)
echo.

echo [4/4] Daemon Log (last 30):
echo ----------------------------------------
set "DLOG=%LOGDIR%\executor_daemon.log"
if exist "%DLOG%" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%DLOG%'"
) else (
  echo (no daemon log)
)
echo.

echo [5/5] Runtime Log (last 30):
echo ----------------------------------------
set "ELOG=%LOGDIR%\executor_runtime.log"
if exist "%ELOG%" (
  powershell -NoProfile -Command "Get-Content -Tail 30 '%ELOG%'"
) else (
  echo (no runtime log)
)
echo.

echo ========================================
echo Health Check Complete
echo ========================================
echo.
echo Quick actions:
echo   Start daemon: start /min cmd.exe /c "tools\EXECUTOR_DAEMON.cmd"
echo   Install startup: tools\INSTALL_EXECUTOR_STARTUP.cmd
echo   Test health: curl http://127.0.0.1:4001/healthz
echo.

pause
exit /b 0

