$ErrorActionPreference = "Stop"
$Node = $env:SPARK_NODE_BIN
if ([string]::IsNullOrWhiteSpace($Node)) { $Node = "node" }
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$ev = "evidence/local/smoke/$ts"
New-Item -Force -ItemType Directory -Path $ev | Out-Null

# 1) Node sürümü
& $Node -v | Tee-Object "$ev/node.txt"

# 2) Install
pnpm -w install --frozen-lockfile

# 3) Start services (arka plan)
Start-Job { pnpm --filter @spark/executor dev -- --port 4001 } | Out-Null
Start-Job { pnpm --filter @spark/web-next dev -- -p 3003 -H 127.0.0.1 } | Out-Null
Start-Sleep -Seconds 8

# 4) BEFORE metrics
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/api/public/metrics/prom | Out-File "$ev/metrics_before.txt" -Encoding utf8

# 5) 401 ve 429 üret
1..1  | ForEach-Object { try { Invoke-WebRequest http://127.0.0.1:3003/api/exec/test/binance -Method Post -ContentType 'application/json' -Body '{}' | Out-Null } catch { } }
1..25 | ForEach-Object { try { Invoke-WebRequest http://127.0.0.1:3003/api/exec/test/binance -Method Post -ContentType 'application/json' -Body '{}' | Out-Null } catch { } }

# 6) AFTER metrics + audit
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/api/public/metrics/prom | Out-File "$ev/metrics_after.txt" -Encoding utf8
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/public/audit/tail?limit=25 | Out-File "$ev/audit_tail.json" -Encoding utf8

# 6.1) Auto-assert: compute metric deltas (401 and rate-limit) and write a summary
function Measure-MetricValue {
    param([string]$Path, [string]$Pattern)
    $values = Select-String -Path $Path -Pattern $Pattern -AllMatches |
    ForEach-Object { $_.Matches } |
    ForEach-Object { $_.Groups[1].Value }
    if ($values.Count -eq 0) { return 0 }
    ($values | ForEach-Object { [double]$_ }) | Measure-Object -Sum | Select-Object -ExpandProperty Sum
}

$before401 = Measure-MetricValue -Path "$ev/metrics_before.txt" -Pattern 'http_requests_total(?:\{[^\}]*code="401"[^\}]*\})?\s+([0-9\.]+)'
$after401 = Measure-MetricValue -Path "$ev/metrics_after.txt"  -Pattern 'http_requests_total(?:\{[^\}]*code="401"[^\}]*\})?\s+([0-9\.]+)'
$beforeRL = Measure-MetricValue -Path "$ev/metrics_before.txt" -Pattern 'rate_limit_hits_total(?:\{[^\}]*\})?\s+([0-9\.]+)'
$afterRL = Measure-MetricValue -Path "$ev/metrics_after.txt"  -Pattern 'rate_limit_hits_total(?:\{[^\}]*\})?\s+([0-9\.]+)'

$delta401 = [double]($after401 - $before401)
$deltaRL = [double]($afterRL - $beforeRL)

$pass401 = $delta401 -ge 1
$passRL = $deltaRL -ge 1
$overall = $pass401 -and $passRL

@"
HEALTH_CANDIDATE=GREEN
DELTA_401=$delta401
DELTA_RATELIMIT=$deltaRL
PASS_401=$pass401
PASS_RATELIMIT=$passRL
OVERALL=$overall
"@ | Out-File "$ev\summary.txt" -Encoding utf8

Write-Host "AUTO-ASSERT: 401 Δ=$delta401 ; rate_limit Δ=$deltaRL ; OVERALL=$overall"

# 7) Port durumu
netstat -ano | findstr ":3003" | Out-File "$ev/ports.txt"
netstat -ano | findstr ":4001" | Out-File "$ev/ports.txt" -Append

Write-Host "SMOKE tamam. Evidence: $ev"


