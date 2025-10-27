param(
  [int]$Port = 3003,
  [switch]$Open,
  [switch]$NoKill,
  [switch]$DisableLint
)

$ErrorActionPreference = "Stop"

function Test-FreePort([int]$p) {
  try {
    Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop | Out-Null
    return $false
  } catch {
    return $true
  }
}

function Kill-Port([int]$p) {
  $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if ($c) {
    $pids = $c | Select -Expand OwningProcess -Unique
    foreach ($procId in $pids) {
      try { Stop-Process -Id $procId -Force } catch {}
    }
  }
}

$target = $Port
if (-not $NoKill) { Kill-Port $target }
if (-not (Test-FreePort $target)) {
  $alt = $Port + 1
  if (Test-FreePort $alt) { $target = $alt }
  else { $target = Get-Random -Minimum 3005 -Maximum 3999 }
}

$env:NEXT_TELEMETRY_DISABLED = "1"
if ($DisableLint) { $env:NEXT_IGNORE_ESLINT = "1" }

Write-Host "⇢ Starting dev on http://127.0.0.1:$target" -ForegroundColor Green

if ($Open) {
  Start-Job -ScriptBlock { param($u) Start-Sleep 2; Start-Process $u } -ArgumentList "http://127.0.0.1:$target/backtest-demo" | Out-Null
  Start-Job -ScriptBlock { param($u) Start-Sleep 3; Start-Process $u } -ArgumentList "http://127.0.0.1:$target/optimize" | Out-Null
  Start-Job -ScriptBlock { param($u) Start-Sleep 4; Start-Process $u } -ArgumentList "http://127.0.0.1:$target/automation" | Out-Null
}

npm run dev:auto -w apps/web-next -- -p $target -H 127.0.0.1 