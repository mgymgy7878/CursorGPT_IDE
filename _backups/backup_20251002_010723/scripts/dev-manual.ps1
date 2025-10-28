# Usage: pwsh scripts/dev-manual.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$root = Join-Path $root "CursorGPT_IDE"

Push-Location $root
Write-Host "[*] bootstrap pnpm workspace…"
pnpm install

# Temizlik
Remove-Item -ErrorAction SilentlyContinue -Recurse -Force "$root\apps\web-next\.next"
Remove-Item -ErrorAction SilentlyContinue -Recurse -Force "$root\.pnpm-debug.log"

# Executor
$execLog = "$root\.dev\executor.log"
$execPidFile = "$root\.dev\executor.pid"
New-Item -ItemType Directory -Force "$root\.dev" | Out-Null
Write-Host "[*] starting executor (4001)…"
$exec = Start-Process -FilePath "powershell" -ArgumentList @("-Command", "pnpm --filter ./services/executor run dev") `
  -WorkingDirectory $root -RedirectStandardOutput $execLog -RedirectStandardError "$root\.dev\executor-error.log" -PassThru
$exec.Id | Out-File -Encoding ascii $execPidFile

# Web (Next.js)
$webLog = "$root\.dev\web-next.log"
$webPidFile = "$root\.dev\web-next.pid"
Write-Host "[*] starting web-next (3003)…"
$web = Start-Process -FilePath "powershell" -ArgumentList @("-Command", "pnpm --filter ./apps/web-next run dev -- --port 3003") `
  -WorkingDirectory $root -RedirectStandardOutput $webLog -RedirectStandardError "$root\.dev\web-next-error.log" -PassThru
$web.Id | Out-File -Encoding ascii $webPidFile

Write-Host "[OK] executor PID=$($exec.Id)  web-next PID=$($web.Id)"
Write-Host "Logs:"
Write-Host "  $execLog"
Write-Host "  $webLog"

# Hızlı sağlık kontrolü (isteğe bağlı)
Start-Sleep -Seconds 5
try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/health | Out-Null; Write-Host "[✓] executor health 200" }
catch { Write-Warning "[!] executor health erişilemedi" }
try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/api/public/healthz | Out-Null; Write-Host "[✓] web health 200" }
catch { Write-Warning "[!] web health erişilemedi" }

Pop-Location