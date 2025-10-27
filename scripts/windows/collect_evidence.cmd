@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading Platform - Evidence Collection
echo ========================================

set UI_PORT=3003
set EXECUTOR_PORT=4001
set TIMESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set OUT_DIR=logs
set OUT_FILE=%OUT_DIR%\evidence_%TIMESTAMP%.txt

:: Create logs directory if it doesn't exist
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo Timestamp: %TIMESTAMP%
echo Output File: %OUT_FILE%
echo UI Port: %UI_PORT%
echo Executor Port: %EXECUTOR_PORT%

:: Check if curl is available
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: curl is not available
    echo Please install curl or use PowerShell instead
    pause
    exit /b 1
)

echo.
echo ========================================
echo Collecting System Evidence
echo ========================================

:: Start collecting evidence
echo === SPARK TRADING PLATFORM EVIDENCE COLLECTION === > "%OUT_FILE%"
echo Timestamp: %TIMESTAMP% >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: System information
echo === SYSTEM INFORMATION === >> "%OUT_FILE%"
echo Date/Time: %date% %time% >> "%OUT_FILE%"
echo OS: %OS% >> "%OUT_FILE%"
echo Computer Name: %COMPUTERNAME% >> "%OUT_FILE%"
echo User: %USERNAME% >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: Environment variables
echo === ENVIRONMENT VARIABLES === >> "%OUT_FILE%"
echo SPARK_EXCHANGE_MODE: %SPARK_EXCHANGE_MODE% >> "%OUT_FILE%"
echo BINANCE_API_KEY: %BINANCE_API_KEY:~0,10%... >> "%OUT_FILE%"
echo BINANCE_API_SECRET: %BINANCE_API_SECRET:~0,10%... >> "%OUT_FILE%"
echo NODE_ENV: %NODE_ENV% >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: Port status
echo === PORT STATUS === >> "%OUT_FILE%"
netstat -an | findstr ":%UI_PORT%" >> "%OUT_FILE%"
netstat -an | findstr ":%EXECUTOR_PORT%" >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: Process status
echo === PROCESS STATUS === >> "%OUT_FILE%"
tasklist | findstr /I "node" >> "%OUT_FILE%"
tasklist | findstr /I "pnpm" >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: UI Health Check
echo === UI HEALTH CHECK === >> "%OUT_FILE%"
echo Timestamp: %date% %time% >> "%OUT_FILE%"
curl -sS -m 10 http://127.0.0.1:%UI_PORT%/api/public/health >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: UI Metrics
echo === UI METRICS === >> "%OUT_FILE%"
echo Timestamp: %date% %time% >> "%OUT_FILE%"
curl -sS -m 10 http://127.0.0.1:%UI_PORT%/api/public/metrics/prom >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Executor Health Check
echo === EXECUTOR HEALTH CHECK === >> "%OUT_FILE%"
echo Timestamp: %date% %time% >> "%OUT_FILE%"
curl -sS -m 10 http://127.0.0.1:%EXECUTOR_PORT%/api/public/health >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Executor Metrics
echo === EXECUTOR METRICS === >> "%OUT_FILE%"
echo Timestamp: %date% %time% >> "%OUT_FILE%"
curl -sS -m 10 http://127.0.0.1:%EXECUTOR_PORT%/api/public/metrics/prom >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Recent log files (if available)
echo === RECENT LOGS === >> "%OUT_FILE%"
if exist "logs\*.log" (
    echo Recent log files found: >> "%OUT_FILE%"
    dir logs\*.log /OD >> "%OUT_FILE%"
    echo. >> "%OUT_FILE%"
    
    :: Get last 50 lines of each log file
    for %%f in (logs\*.log) do (
        echo === %%~nxf === >> "%OUT_FILE%"
        powershell "Get-Content '%%f' | Select-Object -Last 50" >> "%OUT_FILE%" 2>&1
        echo. >> "%OUT_FILE%"
    )
) else (
    echo No log files found in logs directory >> "%OUT_FILE%"
    echo. >> "%OUT_FILE%"
)

:: Network connectivity test
echo === NETWORK CONNECTIVITY === >> "%OUT_FILE%"
echo Testing Binance API connectivity... >> "%OUT_FILE%"
curl -sS -m 10 https://testnet.binance.vision/api/v3/time >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Disk space
echo === DISK SPACE === >> "%OUT_FILE%"
wmic logicaldisk get size,freespace,caption >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Memory usage
echo === MEMORY USAGE === >> "%OUT_FILE%"
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /Value >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: CPU usage
echo === CPU USAGE === >> "%OUT_FILE%"
wmic cpu get loadpercentage /Value >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: Active connections
echo === ACTIVE CONNECTIONS === >> "%OUT_FILE%"
netstat -an | findstr "ESTABLISHED" | findstr ":%UI_PORT%" >> "%OUT_FILE%"
netstat -an | findstr "ESTABLISHED" | findstr ":%EXECUTOR_PORT%" >> "%OUT_FILE%"
echo. >> "%OUT_FILE%"

:: Error summary
echo === ERROR SUMMARY === >> "%OUT_FILE%"
echo Collecting error patterns... >> "%OUT_FILE%"
findstr /I "error" "%OUT_FILE%" | findstr /V "=== ERROR SUMMARY ===" >> "%OUT_FILE%" 2>&1
echo. >> "%OUT_FILE%"

:: End of evidence collection
echo === EVIDENCE COLLECTION COMPLETE === >> "%OUT_FILE%"
echo End Timestamp: %date% %time% >> "%OUT_FILE%"

echo.
echo ========================================
echo Evidence Collection Complete
echo ========================================
echo.
echo Evidence saved to: %OUT_FILE%
echo File size: 
for %%A in ("%OUT_FILE%") do echo %%~zA bytes
echo.
echo Evidence includes:
echo - System information
echo - Environment variables
echo - Port and process status
echo - Health checks and metrics
echo - Recent log files
echo - Network connectivity
echo - System resources
echo - Error patterns
echo.
echo This file can be used for:
echo - Troubleshooting issues
echo - Performance analysis
echo - Support requests
echo - Compliance reporting
echo.
echo Press any key to open the evidence file...
pause >nul

:: Open the evidence file
start notepad "%OUT_FILE%"

echo.
echo Evidence collection completed successfully!
pause 