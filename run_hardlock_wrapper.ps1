$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

function Kill-Port([int]$port){
  try{ $pid = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess) }catch{ $pid=$null }
  if(-not $pid){ try{ $pid = (& netstat -ano | Select-String ":$port\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1) }catch{ $pid=$null } }
  if($pid){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 400 }
}

if (Test-Path "C:\dev\CursorGPT_IDE") { Set-Location "C:\dev\CursorGPT_IDE" } else { Set-Location "C:\dev" }

$ps1 = ".\hardlock_probe_e2e.ps1"
if (!(Test-Path $ps1)) {
  Write-Output "ERR: hardlock_probe_e2e.ps1 not found"; exit 1
}

Kill-Port 3004; Kill-Port 3005

$summary = & powershell -NoProfile -ExecutionPolicy Bypass -File $ps1
$summaryText = ($summary -join "`n")
Write-Output $summaryText


