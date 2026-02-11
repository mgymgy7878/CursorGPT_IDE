param(
  [int]$Port = 3003
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "== web-next DEV RESCUE ==" -ForegroundColor Yellow

# 1) Port'ta ne varsa öldür
$pid = (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if ($pid) {
  Write-Host "Killing PID $pid on port $Port" -ForegroundColor Red
  Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}

# 2) .next temizle
$nextDir = "apps\web-next\.next"
if (Test-Path $nextDir) {
  Write-Host "Removing $nextDir" -ForegroundColor Yellow
  Remove-Item -Recurse -Force $nextDir -ErrorAction SilentlyContinue
}

# 3) Dev başlat
Write-Host "Starting dev server on $Port" -ForegroundColor Green
Set-Location $PSScriptRoot\..
pnpm -w --filter web-next dev -- --port $Port

