@echo off
start "executor-4001" cmd /c "pnpm -w -F executor dev"
ping -n 3 127.0.0.1 >nul
start "web-3003" cmd /c "pnpm -w -F web-next dev -- -p 3003"
echo [OK] executor:4001 + web:3003 baslatildi. UI: http://127.0.0.1:3003/ops
