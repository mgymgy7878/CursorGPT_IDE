param([string]$WebBase = "http://127.0.0.1:3005",[string]$ExecBase = "http://127.0.0.1:4001")
$u = "$WebBase/api/public/metrics/prom"
try { $c=(Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 5).Content }
catch { $c=(Invoke-WebRequest -UseBasicParsing -Uri "$ExecBase/public/metrics/prom" -TimeoutSec 5).Content }
$c -split "`n" | Select-String -Pattern '^ai_generate_total','^ai_latency_ms','^ai_tokens_total' | Select-Object -First 50 | ForEach-Object { $_.Line }
