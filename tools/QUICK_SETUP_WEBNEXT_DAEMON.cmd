@echo off
rem Tek hamlede tüm kurulum: cleanup + install + verification

setlocal EnableExtensions

echo ========================================
echo Quick Setup: WebNext Daemon
echo ========================================
echo.
echo This will:
echo   1. Clean up all old tasks
echo   2. Install SYSTEM daemon (ONSTART)
echo   3. Optionally install Startup fallback
echo.

pause

echo.
echo [STEP 1/3] Cleaning old tasks...
call "%~dp0CLEANUP_ALL_WEBNEXT_TASKS.cmd"
echo.

echo [STEP 2/3] Installing SYSTEM daemon...
call "%~dp0INSTALL_WEBNEXT_DAEMON.cmd"
echo.

echo [STEP 3/3] Startup fallback (optional)...
echo.
echo Do you want to install Startup folder fallback?
echo (Recommended if Fast Startup is enabled)
echo.
set /p INSTALL_STARTUP="Install? (Y/N): "
if /i "%INSTALL_STARTUP%"=="Y" (
  call "%~dp0INSTALL_STARTUP_FALLBACK.cmd"
) else (
  echo [skip] Startup fallback skipped
)
echo.

echo ========================================
echo Setup Complete
echo ========================================
echo.
echo Wait 15 seconds, then verify:
echo   tools\HEALTH_WEBNEXT.cmd
echo.
echo Or check manually:
echo   netstat -ano ^| findstr :3003
echo   http://127.0.0.1:3003/dashboard
echo.

pause
exit /b 0

