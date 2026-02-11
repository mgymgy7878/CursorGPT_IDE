@echo off
setlocal
set LOGDIR=%~dp0logs

echo [check] Checking boot logs...
echo.

if not exist "%LOGDIR%" (
    echo [WARNING] Logs directory does not exist: %LOGDIR%
    echo [INFO] Logs will be created on first boot.
    pause
    exit /b 0
)

echo [DEV MODE LOGS]
echo ========================================
if exist "%LOGDIR%\boot_dev.log" (
    echo Last 20 lines of boot_dev.log:
    powershell -Command "Get-Content '%LOGDIR%\boot_dev.log' -Tail 20"
) else (
    echo boot_dev.log not found (DEV mode may not have run yet)
)
echo.

if exist "%LOGDIR%\web-next.log" (
    echo Last 20 lines of web-next.log:
    powershell -Command "Get-Content '%LOGDIR%\web-next.log' -Tail 20"
) else (
    echo web-next.log not found (DEV mode may not have run yet)
)
echo.

echo [PROD MODE LOGS]
echo ========================================
if exist "%LOGDIR%\boot_prod.log" (
    echo Last 20 lines of boot_prod.log:
    powershell -Command "Get-Content '%LOGDIR%\boot_prod.log' -Tail 20"
) else (
    echo boot_prod.log not found (PROD mode may not have run yet)
)
echo.

if exist "%LOGDIR%\web-next-prod.log" (
    echo Last 20 lines of web-next-prod.log:
    powershell -Command "Get-Content '%LOGDIR%\web-next-prod.log' -Tail 20"
) else (
    echo web-next-prod.log not found (PROD mode may not have run yet)
)
echo.

if exist "%LOGDIR%\build.log" (
    echo Last 20 lines of build.log:
    powershell -Command "Get-Content '%LOGDIR%\build.log' -Tail 20"
) else (
    echo build.log not found (no build attempts yet)
)
echo.

echo [TASK STATUS]
echo ========================================
schtasks /Query /TN "Spark-Dev-WebNext" /V /FO LIST 2>nul | findstr /C:"Last Run Result"
schtasks /Query /TN "Spark-Prod-WebNext" /V /FO LIST 2>nul | findstr /C:"Last Run Result"
echo.

echo [PORT STATUS]
echo ========================================
netstat -ano | findstr ":3003"
echo.

pause

