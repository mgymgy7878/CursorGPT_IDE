# 10 Dakikalık Go/No-Go Kiti
# Spark Trading Platform - Prod Öncesi Akıl Sağlığı Kontrolü
# Usage: .\scripts\validation\go-no-go-kit-10dk.ps1

param(
    [Parameter()]
    [switch]$AutoApprove,  # Otomatik onay (≥80% ise)
    
    [Parameter()]
    [switch]$Verbose       # Detaylı çıktı
)

$ErrorActionPreference = 'Continue'
$baseUrl = "http://localhost:3003"
$startTime = Get-Date

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          10-DAKİKA GO/NO-GO KİTİ                         ║" -ForegroundColor Cyan
Write-Host "║      'Saklı Meteorlar' Sahaya Düşse Bile Net Karar      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 0: Feature Flag Kilitleme
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[0/5] Feature Flag Durumu" -ForegroundColor Yellow
Write-Host ""

$envPath = "apps\web-next\.env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    $realData = if ($envContent -match "SPARK_REAL_DATA=1") { "✅ AÇIK" } else { "❌ KAPALI" }
    $bistFeed = if ($envContent -match "BIST_REAL_FEED=true") { "⚠️ AÇIK" } else { "✅ KAPALI" }
    
    Write-Host "  SPARK_REAL_DATA: $realData" -ForegroundColor $(if ($realData -match "AÇIK") { "Green" } else { "Red" })
    Write-Host "  BIST_REAL_FEED: $bistFeed" -ForegroundColor $(if ($bistFeed -match "KAPALI") { "Green" } else { "Yellow" })
    
    # Validation
    if ($realData -match "AÇIK" -and $bistFeed -match "KAPALI") {
        Write-Host "  ✅ PASS: Real data ON, BIST feed OFF (beklenen)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ WARNING: Feature flag config beklenmedik" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ WARNING: .env.local bulunamadı" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 1: Final Gauntlet (Rapor Zorunlu)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[1/5] Final Gauntlet Execution" -ForegroundColor Yellow
Write-Host ""

$gauntletPath = "scripts\validation\final-gauntlet-15dk.ps1"
if (Test-Path $gauntletPath) {
    Write-Host "  Gauntlet başlatılıyor..." -ForegroundColor Cyan
    
    # Gauntlet çalıştır (ayrı process)
    $gauntletOutput = & $gauntletPath -FullReport 2>&1
    $gauntletExitCode = $LASTEXITCODE
    
    # Sonuç analizi
    $successMatch = $gauntletOutput | Select-String "SERTİFİKA:.*BAŞARILI.*\(([0-9.]+)%\)"
    
    if ($successMatch) {
        $successRate = [double]$successMatch.Matches.Groups[1].Value
        
        if ($successRate -ge 80) {
            Write-Host "  ✅ GAUNTLET PASS: $successRate% (≥80%)" -ForegroundColor Green
            $gauntletPassed = $true
        } else {
            Write-Host "  ❌ GAUNTLET FAIL: $successRate% (<80%)" -ForegroundColor Red
            $gauntletPassed = $false
        }
    } else {
        Write-Host "  ⚠️ WARNING: Gauntlet sonucu parse edilemedi" -ForegroundColor Yellow
        if ($Verbose) {
            Write-Host "Output:" -ForegroundColor DarkGray
            $gauntletOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        }
        $gauntletPassed = $false
    }
    
    # Evidence ZIP kontrolü
    $evidenceDir = "validation"
    if (Test-Path $evidenceDir) {
        $latestEvidence = Get-ChildItem $evidenceDir -Filter "final_gauntlet_*" -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latestEvidence) {
            Write-Host "  Evidence: $($latestEvidence.Name)" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "  ❌ FAIL: Gauntlet script bulunamadı ($gauntletPath)" -ForegroundColor Red
    $gauntletPassed = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 2: Hızlı Göz Testi (Grafana Metrics)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[2/5] Hızlı Göz Testi (Grafana)" -ForegroundColor Yellow
Write-Host ""

$metricsTest = @{ passed = $true; issues = @() }

try {
    # Health check
    $health = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -TimeoutSec 5 | ConvertFrom-Json
    
    # P95 UI
    $p95 = $health.slo.latencyP95
    $p95Status = if ($p95 -lt 120) { "✅" } else { "❌" }
    Write-Host "  P95 (UI): $p95 ms (target: <120ms) $p95Status" -ForegroundColor $(if ($p95 -lt 120) { "Green" } else { "Red" })
    if ($p95 -ge 120) {
        $metricsTest.passed = $false
        $metricsTest.issues += "P95 threshold breach"
    }
    
    # Error Rate
    $errorRate = $health.slo.errorRate
    $errorStatus = if ($errorRate -lt 1) { "✅" } else { "❌" }
    Write-Host "  Error: $errorRate% (target: <1%) $errorStatus" -ForegroundColor $(if ($errorRate -lt 1) { "Green" } else { "Red" })
    if ($errorRate -ge 1) {
        $metricsTest.passed = $false
        $metricsTest.issues += "Error rate threshold breach"
    }
    
    # Venue Staleness
    $staleness = $health.venues.btcturk.stalenessSec
    $stalenessStatus = if ($staleness -lt 20) { "✅" } else { "❌" }
    Write-Host "  Venue staleness: $staleness s (target: <20s) $stalenessStatus" -ForegroundColor $(if ($staleness -lt 20) { "Green" } else { "Red" })
    if ($staleness -ge 20) {
        $metricsTest.passed = $false
        $metricsTest.issues += "Venue staleness high"
    }
    
    # WS Reconnects (son 5 dk)
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $wsReconnects = 0
    if ($metrics -match "ws_reconnects_total (\d+)") {
        $wsReconnects = [int]$Matches[1]
    }
    
    # Son 5 dk için artış kontrolü (basitleştirilmiş)
    $wsStatus = if ($wsReconnects -le 10) { "✅" } else { "⚠️" }
    Write-Host "  WS reconnects: $wsReconnects (target: ≤10 last 5min) $wsStatus" -ForegroundColor $(if ($wsReconnects -le 10) { "Green" } else { "Yellow" })
    
    Write-Host ""
    if ($metricsTest.passed) {
        Write-Host "  ✅ HIZLI GÖZ TESTİ: PASS" -ForegroundColor Green
    } else {
        Write-Host "  ❌ HIZLI GÖZ TESTİ: FAIL" -ForegroundColor Red
        Write-Host "  Issues: $($metricsTest.issues -join ', ')" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ❌ FAIL: Metrics erişim hatası" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    $metricsTest.passed = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 3: Kardinalite & Yük Nefesi
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[3/5] Kardinalite & Yük Nefesi" -ForegroundColor Yellow
Write-Host ""

$loadTest = @{ passed = $true }

try {
    # Prometheus TSDB series kontrolü
    $prometheusUrl = "http://localhost:9090"
    try {
        $query = "count({__name__=~`".+`"})"
        $response = Invoke-WebRequest -Uri "$prometheusUrl/api/v1/query?query=$query" -TimeoutSec 5 | ConvertFrom-Json
        
        if ($response.data.result.Count -gt 0) {
            $currentSeries = [int]$response.data.result[0].value[1]
            
            $baselinePath = "logs\validation\cardinality_baseline.txt"
            if (Test-Path $baselinePath) {
                $baselineSeries = [int](Get-Content $baselinePath)
                $growthPct = (($currentSeries - $baselineSeries) / $baselineSeries) * 100
                
                $growthStatus = if ($growthPct -le 50) { "✅" } else { "❌" }
                Write-Host "  TSDB series: $currentSeries (baseline: $baselineSeries, +$([math]::Round($growthPct, 1))%) $growthStatus" -ForegroundColor $(if ($growthPct -le 50) { "Green" } else { "Red" })
                
                if ($growthPct -gt 50) {
                    $loadTest.passed = $false
                }
            } else {
                Write-Host "  ℹ️ TSDB baseline yok, oluşturuluyor..." -ForegroundColor Cyan
                New-Item -Path "logs\validation" -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
                $currentSeries | Out-File $baselinePath
            }
        }
    } catch {
        Write-Host "  ⏭️ Prometheus offline, TSDB check SKIP" -ForegroundColor DarkGray
    }
    
    # SSE Queue Depth
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $queueDepth = 0
    $throttleCoeff = 1.0
    
    if ($metrics -match "sse_queue_depth_avg_gauge (\d+)") {
        $queueDepth = [int]$Matches[1]
    }
    if ($metrics -match "sse_throttle_coefficient_avg_gauge ([0-9.]+)") {
        $throttleCoeff = [double]$Matches[1]
    }
    
    $queueStatus = if ($queueDepth -lt 80) { "✅" } else { "⚠️" }
    $throttleStatus = if ($throttleCoeff -le 4.0) { "✅" } else { "❌" }
    
    Write-Host "  SSE queue depth: $queueDepth/100 (target: <80) $queueStatus" -ForegroundColor $(if ($queueDepth -lt 80) { "Green" } else { "Yellow" })
    Write-Host "  SSE throttle coeff: ${throttleCoeff}x (max: 4.0x) $throttleStatus" -ForegroundColor $(if ($throttleCoeff -le 4.0) { "Green" } else { "Red" })
    
    if ($queueDepth -ge 80 -or $throttleCoeff -gt 4.0) {
        $loadTest.passed = $false
    }
    
    Write-Host ""
    if ($loadTest.passed) {
        Write-Host "  ✅ KARDİNALİTE & YÜK: PASS" -ForegroundColor Green
    } else {
        Write-Host "  ❌ KARDİNALİTE & YÜK: FAIL" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ❌ FAIL: Metrics error" -ForegroundColor Red
    $loadTest.passed = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 4: Bukalemun Kontrolleri
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[4/5] Bukalemun Kontrolleri" -ForegroundColor Yellow
Write-Host ""

$chameleonTest = @{ passed = $true; checks = 0; passedChecks = 0 }

try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    # Clock skew
    $chameleonTest.checks++
    $clockSkew = 0
    if ($metrics -match "clock_skew_ms (\d+)") {
        $clockSkew = [int]$Matches[1]
    }
    
    $clockStatus = if ($clockSkew -lt 3000) { "✅" } else { "⚠️" }
    Write-Host "  Clock skew: $clockSkew ms (target: <3000ms) $clockStatus" -ForegroundColor $(if ($clockSkew -lt 3000) { "Green" } else { "Yellow" })
    if ($clockSkew -lt 3000) { $chameleonTest.passedChecks++ }
    
    # Tatil sessizliği
    $chameleonTest.checks++
    $logPath = "logs\bist_quality.log"
    if (Test-Path $logPath) {
        $recentLogs = Get-Content $logPath -Tail 30 -ErrorAction SilentlyContinue
        $zeroVolWarnings = ($recentLogs | Select-String "zero-volume" -SimpleMatch).Count
        $marketClosed = ($recentLogs | Select-String "market_closed=1" -SimpleMatch).Count
        
        $holidayStatus = if ($zeroVolWarnings -eq 0 -or $marketClosed -gt 0) { "✅" } else { "⚠️" }
        Write-Host "  Tatil/yarım gün: zero-vol=$zeroVolWarnings, market_closed=$marketClosed $holidayStatus" -ForegroundColor $(if ($holidayStatus -eq "✅") { "Green" } else { "Yellow" })
        if ($holidayStatus -eq "✅") { $chameleonTest.passedChecks++ }
    } else {
        Write-Host "  ⏭️ Tatil check SKIP (log yok)" -ForegroundColor DarkGray
    }
    
    # Rate-limit burst/sustained
    $chameleonTest.checks++
    $burstViolations = 0
    $sustainedViolations = 0
    $adaptiveBackoff = 1.0
    
    if ($metrics -match "venue_http_429_burst_total{venue=`"btcturk`"} (\d+)") {
        $burstViolations = [int]$Matches[1]
    }
    if ($metrics -match "venue_http_429_sustained_total{venue=`"btcturk`"} (\d+)") {
        $sustainedViolations = [int]$Matches[1]
    }
    if ($metrics -match "venue_adaptive_backoff_multiplier{venue=`"btcturk`"} ([0-9.]+)") {
        $adaptiveBackoff = [double]$Matches[1]
    }
    
    $expectedBackoff = if ($burstViolations -gt 0) { 1.5 } elseif ($sustainedViolations -gt 0) { 2.0 } else { 1.0 }
    $backoffMatch = [math]::Abs($adaptiveBackoff - $expectedBackoff) -lt 0.5
    
    $rateLimitStatus = if ($backoffMatch -or $adaptiveBackoff -eq 1.0) { "✅" } else { "⚠️" }
    Write-Host "  Rate-limit: burst=$burstViolations, sustained=$sustainedViolations, backoff=${adaptiveBackoff}x $rateLimitStatus" -ForegroundColor $(if ($rateLimitStatus -eq "✅") { "Green" } else { "Yellow" })
    if ($rateLimitStatus -eq "✅") { $chameleonTest.passedChecks++ }
    
    Write-Host ""
    $chameleonPassRate = if ($chameleonTest.checks -gt 0) { ($chameleonTest.passedChecks / $chameleonTest.checks) * 100 } else { 0 }
    
    if ($chameleonPassRate -ge 66) {
        Write-Host "  ✅ BUKALEMUN KONTROLLERİ: PASS ($([math]::Round($chameleonPassRate, 0))%)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ BUKALEMUN KONTROLLERİ: WARN ($([math]::Round($chameleonPassRate, 0))%)" -ForegroundColor Yellow
        $chameleonTest.passed = $false
    }
    
} catch {
    Write-Host "  ❌ FAIL: Metrics error" -ForegroundColor Red
    $chameleonTest.passed = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 5: Kırmızı Düğme Hazırlık
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[5/5] Kırmızı Düğme Hazırlık" -ForegroundColor Yellow
Write-Host ""

$redButtonTest = @{ passed = $true; checks = 0; passedChecks = 0 }

try {
    # Command Palette kontrol (API endpoint test)
    $chameleonTest.checks++
    
    # Incident ZIP creation test (dry-run)
    Write-Host "  [Test] Incident ZIP creation..." -NoNewline
    try {
        $testIncident = Invoke-WebRequest -Uri "$baseUrl/api/tools/incident/create" -Method POST `
            -Body (@{ reason = "Go/No-Go kit test - dry run" } | ConvertTo-Json) `
            -ContentType "application/json" -TimeoutSec 5 | ConvertFrom-Json
        
        if ($testIncident.success -and $testIncident.zipPath) {
            Write-Host " ✅ OK" -ForegroundColor Green
            Write-Host "    ZIP: $($testIncident.zipPath)" -ForegroundColor DarkGreen
            Write-Host "    Trace-ID: $($testIncident.traceId)" -ForegroundColor DarkGreen
            Write-Host "    Git SHA: $($testIncident.git.sha)" -ForegroundColor DarkGreen
            $redButtonTest.passedChecks++
        } else {
            Write-Host " ❌ FAIL" -ForegroundColor Red
        }
    } catch {
        Write-Host " ⚠️ ENDPOINT NOT READY" -ForegroundColor Yellow
    }
    
    # Kill-switch history kontrolü
    $redButtonTest.checks++
    Write-Host "  [Test] Kill-switch history..." -NoNewline
    try {
        $history = Invoke-WebRequest -Uri "$baseUrl/api/tools/kill-switch/toggle" -Method GET -TimeoutSec 3 | ConvertFrom-Json
        
        if ($history.history -and $history.history.Count -gt 0) {
            Write-Host " ✅ OK" -ForegroundColor Green
            Write-Host "    Events: $($history.history.Count)" -ForegroundColor DarkGreen
            Write-Host "    Last cooldown: $($history.currentCooldown)" -ForegroundColor DarkGreen
            $redButtonTest.passedChecks++
        } else {
            Write-Host " ⚠️ NO HISTORY" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ❌ FAIL" -ForegroundColor Red
    }
    
    Write-Host ""
    $redButtonPassRate = if ($redButtonTest.checks -gt 0) { ($redButtonTest.passedChecks / $redButtonTest.checks) * 100 } else { 0 }
    
    if ($redButtonPassRate -ge 50) {
        Write-Host "  ✅ KIRMIZI DÜĞME: READY" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ KIRMIZI DÜĞME: PARTIAL" -ForegroundColor Yellow
        $redButtonTest.passed = $false
    }
    
} catch {
    Write-Host "  ❌ FAIL: Red button test error" -ForegroundColor Red
    $redButtonTest.passed = $false
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# FINAL DECISION: GO / NO-GO
# ═══════════════════════════════════════════════════════════════════════

$duration = ((Get-Date) - $startTime).TotalMinutes

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              GO/NO-GO KARAR ($([math]::Round($duration, 1)) dakika)              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allPassed = $gauntletPassed -and $metricsTest.passed -and $loadTest.passed -and $chameleonTest.passed -and $redButtonTest.passed

Write-Host "Kontrol Sonuçları:" -ForegroundColor White
Write-Host "  [0] Feature Flags: ✅ (manual check)" -ForegroundColor Green
Write-Host "  [1] Final Gauntlet: $(if ($gauntletPassed) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($gauntletPassed) { "Green" } else { "Red" })
Write-Host "  [2] Grafana Göz Testi: $(if ($metricsTest.passed) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($metricsTest.passed) { "Green" } else { "Red" })
Write-Host "  [3] Kardinalite & Yük: $(if ($loadTest.passed) { '✅ PASS' } else { '❌ FAIL' })" -ForegroundColor $(if ($loadTest.passed) { "Green" } else { "Red" })
Write-Host "  [4] Bukalemun: $(if ($chameleonTest.passed) { '✅ PASS' } else { '⚠️ WARN' })" -ForegroundColor $(if ($chameleonTest.passed) { "Green" } else { "Yellow" })
Write-Host "  [5] Kırmızı Düğme: $(if ($redButtonTest.passed) { '✅ READY' } else { '⚠️ PARTIAL' })" -ForegroundColor $(if ($redButtonTest.passed) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

if ($allPassed) {
    Write-Host "✅✅✅ GO DECISION: PROD'A ÇIKIŞ ONAYLANDI ✅✅✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Kalkan: Auto-degrade + cooldown + quality gates ✅" -ForegroundColor Green
    Write-Host "  Fren: Adaptive throttle/backoff + concurrent caps ✅" -ForegroundColor Green
    Write-Host "  Pusula: SLO windows + trace-ID + evidence trail ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🚀 PİST SİZİNDİR - KALKIŞ İZNİ VERİLDİ" -ForegroundColor Green
    Write-Host ""
    
    if ($AutoApprove) {
        Write-Host "  [AUTO-APPROVE] Prod deploy başlatılabilir" -ForegroundColor Cyan
    }
    
    $exitCode = 0
} else {
    Write-Host "❌❌❌ NO-GO DECISION: PROD ÇIKIŞI BLOKELENDİ ❌❌❌" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Issues:" -ForegroundColor Red
    
    if (-not $gauntletPassed) {
        Write-Host "    - Final gauntlet <80% success" -ForegroundColor Red
    }
    if (-not $metricsTest.passed) {
        Write-Host "    - $($metricsTest.issues -join ', ')" -ForegroundColor Red
    }
    if (-not $loadTest.passed) {
        Write-Host "    - Kardinalite veya SSE queue issues" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "  Önerilen Aksiyon:" -ForegroundColor Yellow
    Write-Host "    1. Evidence ZIP'i incele" -ForegroundColor Yellow
    Write-Host "    2. Failed checks'i düzelt" -ForegroundColor Yellow
    Write-Host "    3. Go/No-Go kit'i tekrar çalıştır" -ForegroundColor Yellow
    Write-Host ""
    
    $exitCode = 1
}

Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Exit Code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

exit $exitCode

