Param(
  [string]$WebOrigin = "http://127.0.0.1:3003",
  [string]$Token = $env:NEXT_PUBLIC_API_TOKEN,
  [string]$EvidenceDir
)

if (-not $Token) { $Token = "dev-token-123" }
$Headers = @{ 'Content-Type'='application/json'; 'Authorization' = "Bearer $Token" }

$root = "evidence\local\fast-lane"
if ($EvidenceDir) {
  $dir = $EvidenceDir
} else {
  if (-not (Test-Path $root)) { throw "Fast-lane evidence root not found: $root" }
  $dir = (Get-ChildItem -Directory $root | Sort-Object Name -Descending | Select-Object -First 1).FullName
}

$riskFile = Join-Path $dir '2_risk_set.json'
$canFile  = Join-Path $dir '3_canary_confirm.json'

function Get-ConfirmToken([string]$filePath) {
  if (-not (Test-Path $filePath)) { return $null }
  $raw = Get-Content $filePath -Raw
  try { $obj = $raw | ConvertFrom-Json } catch { $obj = $null }
  if ($obj -and $obj.confirm_token) { return $obj.confirm_token }
  $m = [regex]::Match($raw, '"confirm_token"\s*:\s*"([^"]+)"')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

$riskToken = Get-ConfirmToken $riskFile
$canToken  = Get-ConfirmToken $canFile

# Fallback: token yoksa yeni pending oluştur
if (-not $riskToken) {
  try {
    $setBody = @{ action='/risk/threshold.set'; params=@{ exchange='binance:futures'; maxNotionalPerTradeUSDT=200; maxLeverage=5; maxDailyDrawdownPct=3; requireStopLoss=$true; killSwitch=$true }; dryRun=$false; confirm_required=$true; reason='Guardrails' } | ConvertTo-Json -Depth 6
    $setRes = Invoke-RestMethod -Uri ("$WebOrigin/api/risk/threshold/set") -Method POST -Headers $Headers -Body $setBody -TimeoutSec 20
    $riskToken = $setRes.confirm_token
  } catch { }
}
if (-not $canToken) {
  try {
    $confBody = @{ action='/canary/confirm'; params=@{ scope='binance:futures'; targets=@('place_order','cancel_order','ack_latency'); criteria=@{ p95_ms_max=1000; success_rate_min=0.98; ts_errors_max=15; auth='token' } }; dryRun=$false; confirm_required=$true; reason='Go live' } | ConvertTo-Json -Depth 8
    $confRes = Invoke-RestMethod -Uri ("$WebOrigin/api/canary/confirm") -Method POST -Headers $Headers -Body $confBody -TimeoutSec 20
    $canToken = $confRes.confirm_token
  } catch { }
}

$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$outDir = Join-Path 'evidence\local\approve_run' $ts
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Approve Risk
if ($riskToken) {
  $body = @{ confirm_token = $riskToken } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri ("$WebOrigin/api/risk/threshold/approve") -Method POST -Headers $Headers -Body $body -TimeoutSec 20
  ($res | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $outDir 'risk_approve.json')
} else { "NO_RISK_TOKEN" | Out-File -Encoding utf8 (Join-Path $outDir 'risk_approve.json') }

# Approve Canary
$canaryApproved = $false
if ($canToken) {
  $body = @{ confirm_token = $canToken } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri ("$WebOrigin/api/canary/approve") -Method POST -Headers $Headers -Body $body -TimeoutSec 20
  ($res | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $outDir 'canary_approve.json')
  $canaryApproved = $true
} else { "NO_CANARY_TOKEN" | Out-File -Encoding utf8 (Join-Path $outDir 'canary_approve.json') }

# Status after
$statusBody = @{ include = @('health','p95','open_orders','rate_limit') } | ConvertTo-Json
$status = Invoke-RestMethod -Uri ("$WebOrigin/api/tools/get_status") -Method POST -Headers $Headers -Body $statusBody -TimeoutSec 20
($status | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $outDir 'status_after.json')

# Advisor suggest
$advBody = @{ task='generate_and_rank_strategies'; universe=@('BTCUSDT-PERP'); templates=@('ema_cross+atr_sl_tp','rsi_pullback+atr_sl_tp','breakout_keltner'); constraints=@{ max_leverage=5; notional_pct=0.01; sl_atr_range=@(1.2,2.0); tp_atr_range=@(1.8,3.0) }; objective='maximize_sharpe_subject_to_dd3pct_day'; deliver=@('strategy_json','param_grid','risk_notes') } | ConvertTo-Json -Depth 10
$adv = Invoke-RestMethod -Uri ("$WebOrigin/api/advisor/suggest") -Method POST -Headers $Headers -Body $advBody -TimeoutSec 30
($adv | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $outDir 'advisor_suggest.json')

# Canary dry-run with AI strategy
$strategy = $adv.data.strategy_json
if ($strategy) {
  $runBody = @{ scope='binance:futures:testnet'; symbols=@('BTCUSDT'); samples=20; checks=@('place_order','cancel_order','ack_latency','ws_stream'); strategy=$strategy } | ConvertTo-Json -Depth 20
  $run = Invoke-RestMethod -Uri ("$WebOrigin/api/canary/run") -Method POST -Headers $Headers -Body $runBody -TimeoutSec 30
  ($run | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $outDir 'canary_run_ai.json')
} else {
  "NO_STRATEGY_JSON" | Out-File -Encoding utf8 (Join-Path $outDir 'canary_run_ai.json')
}

Write-Output ("EVIDENCE_DIR="+$outDir)


