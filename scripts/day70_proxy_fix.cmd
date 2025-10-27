@echo off
setlocal
echo [DAY-70] Proxy Fix / UI Up (Windows)

set HOST=0.0.0.0
if not defined PORT set PORT=3003
if not defined NEXT_PUBLIC_EXECUTOR_ORIGIN set NEXT_PUBLIC_EXECUTOR_ORIGIN=http://localhost:4001

echo NEXT_PUBLIC_EXECUTOR_ORIGIN=%NEXT_PUBLIC_EXECUTOR_ORIGIN%
pnpm --filter apps/web-next dev -p %PORT% -H %HOST% 