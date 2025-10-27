@echo off
cd /d C:\dev\CursorGPT_IDE
where pnpm >nul 2>&1 || (echo pnpm gerekli & exit /b 1)
where pm2  >nul 2>&1 || npm i -g pm2

if not exist node_modules pnpm install
pm2 start ecosystem.config.cjs --silent

timeout /t 3 >nul
echo --- SPARK START EVIDENCE ---
curl -s http://127.0.0.1:4001/health
for /f "tokens=2 delims= " %%a in ('powershell -NoP -C "(Invoke-WebRequest http://127.0.0.1:3003 -UseBasicParsing).StatusCode"') do echo UI HTTP %%a
curl -s "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY"
pm2 status

