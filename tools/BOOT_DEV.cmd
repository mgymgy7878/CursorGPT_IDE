@echo off
setlocal enabledelayedexpansion

REM --- Task Scheduler için sağlam PATH (Node + pnpm) ---
set "PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%USERPROFILE%\AppData\Roaming\npm;%USERPROFILE%\AppData\Local\Programs\nodejs;%PATH%"

REM Self-contained: Always run from repo root (regardless of where script is called from)
cd /d "%~dp0.."

set HOST=127.0.0.1
set PORT=3003

REM Create logs directory
set LOGDIR=%~dp0logs
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

REM Log startup
echo [%date% %time%] BOOT_DEV starting... >> "%LOGDIR%\boot_dev.log"
echo [%date% %time%] Working directory: %CD% >> "%LOGDIR%\boot_dev.log"

REM --- pnpm seçimi: corepack varsa onu kullan (en sağlam) ---
where corepack >nul 2>&1
if %errorlevel%==0 (
  set "PNPM=corepack pnpm"
  echo [%date% %time%] INFO: corepack bulundu, corepack pnpm kullanılacak >> "%LOGDIR%\boot_dev.log"
) else (
  set "PNPM=pnpm"
  echo [%date% %time%] INFO: corepack yok, pnpm kullanılacak >> "%LOGDIR%\boot_dev.log"
)

REM --- hızlı doğrulama ---
where node >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: node bulunamadı. PATH: %PATH% >> "%LOGDIR%\boot_dev.log"
    echo [ERROR] node bulunamadı. PATH: %PATH%
    if not "%1"=="task" pause
    exit /b 1
)

call %PNPM% --version >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: pnpm/corepack çalışmıyor. PATH: %PATH% >> "%LOGDIR%\boot_dev.log"
    echo [ERROR] pnpm/corepack çalışmıyor. PATH: %PATH%
    if not "%1"=="task" pause
    exit /b 1
)

for /f "tokens=*" %%v in ('%PNPM% --version 2^>nul') do set "PNPM_VER=%%v"
echo [%date% %time%] INFO: node ve pnpm doğrulandı (pnpm version: %PNPM_VER%) >> "%LOGDIR%\boot_dev.log"

REM Clean up stale processes
echo [boot] Checking for stale processes on ports %PORT% and 4001...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT%"') do (
    echo [boot] Killing process on port %PORT% (PID: %%a)...
    echo [%date% %time%] Killing stale process on port %PORT% (PID: %%a) >> "%LOGDIR%\boot_dev.log"
    taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4001"') do (
    echo [boot] Killing process on port 4001 (PID: %%a)...
    echo [%date% %time%] Killing stale process on port 4001 (PID: %%a) >> "%LOGDIR%\boot_dev.log"
    taskkill /PID %%a /F >nul 2>nul
)

timeout /t 2 /nobreak >nul

REM Start web-next in a separate window with logging
echo [%date% %time%] Starting web-next on port %PORT%... >> "%LOGDIR%\boot_dev.log"
echo [boot] Starting web-next on port %PORT% (hostname: %HOST%)...
echo [boot] Logs: %LOGDIR%\web-next.log

REM Start in separate window with logging (PATH'i child process'e de aktar)
start "spark-web-next" cmd /k "set PATH=%PATH% && %PNPM% --filter web-next dev -- --port %PORT% --hostname %HOST% >> \"%LOGDIR%\web-next.log\" 2>&1"

REM Wait a bit to see if it starts successfully
timeout /t 5 /nobreak >nul

REM Check if process is still running (basic check)
netstat -ano | findstr ":%PORT%" >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] WARNING: Port %PORT% not listening after 5 seconds >> "%LOGDIR%\boot_dev.log"
    echo [WARNING] Port %PORT% may not be listening. Check logs: %LOGDIR%\web-next.log
) else (
    echo [%date% %time%] SUCCESS: web-next started on port %PORT% >> "%LOGDIR%\boot_dev.log"
    echo [OK] web-next started. Check http://%HOST%:%PORT%/dashboard
    echo [OK] Logs: %LOGDIR%\web-next.log
)

REM Uncomment below if you want executor to start automatically:
REM echo [boot] Starting executor on port 4001...
REM start "spark-executor" cmd /k "pnpm --filter executor dev -- --port 4001"

REM If running from Task Scheduler, exit here (don't wait for user input)
if "%1"=="task" (
    echo [boot] Running from Task Scheduler. Exiting (process will continue in separate window).
    exit /b 0
)

REM Manual mode: keep window open and show status
echo.
echo [boot] Done! Check http://%HOST%:%PORT%/dashboard
echo [boot] Logs: %LOGDIR%\boot_dev.log and %LOGDIR%\web-next.log
echo [boot] Press any key to exit (web-next will continue in separate window)
pause >nul
exit /b 0
