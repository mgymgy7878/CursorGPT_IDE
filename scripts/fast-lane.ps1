Param(
  [string]$WebOrigin = "http://127.0.0.1:3003",
  [string]$Token = $env:NEXT_PUBLIC_API_TOKEN
)

if (-not $Token) { $Token = "dev-token-123" }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$evid = Join-Path -Path "evidence/local/fast-lane" -ChildPath $ts
New-Item -ItemType Directory -Force -Path $evid | Out-Null

Function Invoke-PostJson {
  Param([string]$Path, [object]$Body)
  $uri = "$WebOrigin$Path"
  $headers = @{ 'Content-Type'='application/json'; 'Authorization'="Bearer $Token" }
  $json = $Body | ConvertTo-Json -Depth 8
  try { return Invoke-WebRequest -Method POST -Uri $uri -Headers $headers -Body $json -TimeoutSec 15 -UseBasicParsing }
  catch { return $_.Exception.Response }
}

# 0) Baseline status
$res0 = Invoke-PostJson "/api/tools/get_status" @{ action="/tools/get_status"; params=@{ include=@("health","p95","open_orders","rate_limit") }; dryRun=$false; confirm_required=$false; reason="baseline" }
($res0.Content) | Out-File -Encoding utf8 (Join-Path $evid "0_status.json")

$res1 = Invoke-PostJson "/api/tools/get_metrics" @{ action="/tools/get_metrics"; params=@{}; dryRun=$false; confirm_required=$false; reason="metrics" }
($res1.Content) | Out-File -Encoding utf8 (Join-Path $evid "0_metrics.prom")

# 1) Canary Dry-Run
$canary = @{ action="/canary/run"; params=@{ scope="binance:futures:testnet"; symbols=@("BTCUSDT"); samples=20; checks=@("place_order","cancel_order","ack_latency","ws_stream"); strategy=@{ name="ema_atr_v0"; ema_fast=9; ema_slow=21; atr=14; tp_atr=2.0; sl_atr=1.5; risk_notional_pct=0.01; volatility_filter_ratio=0.002 } }; dryRun=$true; confirm_required=$false; reason="dry-run" }
$res2 = Invoke-PostJson "/api/canary/run" $canary
($res2.Content) | Out-File -Encoding utf8 (Join-Path $evid "1_canary_run.json")

# 2) Risk Guardrails (pending)
$risk = @{ action="/risk/threshold.set"; params=@{ exchange="binance:futures"; maxNotionalPerTradeUSDT=200; maxLeverage=5; maxDailyDrawdownPct=3; requireStopLoss=$true; killSwitch=$true }; dryRun=$false; confirm_required=$true; reason="guardrails" }
$res3 = Invoke-PostJson "/api/risk/threshold/set" $risk
($res3.Content) | Out-File -Encoding utf8 (Join-Path $evid "2_risk_set.json")

# 3) Canary Confirm (pending)
$confirm = @{ action="/canary/confirm"; params=@{ scope="binance:futures"; targets=@("place_order","cancel_order","ack_latency"); criteria=@{ p95_ms_max=1000; success_rate_min=0.98; ts_errors_max=15; auth="token" } }; dryRun=$false; confirm_required=$true; reason="confirm" }
$res4 = Invoke-PostJson "/api/canary/confirm" $confirm
($res4.Content) | Out-File -Encoding utf8 (Join-Path $evid "3_canary_confirm.json")

# 4) Alerts
$alerts = @{ action="/alerts/create"; params=@(@{ kind="price"; symbol="BTCUSDT"; op="lt"; value=58000; ttl="1d" }, @{ kind="metric"; name="ack_p95_ms"; op="gt"; value=800; ttl="24h" }); dryRun=$false; confirm_required=$false; reason="alerts" }
$res5 = Invoke-PostJson "/api/alerts/create" $alerts
($res5.Content) | Out-File -Encoding utf8 (Join-Path $evid "4_alerts_create.json")

Write-Output "EVIDENCE_DIR=$evid"


