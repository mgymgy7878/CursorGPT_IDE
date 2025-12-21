@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "TASK=Spark-WebNext-Daemon"

echo ========================================
echo Spark WebNext Daemon - SYSTEM Install
echo ========================================
echo.
echo [1/3] Cleaning old tasks...
schtasks /Delete /TN "%TASK%" /F >nul 2>nul
if %errorlevel%==0 (
  echo   [OK] Old daemon task removed
) else (
  echo   [info] No old daemon task found
)
echo.

echo [2/3] Creating SYSTEM task with ONSTART trigger...
echo   Task: %TASK%
echo   Trigger: ONSTART (30s delay)
echo   Account: SYSTEM (bypasses user profile/PATH issues)
echo.

schtasks /Create /F ^
  /TN "%TASK%" ^
  /SC ONSTART ^
  /DELAY 0000:30 ^
  /RL HIGHEST ^
  /RU "SYSTEM" ^
  /TR "cmd.exe /c \"\"%ROOT%\tools\WEBNEXT_DAEMON.cmd\"\""

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Failed to create task. Error: %ERRORLEVEL%
  echo [info] Make sure you're running as Administrator
  pause
  exit /b 1
)

echo   [OK] Task created successfully
echo.

echo [3/3] Triggering task immediately...
schtasks /Run /TN "%TASK%" >nul 2>nul
if %errorlevel%==0 (
  echo   [OK] Task triggered (check in 15 seconds)
) else (
  echo   [warning] Could not trigger immediately (may need manual start)
)
echo.

echo ========================================
echo Installation Complete
echo ========================================
echo.
echo IMPORTANT: Task Scheduler Configuration
echo ----------------------------------------
echo 1. Open: taskschd.msc
echo 2. Find: %TASK%
echo 3. Right-click -^> Properties
echo.
echo CONDITIONS tab - UNCHECK ALL:
echo   ☐ AC power requirements
echo   ☐ Network connection requirements
echo   ☐ Wake the computer
echo.
echo SETTINGS tab:
echo   ☐ UNCHECK "Stop the task if it runs longer than"
echo   ✅ "If the task fails, restart every: 1 minute" (3 attempts)
echo.
echo ========================================
echo.
echo Quick verification (wait 15 seconds first):
echo   tools\HEALTH_WEBNEXT.cmd
echo.
echo Manual trigger:
echo   schtasks /Run /TN "%TASK%"
echo.
echo Uninstall:
echo   tools\UNINSTALL_WEBNEXT_DAEMON.cmd
echo.

pause
exit /b 0
