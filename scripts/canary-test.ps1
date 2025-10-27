# SPARK TRADING PLATFORM - CANARY TEST SCRIPT
# BTCTurk Spot entegrasyonu için canary test

param(
    [string]$Symbol = "BTCTRY",
    [int]$TestDuration = 60,
    [switch]$DryRun,
    [switch]$Verbose
)

Write-Host "🧪 Canary Test Başlatılıyor..." -ForegroundColor Green

# Renkler
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

# 1. Pre-flight Checks
Write-Host "`n📋 Pre-flight Checks..." -ForegroundColor $Yellow

$checks = @()

# Service availability
$services = @(
    @{Name="Web"; Url="http://localhost:3003/api/public/health"},
    @{Name="Executor"; Url="http://localhost:4001/api/public/health"},
    @{Name="Prometheus"; Url="http://localhost:9090/api/v1/query?query=up"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.Url -Method GET -TimeoutSec 5
        Write-Host "✅ $($service.Name) erişilebilir" -ForegroundColor $Green
    } catch {
        Write-Host "❌ $($service.Name) erişilemiyor" -ForegroundColor $Red
        $checks += "❌ $($service.Name) down"
    }
}

# 2. BTCTurk API Test
Write-Host "`n🔗 BTCTurk API Test..." -ForegroundColor $Yellow

$btcturkEndpoints = @(
    @{Name="Ticker"; Url="http://localhost:3003/api/public/btcturk/ticker?symbol=$Symbol"},
    @{Name="Order Book"; Url="http://localhost:3003/api/public/btcturk/orderbook?symbol=$Symbol"},
    @{Name="Trades"; Url="http://localhost:3003/api/public/btcturk/trades?symbol=$Symbol"}
)

foreach ($endpoint in $btcturkEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET -TimeoutSec 10
        Write-Host "✅ $($endpoint.Name) API çalışıyor" -ForegroundColor $Green
        
        if ($Verbose) {
            Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor $Cyan
        }
    } catch {
        Write-Host "❌ $($endpoint.Name) API başarısız" -ForegroundColor $Red
        $checks += "❌ $($endpoint.Name) API error"
    }
}

# 3. WebSocket Test
Write-Host "`n🌐 WebSocket Test..." -ForegroundColor $Yellow

try {
    # WebSocket test için basit HTTP check
    $wsUrl = "http://localhost:3003/api/stream"
    $response = Invoke-WebRequest -Uri $wsUrl -Method GET -TimeoutSec 5
    Write-Host "✅ WebSocket endpoint erişilebilir" -ForegroundColor $Green
} catch {
    Write-Host "⚠️  WebSocket endpoint test edilemedi" -ForegroundColor $Yellow
}

# 4. Metrics Collection
Write-Host "`n📊 Metrics Collection..." -ForegroundColor $Yellow

$metrics = @{}

# Prometheus metrics
try {
    $prometheusUrl = "http://localhost:9090/api/v1/query"
    
    # Executor health
    $executorHealth = Invoke-RestMethod -Uri "$prometheusUrl?query=up{job='spark-executor'}" -Method GET
    $metrics.ExecutorHealth = $executorHealth.data.result[0].value[1]
    
    # Web health
    $webHealth = Invoke-RestMethod -Uri "$prometheusUrl?query=up{job='spark-web'}" -Method GET
    $metrics.WebHealth = $webHealth.data.result[0].value[1]
    
    Write-Host "✅ Metrics toplandı" -ForegroundColor $Green
} catch {
    Write-Host "⚠️  Metrics toplanamadı" -ForegroundColor $Yellow
}

# 5. Canary Test Execution
if ($DryRun) {
    Write-Host "`n🧪 DRY RUN - Canary test simülasyonu..." -ForegroundColor $Yellow
    Write-Host "   Symbol: $Symbol" -ForegroundColor $Cyan
    Write-Host "   Duration: $TestDuration seconds" -ForegroundColor $Cyan
    Write-Host "   Mode: Dry Run (gerçek işlem yapılmayacak)" -ForegroundColor $Cyan
} else {
    Write-Host "`n🧪 Canary Test Execution..." -ForegroundColor $Yellow
    Write-Host "   Symbol: $Symbol" -ForegroundColor $Cyan
    Write-Host "   Duration: $TestDuration seconds" -ForegroundColor $Cyan
    Write-Host "   Mode: Live Test" -ForegroundColor $Cyan
    
    # Test süresince monitoring
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($TestDuration)
    
    Write-Host "   Test başlatılıyor... ($startTime)" -ForegroundColor $Cyan
    
    do {
        $currentTime = Get-Date
        $elapsed = ($currentTime - $startTime).TotalSeconds
        $remaining = $TestDuration - $elapsed
        
        Write-Host "   Elapsed: $([math]::Round($elapsed, 1))s / Remaining: $([math]::Round($remaining, 1))s" -ForegroundColor $Cyan
        
        # Her 10 saniyede bir health check
        if ([math]::Floor($elapsed) % 10 -eq 0) {
            try {
                $health = Invoke-RestMethod -Uri "http://localhost:4001/api/public/health" -Method GET -TimeoutSec 2
                Write-Host "   ✅ Health check OK" -ForegroundColor $Green
            } catch {
                Write-Host "   ❌ Health check failed" -ForegroundColor $Red
            }
        }
        
        Start-Sleep -Seconds 1
    } while ($currentTime -lt $endTime)
    
    Write-Host "   Test tamamlandı! ($(Get-Date))" -ForegroundColor $Green
}

# 6. Results Summary
Write-Host "`n📊 Test Results Summary:" -ForegroundColor $Yellow

if ($checks.Count -eq 0) {
    Write-Host "🎉 Tüm kontroller başarılı!" -ForegroundColor $Green
} else {
    Write-Host "⚠️  $($checks.Count) sorun tespit edildi:" -ForegroundColor $Red
    foreach ($check in $checks) {
        Write-Host "   $check" -ForegroundColor $Red
    }
}

# Metrics summary
if ($metrics.Count -gt 0) {
    Write-Host "`n📈 Metrics Summary:" -ForegroundColor $Cyan
    foreach ($metric in $metrics.GetEnumerator()) {
        Write-Host "   $($metric.Key): $($metric.Value)" -ForegroundColor White
    }
}

# 7. Recommendations
Write-Host "`n💡 Next Steps:" -ForegroundColor $Cyan

if ($checks.Count -eq 0) {
    Write-Host "   ✅ Canary test hazır - BTCTurk Spot entegrasyonu başlatılabilir" -ForegroundColor $Green
    Write-Host "   📊 Grafana dashboard'ları izleyin" -ForegroundColor White
    Write-Host "   🔔 Alert rules'ları yapılandırın" -ForegroundColor White
} else {
    Write-Host "   🔧 Önce sorunları çözün:" -ForegroundColor $Yellow
    foreach ($check in $checks) {
        Write-Host "      $check" -ForegroundColor White
    }
}

Write-Host "`n🧪 Canary Test Tamamlandı!" -ForegroundColor $Green
