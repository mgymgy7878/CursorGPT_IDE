$ErrorActionPreference = 'SilentlyContinue'
$out = Join-Path $PSScriptRoot '..\logs\web3003_server.out.log'
$err = Join-Path $PSScriptRoot '..\logs\web3003_server.err.log'

Write-Host '--- STDOUT (last 80) ---'
if (Test-Path $out) { Get-Content -Path $out -Tail 80 }
Write-Host '--- STDERR (last 80) ---'
if (Test-Path $err) { Get-Content -Path $err -Tail 80 }

Write-Host '--- FOLLOW 60s (tick=2s) ---'
for ($i = 0; $i -lt 30; $i++) {
  $ts = Get-Date -Format HH:mm:ss
  Write-Host ("[$ts] STDOUT tail:")
  if (Test-Path $out) { Get-Content -Path $out -Tail 5 }
  Write-Host ("[$ts] STDERR tail:")
  if (Test-Path $err) { Get-Content -Path $err -Tail 5 }
  Start-Sleep -Seconds 2
}


