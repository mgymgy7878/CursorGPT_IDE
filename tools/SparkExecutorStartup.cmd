@echo off
rem Fast Startup sigortası: Kullanıcı logon'da executor daemon'u başlatır
rem Task Scheduler ONSTART bazen Fast Startup'da tutarsız olabilir
rem Bu script Startup klasöründe çalışır (Win+R -> shell:startup)

setlocal EnableExtensions

rem Sabit yol (en güvenilir)
set "ROOT=C:\dev\CursorGPT_IDE"
set "DAEMON=%ROOT%\tools\EXECUTOR_DAEMON.cmd"

rem Executor zaten çalışıyorsa tekrar başlatma (port kontrolü)
netstat -ano | findstr /R /C:":4001 .*LISTENING" >nul 2>nul
if %errorlevel%==0 (
  exit /b 0
)

rem Daemon'u başlat (arka planda, minimize)
start "" /min cmd.exe /c "%DAEMON%"

exit /b 0

