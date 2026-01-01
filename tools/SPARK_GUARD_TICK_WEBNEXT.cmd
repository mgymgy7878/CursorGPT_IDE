@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
cd /d "%ROOT%"

set "PORT=3003"
set "LOGDIR=%ROOT%\tools\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "LOG=%LOGDIR%\guard_tick_webnext.log"

call :ensure_path
call :log "tick start"

rem Port zaten dinliyorsa çık
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  call :log "port %PORT% listening -> OK"
  exit /b 0
)

call :log "port %PORT% NOT listening -> starting web-next"
rem BOOT_DEV.cmd'yi task modunda çağır (pause yok, log'a akar)
start "spark-web-next" /min cmd /d /c "%ROOT%\tools\BOOT_DEV.cmd task"

timeout /t 5 /nobreak >nul

rem Başlatma sonrası kontrol
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  call :log "start OK, port %PORT% listening"
  exit /b 0
) else (
  call :log "start attempted but port still NOT listening (check tools\logs\web-next.log)"
  exit /b 1
)

:ensure_path
rem Task Scheduler için sağlam PATH (Node + pnpm)
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%USERPROFILE%\AppData\Roaming\npm;%USERPROFILE%\AppData\Local\Programs\nodejs"
exit /b 0

:log
for /f "delims=" %%A in ('powershell -NoProfile -Command "Get-Date -Format ''yyyy-MM-dd HH:mm:ss''"') do set "TS=%%A"
>>"%LOG%" echo [%TS%] %*
exit /b 0

