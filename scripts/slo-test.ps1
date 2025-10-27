$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:4001"
Write-Host "JIT Warmup basliyor..." -ForegroundColor Yellow

# extra warmup (8 istek, 200ms aralik)
for ($i = 1; $i -le 8; $i++) {
    try {
        $r = Invoke-WebRequest "$base/canary/run?dry=true" -UseBasicParsing -TimeoutSec 10
        Write-Host "Warmup $i - $($r.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "Warmup $i - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 200 
}

Write-Host "Mini-load test basliyor..." -ForegroundColor Yellow
# mini-load: 10 istek, 500ms aralik
$times = @()
for ($i = 1; $i -le 10; $i++) {
    $start = Get-Date
    try {
        $r = Invoke-WebRequest "$base/canary/run?dry=true" -UseBasicParsing -TimeoutSec 10
        $end = Get-Date
        $duration = ($end - $start).TotalMilliseconds
        $times += $duration
        Write-Host "Load $i - $($r.StatusCode) - $duration ms" -ForegroundColor Cyan
    } catch {
        Write-Host "Load $i - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 500 
}

# P95 hesaplama
if ($times.Count -gt 0) {
    $sorted = $times | Sort-Object
    $p95Index = [Math]::Floor($sorted.Count * 0.95)
    $p95 = $sorted[$p95Index]
    Write-Host "P95 Latency: $p95 ms" -ForegroundColor $(if ($p95 -lt 1000) { "Green" } else { "Red" })
}

Write-Host "Metrics snapshot aliniyor..." -ForegroundColor Yellow
try {
    $metrics = Invoke-WebRequest "http://127.0.0.1:3003/api/public/metrics/prom" -UseBasicParsing -TimeoutSec 10
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    $dir = "logs\evidence\slo_fix_$ts"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $metrics.Content | Out-File -Encoding UTF8 "$dir\metrics.prom"
    "done $ts" | Out-File "$dir\done.txt"
    Write-Host "Metrics snapshot: $($metrics.Content.Length) bytes -> $dir" -ForegroundColor Green
} catch {
    Write-Host "Metrics snapshot hatasi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "SLO test tamamlandi!" -ForegroundColor Green
