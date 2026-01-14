@echo off
REM Spark Trading - UI Dev Server Starter
REM Usage: start-ui.cmd
REM Starts the web-next dev server on 127.0.0.1:3003

cd /d "%~dp0\..\.."

echo [INFO] Starting UI dev server...
echo [INFO] Port: 3003
echo [INFO] Hostname: 127.0.0.1
echo.

pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003

pause
