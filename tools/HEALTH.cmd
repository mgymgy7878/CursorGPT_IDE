@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
cd /d "%ROOT%"

set "LOGDIR=%ROOT%\tools\logs"
set "PORT=3003"

echo ========================================
echo Spark Trading - Health Check
echo ========================================
echo.

rem [1] Port kontrolü
echo [1/5] Port %PORT% Status:
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  echo   ✅ Port %PORT% is LISTENING
  netstat -ano | findstr /R /C:":%PORT% .*LISTENING"
) else (
  echo   ❌ Port %PORT% is NOT listening
)
echo.

rem [2] Guard tasks durumu
echo [2/5] Guard Tasks Status:
set "T_LOGON=Spark-GuardTick-WebNext-Logon"
set "T_MIN=Spark-GuardTick-WebNext-Minute"

schtasks /Query /TN "%T_LOGON%" /V /FO LIST 2>nul | findstr /C:"Task Name" /C:"Status" /C:"Last Run Result" /C:"Next Run Time" >nul
if %errorlevel%==0 (
  echo   ✅ %T_LOGON%: EXISTS
  schtasks /Query /TN "%T_LOGON%" /V /FO LIST 2>nul | findstr /C:"Last Run Result" /C:"Next Run Time"
) else (
  echo   ❌ %T_LOGON%: NOT FOUND
)
echo.

schtasks /Query /TN "%T_MIN%" /V /FO LIST 2>nul | findstr /C:"Task Name" /C:"Status" /C:"Last Run Result" /C:"Next Run Time" >nul
if %errorlevel%==0 (
  echo   ✅ %T_MIN%: EXISTS
  schtasks /Query /TN "%T_MIN%" /V /FO LIST 2>nul | findstr /C:"Last Run Result" /C:"Next Run Time"
) else (
  echo   ❌ %T_MIN%: NOT FOUND
)
echo.

rem [3] Guard tick log (son 10 satır)
echo [3/5] Guard Tick Log (last 10 lines):
set "TICKLOG=%LOGDIR%\guard_tick_webnext.log"
if exist "%TICKLOG%" (
  echo   Log file: %TICKLOG%
  powershell -NoProfile -Command "Get-Content '%TICKLOG%' -Tail 10 | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo   ❌ Log file not found: %TICKLOG%
)
echo.

rem [4] Web-next log (son 10 satır)
echo [4/5] Web-Next Log (last 10 lines):
set "WEBNEXTLOG=%LOGDIR%\web-next.log"
if exist "%WEBNEXTLOG%" (
  echo   Log file: %WEBNEXTLOG%
  powershell -NoProfile -Command "Get-Content '%WEBNEXTLOG%' -Tail 10 | ForEach-Object { Write-Host '  ' $_ }"
) else (
  echo   ❌ Log file not found: %WEBNEXTLOG%
)
echo.

rem [5] Son crash nedeni (log'larda ERROR/CRITICAL)
echo [5/5] Recent Errors (last 20 lines):
if exist "%TICKLOG%" (
  powershell -NoProfile -Command "$content = Get-Content '%TICKLOG%' -Tail 20; $errors = $content | Select-String -Pattern 'ERROR|CRITICAL|FAILED|NOT listening' -CaseSensitive; if ($errors) { Write-Host '  Found errors:' -ForegroundColor Red; $errors | ForEach-Object { Write-Host '  ' $_ } } else { Write-Host '  ✅ No recent errors in guard log' -ForegroundColor Green }"
) else (
  echo   ⚠️  Guard log not found, cannot check errors
)
echo.

echo ========================================
echo Health Check Complete
echo ========================================
echo.
echo Quick actions:
echo   Start dev server: tools\BOOT_DEV.cmd
echo   Install guard: tools\INSTALL_GUARD_TICK.cmd
echo   Uninstall guard: tools\UNINSTALL_GUARD_TICK.cmd
echo   Configure tasks: taskschd.msc
echo.

pause

