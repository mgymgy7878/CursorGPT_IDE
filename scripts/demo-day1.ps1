Param(
  [string]$UiBase = "http://127.0.0.1:3003",
  [string]$ExecBase = "http://127.0.0.1:4001"
)
Write-Host "=== Day-1 Demo ===" -ForegroundColor Cyan
$ErrorActionPreference = "Stop"
function J($o){ $o | ConvertTo-Json -Depth 8 }

# 1) Copilot özet (API) + Dashboard/Studio aç
$sum = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/copro/summary" -Body '{}' -TimeoutSec 30
Write-Host "Copilot summary:" (J $sum)
Start-Process "$UiBase/dashboard"
Start-Process "$UiBase/strategy-studio"

# 2) Strategy preview→control (onay kapısı)
$prev = @{ action="strategy.preview"; params=@{ name="ema_crossover_v1"; op="stop"; scope="paper" }; dryRun=$true; confirm_required=$false; reason="demo" } | ConvertTo-Json -Compress
$pRes = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/tools/strategy.preview" -Body $prev -TimeoutSec 30
Write-Host "Preview:" (J $pRes)
$ctrl = @{ action="strategy.control"; params=@{ name="ema_crossover_v1"; op="stop"; scope="paper" }; dryRun=$false; confirm_required=$true; reason="demo" } | ConvertTo-Json -Compress
$cRes = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/tools/strategy.control" -Body $ctrl -TimeoutSec 30
Write-Host "Control response:" $cRes

# 3) Alerts preview→control (disable örneği)
$ap = @{ action="alerts.preview"; params=@{ id="alert_1"; op="disable" }; dryRun=$true; confirm_required=$false; reason="demo" } | ConvertTo-Json -Compress
$apr = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/alerts/preview" -Body $ap -TimeoutSec 30
Write-Host "Alert preview:" (J $apr)
$ac = @{ action="alerts.control"; params=@{ id="alert_1"; op="disable" }; dryRun=$false; confirm_required=$true; reason="demo" } | ConvertTo-Json -Compress
$acr = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/alerts/control" -Body $ac -TimeoutSec 30
Write-Host "Alert control:" $acr

# 4) Portfolio rebalance suggest→apply (onay kapılı)
$rb = @{ action="rebalance.suggest"; params=@{ targetRisk="balanced"; maxTurnover=0.2 }; dryRun=$true; confirm_required=$false; reason="demo" } | ConvertTo-Json -Compress
$rbr = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/portfolio/rebalance/suggest" -Body $rb -TimeoutSec 60
Write-Host "Rebalance suggest:" (J $rbr)
$csv = Join-Path $env:TEMP "rebalance_plan.csv"
if ($rbr.orders) {
  $cols = ($rbr.orders | Get-Member -MemberType NoteProperty | Select -ExpandProperty Name | Sort-Object -Unique)
  $lines = @()
  $lines += ($cols -join ",")
  foreach($o in $rbr.orders){ $lines += ($cols | ForEach-Object { '"' + ($o.$_ -replace '"','""') + '"' } ) -join "," }
  $lines -join "`n" | Out-File -FilePath $csv -Encoding utf8
  Write-Host "Rebalance CSV → $csv"
}
$ra = @{ action="rebalance.apply"; params=@{ plan=$rbr }; dryRun=$false; confirm_required=$true; reason="demo" } | ConvertTo-Json -Compress
$rar = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/portfolio/rebalance/apply" -Body $ra -TimeoutSec 60
Write-Host "Rebalance apply:" $rar

# 5) Studio optimize→best→deploy (deploy onay kapılı)
$opt = @{ action="optimizer.grid"; params=@{ symbol="BTCUSDT"; timeframe="1h"; start="2024-01-01"; end="2024-03-01"; emaFast=@{from=5;to=25;step=5}; emaSlow=@{from=30;to=120;step=10}; topK=5 }; dryRun=$true; confirm_required=$false; reason="demo" } | ConvertTo-Json -Compress
$optRes = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/advisor/suggest" -Body $opt -TimeoutSec 120
Write-Host "Optimizer (topK):" (J $optRes)
$dep = @{ action="model.promote"; params=@{ name="ema_crossover_v1"; source="strategy-studio"; artifact="{}" }; dryRun=$false; confirm_required=$true; reason="demo" } | ConvertTo-Json -Compress
$depRes = Invoke-RestMethod -Method Post -ContentType 'application/json' -Uri "$UiBase/api/model/promote" -Body $dep -TimeoutSec 60
Write-Host "Deploy:" $depRes

Write-Host "=== Demo tamamlandı ===" -ForegroundColor Green


