@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM --- Task Scheduler için sağlam PATH (Node + pnpm) ---
set "PATH=C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%USERPROFILE%\AppData\Roaming\npm;%USERPROFILE%\AppData\Local\Programs\nodejs;%PATH%"

rem --- root
set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

set "LOGDIR=%ROOT%\tools\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>nul

set "LOG=%LOGDIR%\guard_webnext.log"
set "WEBLOG=%LOGDIR%\web-next.log"

call :log "=== GUARD START ==="

REM --- pnpm seçimi: corepack varsa onu kullan (en sağlam) ---
where corepack >nul 2>&1
if %errorlevel%==0 (
  set "PNPM=corepack pnpm"
  call :log "INFO: corepack bulundu, corepack pnpm kullanılacak."
) else (
  set "PNPM=pnpm"
  call :log "INFO: corepack yok, pnpm kullanılacak."
)

REM --- hızlı doğrulama ---
where node >nul 2>&1
if errorlevel 1 (
  call :log "ERROR: node bulunamadı. PATH: %PATH%"
  exit /b 1
)

call %PNPM% --version >nul 2>&1
if errorlevel 1 (
  call :log "ERROR: pnpm/corepack çalışmıyor. PATH: %PATH%"
  exit /b 1
)

set "PNPM_VER="
for /f "tokens=*" %%v in ('%PNPM% --version 2^>nul') do set "PNPM_VER=%%v"
call :log "INFO: node ve pnpm doğrulandı (pnpm version: %PNPM_VER%)"

rem --- guard loop
:loop
call :is_listening 3003
if errorlevel 1 (
  call :log "WARN: :3003 LISTENING yok. web-next dev başlatılıyor..."
  call :start_webnext
) else (
  call :log "OK: :3003 LISTENING"
)

timeout /t 5 /nobreak >nul
goto loop

rem ------------------------
:is_listening
set "PORT=%~1"
for /f "tokens=1,2,3,4,5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  exit /b 0
)
exit /b 1

:start_webnext
rem varsa portu tutan pid'i öldür (rare ama iyi)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3003 .*LISTENING"') do (
  call :log "INFO: port 3003 PID=%%p -> taskkill"
  taskkill /F /PID %%p >nul 2>nul
)

rem Scheduler-safe başlatma: PowerShell ile Hidden window (interactive pencere açma sorunlarını önler)
rem PATH'i child process'e de aktar
set "CMDLINE=cd /d ""%ROOT%"" ^&^& set PATH=%PATH% ^&^& %PNPM% --filter web-next dev -- --port 3003 --hostname 127.0.0.1 1>>""%WEBLOG%"" 2>>&1"
call :log "RUN (Hidden): !CMDLINE!"

rem PowerShell ile Hidden window başlat (Task Scheduler-safe)
rem Delayed expansion için CMDLINE'i PowerShell'e aktar
setlocal DisableDelayedExpansion
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -WorkingDirectory '%ROOT%' -FilePath 'cmd.exe' -ArgumentList '/c \"\"cd /d \"\"\"\"%ROOT%\"\"\"\" ^&^& set PATH=%PATH% ^&^& %PNPM% --filter web-next dev -- --port 3003 --hostname 127.0.0.1 1>>\"\"\"\"%WEBLOG%\"\"\"\" 2>>^&1\"\"'"
endlocal

rem kısa bekle + tekrar kontrol
timeout /t 3 /nobreak >nul
call :is_listening 3003
if errorlevel 1 (
  call :log "ERROR: start sonrası hâlâ :3003 dinlemiyor. web-next.log kontrol et."
) else (
  call :log "OK: web-next ayağa kalktı."
)
exit /b 0

:log
set "TS=%date% %time%"
>>"%LOG%" echo [%TS%] %*
exit /b 0

