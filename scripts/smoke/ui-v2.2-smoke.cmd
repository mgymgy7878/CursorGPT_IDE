@echo off
setlocal enabledelayedexpansion
set OUT=docs\evidence\dev\v2.2-ui
if not exist "%OUT%" mkdir "%OUT%"

REM Confirm (gate OFF)
curl -s -X POST http://127.0.0.1:4001/api/futures/order -H "Content-Type: application/json" -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"quantity\":0.001}" > "%OUT%\smoke_confirm_gate.txt"

REM UDS lifecycle
for /f "delims=" %%A in ('curl -s -X POST http://127.0.0.1:4001/api/futures/userDataStream') do set CREATE=%%A
echo CREATE: %CREATE%> "%OUT%\uds_lifecycle.txt"
echo %CREATE%> "%TEMP%\uds.json"
curl -s -X PUT  http://127.0.0.1:4001/api/futures/userDataStream -H "Content-Type: application/json" -d "@%TEMP%\uds.json" >> "%OUT%\uds_lifecycle.txt"
echo.>> "%OUT%\uds_lifecycle.txt"
curl -s -X DELETE http://127.0.0.1:4001/api/futures/userDataStream -H "Content-Type: application/json" -d "@%TEMP%\uds.json" >> "%OUT%\uds_lifecycle.txt"

REM Snapshots
curl -s http://127.0.0.1:4001/api/futures/positions > "%OUT%\positions_snapshot.json"

REM Metrics (proxy 3003 → executor)
curl -s http://127.0.0.1:3003/api/public/metrics > "%OUT%\metrics_dump.prom"

REM Alerts rules (repo kopyası)
copy /Y services\executor\config\alerts.rules "%OUT%\alerts.rules" >nul 2>nul

echo [OK] Evidence written to %OUT%


