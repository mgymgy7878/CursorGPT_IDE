@echo off
rem ===== Web-Next Dev Server Rescue Script =====
rem Purpose: Quick recovery from ERR_CONNECTION_REFUSED (port 3003)

setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ========================================
echo Web-Next Dev Server Rescue
echo ========================================
echo.

echo [1/5] Preflight: Cleaning stale processes on port 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3003 .*LISTENING" 2^>nul') do (
  echo   Killing stale PID %%a...
  taskkill /F /PID %%a >nul 2>nul
)
timeout /t 2 /nobreak >nul
netstat -ano | findstr /R /C:":3003 .*LISTENING" >nul 2>nul
if %errorlevel%==0 (
  echo   ⚠️  Port 3003 still LISTENING after cleanup
) else (
  echo   ✅ Port 3003 is clean (ready for startup)
)
echo.

echo [2/5] Cleaning stale processes...
taskkill /F /FI "WINDOWTITLE eq spark-web-next*" /T >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq WEBNEXT_DAEMON*" /T >nul 2>nul
echo   Done
echo.

echo [3/5] Creating evidence directory...
mkdir "%ROOT%\evidence\local\oneshot" >nul 2>nul
echo   Done
echo.

echo [4/5] Starting web-next dev server...
pushd "%ROOT%\apps\web-next" >nul 2>nul
start "spark-web-next" /min cmd.exe /c ^
  "pnpm dev -- --port 3003 --hostname 127.0.0.1 >> \"%ROOT%\evidence\local\oneshot\webnext_startup.log\" 2>&1"
popd >nul 2>nul
echo   Started in background (minimized window)
echo   Waiting 15 seconds for startup...
timeout /t 15 /nobreak >nul
echo.

echo [5/6] Verifying web-next connection...
netstat -ano | findstr /R /C:":3003 .*LISTENING" >nul 2>nul
if %errorlevel%==0 (
  echo   ✅ Port 3003 is LISTENING
  echo.
  echo   Testing HTTP endpoint...
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/' -TimeoutSec 3 -UseBasicParsing; Write-Host '  HTTP_CODE=' $r.StatusCode } catch { Write-Host '  HTTP_CODE=ERROR' $_.Exception.Message }"
  echo.
  echo   Checking health endpoint...
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3003/api/healthz' -TimeoutSec 3 -UseBasicParsing; $json = $r.Content | ConvertFrom-Json; if ($json.services.executor.status -ne 'UP') { Write-Host '  ⚠️  Executor not ready, starting...' ; cmd /c \"%ROOT%\\tools\\EXECUTOR_DAEMON.cmd\" } } catch { Write-Host '  Health check failed' }"
) else (
  echo   ❌ Port 3003 is still NOT listening
  echo.
  echo   Check startup log:
  if exist "%ROOT%\evidence\local\oneshot\webnext_startup.log" (
    echo   Last 20 lines:
    powershell -NoProfile -Command "Get-Content -Tail 20 '%ROOT%\evidence\local\oneshot\webnext_startup.log'"
  ) else (
    echo   (No startup log found)
  )
)
echo.

echo [6/6] Running final verification...
call "%ROOT%\tools\VERIFY_WEBNEXT.cmd"
echo.

echo ========================================
echo Rescue Complete
echo ========================================
echo.
echo Next steps:
echo   1. Open browser: http://127.0.0.1:3003/dashboard
echo   2. Check logs: evidence\local\oneshot\webnext_startup.log
echo   3. If still failing, check: tools\HEALTH_WEBNEXT.cmd
echo.

pause
exit /b 0

