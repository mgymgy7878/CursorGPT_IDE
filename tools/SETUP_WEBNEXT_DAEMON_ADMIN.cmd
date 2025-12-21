@echo off
rem Administrator olarak çalıştırılmalı (SYSTEM task için)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "TASK=Spark-WebNext-Daemon"

echo ========================================
echo WebNext Daemon - Administrator Setup
echo ========================================
echo.
echo This script MUST be run as Administrator
echo (Right-click -> Run as Administrator)
echo.

rem Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Administrator privileges required!
  echo.
  echo Please:
  echo   1. Right-click this file
  echo   2. Select "Run as Administrator"
  echo.
  pause
  exit /b 1
)

echo [OK] Running as Administrator
echo.

echo [STEP 1/4] Cleaning old tasks...
call "%~dp0CLEANUP_ALL_WEBNEXT_TASKS.cmd"
echo.

echo [STEP 2/4] Creating SYSTEM task...
schtasks /Delete /TN "%TASK%" /F >nul 2>nul

schtasks /Create /F ^
  /TN "%TASK%" ^
  /SC ONSTART ^
  /DELAY 0000:30 ^
  /RL HIGHEST ^
  /RU "SYSTEM" ^
  /TR "cmd.exe /c \"\"%ROOT%\tools\WEBNEXT_DAEMON.cmd\"\""

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to create task. Error: %ERRORLEVEL%
  pause
  exit /b 1
)

echo [OK] Task created: %TASK%
echo.

echo [STEP 3/4] Triggering task immediately...
schtasks /Run /TN "%TASK%" >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Task triggered
) else (
  echo [warning] Could not trigger immediately
)
echo.

echo [STEP 4/4] Waiting 15 seconds for daemon to start...
timeout /t 15 /nobreak >nul
echo.

echo ========================================
echo Setup Complete
echo ========================================
echo.

echo IMPORTANT: Configure Task Scheduler
echo ----------------------------------------
echo 1. Open: taskschd.msc
echo 2. Find: %TASK%
echo 3. Right-click -> Properties
echo.
echo CONDITIONS tab - UNCHECK ALL:
echo   ☐ AC power requirements
echo   ☐ Network connection requirements
echo   ☐ Wake the computer
echo.
echo SETTINGS tab:
echo   ☐ UNCHECK "Stop the task if it runs longer than"
echo   ✅ "If the task fails, restart every: 1 minute"
echo.

echo Verification:
call "%~dp0HEALTH_WEBNEXT.cmd"

pause
exit /b 0

