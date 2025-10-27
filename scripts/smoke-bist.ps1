# BIST Smoke Test Script
# Tests BIST feeds service endpoints

Write-Host "🏛️ BIST Smoke Test Başlıyor..." -ForegroundColor Yellow

$baseUrl = "http://127.0.0.1:4002"
$evidenceDir = "evidence/local/archive"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Create evidence directory if not exists
if (!(Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir -Force
}

Write-Host "📊 BIST Health Check..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✅ Health: $($healthData.status)" -ForegroundColor Green
    $healthData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/bist_health_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/bist_health_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "📈 BIST Stats..." -ForegroundColor Cyan
try {
    $statsResponse = Invoke-WebRequest -Uri "$baseUrl/stats" -UseBasicParsing
    $statsData = $statsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Stats: $($statsData.metrics.ingestRowsTotal) rows, $($statsData.symbols.total) symbols" -ForegroundColor Green
    $statsData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/bist_stats_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Stats Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/bist_stats_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "🎯 BIST Symbols..." -ForegroundColor Cyan
try {
    $symbolsResponse = Invoke-WebRequest -Uri "$baseUrl/symbols" -UseBasicParsing
    $symbolsData = $symbolsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Symbols: $($symbolsData.symbols.Count) symbols available" -ForegroundColor Green
    $symbolsData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/bist_symbols_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Symbols Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/bist_symbols_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "💰 BIST Quote (THYAO)..." -ForegroundColor Cyan
try {
    $quoteResponse = Invoke-WebRequest -Uri "$baseUrl/quote/THYAO" -UseBasicParsing
    $quoteData = $quoteResponse.Content | ConvertFrom-Json
    Write-Host "✅ Quote: THYAO = $($quoteData.quote.last)" -ForegroundColor Green
    $quoteData | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir/bist_quote_$timestamp.json" -Encoding UTF8
} catch {
    Write-Host "❌ Quote Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/bist_quote_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "📊 BIST Prometheus Metrics..." -ForegroundColor Cyan
try {
    $metricsResponse = Invoke-WebRequest -Uri "$baseUrl/metrics" -UseBasicParsing
    $metricsContent = $metricsResponse.Content
    Write-Host "✅ Metrics: Prometheus format available" -ForegroundColor Green
    $metricsContent | Out-File "$evidenceDir/bist_metrics_$timestamp.prom" -Encoding UTF8
} catch {
    Write-Host "❌ Metrics Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    $_.Exception.Message | Out-File "$evidenceDir/bist_metrics_error_$timestamp.txt" -Encoding UTF8
}

Write-Host "🎉 BIST Smoke Test Tamamlandı!" -ForegroundColor Green
Write-Host "📁 Evidence dosyları: $evidenceDir" -ForegroundColor Yellow
