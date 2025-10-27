# Tek Komutla Kanıt Toplama - Route Label "Bir Daha Asla" Evidence
# Bu script, canary test ve metrik sözleşmesini test edip evidence toplar

param(
    [switch]$SkipBuild
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence/metrics"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

Write-Host "🔍 Route Label 'Bir Daha Asla' Evidence Collection" -ForegroundColor Cyan
Write-Host "📅 Timestamp: $timestamp" -ForegroundColor Yellow
Write-Host "📁 Evidence Directory: $evidenceDir" -ForegroundColor Yellow
Write-Host ""

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

Write-Host "📡 Executor başlatılıyor (evidence collection mode)..." -ForegroundColor Yellow
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

Write-Host "✅ Executor hazır, evidence toplanıyor..." -ForegroundColor Green

# 1. Canary Test Evidence
Write-Host "🔍 Canary test evidence toplanıyor..." -ForegroundColor Yellow
try {
    $canaryResponse = Invoke-WebRequest -Uri "http://localhost:4001/api/canary/run" -Method POST -ContentType "application/json" -Body '{"dry": true}' -UseBasicParsing -TimeoutSec 10
    $canaryResult = $canaryResponse.Content
    $canaryResult | Out-File -FilePath "$evidenceDir/canary_$timestamp.json" -Encoding UTF8
    
    $canaryObj = $canaryResult | ConvertFrom-Json
    if ($canaryObj.ok -eq $true) {
        Write-Host "✅ Canary test: PASS" -ForegroundColor Green
        $canaryStatus = "PASS"
    } else {
        Write-Host "❌ Canary test: FAIL" -ForegroundColor Red
        $canaryStatus = "FAIL"
    }
} catch {
    Write-Host "❌ Canary test hatası: $($_.Exception.Message)" -ForegroundColor Red
    $canaryStatus = "FAIL"
}

# 2. Metrics Evidence
Write-Host "📊 Metrics evidence toplanıyor..." -ForegroundColor Yellow
try {
    $metricsResponse = Invoke-WebRequest -Uri "http://localhost:4001/metrics" -UseBasicParsing -TimeoutSec 10
    $metricsOutput = $metricsResponse.Content
    $metricsOutput | Out-File -FilePath "$evidenceDir/metrics_$timestamp.txt" -Encoding UTF8
} catch {
    Write-Host "❌ Metrikler indirilemedi: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# 3. Metrics Contract Validation
Write-Host "🔍 Metrics contract validation..." -ForegroundColor Yellow

$httpViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^http_request_duration_ms_(bucket|sum|count)" -and 
    $_ -notmatch "method=|route=|status=" 
}

$aiViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^spark_ai_(latency_ms|payload_bytes|tokens_total)" -and 
    $_ -notmatch "model=|status=" 
}

$exchangeViolations = $metricsOutput -split "`n" | Where-Object { 
    $_ -match "^spark_futures_uds_last_keepalive_ts" -and 
    $_ -notmatch "exchange=" 
}

$contractStatus = "PASS"
if ($httpViolations.Count -gt 0 -or $aiViolations.Count -gt 0 -or $exchangeViolations.Count -gt 0) {
    Write-Host "❌ Metrics contract: FAIL" -ForegroundColor Red
    $contractStatus = "FAIL"
    
    $violations = @()
    if ($httpViolations.Count -gt 0) {
        $violations += "HTTP Violations:"
        $violations += $httpViolations
    }
    if ($aiViolations.Count -gt 0) {
        $violations += "AI Violations:"
        $violations += $aiViolations
    }
    if ($exchangeViolations.Count -gt 0) {
        $violations += "Exchange Violations:"
        $violations += $exchangeViolations
    }
    
    $violations | Out-File -FilePath "$evidenceDir/violations_$timestamp.txt" -Encoding UTF8
} else {
    Write-Host "✅ Metrics contract: PASS" -ForegroundColor Green
}

# 4. Summary Report
$summaryFile = "$evidenceDir/summary_$timestamp.txt"
$summary = @"
Route Label 'Bir Daha Asla' Evidence Summary
==============================================
Timestamp: $timestamp
Canary Test: $canaryStatus
Metrics Contract: $contractStatus

Evidence Files:
- canary_$timestamp.json
- metrics_$timestamp.txt
"@

if ($contractStatus -eq "FAIL") {
    $summary += "`n- violations_$timestamp.txt"
}

$lineCount = ($metricsOutput -split "`n").Count
$byteCount = [System.Text.Encoding]::UTF8.GetByteCount($metricsOutput)
$httpLineCount = ($metricsOutput -split "`n" | Where-Object { $_ -match "http_request_duration_ms" }).Count
$aiLineCount = ($metricsOutput -split "`n" | Where-Object { $_ -match "spark_ai_" }).Count
$exchangeLineCount = ($metricsOutput -split "`n" | Where-Object { $_ -match "spark_futures_" }).Count

$summary += @"

Metrics Stats:
- Total Lines: $lineCount
- File Size: $byteCount bytes

Contract Validation:
- HTTP Metrics: $httpLineCount lines
- AI Metrics: $aiLineCount lines
- Exchange Metrics: $exchangeLineCount lines

"@

if ($canaryStatus -eq "PASS" -and $contractStatus -eq "PASS") {
    $summary += "🎉 OVERALL STATUS: PASS - Route label hatasi 'bir daha asla' kutusunda!"
} else {
    $summary += "❌ OVERALL STATUS: FAIL - Sorunlar tespit edildi"
}

$summary | Out-File -FilePath $summaryFile -Encoding UTF8

# Temizlik
Write-Host "🧹 Temizlik yapılıyor..." -ForegroundColor Yellow
Stop-Process -Id $executorProcess.Id -Force -ErrorAction SilentlyContinue

# Sonuç
Write-Host ""
Write-Host "📋 Evidence Collection Tamamlandı" -ForegroundColor Cyan
Write-Host "📁 Evidence Directory: $evidenceDir" -ForegroundColor Yellow
Write-Host "📄 Summary: $summaryFile" -ForegroundColor Yellow
Write-Host ""

if ($canaryStatus -eq "PASS" -and $contractStatus -eq "PASS") {
    Write-Host "🎉 BASARILI: Route label hatasi 'bir daha asla' kutusunda!" -ForegroundColor Green
    Write-Host "✅ Canary: PASS" -ForegroundColor Green
    Write-Host "✅ Metrics Contract: PASS" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ BAŞARISIZ: Sorunlar tespit edildi" -ForegroundColor Red
    Write-Host "❌ Canary: $canaryStatus" -ForegroundColor Red
    Write-Host "❌ Metrics Contract: $contractStatus" -ForegroundColor Red
    exit 1
}
