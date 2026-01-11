@echo off
rem WebNext + Executor birlikte sağlık kontrolü

setlocal EnableExtensions

echo ========================================
echo Spark Trading - Full Health Check
echo ========================================
echo.

echo [1/3] WebNext (Port 3003):
echo ----------------------------------------
netstat -ano | findstr /R /C:":3003 .*LISTENING" >nul
if %errorlevel%==0 (
  echo ✅ Port 3003 is LISTENING
  netstat -ano | findstr /R /C:":3003 .*LISTENING"
) else (
  echo ❌ Port 3003 is NOT listening
  echo    Start: start /min cmd.exe /c "tools\WEBNEXT_DAEMON.cmd"
)
echo.

echo [2/3] Executor (Port 4001):
echo ----------------------------------------
netstat -ano | findstr /R /C:":4001 .*LISTENING" >nul
if %errorlevel%==0 (
  echo ✅ Port 4001 is LISTENING
  netstat -ano | findstr /R /C:":4001 .*LISTENING"
) else (
  echo ❌ Port 4001 is NOT listening
  echo    Start: start /min cmd.exe /c "tools\EXECUTOR_DAEMON.cmd"
)
echo.

echo [3/3] Startup Scripts:
echo ----------------------------------------
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "WEB_SCRIPT=%STARTUP%\SparkWebNextStartup.cmd"
set "EXEC_SCRIPT=%STARTUP%\SparkExecutorStartup.cmd"

if exist "%WEB_SCRIPT%" (
  echo ✅ WebNext startup: SparkWebNextStartup.cmd
) else (
  echo ❌ WebNext startup NOT found
  echo    Install: tools\INSTALL_STARTUP_FALLBACK.cmd
)

if exist "%EXEC_SCRIPT%" (
  echo ✅ Executor startup: SparkExecutorStartup.cmd
) else (
  echo ❌ Executor startup NOT found
  echo    Install: tools\INSTALL_EXECUTOR_STARTUP.cmd
)
echo.

echo ========================================
echo Summary
echo ========================================
echo.
if exist "%WEB_SCRIPT%" if exist "%EXEC_SCRIPT%" (
  echo ✅ Both daemons configured for autostart
) else (
  echo ⚠️  Some daemons missing from Startup folder
)
echo.
echo 📋 Quick actions:
echo    WebNext health: tools\HEALTH_WEBNEXT.cmd
echo    Executor health: tools\HEALTH_EXECUTOR.cmd
echo    Install both: tools\INSTALL_BOTH_STARTUP.cmd
echo.
echo 🌐 Access:
echo    Dashboard: http://127.0.0.1:3003/dashboard
echo    Executor health: http://127.0.0.1:4001/healthz
echo.

pause
exit /b 0

