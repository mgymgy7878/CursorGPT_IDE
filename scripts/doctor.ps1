$ErrorActionPreference="SilentlyContinue"
Write-Host "▶ DOCTOR" -ForegroundColor Cyan
function TryGet($u){ try{ @{ ok=$true; data=(Invoke-RestMethod -Uri $u -TimeoutSec 5) } }catch{ @{ ok=$false; data="$($_.Exception.Message)" } } }
$ui   = TryGet "http://127.0.0.1:3003/api/public/health"
$exec = TryGet "http://127.0.0.1:4001/public/metrics/prom"
$p95="missing"
if($exec.ok -and "$($exec.data)" -match "http_request_duration_seconds_bucket"){ $p95="present" }
[pscustomobject]@{ ts=(Get-Date).ToString("s"); ui_health=$ui.ok; ui_detail=$ui.data; exec_metrics=$exec.ok; p95_signal=$p95 } | ConvertTo-Json -Depth 6