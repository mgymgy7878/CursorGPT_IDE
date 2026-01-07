@echo off
rem Tüm eski web-next task'larını temizler (tek otorite için)

setlocal EnableExtensions

echo ========================================
echo Cleanup: All WebNext Tasks
echo ========================================
echo.
echo Removing all old web-next related tasks...
echo.

set "REMOVED=0"
set "NOTFOUND=0"

rem Daemon
echo [1/5] Spark-WebNext-Daemon...
schtasks /Delete /TN "Spark-WebNext-Daemon" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

rem Guard Tick
echo [2/5] Spark-GuardTick-WebNext-Logon...
schtasks /Delete /TN "Spark-GuardTick-WebNext-Logon" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

echo [3/5] Spark-GuardTick-WebNext-Minute...
schtasks /Delete /TN "Spark-GuardTick-WebNext-Minute" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

rem Guard
echo [4/5] Spark-Guard-WebNext...
schtasks /Delete /TN "Spark-Guard-WebNext" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

rem Autostart
echo [5/5] Spark-Dev-WebNext...
schtasks /Delete /TN "Spark-Dev-WebNext" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

echo [5/5] Spark-Prod-WebNext...
schtasks /Delete /TN "Spark-Prod-WebNext" /F >nul 2>nul
if %errorlevel%==0 (set /a REMOVED+=1 & echo   [OK] Removed) else (set /a NOTFOUND+=1 & echo   [info] Not found)

echo.
echo ========================================
echo Cleanup Complete
echo ========================================
echo   Removed: %REMOVED% task(s)
echo   Not found: %NOTFOUND% task(s)
echo.
echo Next step: Install new daemon
echo   tools\INSTALL_WEBNEXT_DAEMON.cmd
echo.

pause
exit /b 0

