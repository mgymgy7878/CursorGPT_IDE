@echo off
setlocal ENABLEDELAYEDEXPANSION
set NONCE=%1
if "%NONCE%"=="" set NONCE=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set NONCE=%NONCE: =0%

set ROOT=evidence\canary\%NONCE%
mkdir "%ROOT%" 2>NUL

echo {"symbol":"BTCUSDT","side":"BUY","qty":0.0002} > "%ROOT%\body.json"

curl -s -X POST http://127.0.0.1:4001/canary/arm     -H "Content-Type: application/json" --data "@%ROOT%\body.json" > "%ROOT%\arm.json"
curl -s -X POST http://127.0.0.1:4001/canary/confirm -H "Content-Type: application/json" --data "@%ROOT%\body.json" > "%ROOT%\confirm.json"
curl -s http://127.0.0.1:4001/metrics > "%ROOT%\metrics.txt"

echo NONCE=%NONCE% > "%ROOT%\env.redacted.txt"
echo BINANCE_TESTNET=%BINANCE_TESTNET%>> "%ROOT%\env.redacted.txt"
echo RECV_WINDOW=%BINANCE_RECV_WINDOW%>> "%ROOT%\env.redacted.txt"

powershell -Command "Compress-Archive -Path '%ROOT%\*' -DestinationPath '%ROOT%\bundle.zip' -Force" 1>NUL 2>NUL
echo Evidence written to %ROOT% 