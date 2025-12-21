@echo off
rem Health endpoint'lerini test eder (kanıtlı kontrol)

setlocal EnableExtensions

echo ========================================
echo Health Endpoints Test
echo ========================================
echo.

echo [1/3] WebNext Health (/api/healthz):
echo ----------------------------------------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/healthz' -TimeoutSec 2 -UseBasicParsing; Write-Host '  Status:' $r.StatusCode; Write-Host '  Content-Type:' $r.Headers['Content-Type']; $json = $r.Content | ConvertFrom-Json; Write-Host '  Status:' $json.status; Write-Host '  UI:' $json.services.ui } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo [2/3] Executor Health (Direct):
echo ----------------------------------------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4001/healthz' -TimeoutSec 2 -UseBasicParsing; Write-Host '  Status:' $r.StatusCode; $json = $r.Content | ConvertFrom-Json; Write-Host '  Status:' $json.status; Write-Host '  Service:' $json.service } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo [3/3] Executor Health (Proxy):
echo ----------------------------------------
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/executor-healthz' -TimeoutSec 2 -UseBasicParsing; Write-Host '  Status:' $r.StatusCode; $json = $r.Content | ConvertFrom-Json; Write-Host '  OK:' $json.ok; Write-Host '  Latency:' $json.latencyMs 'ms' } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo ========================================
echo Test Complete
echo ========================================
echo.
echo Expected:
echo   [1] Status: 200, Status: UP, UI: UP
echo   [2] Status: 200, Status: ok, Service: executor
echo   [3] Status: 200, OK: True, Latency: <100ms
echo.

pause
exit /b 0

