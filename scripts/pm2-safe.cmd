@echo off
rem Read-only pm2 wrapper
set CMD=%1
if "%CMD%"=="ls"        (pm2 ls & exit /b %errorlevel%)
if "%CMD%"=="list"      (pm2 list & exit /b %errorlevel%)
if "%CMD%"=="monit"     (pm2 monit & exit /b %errorlevel%)
if "%CMD%"=="describe"  (shift & pm2 describe %* & exit /b %errorlevel%)
echo [pm2-safe] BLOCKED
