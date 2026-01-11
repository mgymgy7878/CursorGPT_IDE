@echo off
rem Executor health durumunu kontrol eder (UI state mapping doğrulama)

setlocal EnableExtensions

echo ========================================
echo Executor Health Verification
echo ========================================
echo.

echo [1/3] Direct Executor Health (port 4001):
echo ----------------------------------------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4001/healthz' -TimeoutSec 2 -UseBasicParsing; $json = $r.Content | ConvertFrom-Json; Write-Host '  Status:' $r.StatusCode; Write-Host '  Service:' $json.service; Write-Host '  Status:' $json.status } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo [2/3] Proxy Executor Health (/api/executor-healthz):
echo ----------------------------------------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/executor-healthz' -TimeoutSec 2 -UseBasicParsing; $json = $r.Content | ConvertFrom-Json; Write-Host '  Status:' $r.StatusCode; Write-Host '  OK:' $json.ok; Write-Host '  Latency:' $json.latencyMs 'ms' } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo [3/3] Port 4001 Status:
echo ----------------------------------------
netstat -ano | findstr /R /C:":4001 .*LISTENING"
if %errorlevel%==0 (
  echo   ✅ Port 4001 is LISTENING
) else (
  echo   ❌ Port 4001 is NOT listening
  echo      Start: start /min cmd.exe /c "tools\EXECUTOR_DAEMON.cmd"
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Expected:
echo   [1] Status: 200, Service: executor, Status: ok
echo   [2] Status: 200, OK: True, Latency: <100ms
echo   [3] Port 4001 LISTENING
echo.
echo If executor is running but UI shows red:
echo   - Check useExecutorHealth hook state mapping
echo   - Verify proxy endpoint returns ok:true
echo.

pause
exit /b 0

