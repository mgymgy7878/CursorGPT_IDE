@echo off
setlocal enabledelayedexpansion

REM === Spark WebNext Dev Server Watchdog ===
REM Port 3003'ü sürekli kontrol eder, dinlenmiyorsa başlatır
REM Startup klasörüne eklenir (penceresiz VBS wrapper ile)

REM Script'in bulunduğu klasörden repo root'u bul
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "ROOT=%%~fI"

REM log klasörü
set "LOGDIR=%ROOT%\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

set "OUT=%LOGDIR%\webnext-watch.out.log"
set "ERR=%LOGDIR%\webnext-watch.err.log"

REM Başlangıç logu
echo ======================================== >> "%OUT%"
echo [%date% %time%] WATCHDOG START >> "%OUT%"
echo [%date% %time%] Root: %ROOT% >> "%OUT%"
echo [%date% %time%] Monitoring port 3003... >> "%OUT%"
echo ======================================== >> "%OUT%"

:loop
REM Port 3003 LISTENING durumunda mı kontrol et
netstat -ano 2>nul | findstr /R /C:":3003 .*LISTENING" >nul
if errorlevel 1 (
  REM Port dinlenmiyor, başlat
  echo [%date% %time%] Port 3003 NOT listening -> attempting to start server... >> "%OUT%"
  start "" /min cmd /c call "%ROOT%\tools\windows\start-webnext-dev.cmd" >> "%OUT%" 2>> "%ERR%"
  REM Server başlaması için 15 saniye bekle (next.cmd başlatma süresi)
  timeout /t 15 /nobreak >nul
  REM Başlatma sonrası port kontrolü
  netstat -ano 2>nul | findstr /R /C:":3003 .*LISTENING" >nul
  if errorlevel 1 (
    echo [%date% %time%] Port 3003 still NOT listening after start attempt >> "%OUT%"
  ) else (
    echo [%date% %time%] Port 3003 is now listening - server started successfully >> "%OUT%"
  )
) else (
  REM Port dinleniyor, 30 saniye bekle ve tekrar kontrol et
  timeout /t 30 /nobreak >nul
)
goto loop
