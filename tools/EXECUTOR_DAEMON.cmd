@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Self-contained root
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "LOGDIR=%ROOT%\tools\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>nul

set "DLOG=%LOGDIR%\executor_daemon.log"
set "ELOG=%LOGDIR%\executor_runtime.log"

set "PORT=4001"
set "HOST=127.0.0.1"

echo ==================================================>>"%DLOG%"
echo [daemon] %DATE% %TIME% starting...>>"%DLOG%"
echo [daemon] ROOT=%ROOT%>>"%DLOG%"
echo [daemon] USER=%USERNAME%>>"%DLOG%"
echo [daemon] PATH=%PATH%>>"%DLOG%"

call :resolve_node || goto :fatal
call :resolve_tsx || goto :fatal
call :resolve_executor || goto :fatal

echo [daemon] NODE_EXE=%NODE_EXE%>>"%DLOG%"
echo [daemon] TSX_BIN=%TSX_BIN%>>"%DLOG%"
echo [daemon] EXECUTOR_SRC=%EXECUTOR_SRC%>>"%DLOG%"

rem Main loop (low CPU)
:loop
call :is_listening
if "%LISTENING%"=="1" (
  timeout /t 5 /nobreak >nul
  goto loop
)

echo [daemon] %DATE% %TIME% port %PORT% down -> starting executor...>>"%DLOG%"
call :start_executor

rem Give it time to bind port, avoid spawn storms
call :wait_port 25
timeout /t 3 /nobreak >nul
goto loop

:fatal
echo [daemon] FATAL: could not resolve node/tsx/executor.>>"%DLOG%"
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
  echo [daemon] %DATE% %TIME% port still DOWN after %WAIT%s. Check %ELOG%>>"%DLOG%"
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

:resolve_tsx
set "TSX_BIN="

rem 1) Executor node_modules (local)
set "TSX1=%ROOT%\services\executor\node_modules\.bin\tsx"
set "TSX2=%ROOT%\services\executor\node_modules\tsx\dist\cli.mjs"

rem 2) Root node_modules
set "TSX3=%ROOT%\node_modules\.bin\tsx"
set "TSX4=%ROOT%\node_modules\tsx\dist\cli.mjs"

if exist "%TSX1%" (
  set "TSX_BIN=%TSX1%"
  goto tsx_ok
)
if exist "%TSX2%" (
  set "TSX_BIN=%TSX2%"
  goto tsx_ok
)
if exist "%TSX3%" (
  set "TSX_BIN=%TSX3%"
  goto tsx_ok
)
if exist "%TSX4%" (
  set "TSX_BIN=%TSX4%"
  goto tsx_ok
)

rem 3) PATH (where tsx)
for /f "delims=" %%P in ('where tsx 2^>nul') do (
  set "TSX_BIN=%%P"
  goto tsx_ok
)

:tsx_ok
if not defined TSX_BIN exit /b 1
exit /b 0

:resolve_executor
set "EXECUTOR_SRC=%ROOT%\services\executor\src\server.ts"
if not exist "%EXECUTOR_SRC%" exit /b 1
exit /b 0

:start_executor
rem Start minimized in separate cmd; logs to ELOG
pushd "%ROOT%\services\executor" >nul 2>nul
if errorlevel 1 (
  echo [daemon] %DATE% %TIME% ERROR: Cannot cd to services\executor>>"%DLOG%"
  popd >nul 2>nul
  exit /b 1
)

rem Kill any existing process on port to avoid conflicts
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING" 2^>nul') do (
  echo [daemon] %DATE% %TIME% killing existing process on port %PORT% (PID: %%p)>>"%DLOG%"
  taskkill /F /PID %%p >nul 2>nul
)
timeout /t 1 /nobreak >nul

rem Start executor with tsx watch (uses PORT and HOST env vars)
echo [daemon] %DATE% %TIME% starting: "%NODE_EXE%" "%TSX_BIN%" watch "%EXECUTOR_SRC%" (PORT=%PORT%, HOST=%HOST%)>>"%DLOG%"

start "spark-executor" /min cmd /c ^
  "set PORT=%PORT% && set HOST=%HOST% && \"%NODE_EXE%\" \"%TSX_BIN%\" watch \"%EXECUTOR_SRC%\" >> \"%ELOG%\" 2>&1 & echo EXIT_CODE=!ERRORLEVEL! >> \"%ELOG%\""

popd >nul 2>nul

rem Wait a bit then check if process started
timeout /t 3 /nobreak >nul
tasklist | findstr /I "node.exe" >nul
if errorlevel 1 (
  echo [daemon] %DATE% %TIME% WARNING: Node process not found after start>>"%DLOG%"
  if exist "%ELOG%" (
    echo [daemon] Last 50 lines of runtime log:>>"%DLOG%"
    powershell -NoProfile -Command "Get-Content -Tail 50 '%ELOG%' | ForEach-Object { Write-Output \"  $_\" }" >>"%DLOG%" 2>nul
  )
)

exit /b 0

