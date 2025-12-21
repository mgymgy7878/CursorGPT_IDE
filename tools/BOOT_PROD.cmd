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
echo [%date% %time%] BOOT_PROD starting... >> "%LOGDIR%\boot_prod.log"
echo [%date% %time%] Working directory: %CD% >> "%LOGDIR%\boot_prod.log"

REM --- pnpm seçimi: corepack varsa onu kullan (en sağlam) ---
where corepack >nul 2>&1
if %errorlevel%==0 (
  set "PNPM=corepack pnpm"
  echo [%date% %time%] INFO: corepack bulundu, corepack pnpm kullanılacak >> "%LOGDIR%\boot_prod.log"
) else (
  set "PNPM=pnpm"
  echo [%date% %time%] INFO: corepack yok, pnpm kullanılacak >> "%LOGDIR%\boot_prod.log"
)

REM --- hızlı doğrulama ---
where node >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: node bulunamadı. PATH: %PATH% >> "%LOGDIR%\boot_prod.log"
    echo [ERROR] node bulunamadı. PATH: %PATH%
    pause
    exit /b 1
)

call %PNPM% --version >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: pnpm/corepack çalışmıyor. PATH: %PATH% >> "%LOGDIR%\boot_prod.log"
    echo [ERROR] pnpm/corepack çalışmıyor. PATH: %PATH%
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('%PNPM% --version 2^>nul') do set "PNPM_VER=%%v"
echo [%date% %time%] INFO: node ve pnpm doğrulandı (pnpm version: %PNPM_VER%) >> "%LOGDIR%\boot_prod.log"

REM Clean up stale processes
echo [boot-prod] Checking for stale processes on ports %PORT% and 4001...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT%"') do (
    echo [boot-prod] Killing process on port %PORT% (PID: %%a)...
    echo [%date% %time%] Killing stale process on port %PORT% (PID: %%a) >> "%LOGDIR%\boot_prod.log"
    taskkill /PID %%a /F >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4001"') do (
    echo [boot-prod] Killing process on port 4001 (PID: %%a)...
    echo [%date% %time%] Killing stale process on port 4001 (PID: %%a) >> "%LOGDIR%\boot_prod.log"
    taskkill /PID %%a /F >nul 2>nul
)

timeout /t 2 /nobreak >nul

REM Build
echo [boot-prod] Building web-next (production)...
echo [%date% %time%] Starting build... >> "%LOGDIR%\boot_prod.log"
call %PNPM% --filter web-next build >> "%LOGDIR%\build.log" 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] ERROR: Build failed (exit code: %ERRORLEVEL%) >> "%LOGDIR%\boot_prod.log"
    echo [ERROR] Build failed. Check logs: %LOGDIR%\build.log
    pause
    exit /b 1
)

echo [%date% %time%] Build successful >> "%LOGDIR%\boot_prod.log"

REM Start in production mode
echo [boot-prod] Starting web-next in production mode on port %PORT%...
echo [%date% %time%] Starting web-next in production mode... >> "%LOGDIR%\boot_prod.log"

start "spark-web-next-prod" cmd /k "set PATH=%PATH% && %PNPM% --filter web-next start -- --port %PORT% --hostname %HOST% >> \"%LOGDIR%\web-next-prod.log\" 2>&1"

REM Wait a bit to see if it starts successfully
timeout /t 5 /nobreak >nul

REM Check if process is still running
netstat -ano | findstr ":%PORT%" >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] WARNING: Port %PORT% not listening after 5 seconds >> "%LOGDIR%\boot_prod.log"
    echo [WARNING] Port %PORT% may not be listening. Check logs: %LOGDIR%\web-next-prod.log
) else (
    echo [%date% %time%] SUCCESS: web-next started on port %PORT% >> "%LOGDIR%\boot_prod.log"
    echo [OK] web-next started. Check http://%HOST%:%PORT%/dashboard
    echo [OK] Logs: %LOGDIR%\web-next-prod.log
)

REM Uncomment below if you want executor to start automatically:
REM echo [boot-prod] Starting executor on port 4001...
REM start "spark-executor" cmd /k "pnpm --filter executor dev -- --port 4001"

echo [boot-prod] Done! Check http://%HOST%:%PORT%/dashboard
echo [boot-prod] Note: Production mode (no hot-reload)
echo [boot-prod] Logs: %LOGDIR%\boot_prod.log and %LOGDIR%\web-next-prod.log

REM If running from Task Scheduler, exit here
if "%1"=="task" (
    echo [boot-prod] Running from Task Scheduler. Exiting (process will continue in separate window).
    exit /b 0
)

pause

