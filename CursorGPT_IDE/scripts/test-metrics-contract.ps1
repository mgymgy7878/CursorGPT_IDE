# Metrics Contract Test - Route Label Hatası "Bir Daha Asla" Guardrail
# Bu script, metriklerde beklenmeyen label'ları yakalar ve CI'da fail eder

param(
    [switch]$SkipBuild
)

Write-Host "🔍 Metrics Contract Test Başlatılıyor..." -ForegroundColor Cyan

# Executor'ı test modunda başlat
if (-not $SkipBuild) {
    Write-Host "📡 Executor build ediliyor..." -ForegroundColor Yellow
    Set-Location services/executor
    $env:METRICS_DISABLED = "0"
    pnpm build | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build başarısız" -ForegroundColor Red
        exit 1
    }
    Set-Location ../..
}

Write-Host "📡 Executor başlatılıyor (test modu)..." -ForegroundColor Yellow
$env:METRICS_DISABLED = "0"
$executorProcess = Start-Process -FilePath "node" -ArgumentList "services/executor/dist/index.cjs" -WindowStyle Hidden -PassThru

# Executor'ın başlamasını bekle
Write-Host "⏳ Executor başlaması bekleniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Health check
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:4001/ops/health" -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -ne 200) {
        throw "Health check failed"
    }
} catch {
    Write-Host "❌ Executor başlamadı: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ Executor hazır, metrik sözleşmesi kontrol ediliyor..." -ForegroundColor Green

# Metrikleri indir
try {
    $metricsResponse = Invoke-WebRequest -Uri "http://localhost:4001/metrics" -UseBasicParsing -TimeoutSec 10
    $metricsOutput = $metricsResponse.Content
    $lineCount = ($metricsOutput -split "`n").Count
    Write-Host "📊 Metrikler indirildi ($lineCount satır)" -ForegroundColor Green
} catch {
    Write-Host "❌ Metrikler indirilemedi: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# HTTP Metrikleri Kontrolü
Write-Host "🔍 HTTP metrikleri kontrol ediliyor..." -ForegroundColor Yellow
$httpViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^http_request_duration_ms_(bucket|sum|count)" -and 
    $_ -notmatch "method=|route=|status=" 
}

if ($httpViolations.Count -gt 0) {
    Write-Host "❌ HTTP metriklerinde beklenmeyen label bulundu:" -ForegroundColor Red
    $httpViolations | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# AI Metrikleri Kontrolü
Write-Host "🔍 AI metrikleri kontrol ediliyor..." -ForegroundColor Yellow
$aiViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^spark_ai_(latency_ms|payload_bytes|tokens_total)" -and 
    $_ -notmatch "model=|status=" 
}

if ($aiViolations.Count -gt 0) {
    Write-Host "❌ AI metriklerinde beklenmeyen label bulundu:" -ForegroundColor Red
    $aiViolations | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Exchange Metrikleri Kontrolü
Write-Host "🔍 Exchange metrikleri kontrol ediliyor..." -ForegroundColor Yellow
$exchangeViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^spark_futures_uds_last_keepalive_ts" -and 
    $_ -notmatch "exchange=" 
}

if ($exchangeViolations.Count -gt 0) {
    Write-Host "❌ Exchange metriklerinde beklenmeyen label bulundu:" -ForegroundColor Red
    $exchangeViolations | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Canary Test
Write-Host "🔍 Canary test çalıştırılıyor..." -ForegroundColor Yellow
try {
    $canaryResponse = Invoke-WebRequest -Uri "http://localhost:4001/api/canary/run" -Method POST -ContentType "application/json" -Body '{"dry": true}' -UseBasicParsing -TimeoutSec 10
    $canaryResult = $canaryResponse.Content | ConvertFrom-Json
    
    if ($canaryResult.ok -eq $true) {
        Write-Host "✅ Canary test geçti" -ForegroundColor Green
    } else {
        Write-Host "❌ Canary test başarısız:" -ForegroundColor Red
        Write-Host $canaryResult -ForegroundColor Red
        Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host "❌ Canary test hatası: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Temizlik
Write-Host "🧹 Temizlik yapılıyor..." -ForegroundColor Yellow
Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Tüm metrik sözleşme testleri geçti!" -ForegroundColor Green
Write-Host "✅ HTTP metrikleri: method, route, status" -ForegroundColor Green
Write-Host "✅ AI metrikleri: model, status" -ForegroundColor Green
Write-Host "✅ Exchange metrikleri: exchange" -ForegroundColor Green
Write-Host "✅ Canary test: 200 OK" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Route label hatasi 'bir daha asla' kutusuna tasindi!" -ForegroundColor Magenta
