@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Spark Trading - Incident Response Drills
echo ========================================

echo.
echo Available drills:
echo 1. Kill Switch Activation
echo 2. Read-Only Mode
echo 3. Rate Limit Tightening
echo 4. Circuit Breaker
echo 5. Rollback to Safe Mode
echo 6. Emergency Stop All
echo.

set /p DRILL="Select drill (1-6): "

if "%DRILL%"=="1" goto :killswitch
if "%DRILL%"=="2" goto :readonly
if "%DRILL%"=="3" goto :ratelimit
if "%DRILL%"=="4" goto :circuitbreaker
if "%DRILL%"=="5" goto :rollback
if "%DRILL%"=="6" goto :emergency
goto :invalid

:killswitch
echo.
echo ========================================
echo Drill 1: Kill Switch Activation
echo ========================================
echo.
echo This will activate the kill switch to prevent new orders
echo.
set /p CONFIRM="Activate kill switch? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo Activating kill switch...
set SPARK_KILL_SWITCH=1
echo SPARK_KILL_SWITCH=1 set

echo Testing kill switch...
curl -X POST http://127.0.0.1:4001/api/private/kill-switch
echo.

echo Kill switch activated. New orders should be rejected.
echo Check audit logs for kill switch activation.
goto :end

:readonly
echo.
echo ========================================
echo Drill 2: Read-Only Mode
echo ========================================
echo.
echo This will enable read-only mode banner
echo.
set /p CONFIRM="Enable read-only mode? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo Enabling read-only mode...
set SPARK_READ_ONLY=1
echo SPARK_READ_ONLY=1 set

echo Read-only mode enabled. UI should show read-only banner.
echo Check the UI dashboard for read-only indicator.
goto :end

:ratelimit
echo.
echo ========================================
echo Drill 3: Rate Limit Tightening
echo ========================================
echo.
echo This will tighten rate limits to 5 r/m for strict endpoints
echo.
set /p CONFIRM="Tighten rate limits? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo Tightening rate limits...
echo Note: This requires nginx configuration change
echo Current rate limit: 10 r/m
echo New rate limit: 5 r/m
echo.
echo Please update nginx.conf and reload nginx:
echo limit_req_zone $binary_remote_addr zone=strict:10m rate=5r/m;
echo systemctl reload nginx
goto :end

:circuitbreaker
echo.
echo ========================================
echo Drill 4: Circuit Breaker
echo ========================================
echo.
echo This will test circuit breaker functionality
echo.
set /p CONFIRM="Test circuit breaker? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo Testing circuit breaker...
curl -X POST http://127.0.0.1:4001/api/private/circuit-breaker/open
echo.

echo Circuit breaker opened. Check health endpoint:
curl -sS http://127.0.0.1:4001/api/public/health
echo.

echo To close circuit breaker:
curl -X POST http://127.0.0.1:4001/api/private/circuit-breaker/close
goto :end

:rollback
echo.
echo ========================================
echo Drill 5: Rollback to Safe Mode
echo ========================================
echo.
echo This will rollback to confirm_required mode
echo.
set /p CONFIRM="Rollback to safe mode? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo Rolling back to safe mode...
set LIVE_POLICY=confirm_required
set EXECUTE=false
echo LIVE_POLICY=confirm_required set
echo EXECUTE=false set

echo Safe mode enabled. All orders will require confirmation.
echo No automatic execution will occur.
goto :end

:emergency
echo.
echo ========================================
echo Drill 6: Emergency Stop All
echo ========================================
echo.
echo This will stop all services immediately
echo.
set /p CONFIRM="EMERGENCY STOP ALL SERVICES? (y/N): "
if /i not "%CONFIRM%"=="y" goto :end

echo EMERGENCY STOP INITIATED
echo.

echo Stopping all services...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM pnpm.exe 2>nul

echo All services stopped.
echo To restart: scripts\windows\start_services.cmd
goto :end

:invalid
echo Invalid selection. Please choose 1-6.
goto :end

:end
echo.
echo ========================================
echo Drill Summary
echo ========================================
echo.
echo Drill completed. Check the following:
echo - Service logs for any errors
echo - UI dashboard for status changes
echo - Metrics for any anomalies
echo - Audit logs for drill actions
echo.
echo To restore normal operation:
echo - Reset environment variables
echo - Restart services if needed
echo - Check health endpoints
echo.
echo Press any key to exit...
pause >nul 