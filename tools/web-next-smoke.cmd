@echo off
setlocal
set BASE=http://127.0.0.1:3003

echo == SMOKE TEST ==
echo.

REM Route health check
echo [Routes]
curl -s -o nul -w "  dashboard: %%{http_code}\n" "%BASE%/dashboard" || echo "  dashboard: FAIL"
curl -s -o nul -w "  market-data: %%{http_code}\n" "%BASE%/market-data" || echo "  market-data: FAIL"
curl -s -o nul -w "  running: %%{http_code}\n" "%BASE%/running" || echo "  running: FAIL"
curl -s -o nul -w "  strategies: %%{http_code}\n" "%BASE%/strategies" || echo "  strategies: FAIL"
curl -s -o nul -w "  control: %%{http_code}\n" "%BASE%/control" || echo "  control: FAIL"
curl -s -o nul -w "  settings: %%{http_code}\n" "%BASE%/settings" || echo "  settings: FAIL"

echo.
echo [Assets]
REM Asset health check (should return 200/304, not 404 or HTML)
curl -s -o nul -w "  _next/static (should be 200/304): %%{http_code}\n" "%BASE%/_next/static/" || echo "  _next/static: FAIL"

echo.
echo Done.

