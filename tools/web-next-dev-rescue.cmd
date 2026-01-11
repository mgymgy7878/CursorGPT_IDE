@echo off
setlocal
set PORT=3003

echo == web-next DEV RESCUE ==

REM 1) Port'ta ne varsa öldür
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
  echo Killing PID %%a on port %PORT%
  taskkill /F /PID %%a >nul 2>nul
)

timeout /t 2 /nobreak >nul

REM 2) .next temizle
if exist "apps\web-next\.next" (
  echo Removing apps\web-next\.next
  rmdir /S /Q "apps\web-next\.next" >nul 2>nul
)

REM 3) Dev başlat
echo Starting dev server on %PORT%
cd /d "%~dp0.."
pnpm -w --filter web-next dev -- --port %PORT%

