@echo off
setlocal

echo [uninstall] Removing autostart tasks...

schtasks /Delete /TN "Spark-Dev-WebNext" /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Removed: Spark-Dev-WebNext
) else (
    echo [info] Spark-Dev-WebNext not found (or already removed)
)

schtasks /Delete /TN "Spark-Prod-WebNext" /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Removed: Spark-Prod-WebNext
) else (
    echo [info] Spark-Prod-WebNext not found (or already removed)
)

echo.
echo [done] Autostart tasks removed.
pause

