# proof & canary (testnet dry-run) collector
# usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\prove-e2e.ps1 -Symbol BTCUSDT -Interval 1m -Leverage 3 -Notional 10 -Side BUY

param(
  [string]$WebBase = "http://127.0.0.1:3003",
  [string]$ExecBase = "http://127.0.0.1:4001",
  [string]$Symbol = "BTCUSDT",
  [string]$Interval = "1m",
  [int]$Leverage = 3,
  [double]$Notional = 10,
  [ValidateSet("BUY","SELL")] [string]$Side = "BUY"
)

$ErrorActionPreference = "Stop"
$root = Join-Path $PWD "evidence"
$dev  = Join-Path $root "local"
$smk  = Join-Path $dev  "smoke"
$cnr  = Join-Path $dev  "canary"
New-Item -ItemType Directory -Force -Path $smk | Out-Null
New-Item -ItemType Directory -Force -Path $cnr | Out-Null

function SaveJson($url,$path) {
  $r = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 10
  ($r | ConvertTo-Json -Depth 8) | Out-File -Encoding UTF8 -FilePath $path
  return $true
}
function SaveText($url,$path) {
  $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 10
  $r.Content | Out-File -Encoding UTF8 -FilePath $path
  return $true
}
function WaitUp($url,$tries=30){
  for($i=0;$i -lt $tries;$i++){ try{ Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 2 | Out-Null; return $true } catch { Start-Sleep -s 1 } }
  return $false
}

Write-Host "=== WAIT HEALTH ==="
if (-not (WaitUp "$WebBase/api/public/health")) { throw "Web health gelmedi: $WebBase" }
if (-not (WaitUp "$ExecBase/public/health")) { throw "Executor health gelmedi: $ExecBase" }

Write-Host "=== COLLECT HEALTH/METRICS ==="
SaveJson "$WebBase/api/public/health" (Join-Path $smk "web_health.json")   | Out-Null
SaveJson "$ExecBase/public/health"   (Join-Path $smk "exec_health.json")  | Out-Null
SaveText "$WebBase/api/public/metrics" (Join-Path $smk "metrics.txt")     | Out-Null

Write-Host "=== FUTURES PROXY CHECK ==="
SaveJson "$WebBase/api/futures/time" (Join-Path $smk "futures_time.json") | Out-Null
$kl = "$WebBase/api/futures/klines?symbol=$Symbol&interval=$Interval&limit=5"
SaveJson $kl (Join-Path $smk "futures_klines.json")                        | Out-Null

Write-Host "=== CANARY (TESTNET DRY-RUN) ==="
# Try direct /canary/run, fallback to /api/canary/run
$payload = @{
  market   = "futures"
  symbol   = $Symbol
  leverage = $Leverage
  notional = $Notional
  side     = $Side
  type     = "MARKET"
  testnet  = $true
}
$body = ($payload | ConvertTo-Json -Depth 6)

$canaryOk = $false
try {
  $res = Invoke-RestMethod -Method POST -Uri "$ExecBase/canary/run" -Body $body -ContentType "application/json" -TimeoutSec 20
  ($res | ConvertTo-Json -Depth 8) | Out-File -Encoding UTF8 -FilePath (Join-Path $cnr "canary_run.json")
  $canaryOk = $true
} catch {
  Write-Host "Direct /canary/run failed, trying /api/canary/run..."
  $res = Invoke-RestMethod -Method POST -Uri "$ExecBase/api/canary/run" -Body $body -ContentType "application/json" -TimeoutSec 20
  ($res | ConvertTo-Json -Depth 8) | Out-File -Encoding UTF8 -FilePath (Join-Path $cnr "canary_run.json")
  $canaryOk = $true
}

Write-Host "=== SUMMARY ==="
$webH = Get-Content (Join-Path $smk "web_health.json")  -Raw
$exH  = Get-Content (Join-Path $smk "exec_health.json") -Raw
$tmOk = Test-Path (Join-Path $smk "futures_time.json")
$klOk = Test-Path (Join-Path $smk "futures_klines.json")
$cnOk = $canaryOk
$summary = @{
  webHealth   = (ConvertFrom-Json $webH)
  execHealth  = (ConvertFrom-Json $exH)
  futures     = @{ timeOk = $tmOk; klinesOk = $klOk }
  canaryDryRunOk = $cnOk
}
($summary | ConvertTo-Json -Depth 8) | Out-File -Encoding UTF8 -FilePath (Join-Path $dev "summary.json")
$summary | ConvertTo-Json -Depth 8
Write-Host "Artifacts → $dev"
Write-Host "Open Strategy Lab for SSE (manual): $WebBase/strategy-lab"


