Param(
  [string]$WebOrigin = "http://127.0.0.1:3003",
  [string]$Token = $env:NEXT_PUBLIC_API_TOKEN
)

if (-not $Token) { $Token = "dev-token-123" }
$Headers = @{ 'Content-Type'='application/json'; 'Authorization' = "Bearer $Token" }

function Invoke-PostJson([string]$Path, [object]$Body, [string]$Name, [string]$OutDir) {
  $uri = "$WebOrigin$Path"
  $json = $Body | ConvertTo-Json -Depth 20
  try {
    $res = Invoke-RestMethod -Uri $uri -Method POST -Headers $Headers -Body $json -TimeoutSec 30
    ($res | ConvertTo-Json -Depth 20) | Out-File -Encoding utf8 (Join-Path $OutDir ($Name+".json"))
    return $res
  } catch {
    $content = ""
    try { $content = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd() } catch {}
    $msg = $_.Exception.ToString() + "`n---BODY---`n" + $content
    $msg | Out-File -Encoding utf8 (Join-Path $OutDir ($Name+".error.txt"))
    return $null
  }
}

$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
$outDir = Join-Path 'evidence\\local\\micro-smoke' $ts
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# 1) Status
$statusBody = @{ include = @('health','p95','open_orders','rate_limit') }
Invoke-PostJson '/api/tools/get_status' $statusBody '1_status' $outDir | Out-Null

# 2) Canary confirm (pending) + approve
$confirmReq = @{ 
  scope = 'binance:futures'; 
  targets = @('place_order','cancel_order','ack_latency'); 
  criteria = @{ p95_ms_max=1000; success_rate_min=0.98; ts_errors_max=15; auth='token' };
  confirm_required = $true 
}
$confirmRes = Invoke-PostJson '/api/canary/confirm' $confirmReq '2_confirm' $outDir
$confirmToken = $null
if ($confirmRes -and $confirmRes.confirm_token) { $confirmToken = $confirmRes.confirm_token }
if (-not $confirmToken -and $confirmRes -and $confirmRes.data -and $confirmRes.data.confirm_token) { $confirmToken = $confirmRes.data.confirm_token }
if ($confirmToken) {
  $apr = @{ confirm_token = $confirmToken }
  Invoke-PostJson '/api/canary/approve' $apr '2b_approve' $outDir | Out-Null
}

# 3) Advisor suggest
$advReq = @{ task='generate_and_rank_strategies'; universe=@('BTCUSDT-PERP'); templates=@('ema_cross+atr_sl_tp','rsi_pullback+atr_sl_tp','breakout_keltner'); constraints=@{ max_leverage=5; notional_pct=0.01; sl_atr_range=@(1.2,2.0); tp_atr_range=@(1.8,3.0) }; objective='maximize_sharpe_subject_to_dd3pct_day'; deliver=@('strategy_json','param_grid','risk_notes') }
$advRes = Invoke-PostJson '/api/advisor/suggest' $advReq '3_advisor' $outDir

# 4) Canary dry-run (testnet) with advisor strategy
$strategy = $null
if ($advRes -and $advRes.data -and $advRes.data.strategy_json) { $strategy = $advRes.data.strategy_json }
if ($strategy) {
  $runReq = @{ scope='binance:futures:testnet'; symbols=@('BTCUSDT'); samples=20; checks=@('place_order','cancel_order','ack_latency','ws_stream'); strategy=$strategy }
  Invoke-PostJson '/api/canary/run' $runReq '4_testnet_run' $outDir | Out-Null
}

# 5) Alerts
$alertsReq = @(
  @{ kind='metric'; name='ack_p95_ms'; op='gt'; value=800; ttl='24h' },
  @{ kind='metric'; name='rej_rate_pct'; op='gt'; value=1.5; ttl='24h' },
  @{ kind='price';  symbol='BTCUSDT'; op='lt'; value=58000; ttl='1d' }
)
Invoke-PostJson '/api/alerts/create' @{ params = $alertsReq } '5_alerts' $outDir | Out-Null

Write-Output ("EVIDENCE_DIR="+$outDir)


