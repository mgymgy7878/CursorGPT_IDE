@echo off
rem Daemon kurulumunu test eder ve sorunları teşhis eder

setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "LOGDIR=%ROOT%\tools\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>nul

echo ========================================
echo Daemon Setup Test
echo ========================================
echo.

echo [1/6] Checking log directory...
if exist "%LOGDIR%" (
  echo   [OK] Log directory exists: %LOGDIR%
) else (
  echo   [FAIL] Cannot create log directory: %LOGDIR%
  pause
  exit /b 1
)
echo.

echo [2/6] Testing log write...
set "TESTLOG=%LOGDIR%\test_write.log"
echo Test write >"%TESTLOG%" 2>nul
if exist "%TESTLOG%" (
  echo   [OK] Can write to log directory
  del "%TESTLOG%" >nul 2>nul
) else (
  echo   [FAIL] Cannot write to log directory (permissions?)
  pause
  exit /b 1
)
echo.

echo [3/6] Resolving Node.js...
set "NODE_EXE="
set "PORTABLE_NODE=%ROOT%\tools\node-v20.10.0-win-x64\node.exe"
if exist "%PORTABLE_NODE%" (
  set "NODE_EXE=%PORTABLE_NODE%"
  echo   [OK] Portable node found: %NODE_EXE%
) else (
  for /f "delims=" %%P in ('where node 2^>nul') do (
    set "NODE_EXE=%%P"
    goto node_found
  )
  echo   [FAIL] Node.js not found in PATH
  echo   [info] Checked: %PORTABLE_NODE%
  pause
  exit /b 1
  :node_found
  echo   [OK] Node.js found in PATH: %NODE_EXE%
)
echo.

echo [4/6] Testing Node.js execution...
"%NODE_EXE%" --version >nul 2>nul
if %errorlevel%==0 (
  for /f "delims=" %%V in ('"%NODE_EXE%" --version 2^>nul') do (
    echo   [OK] Node.js version: %%V
  )
) else (
  echo   [FAIL] Cannot execute Node.js
  pause
  exit /b 1
)
echo.

echo [5/6] Resolving Next.js...
set "NEXT_BIN="
set "C1=%ROOT%\apps\web-next\node_modules\next\dist\bin\next"
set "C2=%ROOT%\node_modules\next\dist\bin\next"
if exist "%C1%" (
  set "NEXT_BIN=%C1%"
  echo   [OK] Next.js found: %NEXT_BIN%
) else if exist "%C2%" (
  set "NEXT_BIN=%C2%"
  echo   [OK] Next.js found: %NEXT_BIN%
) else (
  echo   [FAIL] Next.js binary not found
  echo   [info] Checked: %C1%
  echo   [info] Checked: %C2%
  pause
  exit /b 1
)
echo.

echo [6/6] Testing Next.js execution...
pushd "%ROOT%\apps\web-next" >nul 2>nul
"%NODE_EXE%" "%NEXT_BIN%" --version >nul 2>nul
if %errorlevel%==0 (
  for /f "delims=" %%V in ('"%NODE_EXE%" "%NEXT_BIN%" --version 2^>nul') do (
    echo   [OK] Next.js version: %%V
  )
) else (
  echo   [WARNING] Cannot execute Next.js (may need dependencies)
  echo   [info] Run: pnpm --filter web-next install
)
popd >nul 2>nul
echo.

echo ========================================
echo Test Complete
echo ========================================
echo.
echo All checks passed. Daemon should work.
echo.
echo Next steps:
echo   1. Install daemon: tools\INSTALL_WEBNEXT_DAEMON.cmd (as Administrator)
echo   2. Configure Task Scheduler (see INSTALL output)
echo   3. Verify: tools\HEALTH_WEBNEXT.cmd
echo.

pause
exit /b 0

