@echo off
REM Spark Trading - All Dev Servers Starter
REM Usage: start-all.cmd
REM Starts both UI (3003) and Executor (4001) dev servers

cd /d "%~dp0\..\.."

echo [INFO] Starting all dev servers...
echo [INFO] UI: http://127.0.0.1:3003
echo [INFO] Executor: http://127.0.0.1:4001
echo.

REM Start UI server in background (PowerShell)
start "Spark UI Dev Server" powershell -NoExit -Command "cd '%CD%'; pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003"

REM Wait a bit before starting executor
timeout /t 2 /nobreak >nul

REM Start Executor server in background (PowerShell)
start "Spark Executor Dev Server" powershell -NoExit -Command "cd '%CD%'; pnpm --filter executor dev"

echo [INFO] Both servers started in separate windows.
echo [INFO] Close this window to keep servers running.
pause
