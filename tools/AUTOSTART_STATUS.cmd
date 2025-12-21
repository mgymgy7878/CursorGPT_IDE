@echo off
rem Autostart durumunu tek bakışta gösterir (tek otorite kontrolü)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_SCRIPT=%STARTUP%\SparkWebNextStartup.cmd"

echo ========================================
echo WebNext Autostart Status
echo ========================================
echo.

echo [1/4] Startup Folder (Primary - Recommended):
if exist "%STARTUP_SCRIPT%" (
  echo   ✅ ACTIVE: SparkWebNextStartup.cmd
  echo      Location: %STARTUP_SCRIPT%
) else (
  echo   ❌ NOT FOUND: SparkWebNextStartup.cmd
  echo      Install: tools\INSTALL_STARTUP_FALLBACK.cmd
)
echo.

echo [2/4] Task Scheduler Tasks (Should be empty):
set "FOUND_TASK=0"
for %%T in ("Spark-WebNext-Daemon" "Spark-WebNext-Daemon-User" "Spark-GuardTick-WebNext-Logon" "Spark-GuardTick-WebNext-Minute" "Spark-Guard-WebNext" "Spark-Dev-WebNext" "Spark-Prod-WebNext") do (
  schtasks /Query /TN %%~T /V /FO LIST >nul 2>nul
  if !errorlevel!==0 (
    echo   ⚠️  Found: %%~T
    set "FOUND_TASK=1"
  )
)
if !FOUND_TASK!==0 (
  echo   ✅ No conflicting tasks found (clean)
) else (
  echo   ⚠️  Cleanup recommended: tools\CLEANUP_ALL_WEBNEXT_TASKS.cmd
)
echo.

echo [3/4] Current Port Status:
netstat -ano | findstr /R /C:":3003 .*LISTENING" >nul
if %errorlevel%==0 (
  echo   ✅ Port 3003 is LISTENING
  netstat -ano | findstr /R /C:":3003 .*LISTENING"
) else (
  echo   ❌ Port 3003 is NOT listening
  echo      Start: start /min cmd.exe /c "tools\WEBNEXT_DAEMON.cmd"
)
echo.

echo [4/4] Daemon Log (last check):
set "DLOG=%ROOT%\tools\logs\webnext_daemon.log"
if exist "%DLOG%" (
  echo   ✅ Log exists
  for /f "tokens=*" %%L in ('powershell -NoProfile -Command "Get-Content -Tail 1 '%DLOG%' 2>nul"') do (
    echo      Last entry: %%L
  )
) else (
  echo   ⚠️  No daemon log (daemon may not have run yet)
)
echo.

echo ========================================
echo Summary
echo ========================================
echo.
echo ✅ Recommended setup: Startup Folder only
echo    (No Task Scheduler, no guards, single authority)
echo.
echo 📋 After reboot:
echo    1. Login
echo    2. Wait 20-30 seconds
echo    3. Check: tools\HEALTH_WEBNEXT.cmd
echo    4. Verify: netstat -ano ^| findstr :3003
echo.
echo 🔧 If port not listening:
echo    - Check: tools\logs\webnext_daemon.log
echo    - Check: tools\logs\webnext_runtime.log
echo    - Fast Startup: powercfg /h off
echo.

pause
exit /b 0

