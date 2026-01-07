@echo off
setlocal

echo [check] Guard Status Check
echo ========================================
echo.

echo [PORT STATUS]
netstat -ano | findstr ":3003"
if errorlevel 1 (
    echo Port 3003: NOT LISTENING
) else (
    echo Port 3003: LISTENING
)
echo.

echo [TASK STATUS]
schtasks /Query /TN "Spark-Guard-WebNext" /V /FO LIST 2>nul | findstr /C:"Last Run Result" /C:"Task Name" /C:"Status" /C:"Next Run Time"
if errorlevel 1 (
    echo Task not found (may not be installed)
)
echo.

echo [GUARD LOG - Last 20 lines]
echo ========================================
if exist "tools\logs\guard_webnext.log" (
    powershell -Command "Get-Content 'tools\logs\guard_webnext.log' -Tail 20"
) else (
    echo guard_webnext.log not found (guard may not have run yet)
)
echo.

echo [WEB-NEXT LOG - Last 20 lines]
echo ========================================
if exist "tools\logs\web-next.log" (
    powershell -Command "Get-Content 'tools\logs\web-next.log' -Tail 20"
) else (
    echo web-next.log not found (web-next may not have run yet)
)
echo.

pause

