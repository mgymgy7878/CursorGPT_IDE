# BTCTurk Smoke Test Script
# Tests BTCTurk exchange integration endpoints

Write-Host "🔥 BTCTurk Smoke Test Başlıyor..." -ForegroundColor Yellow

$baseUrl = "http://127.0.0.1:4001"
$evidenceDir = "evidence/local/archive"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Create evidence directory if not exists
if (!(Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force
}

Write-Host "📊 BTCTurk Health Check..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/health" -UseBasicParsing
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✅ Health: $($healthData.status)" -ForegroundColor Green
    $healthData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/btcturk_health_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_health_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "🕐 BTCTurk Clock Check..." -ForegroundColor Cyan
try {
    $clockResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/clock" -UseBasicParsing
    $clockData = $clockResponse.Content | ConvertFrom-Json
    Write-Host "✅ Clock: $($clockData.clockSkewSeconds)s skew" -ForegroundColor Green
    $clockData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/btcturk_clock_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Clock Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_clock_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "📈 BTCTurk Stats..." -ForegroundColor Cyan
try {
    $statsResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/stats" -UseBasicParsing
    $statsData = $statsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Stats: $($statsData.metrics.httpRequestsTotal) requests, $($statsData.metrics.wsMessagesTotal) WS messages" -ForegroundColor Green
    $statsData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/btcturk_stats_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Stats Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_stats_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "🎯 BTCTurk Symbols..." -ForegroundColor Cyan
try {
    $symbolsResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/symbols" -UseBasicParsing
    $symbolsData = $symbolsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Symbols: $($symbolsData.symbols.Count) symbols available" -ForegroundColor Green
    $symbolsData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/btcturk_symbols_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Symbols Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_symbols_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "💰 BTCTurk Ticker (BTCUSDT)..." -ForegroundColor Cyan
try {
    $tickerResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/ticker/BTCUSDT" -UseBasicParsing
    $tickerData = $tickerResponse.Content | ConvertFrom-Json
    Write-Host "✅ Ticker: BTCUSDT = $($tickerData.quote.last)" -ForegroundColor Green
    $tickerData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/btcturk_ticker_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Ticker Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_ticker_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "📊 BTCTurk Prometheus Metrics..." -ForegroundColor Cyan
try {
    $metricsResponse = Invoke-WebRequest -Uri "$baseUrl/api/feeds/btcturk/metrics" -UseBasicParsing
    $metricsContent = $metricsResponse.Content
    Write-Host "✅ Metrics: Prometheus format available" -ForegroundColor Green
    $metricsContent | Out-File "$evidenceDir/btcturk_metrics_$timestamp.prom" -Encoding UTF8
} catch {
    Write-Host "❌ Metrics Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/btcturk_metrics_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "🎉 BTCTurk Smoke Test Tamamlandı!" -ForegroundColor Green
Write-Host "📁 Evidence dosyaları: $evidenceDir" -ForegroundColor Yellow
