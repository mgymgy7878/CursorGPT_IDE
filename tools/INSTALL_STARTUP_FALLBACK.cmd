@echo off
rem Fast Startup sigortası: Startup klasörüne kısayol ekler
rem Task Scheduler ONSTART bazen Fast Startup'da tutarsız olabilir

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%ROOT%\tools\SparkWebNextStartup.cmd"

echo ========================================
echo Startup Folder Fallback Install
echo ========================================
echo.
echo This adds a fallback startup script to ensure daemon starts
echo even if Task Scheduler ONSTART fails (Fast Startup issue).
echo.
echo Target: %TARGET%
echo Startup: %STARTUP%
echo.

if not exist "%STARTUP%" (
  echo [ERROR] Startup folder not found: %STARTUP%
  pause
  exit /b 1
)

rem Copy script to startup folder
copy /Y "%TARGET%" "%STARTUP%\SparkWebNextStartup.cmd" >nul
if %errorlevel%==0 (
  echo [OK] Script copied to Startup folder
) else (
  echo [ERROR] Failed to copy script
  pause
  exit /b 1
)

echo.
echo.
echo ========================================
echo Installation Complete
echo ========================================
echo.
echo ✅ Daemon will start automatically on user logon
echo    (No admin rights required)
echo.
echo 📍 Startup folder: %STARTUP%
echo 📄 Script: SparkWebNextStartup.cmd
echo.
echo 🔍 Manual verification:
echo    Win+R -> shell:startup
echo    (Check if SparkWebNextStartup.cmd exists)
echo.
echo 🗑️  To remove:
echo    del "%STARTUP%\SparkWebNextStartup.cmd"
echo.
echo ⚡ Next: Reboot and verify with:
echo    tools\HEALTH_WEBNEXT.cmd
echo.

pause
exit /b 0

