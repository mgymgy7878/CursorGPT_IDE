param([string]$Base)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

if ([string]::IsNullOrWhiteSpace($Base)) { $Base = $env:EXEC_BASE }
if ([string]::IsNullOrWhiteSpace($Base)) { $Base = "http://127.0.0.1:4001" }

function Get-Json($url) {
  try {
    $resp = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 10
    return @{ ok = $true; data = $resp }
  } catch {
    return @{ ok = $false; err = $_.Exception.Message }
  }
}

Write-Host "=== SMOKE FUTURES @ $Base ==="

$results = [ordered]@{}
$results.health_public    = Get-Json("$Base/public/health")
$results.health_live      = Get-Json("$Base/api/public/live/health")
$results.time             = Get-Json("$Base/api/futures/time")
$results.info             = Get-Json("$Base/api/futures/exchangeInfo?symbol=BTCUSDT")
$results.klines           = Get-Json("$Base/api/futures/klines?symbol=BTCUSDT&interval=1h&limit=2")

function Line($name, $obj) {
  if ($obj.ok) { Write-Host ("OK  {0}" -f $name) } else { Write-Host ("ERR {0}: {1}" -f $name, $obj.err) }
}
Line "/public/health"                 $results.health_public
Line "/api/public/live/health"        $results.health_live
Line "/api/futures/time"              $results.time
Line "/api/futures/exchangeInfo..."   $results.info
Line "/api/futures/klines..."         $results.klines

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$eviDir = "evidence\local\smoke"
New-Item -ItemType Directory -Force -Path $eviDir | Out-Null
$payload = [pscustomobject]@{
  base      = $Base
  timestamp = (Get-Date).ToString("s")
  results   = $results
}
$payload | ConvertTo-Json -Depth 6 | Set-Content -Path "$eviDir\smoke_futures_$stamp.json" -Encoding UTF8

if (( $results.health_public.ok -or $results.health_live.ok ) -and $results.time.ok -and $results.info.ok -and $results.klines.ok) {
  Write-Host "=== SMOKE: PASS ==="
  exit 0
} else {
  Write-Host "=== SMOKE: FAIL ==="
  exit 1
}
