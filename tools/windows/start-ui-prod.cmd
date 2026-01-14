@echo off
REM Spark Trading - UI Prod-Like Server Starter
REM Usage: start-ui-prod.cmd
REM Builds and starts web-next in production mode (more stable, no HMR)

cd /d "%~dp0\..\.."

echo [INFO] Starting UI server in prod-like mode...
echo [INFO] This will build first, then start (no HMR, more stable)
echo.

REM Build first
echo [INFO] Building web-next...
call pnpm --filter web-next build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [OK] Build successful
echo.

REM Start production server
echo [INFO] Starting production server on 127.0.0.1:3003...
call pnpm --filter web-next start -- --hostname 127.0.0.1 --port 3003

pause
