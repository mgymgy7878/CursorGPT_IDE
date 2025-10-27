# Simple Canary v1.1 Test
param([int]$DurationSeconds = 60)

Write-Host "Canary v1.1 Test Baslatiliyor..." -ForegroundColor Green
Write-Host "Sure: $DurationSeconds saniye" -ForegroundColor Yellow

# Evidence dizini
$EvidenceDir = "evidence/canary/v1.1-dry-run"
if (!(Test-Path $EvidenceDir)) {
    New-Item -ItemType Directory -Path $EvidenceDir -Force | Out-Null
}

# PM2 durumu
Write-Host "PM2 Durumu:" -ForegroundColor Yellow
pm2 status

# Health check fonksiyonu
function Test-Endpoint {
    param([string]$Name, [string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        Write-Host "OK $Name : $($response.StatusCode)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "FAIL $Name : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test endpoint'leri
Write-Host "`nHealth Check:" -ForegroundColor Yellow
$results = @()

$results += Test-Endpoint "executor_health" "http://127.0.0.1:4001/health"
$results += Test-Endpoint "web_next_ops" "http://localhost:3003/ops"
$results += Test-Endpoint "runtime_info" "http://localhost:3003/api/public/runtime"

# Canary status (opsiyonel)
try {
    $results += Test-Endpoint "canary_status" "http://127.0.0.1:4001/api/canary/status"
}
catch {
    Write-Host "Canary endpoint mevcut degil (normal)" -ForegroundColor Yellow
}

# Sonuçları kaydet
$testResult = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    duration_seconds = $DurationSeconds
    endpoints_tested = $results.Count
    successful_checks = ($results | Where-Object { $_ -eq $true }).Count
    pm2_status = pm2 status --format json
}

$testResult | ConvertTo-Json -Depth 3 | Out-File "$EvidenceDir/simple_test_result.json" -Encoding UTF8

# Sonuç
$successCount = ($results | Where-Object { $_ -eq $true }).Count
$totalCount = $results.Count

Write-Host "`nTest Sonuclari:" -ForegroundColor Green
Write-Host "Basarili: $successCount/$totalCount" -ForegroundColor $(if($successCount -eq $totalCount) {"Green"} else {"Red"})

if ($successCount -eq $totalCount) {
    Write-Host "CANARY v1.1 TEST BASARILI!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "CANARY v1.1 TEST BASARISIZ!" -ForegroundColor Red
    exit 1
}
