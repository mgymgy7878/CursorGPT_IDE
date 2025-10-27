@echo off
setlocal enabledelayedexpansion
set TS=%DATE:~-4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TS=%TS: =0%
set OUT=docs\evidence\dev\v2.2-ui\root-cause_%TS%
mkdir "%OUT%" 2>nul

echo [PORTS] > "%OUT%\summary.txt"
netstat -aon | find ":3003" >> "%OUT%\summary.txt"
netstat -aon | find ":4001" >> "%OUT%\summary.txt"

echo.>> "%OUT%\summary.txt"
echo [WEB-FIRST-ERROR] >> "%OUT%\summary.txt"
for /f "tokens=1,* delims=]" %%A in ('cmd /c "type docs\evidence\dev\v2.2-ui\rescue_*\web.stderr.log 2^>nul ^| find /n /v \"\""') do (
  echo %%B>> "%OUT%\summary.txt" & goto :doneweb
)
:doneweb

echo.>> "%OUT%\summary.txt"
echo [EXEC-FIRST-ERROR] >> "%OUT%\summary.txt"
for /f "tokens=1,* delims=]" %%A in ('cmd /c "type docs\evidence\dev\v2.2-ui\rescue_*\executor.stderr.log 2^>nul ^| find /n /v \"\""') do (
  echo %%B>> "%OUT%\summary.txt" & goto :doneexec
)
:doneexec

echo.>> "%OUT%\summary.txt"
echo [ENV] >> "%OUT%\summary.txt"
node -v >> "%OUT%\summary.txt" 2>&1
pnpm -v >> "%OUT%\summary.txt" 2>&1

echo [OK] %OUT%\summary.txt


