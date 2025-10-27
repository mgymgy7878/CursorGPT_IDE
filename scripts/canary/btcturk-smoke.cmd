@echo off
set BODY={"pairSymbol":"BTCUSDT","side":"buy","quantity":0.0002}
curl -s -X POST http://127.0.0.1:4001/btcturk/order/market -H "Content-Type: application/json" --data "%BODY%"
echo.
curl -s -X POST http://127.0.0.1:4001/canary/matrix
echo. 