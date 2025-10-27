# === Clean & versions ===
taskkill /F /IM node.exe 2>$null
netstat -ano | findstr ":3000" | ForEach-Object { ($_ -split '\s+')[-1] } | % { taskkill /F /PID $_ } 2>$null
netstat -ano | findstr ":3010" | ForEach-Object { ($_ -split '\s+')[-1] } | % { taskkill /F /PID $_ } 2>$null
netstat -ano | findstr ":4001" | ForEach-Object { ($_ -split '\s+')[-1] } | % { taskkill /F /PID $_ } 2>$null

cd C:\dev\CursorGPT_IDE
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { corepack enable; corepack prepare pnpm@8.15.4 --activate }
pnpm -v
pnpm install --frozen-lockfile 2>$null; if ($LASTEXITCODE -ne 0) { pnpm install --force }

# === Start EXECUTOR (port 4001) ===
$execCmd = 'cd services\executor; $env:LOG_LEVEL="debug"; if (Test-Path .\run-local.cjs) { node .\run-local.cjs } else { pnpm build; node .\dist\server.js }'
Start-Process powershell -ArgumentList "-NoExit","-Command",$execCmd -WindowStyle Normal

Start-Sleep -Seconds 2
Write-Host "`n[Check] 4001 dinleniyor mu?" -ForegroundColor Cyan
netstat -ano | findstr ":4001"

# === Start WEB (Next.js, port 3000) ===
$webCmd = @'
cd apps\web-next
$env:EXECUTOR_URL="http://127.0.0.1:4001"
$env:NEXT_PUBLIC_WS_URL="ws://127.0.0.1:4001/ws/live"
$env:ADMIN_TOKEN="local-admin-123"
$env:NEXT_PUBLIC_ADMIN_ENABLED="1"
$env:HOST="127.0.0.1"
$env:PORT="3000"
try { pnpm dev } catch { npx next dev -H 127.0.0.1 -p 3000 }
'@
Start-Process powershell -ArgumentList "-NoExit","-Command",$webCmd -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Host "`n[Check] 3000 dinleniyor mu?" -ForegroundColor Cyan
netstat -ano | findstr ":3000"

Write-Host "`nHazır: http://127.0.0.1:3000" -ForegroundColor Green
