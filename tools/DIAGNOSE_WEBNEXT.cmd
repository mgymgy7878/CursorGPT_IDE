@echo off
rem Kapsamlı teşhis: port, task, log, process

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "LOGDIR=%ROOT%\tools\logs"

echo ========================================
echo WebNext Daemon - Full Diagnosis
echo ========================================
echo.

echo [1/7] Port 3003 Status:
echo ----------------------------------------
netstat -ano | findstr /R /C:":3003" >nul
if %errorlevel%==0 (
  echo ✅ Port 3003 is in use:
  netstat -ano | findstr /R /C:":3003"
) else (
  echo ❌ Port 3003 is NOT listening
)
echo.

echo [2/7] IPv6 Port (::1:3003):
echo ----------------------------------------
netstat -ano | findstr "::1:3003" >nul
if %errorlevel%==0 (
  echo ✅ IPv6 port active:
  netstat -ano | findstr "::1:3003"
) else (
  echo ⚠️  IPv6 port not active (may be normal)
)
echo.

echo [3/7] Task Scheduler - Spark-WebNext-Daemon:
echo ----------------------------------------
schtasks /Query /TN "Spark-WebNext-Daemon" /V /FO LIST >nul 2>nul
if %errorlevel%==0 (
  echo ✅ Task exists:
  schtasks /Query /TN "Spark-WebNext-Daemon" /V /FO LIST | findstr /C:"Task Name" /C:"Status" /C:"Last Run Result" /C:"Next Run Time" /C:"Last Run Time"
) else (
  echo ❌ Task NOT found
  echo    Install: tools\INSTALL_WEBNEXT_DAEMON.cmd (as Administrator)
)
echo.

echo [4/7] Other WebNext Tasks:
echo ----------------------------------------
set "FOUND=0"
for %%T in ("Spark-GuardTick-WebNext-Logon" "Spark-GuardTick-WebNext-Minute" "Spark-Guard-WebNext" "Spark-Dev-WebNext" "Spark-Prod-WebNext") do (
  schtasks /Query /TN %%~T /V /FO LIST >nul 2>nul
  if !errorlevel!==0 (
    echo ⚠️  Found old task: %%~T
    set "FOUND=1"
  )
)
if !FOUND!==0 (
  echo ✅ No conflicting tasks found
) else (
  echo    Cleanup: tools\CLEANUP_ALL_WEBNEXT_TASKS.cmd
)
echo.

echo [5/7] Daemon Log:
echo ----------------------------------------
set "DLOG=%LOGDIR%\webnext_daemon.log"
if exist "%DLOG%" (
  echo ✅ Log file exists: %DLOG%
  echo    Last 20 lines:
  powershell -NoProfile -Command "Get-Content -Tail 20 '%DLOG%' | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo ❌ Daemon log not found
  echo    Daemon may not have started yet
)
echo.

echo [6/7] Runtime Log:
echo ----------------------------------------
set "NLOG=%LOGDIR%\webnext_runtime.log"
if exist "%NLOG%" (
  echo ✅ Runtime log exists: %NLOG%
  echo    Last 20 lines:
  powershell -NoProfile -Command "Get-Content -Tail 20 '%NLOG%' | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo ⚠️  Runtime log not found
  echo    Web-next may not have started yet
)
echo.

echo [7/7] Node.js Processes:
echo ----------------------------------------
tasklist | findstr /I "node.exe" >nul
if %errorlevel%==0 (
  echo ✅ Node.js processes running:
  tasklist | findstr /I "node.exe"
) else (
  echo ⚠️  No Node.js processes found
)
echo.

echo ========================================
echo Diagnosis Complete
echo ========================================
echo.
echo Quick actions:
echo   Test setup: tools\TEST_DAEMON_SETUP.cmd
echo   Install: tools\INSTALL_WEBNEXT_DAEMON.cmd (as Administrator)
echo   Health: tools\HEALTH_WEBNEXT.cmd
echo   Manual start: tools\WEBNEXT_DAEMON.cmd
echo.

pause
exit /b 0

