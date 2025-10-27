# Mini-Load Canary Test - Simple Version
$ErrorActionPreference = "Continue"
$ROOT = (Get-Location)
$LOAD_DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$LOAD_DIR = Join-Path $ROOT "logs\evidence\canary_load_$LOAD_DATE"
New-Item -ItemType Directory -Force -Path $LOAD_DIR | Out-Null

Write-Host "Mini-Load Canary Test Baslatiliyor..." -ForegroundColor Yellow
Write-Host "Load Test Directory: $LOAD_DIR" -ForegroundColor Cyan

$loadResults = @()

for ($i = 1; $i -le 5; $i++) {
    Write-Host "Load Test Call $i/5..." -ForegroundColor Yellow
    
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
        
        Write-Host "Call $i: $($response.StatusCode) in $duration ms" -ForegroundColor Green
        
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
        
        Write-Host "Call $i: ERROR in $duration ms" -ForegroundColor Red
    }
    
    $loadResults += $result
    $result | ConvertTo-Json -Depth 3 | Out-File "$LOAD_DIR\call_$i.json" -Encoding UTF8
    
    if ($i -lt 5) {
        Write-Host "Waiting 60 seconds before next call..." -ForegroundColor Cyan
        Start-Sleep -Seconds 60
    }
}

# Calculate statistics
$successfulCalls = $loadResults | Where-Object { $_.success -eq $true }
$durations = $successfulCalls | ForEach-Object { $_.duration_ms } | Sort-Object

if ($durations.Count -gt 0) {
    $p50Index = [Math]::Floor($durations.Count * 0.5)
    $p95Index = [Math]::Floor($durations.Count * 0.95)
    
    $p50 = $durations[$p50Index]
    $p95 = $durations[$p95Index]
    $avg = ($durations | Measure-Object -Average).Average
} else {
    $p50 = 0
    $p95 = 0
    $avg = 0
}

Write-Host "Load Test Summary:" -ForegroundColor Cyan
Write-Host "Total Calls: 5" -ForegroundColor White
Write-Host "Successful: $($successfulCalls.Count)" -ForegroundColor Green
Write-Host "P50 Latency: $([Math]::Round($p50, 2))ms" -ForegroundColor White
Write-Host "P95 Latency: $([Math]::Round($p95, 2))ms" -ForegroundColor White
Write-Host "SLO Compliance: $(if ($p95 -le 1000) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($p95 -le 1000) { 'Green' } else { 'Red' })

Write-Host "Mini-Load Canary Test completed: $LOAD_DIR" -ForegroundColor Green
