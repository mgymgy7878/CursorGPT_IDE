@echo off
setlocal
set TASK_NAME=Spark-Dev-WebNext
set SCRIPT_DIR=%~dp0
set BOOT=%SCRIPT_DIR%BOOT_DEV.cmd

echo [install] Installing autostart task: %TASK_NAME%
echo [install] Boot script: %BOOT%

REM Create scheduled task (runs 15 seconds after logon)
REM Note: Pass "task" parameter to indicate running from Task Scheduler
schtasks /Create ^
  /TN "%TASK_NAME%" ^
  /TR "cmd.exe /c \"\"%BOOT%\" task\"" ^
  /SC ONLOGON ^
  /DELAY 0000:15 ^
  /RL HIGHEST ^
  /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Task created successfully: %TASK_NAME%
    echo [info] Task will run 15 seconds after Windows login
    echo.
    echo To verify: schtasks /Query /TN "%TASK_NAME%" /V /FO LIST
    echo To remove: schtasks /Delete /TN "%TASK_NAME%" /F
) else (
    echo.
    echo [ERROR] Failed to create task. Error code: %ERRORLEVEL%
    echo [info] Try running as Administrator
)

pause

