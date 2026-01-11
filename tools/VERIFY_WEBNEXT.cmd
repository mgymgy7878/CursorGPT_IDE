@echo off
rem ===== Web-Next Verification Script =====
rem Purpose: Quick verification of web-next dev server health

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ========================================
echo Web-Next Dev Server Verification
echo ========================================
echo.

echo [1/4] Port Status...
netstat -ano | findstr /R /C:":3003 .*LISTENING" >nul 2>nul
if %errorlevel%==0 (
  echo   ✅ Port 3003 is LISTENING
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3003 .*LISTENING"') do (
    echo   PID: %%P
  )
) else (
  echo   ❌ Port 3003 is NOT listening
)
echo.

echo [2/4] Dashboard HTTP...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/dashboard' -Method Head -TimeoutSec 5 -UseBasicParsing; Write-Host '  Status:' $r.StatusCode } catch { Write-Host '  ERROR:' $_.Exception.Message }"
echo.

echo [3/4] Health Endpoints...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/healthz' -TimeoutSec 5 -UseBasicParsing; $json = $r.Content | ConvertFrom-Json; Write-Host '  /api/healthz:' $r.StatusCode '(' $json.status ')' } catch { Write-Host '  /api/healthz: ERROR' $_.Exception.Message }"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/executor-healthz' -TimeoutSec 5 -UseBasicParsing; $json = $r.Content | ConvertFrom-Json; Write-Host '  /api/executor-healthz:' $r.StatusCode '(OK:' $json.ok ')' } catch { Write-Host '  /api/executor-healthz: ERROR' $_.Exception.Message }"
echo.

echo [5/5] Log Warnings/Errors (last 10)...
if exist "%ROOT%\tools\logs\webnext_runtime.log" (
  powershell -NoProfile -Command "Get-Content '%ROOT%\tools\logs\webnext_runtime.log' | Select-String -Pattern '(?i)(warn|error|fail|exception)' | Select-Object -Last 10"
) else (
  echo   (No runtime log found)
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next steps:
echo   1. Open browser: http://127.0.0.1:3003/dashboard
echo   2. Check DevTools Console for errors
echo   3. Verify health indicators in TopStatusBar
echo.

pause
exit /b 0

