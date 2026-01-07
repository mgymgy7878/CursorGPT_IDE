@echo off
rem Otomatik kurulum (pause yok, Administrator gerekli)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "TASK=Spark-WebNext-Daemon"

echo [install] Creating SYSTEM task: %TASK%

rem Clean old task
schtasks /Delete /TN "%TASK%" /F >nul 2>nul

rem Create SYSTEM task with ONSTART
schtasks /Create /F ^
  /TN "%TASK%" ^
  /SC ONSTART ^
  /DELAY 0000:30 ^
  /RL HIGHEST ^
  /RU "SYSTEM" ^
  /TR "cmd.exe /c \"\"%ROOT%\tools\WEBNEXT_DAEMON.cmd\"\""

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Failed to create task. Error: %ERRORLEVEL%
  echo [info] Run as Administrator
  exit /b 1
)

echo [OK] Task created: %TASK%

rem Trigger immediately
schtasks /Run /TN "%TASK%" >nul 2>nul
if %errorlevel%==0 (
  echo [OK] Task triggered
) else (
  echo [warning] Could not trigger immediately
)

echo.
echo IMPORTANT: Configure Task Scheduler:
echo   taskschd.msc -> %TASK% -> Properties
echo   Conditions: UNCHECK all
echo   Settings: UNCHECK "Stop if runs longer than"
echo.

exit /b 0

