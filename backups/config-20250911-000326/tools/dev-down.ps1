$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path (Split-Path -Parent $PSCommandPath) '..')

# PID dosyasından kapat
if (Test-Path "$root\logs\pids.json"){
  $p = Get-Content "$root\logs\pids.json" | ConvertFrom-Json
  foreach($id in @($p.api,$p.web)){ try { Stop-Process -Id $id -Force } catch {} }
}

# emniyet kemeri
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 3003,4001 -ErrorAction SilentlyContinue | ForEach-Object {
  try { Stop-Process -Id $_.OwningProcess -Force } catch {}
}

# Next artiklari
Remove-Item -Recurse -Force "$root\apps\web-next\.next" -ErrorAction SilentlyContinue
Write-Host "DOWN [OK]  tum surecler kapatildi ve artiklardan temizlendi."
