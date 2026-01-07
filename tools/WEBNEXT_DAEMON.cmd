@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Self-contained root
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "LOGDIR=%ROOT%\tools\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>nul

set "DLOG=%LOGDIR%\webnext_daemon.log"
set "NLOG=%LOGDIR%\webnext_runtime.log"

set "PORT=3003"
set "HOST=127.0.0.1"

echo ==================================================>>"%DLOG%"
echo [daemon] %DATE% %TIME% starting...>>"%DLOG%"
echo [daemon] ROOT=%ROOT%>>"%DLOG%"
echo [daemon] USER=%USERNAME%>>"%DLOG%"
echo [daemon] PATH=%PATH%>>"%DLOG%"

call :resolve_node || goto :fatal
call :resolve_next || goto :fatal

echo [daemon] NODE_EXE=%NODE_EXE%>>"%DLOG%"
echo [daemon] NEXT_BIN=%NEXT_BIN%>>"%DLOG%"

rem Main loop (low CPU)
:loop
call :is_listening
if "%LISTENING%"=="1" (
  timeout /t 5 /nobreak >nul
  goto loop
)

echo [daemon] %DATE% %TIME% port %PORT% down -> starting web-next...>>"%DLOG%"
call :start_webnext

rem Give it time to bind port, avoid spawn storms
call :wait_port 25
timeout /t 3 /nobreak >nul
goto loop

:fatal
echo [daemon] FATAL: could not resolve node/next.>>"%DLOG%"
echo [daemon] PATH=%PATH%>>"%DLOG%"
exit /b 1

rem ---------- helpers ----------
:is_listening
set "LISTENING=0"
for /f "delims=" %%L in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" 2^>nul') do (
  set "LISTENING=1"
)
exit /b 0

:wait_port
rem %1 = seconds
set "WAIT=%~1"
if "%WAIT%"=="" set "WAIT=20"
set /a "i=0"
:wait_loop
call :is_listening
if "%LISTENING%"=="1" (
  echo [daemon] %DATE% %TIME% port %PORT% is UP.>>"%DLOG%"
  exit /b 0
)
set /a "i+=1"
if !i! GEQ %WAIT% (
  echo [daemon] %DATE% %TIME% port still DOWN after %WAIT%s. Check %NLOG%>>"%DLOG%"
  exit /b 0
)
timeout /t 1 /nobreak >nul
goto wait_loop

:resolve_node
set "NODE_EXE="

rem 1) Portable node (project-specific, highest priority)
set "PORTABLE_NODE=%ROOT%\tools\node-v20.10.0-win-x64\node.exe"
if exist "%PORTABLE_NODE%" (
  set "NODE_EXE=%PORTABLE_NODE%"
  goto node_ok
)

rem 2) PATH (where node)
for /f "delims=" %%P in ('where node 2^>nul') do (
  set "NODE_EXE=%%P"
  goto node_ok
)

rem 3) Registry fallback (64-bit + WOW6432Node)
for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\Node.js" /v InstallPath 2^>nul ^| findstr /I "InstallPath"') do set "NODE_DIR=%%B"
if not defined NODE_DIR (
  for /f "tokens=2,*" %%A in ('reg query "HKLM\SOFTWARE\WOW6432Node\Node.js" /v InstallPath 2^>nul ^| findstr /I "InstallPath"') do set "NODE_DIR=%%B"
)
if defined NODE_DIR (
  set "NODE_EXE=%NODE_DIR%\node.exe"
)

:node_ok
if not defined NODE_EXE exit /b 1
if not exist "%NODE_EXE%" exit /b 1
exit /b 0

:resolve_next
set "NEXT_BIN="

set "C1=%ROOT%\apps\web-next\node_modules\next\dist\bin\next"
set "C2=%ROOT%\node_modules\next\dist\bin\next"

if exist "%C1%" set "NEXT_BIN=%C1%"
if not defined NEXT_BIN if exist "%C2%" set "NEXT_BIN=%C2%"

if not defined NEXT_BIN exit /b 1
exit /b 0

:start_webnext
rem Start minimized in separate cmd; logs to NLOG
pushd "%ROOT%\apps\web-next" >nul 2>nul
if errorlevel 1 (
  echo [daemon] %DATE% %TIME% ERROR: Cannot cd to apps\web-next>>"%DLOG%"
  popd >nul 2>nul
  exit /b 1
)

rem Kill any existing process on port to avoid conflicts
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" 2^>nul') do (
  echo [daemon] %DATE% %TIME% killing existing process on port %PORT% (PID: %%p)>>"%DLOG%"
  taskkill /F /PID %%p >nul 2>nul
)
timeout /t 1 /nobreak >nul

rem Start Next.js with crash detection
echo [daemon] %DATE% %TIME% starting: "%NODE_EXE%" "%NEXT_BIN%" dev -p %PORT% -H %HOST%>>"%DLOG%"

start "spark-web-next" /min cmd /c ^
  ""%NODE_EXE%" "%NEXT_BIN%" dev -p %PORT% -H %HOST% >> "%NLOG%" 2>&1 & echo EXIT_CODE=!ERRORLEVEL! >> "%NLOG%""

popd >nul 2>nul

rem Wait a bit then check if process started
timeout /t 3 /nobreak >nul
tasklist | findstr /I "node.exe" >nul
if errorlevel 1 (
  echo [daemon] %DATE% %TIME% WARNING: Node process not found after start>>"%DLOG%"
  if exist "%NLOG%" (
    echo [daemon] Last 50 lines of runtime log:>>"%DLOG%"
    powershell -NoProfile -Command "Get-Content -Tail 50 '%NLOG%' | ForEach-Object { Write-Output \"  $_\" }" >>"%DLOG%" 2>nul
  )
)

exit /b 0
