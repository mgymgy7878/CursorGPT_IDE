# UI Smoke Test Script
# 6 kritik endpoint'i test eder

$baseUrl = "http://127.0.0.1:3003"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "UI SMOKE TEST — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$endpoints = @(
    @{ path = "/"; name = "Dashboard" }
    @{ path = "/portfolio"; name = "Portfolio" }
    @{ path = "/strategies"; name = "Strategies" }
    @{ path = "/running"; name = "Running" }
    @{ path = "/settings"; name = "Settings" }
    @{ path = "/api/health"; name = "Health API" }
)

$results = @()
$passCount = 0
$failCount = 0

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$($endpoint.path)"
    Write-Host "[TEST] $($endpoint.name) ($url)..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ 200 OK" -ForegroundColor Green
            $results += @{
                endpoint = $endpoint.path
                name = $endpoint.name
                status = 200
                result = "PASS"
                responseTime = $response.Headers.'X-Response-Time'
            }
            $passCount++
        } else {
            Write-Host " ⚠️ $($response.StatusCode)" -ForegroundColor Yellow
            $results += @{
                endpoint = $endpoint.path
                name = $endpoint.name
                status = $response.StatusCode
                result = "WARN"
            }
        }
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            endpoint = $endpoint.path
            name = $endpoint.name
            status = 0
            result = "FAIL"
            error = $_.Exception.Message
        }
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total: $($endpoints.Count)" -ForegroundColor White
Write-Host "Pass:  $passCount" -ForegroundColor Green
Write-Host "Fail:  $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "`nStatus: $(if ($failCount -eq 0) { '✅ ALL PASS' } else { '❌ FAILURES DETECTED' })" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "Timestamp: $timestamp" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# JSON çıktı
$output = @{
    timestamp = $timestamp
    baseUrl = $baseUrl
    total = $endpoints.Count
    pass = $passCount
    fail = $failCount
    status = if ($failCount -eq 0) { "PASS" } else { "FAIL" }
    results = $results
}

$output | ConvertTo-Json -Depth 10

# Exit code
exit $failCount
