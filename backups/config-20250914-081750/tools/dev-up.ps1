#requires -Version 5.1
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# repo kökü
$root = Resolve-Path (Join-Path (Split-Path -Parent $PSCommandPath) '..')
New-Item -ItemType Directory -Path "$root\logs" -Force | Out-Null

# Log rotation (başlamadan önce büyük logları temizle)
& "$PSScriptRoot\rotate-logs.ps1"

function Kill-Port([int[]]$ports) {
  $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort }
  foreach ($c in $conns) { try { Stop-Process -Id $c.OwningProcess -Force } catch {} }
}

# önce temizlik
Kill-Port 3003, 4001
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# watcher ve telemetri ayarları (Windows için stabil)
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:WATCHPACK_POLLING = "true"
$env:CHOKIDAR_USEPOLLING = "1"
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:EXECUTOR_BASE = "http://127.0.0.1:4001"

# API'yi başlat (çalışma klasörü ile)
$api = Start-Process -FilePath "cmd.exe" -WorkingDirectory "$root\services\executor" `
  -ArgumentList "/c", "pnpm", "run", "dev", "1>>", "$root\logs\executor.txt", "2>&1" `
  -PassThru -WindowStyle Hidden

# WEB'i başlat (Next dev komutu apps/web-next/package.json içinde: next dev -H 127.0.0.1 -p 3003)
$web = Start-Process -FilePath "cmd.exe" -WorkingDirectory "$root\apps\web-next" `
  -ArgumentList "/c", "pnpm", "run", "dev", "1>>", "$root\logs\web-next.txt", "2>&1" `
  -PassThru -WindowStyle Hidden

# PID'leri kaydet
@{ api = $api.Id; web = $web.Id } | ConvertTo-Json | Set-Content "$root\logs\pids.json"

# sağlık bekleyici
function Wait-200($url, [int]$retries = 30, [int]$sleep = 2) {
  for ($i = 0; $i -lt $retries; $i++) {
    try { if ((Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 6).StatusCode -eq 200) { return $true } } catch {}
    Start-Sleep -Seconds $sleep
  }
  return $false
}

$apiOk = Wait-200 "http://127.0.0.1:4001/health"
$uiOk = Wait-200 "http://127.0.0.1:3003/api/public/ping"

if ($apiOk -and $uiOk) { Write-Host "GREEN [OK]  UI+API 200 OK"; exit 0 }
Write-Host "YELLOW [WARNING]  UI=$uiOk API=$apiOk - loglari kontrol edin: logs\web-next.txt, logs\executor.txt"
exit 1
