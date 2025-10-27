@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading Platform - Service Starter
echo ========================================

set UI_PORT=3003
set EXECUTOR_PORT=4001
set PROJECT_ROOT=%~dp0..\..

echo Project Root: %PROJECT_ROOT%
echo UI Port: %UI_PORT%
echo Executor Port: %EXECUTOR_PORT%

:: Check if ports are available
echo.
echo Checking port availability...
netstat -an | findstr ":%UI_PORT%" >nul
if %errorlevel% equ 0 (
    echo ERROR: Port %UI_PORT% is already in use
    echo Please stop the service using port %UI_PORT% first
    pause
    exit /b 1
)

netstat -an | findstr ":%EXECUTOR_PORT%" >nul
if %errorlevel% equ 0 (
    echo ERROR: Port %EXECUTOR_PORT% is already in use
    echo Please stop the service using port %EXECUTOR_PORT% first
    pause
    exit /b 1
)

echo Ports are available ✓

:: Check if pnpm is available
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pnpm is not installed or not in PATH
    echo Please install pnpm first: npm install -g pnpm
    pause
    exit /b 1
)

:: Check if required environment variables are set
if "%BINANCE_API_KEY%"=="" (
    echo WARNING: BINANCE_API_KEY is not set
    echo Please set your Binance API key before starting services
)

if "%BINANCE_API_SECRET%"=="" (
    echo WARNING: BINANCE_API_SECRET is not set
    echo Please set your Binance API secret before starting services
)

:: Set default exchange mode if not set
if "%SPARK_EXCHANGE_MODE%"=="" (
    set SPARK_EXCHANGE_MODE=spot-testnet
    echo Set SPARK_EXCHANGE_MODE to: %SPARK_EXCHANGE_MODE%
)

:: Create logs directory
if not exist "%PROJECT_ROOT%\logs" mkdir "%PROJECT_ROOT%\logs"

:: Start UI service
echo.
echo Starting Spark Web UI (port %UI_PORT%)...
start "SPARK-UI" cmd /k "cd /d %PROJECT_ROOT%\apps\web-next && set PORT=%UI_PORT% && set HOST=0.0.0.0 && pnpm start"

:: Wait a moment for UI to start
timeout /t 3 /nobreak >nul

:: Start Executor service
echo.
echo Starting Spark Executor (port %EXECUTOR_PORT%)...
start "SPARK-EXECUTOR" cmd /k "cd /d %PROJECT_ROOT%\services\executor && set PORT=%EXECUTOR_PORT% && set HOST=0.0.0.0 && pnpm dev"

:: Wait a moment for Executor to start
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Services started successfully!
echo ========================================
echo.
echo UI Service:     http://localhost:%UI_PORT%
echo Executor API:   http://localhost:%EXECUTOR_PORT%
echo Health Check:   http://localhost:%UI_PORT%/api/public/health
echo Metrics:        http://localhost:%UI_PORT%/api/public/metrics/prom
echo.
echo Press any key to open the UI in your browser...
pause >nul

:: Open UI in default browser
start http://localhost:%UI_PORT%

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause 