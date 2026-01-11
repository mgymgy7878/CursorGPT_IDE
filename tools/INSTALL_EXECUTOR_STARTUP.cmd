@echo off
rem Executor Startup klasörüne kurulum (admin gerektirmez)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%ROOT%\tools\SparkExecutorStartup.cmd"

echo ========================================
echo Executor Startup Folder Install
echo ========================================
echo.
echo This adds executor daemon to Startup folder
echo (No admin rights required)
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
copy /Y "%TARGET%" "%STARTUP%\SparkExecutorStartup.cmd" >nul
if %errorlevel%==0 (
  echo [OK] Script copied to Startup folder
) else (
  echo [ERROR] Failed to copy script
  pause
  exit /b 1
)

echo.
echo ========================================
echo Installation Complete
echo ========================================
echo.
echo ✅ Executor daemon will start automatically on user logon
echo    (No admin rights required)
echo.
echo 📍 Startup folder: %STARTUP%
echo 📄 Script: SparkExecutorStartup.cmd
echo.
echo 🔍 Manual verification:
echo    Win+R -> shell:startup
echo    (Check if SparkExecutorStartup.cmd exists)
echo.
echo 🗑️  To remove:
echo    del "%STARTUP%\SparkExecutorStartup.cmd"
echo.
echo ⚡ Next: Reboot and verify with:
echo    tools\HEALTH_EXECUTOR.cmd
echo.

pause
exit /b 0

