# Mini-Load Canary Test
# 5 calls with 60 second intervals to test P95 stability

$ErrorActionPreference = "Continue"
$ROOT = (Get-Location)
$LOAD_DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$LOAD_DIR = Join-Path $ROOT "logs\evidence\canary_load_$LOAD_DATE"
New-Item -ItemType Directory -Force -Path $LOAD_DIR | Out-Null

Write-Host "🚀 Mini-Load Canary Test Başlatılıyor..." -ForegroundColor Yellow
Write-Host "📁 Load Test Directory: $LOAD_DIR" -ForegroundColor Cyan
Write-Host "⏱️  Test Plan: 5 calls, 60 second intervals" -ForegroundColor Cyan

$loadResults = @()
$totalStart = Get-Date

for ($i = 1; $i -le 5; $i++) {
    Write-Host "🔄 Load Test Call $i/5..." -ForegroundColor Yellow
    
    $callStart = Get-Date
    try {
        $response = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/canary/run?dry=true" -TimeoutSec 15
        $callEnd = Get-Date
        $duration = ($callEnd - $callStart).TotalMilliseconds
        
        $result = @{
            call_number = $i
            status_code = $response.StatusCode
            duration_ms = $duration
            timestamp = $callStart
            success = $true
        }
        
        Write-Host "✅ Call $i: $($response.StatusCode) in $($duration)ms" -ForegroundColor Green
        
    } catch {
        $callEnd = Get-Date
        $duration = ($callEnd - $callStart).TotalMilliseconds
        
        $result = @{
            call_number = $i
            status_code = "ERROR"
            duration_ms = $duration
            timestamp = $callStart
            success = $false
            error = $_.Exception.Message
        }
        
        Write-Host "❌ Call $i: ERROR in $($duration)ms - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    $loadResults += $result
    $result | ConvertTo-Json -Depth 3 | Out-File "$LOAD_DIR\call_$i.json" -Encoding UTF8
    
    if ($i -lt 5) {
        Write-Host "⏳ Waiting 60 seconds before next call..." -ForegroundColor Cyan
        Start-Sleep -Seconds 60
    }
}

$totalEnd = Get-Date
$totalDuration = ($totalEnd - $totalStart).TotalMinutes

# Calculate P95 and statistics
$successfulCalls = $loadResults | Where-Object { $_.success -eq $true }
$durations = $successfulCalls | ForEach-Object { $_.duration_ms } | Sort-Object

if ($durations.Count -gt 0) {
    $p50Index = [Math]::Floor($durations.Count * 0.5)
    $p95Index = [Math]::Floor($durations.Count * 0.95)
    
    $p50 = $durations[$p50Index]
    $p95 = $durations[$p95Index]
    $avg = ($durations | Measure-Object -Average).Average
    $min = ($durations | Measure-Object -Minimum).Minimum
    $max = ($durations | Measure-Object -Maximum).Maximum
} else {
    $p50 = 0
    $p95 = 0
    $avg = 0
    $min = 0
    $max = 0
}

# Generate load test summary
$loadSummary = @{
    test_date = $LOAD_DATE
    total_calls = 5
    successful_calls = $successfulCalls.Count
    failed_calls = (5 - $successfulCalls.Count)
    total_duration_minutes = $totalDuration
    statistics = @{
        p50_ms = $p50
        p95_ms = $p95
        average_ms = $avg
        min_ms = $min
        max_ms = $max
    }
    slo_compliance = @{
        p95_target_ms = 1000
        p95_actual_ms = $p95
        p95_compliant = $p95 -le 1000
    }
    results = $loadResults
}

$loadSummary | ConvertTo-Json -Depth 3 | Out-File "$LOAD_DIR\load_summary.json" -Encoding UTF8

Write-Host "📊 Load Test Summary:" -ForegroundColor Cyan
Write-Host "  - Total Calls: 5" -ForegroundColor White
Write-Host "  - Successful: $($successfulCalls.Count)" -ForegroundColor Green
Write-Host "  - Failed: $((5 - $successfulCalls.Count))" -ForegroundColor Red
Write-Host "  - P50 Latency: $([Math]::Round($p50, 2))ms" -ForegroundColor White
Write-Host "  - P95 Latency: $([Math]::Round($p95, 2))ms" -ForegroundColor White
Write-Host "  - Average: $([Math]::Round($avg, 2))ms" -ForegroundColor White
Write-Host "  - SLO Compliance: $(if ($p95 -le 1000) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($p95 -le 1000) { 'Green' } else { 'Red' })

Write-Host "✅ Mini-Load Canary Test completed: $LOAD_DIR" -ForegroundColor Green
