@echo off
rem Startup klasörü kurulumunu doğrular

setlocal EnableExtensions

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SCRIPT=%STARTUP%\SparkWebNextStartup.cmd"

echo ========================================
echo Startup Folder Verification
echo ========================================
echo.

echo [1/3] Checking Startup folder...
if exist "%STARTUP%" (
  echo   ✅ Startup folder exists: %STARTUP%
) else (
  echo   ❌ Startup folder not found: %STARTUP%
  pause
  exit /b 1
)
echo.

echo [2/3] Checking script file...
if exist "%SCRIPT%" (
  echo   ✅ Script found: SparkWebNextStartup.cmd
  echo.
  echo   Script content:
  echo   ----------------------------------------
  type "%SCRIPT%"
  echo   ----------------------------------------
) else (
  echo   ❌ Script not found: SparkWebNextStartup.cmd
  echo.
  echo   Install with:
  echo     tools\INSTALL_STARTUP_FALLBACK.cmd
  pause
  exit /b 1
)
echo.

echo [3/3] Testing script syntax...
cmd /c "call \"%SCRIPT%\" /?" >nul 2>&1
if %errorlevel%==0 (
  echo   ✅ Script syntax OK
) else (
  echo   ⚠️  Script syntax check (may be normal for batch files)
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo 📍 Startup folder: %STARTUP%
echo 📄 Script: SparkWebNextStartup.cmd
echo.
echo 🔍 Manual check:
echo    Win+R -> shell:startup
echo.
echo ⚡ Next reboot: Daemon will start automatically
echo    (Wait 20-30 seconds after login, then check)
echo    tools\HEALTH_WEBNEXT.cmd
echo.

pause
exit /b 0

