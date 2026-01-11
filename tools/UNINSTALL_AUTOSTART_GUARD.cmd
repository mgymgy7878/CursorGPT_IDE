@echo off
setlocal

set "TASK=Spark-Guard-WebNext"

echo [uninstall] Removing guard task: %TASK%

schtasks /Delete /F /TN "%TASK%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Task removed: %TASK%
) else (
    echo [info] Task not found (or already removed): %TASK%
)

pause

