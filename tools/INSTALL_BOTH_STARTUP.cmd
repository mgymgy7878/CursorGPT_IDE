@echo off
rem WebNext + Executor birlikte Startup klasörüne kurulum

setlocal EnableExtensions

echo ========================================
echo Install Both: WebNext + Executor
echo ========================================
echo.
echo This will install both daemons to Startup folder:
echo   1. WebNext (port 3003)
echo   2. Executor (port 4001)
echo.

pause

echo.
echo [STEP 1/2] Installing WebNext startup...
call "%~dp0INSTALL_STARTUP_FALLBACK.cmd"
echo.

echo [STEP 2/2] Installing Executor startup...
call "%~dp0INSTALL_EXECUTOR_STARTUP.cmd"
echo.

echo ========================================
echo Installation Complete
echo ========================================
echo.
echo ✅ Both daemons will start automatically on user logon
echo.
echo 📋 After reboot (wait 20-30 seconds after login):
echo    tools\HEALTH_WEBNEXT.cmd
echo    tools\HEALTH_EXECUTOR.cmd
echo.
echo 🔍 Manual verification:
echo    Win+R -> shell:startup
echo    (Should see both SparkWebNextStartup.cmd and SparkExecutorStartup.cmd)
echo.

pause
exit /b 0

