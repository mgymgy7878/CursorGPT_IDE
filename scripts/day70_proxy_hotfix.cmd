@echo off
setlocal enabledelayedexpansion
echo [DAY-70] Proxy Hotfix Runner (Windows)

set HOST=0.0.0.0
set PORT=3003
set EXECUTOR_ORIGIN=http://localhost:4001
set NEXT_PUBLIC_EXECUTOR_ORIGIN=%EXECUTOR_ORIGIN%
set NEXT_TELEMETRY_DISABLED=1

where pnpm >NUL 2>&1 || (echo pnpm bulunamadi & exit /b 1)

echo [1/4] Typecheck...
pnpm -w exec tsc -b || echo "Typecheck warnings"

echo [2/4] Executor baslatiliyor...
start "executor" cmd /c "pnpm --filter @spark/executor dev"

echo [3/4] Web-Next baslatiliyor...
start "web-next" cmd /c "pnpm --filter apps/web-next dev -p %PORT% -H %HOST%"

echo [4/4] Hızlı testler:
curl -s http://localhost:4001/public/health && echo:
curl -s http://localhost:%PORT%/api/local/health && echo:
curl -s http://localhost:%PORT%/api/public/health && echo:
echo POST echo:
curl -s -H "Content-Type: application/json" -X POST -d "{\"msg\":\"test\"}" http://localhost:%PORT%/api/public/echo && echo: 