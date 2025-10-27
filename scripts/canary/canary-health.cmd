@echo off
for /f "tokens=* usebackq" %%i in (`curl -s -X POST http://127.0.0.1:4001/canary/stats`) do set JSON=%%i
echo %JSON%
echo. 