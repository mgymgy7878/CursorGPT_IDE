@echo off
echo [1/3] Health
curl -s http://127.0.0.1:3003/api/public/health

echo.
echo [2/3] Canary
curl -s http://127.0.0.1:3003/api/public/canary/status

echo.
echo [3/3] SSE (orders) - 2 sn dinle
curl -s http://127.0.0.1:3003/api/public/events/orders --max-time 2
echo.
echo Done. 