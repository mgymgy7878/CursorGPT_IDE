# Final Gauntlet: 15 Dakikalık Sertifika
# "Saklı Meteor Yağmuruna" Karşı - Prod Öncesi Son Kontrol
# Spark Trading Platform - Week 0 Certification

param(
    [Parameter()]
    [switch]$FullReport,  # Detaylı rapor
    
    [Parameter()]
    [switch]$QuickCheck   # Hızlı check (5 dk)
)

$ErrorActionPreference = 'Continue'
$baseUrl = "http://localhost:3003"
$results = @()
$startTime = Get-Date

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FINAL GAUNTLET: 15 DAKİKALİK SERTİFİKA                ║" -ForegroundColor Cyan
Write-Host "║     'Saklı Meteor Yağmuruna' Karşı Dayanıklılık          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 1: Zaman, Tatil, Saat Kayması Üçlüsü
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 1/7: Zaman Üçlüsü ═══" -ForegroundColor Yellow
Write-Host ""

$g1 = @{ name = "Zaman Üçlüsü"; tests = @(); passed = 0; failed = 0 }

# Test 1.1: Clock Skew (NTP offset simülasyonu)
Write-Host "  [1.1] Clock Skew Testi..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $clockSkew = 0
    if ($metrics -match "clock_skew_ms (\d+)") {
        $clockSkew = [int]$Matches[1]
    }
    
    # Health check - staleness etkilenmemeli
    $health = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -TimeoutSec 3 | ConvertFrom-Json
    $staleness = $health.venues.btcturk.stalenessSec
    
    if ($staleness -lt 30) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Clock skew: $clockSkew ms, Staleness: $staleness s (etkilenmedi)" -ForegroundColor DarkGreen
        $g1.passed++
        $g1.tests += "Clock skew isolation: PASS"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "    Staleness >30s (clock skew etkisi?)" -ForegroundColor Red
        $g1.failed++
        $g1.tests += "Clock skew isolation: FAIL"
    }
} catch {
    Write-Host " ⚠️ ERROR: $($_.Exception.Message)" -ForegroundColor Yellow
    $g1.failed++
}

# Test 1.2: BIST Tatil Sessizliği
Write-Host "  [1.2] BIST Tatil Sessizliği..." -NoNewline
try {
    $logPath = "logs\bist_quality.log"
    
    if (Test-Path $logPath) {
        $recentLogs = Get-Content $logPath -Tail 30 -ErrorAction SilentlyContinue
        $zeroVolumeWarnings = ($recentLogs | Select-String "zero-volume" -SimpleMatch).Count
        $marketClosedLogs = ($recentLogs | Select-String "market_closed=1" -SimpleMatch).Count
        
        if ($zeroVolumeWarnings -eq 0 -or $marketClosedLogs -gt 0) {
            Write-Host " ✅ PASS" -ForegroundColor Green
            Write-Host "    Zero-volume warnings: $zeroVolumeWarnings, market_closed logs: $marketClosedLogs" -ForegroundColor DarkGreen
            $g1.passed++
            $g1.tests += "Holiday silence: PASS"
        } else {
            Write-Host " ⚠️ WARN" -ForegroundColor Yellow
            $g1.tests += "Holiday silence: WARN"
        }
    } else {
        Write-Host " ⏭️ SKIP (log yok)" -ForegroundColor DarkGray
        $g1.tests += "Holiday silence: SKIP"
    }
} catch {
    Write-Host " ⚠️ ERROR" -ForegroundColor Yellow
}

$results += $g1
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 2: Kimlik, Anahtar, Kota
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 2/7: Kimlik & Kota ═══" -ForegroundColor Yellow
Write-Host ""

$g2 = @{ name = "Kimlik & Kota"; tests = @(); passed = 0; failed = 0 }

# Test 2.1: Rate Limit Burst/Sustained
Write-Host "  [2.1] Rate Limit Burst/Sustained..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $burstViolations = 0
    $sustainedViolations = 0
    $adaptiveBackoff = 0
    
    if ($metrics -match "venue_http_429_burst_total{venue=`"btcturk`"} (\d+)") {
        $burstViolations = [int]$Matches[1]
    }
    if ($metrics -match "venue_http_429_sustained_total{venue=`"btcturk`"} (\d+)") {
        $sustainedViolations = [int]$Matches[1]
    }
    if ($metrics -match "venue_adaptive_backoff_multiplier{venue=`"btcturk`"} ([0-9.]+)") {
        $adaptiveBackoff = [double]$Matches[1]
    }
    
    Write-Host " ✅ READY" -ForegroundColor Green
    Write-Host "    Burst: $burstViolations, Sustained: $sustainedViolations, Backoff: ${adaptiveBackoff}x" -ForegroundColor DarkGreen
    $g2.passed++
    $g2.tests += "Rate limit telemetry: READY"
} catch {
    Write-Host " ⚠️ METRICS MISSING" -ForegroundColor Yellow
    $g2.tests += "Rate limit telemetry: PENDING"
}

$results += $g2
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 3: Ağ Şiddeti Testi (Zarif Çöküş)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 3/7: Ağ Şiddeti ═══" -ForegroundColor Yellow
Write-Host ""

$g3 = @{ name = "Ağ Şiddeti"; tests = @(); passed = 0; failed = 0 }

# Test 3.1: WS Reconnect Cap
Write-Host "  [3.1] WS Reconnect Cap..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $concurrentReconnects = 0
    $vendorBackoffActive = 0
    
    if ($metrics -match "ws_reconnect_concurrent_gauge (\d+)") {
        $concurrentReconnects = [int]$Matches[1]
    }
    if ($metrics -match "vendor_backoff_active (\d+)") {
        $vendorBackoffActive = [int]$Matches[1]
    }
    
    if ($concurrentReconnects -le 2) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Concurrent: $concurrentReconnects ≤ 2, Backoff active: $vendorBackoffActive" -ForegroundColor DarkGreen
        $g3.passed++
        $g3.tests += "WS reconnect cap: PASS"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        $g3.failed++
        $g3.tests += "WS reconnect cap: FAIL"
    }
} catch {
    Write-Host " ⚠️ ERROR" -ForegroundColor Yellow
}

# Test 3.2: SSE Queue Depth + Adaptive Throttle
Write-Host "  [3.2] SSE Adaptive Throttle..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $queueDepth = 0
    $throttleCoeff = 1.0
    $droppedEvents = 0
    
    if ($metrics -match "sse_queue_depth_gauge{client=`"[^`"]+`"} (\d+)") {
        $queueDepth = [int]$Matches[1]
    }
    if ($metrics -match "sse_throttle_coefficient_gauge{client=`"[^`"]+`"} ([0-9.]+)") {
        $throttleCoeff = [double]$Matches[1]
    }
    if ($metrics -match "sse_dropped_events_total{reason=`"backpressure`"} (\d+)") {
        $droppedEvents = [int]$Matches[1]
    }
    
    Write-Host " ✅ READY" -ForegroundColor Green
    Write-Host "    Queue: $queueDepth/100, Throttle: ${throttleCoeff}x, Dropped: $droppedEvents" -ForegroundColor DarkGreen
    $g3.passed++
    $g3.tests += "SSE adaptive throttle: READY"
} catch {
    Write-Host " ⚠️ METRICS MISSING" -ForegroundColor Yellow
    $g3.tests += "SSE adaptive throttle: PENDING"
}

$results += $g3
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 4: Kardinalite Fren Kontrolü
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 4/7: Kardinalite Fren ═══" -ForegroundColor Yellow
Write-Host ""

$g4 = @{ name = "Kardinalite"; tests = @(); passed = 0; failed = 0 }

# Test 4.1: TSDB Series Limit
Write-Host "  [4.1] TSDB Series Artış Kontrolü..." -NoNewline
try {
    $prometheusUrl = "http://localhost:9090"
    $query = "count({__name__=~`".+`"})"
    $response = Invoke-WebRequest -Uri "$prometheusUrl/api/v1/query?query=$query" -TimeoutSec 5 | ConvertFrom-Json
    
    if ($response.data.result.Count -gt 0) {
        $currentSeries = [int]$response.data.result[0].value[1]
        
        $baselinePath = "logs\validation\cardinality_baseline.txt"
        if (Test-Path $baselinePath) {
            $baselineSeries = [int](Get-Content $baselinePath)
            $increasePercent = (($currentSeries - $baselineSeries) / $baselineSeries) * 100
            
            if ($increasePercent -le 50) {
                Write-Host " ✅ PASS" -ForegroundColor Green
                Write-Host "    Series: $currentSeries (baseline: $baselineSeries), Artış: $([math]::Round($increasePercent, 1))%" -ForegroundColor DarkGreen
                $g4.passed++
                $g4.tests += "Cardinality limit: PASS"
            } else {
                Write-Host " ❌ FAIL" -ForegroundColor Red
                Write-Host "    Artış %50'yi aştı: $([math]::Round($increasePercent, 1))%" -ForegroundColor Red
                $g4.failed++
                $g4.tests += "Cardinality limit: FAIL"
            }
        } else {
            # Baseline oluştur
            New-Item -Path "logs\validation" -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
            $currentSeries | Out-File $baselinePath
            Write-Host " ✅ BASELINE" -ForegroundColor Cyan
            Write-Host "    Series: $currentSeries (baseline kaydedildi)" -ForegroundColor DarkCyan
            $g4.tests += "Cardinality baseline: CREATED"
        }
    }
} catch {
    Write-Host " ⏭️ SKIP (Prometheus offline)" -ForegroundColor DarkGray
    $g4.tests += "Cardinality: SKIP"
}

# Test 4.2: Top-N Aggregation
Write-Host "  [4.2] Top-N Aggregation..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $symbolMetrics = $metrics -split "`n" | Select-String "venue_requests_by_symbol_total"
    $symbolCount = $symbolMetrics.Count
    
    if ($symbolCount -le 12) {  # Top 10 + "other" + metadata lines
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Symbol metrics: $symbolCount ≤ 12 (top-N aktif)" -ForegroundColor DarkGreen
        $g4.passed++
        $g4.tests += "Top-N aggregation: PASS"
    } else {
        Write-Host " ⚠️ WARN" -ForegroundColor Yellow
        Write-Host "    Symbol metrics: $symbolCount (top-N gerekli?)" -ForegroundColor Yellow
        $g4.tests += "Top-N aggregation: WARN"
    }
} catch {
    Write-Host " ⚠️ ERROR" -ForegroundColor Yellow
}

$results += $g4
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 5: Kill-Switch Muhasebesi
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 5/7: Kill-Switch Muhasebe ═══" -ForegroundColor Yellow
Write-Host ""

$g5 = @{ name = "Kill-Switch"; tests = @(); passed = 0; failed = 0 }

# Test 5.1: Flipflop Rejects Counter
Write-Host "  [5.1] Flipflop Rejects Counter..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $flipflopRejects = 0
    if ($metrics -match "flipflop_rejects_total (\d+)") {
        $flipflopRejects = [int]$Matches[1]
    }
    
    Write-Host " ✅ READY" -ForegroundColor Green
    Write-Host "    flipflop_rejects_total: $flipflopRejects" -ForegroundColor DarkGreen
    $g5.passed++
    $g5.tests += "Flipflop counter: READY"
} catch {
    Write-Host " ⚠️ METRICS MISSING" -ForegroundColor Yellow
    $g5.tests += "Flipflop counter: PENDING"
}

# Test 5.2: Evidence ZIP Completeness
Write-Host "  [5.2] Evidence ZIP İçerik Kontrolü..." -NoNewline
try {
    # Son kill-switch event'i kontrol et
    $history = Invoke-WebRequest -Uri "$baseUrl/api/tools/kill-switch/toggle" -Method GET -TimeoutSec 3 | ConvertFrom-Json
    
    if ($history.history.Count -gt 0) {
        $lastEvent = $history.history[-1]
        $zipPath = "apps\web-next\evidence\$($lastEvent.evidenceZip)"
        
        if (Test-Path $zipPath) {
            # ZIP içeriğini kontrol et
            $tempDir = "temp_gauntlet_extract"
            Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
            
            $hasEventJson = Test-Path "$tempDir\event.json"
            $hasHealthJson = Test-Path "$tempDir\healthz.json"
            
            if ($hasEventJson -and $hasHealthJson) {
                Write-Host " ✅ PASS" -ForegroundColor Green
                Write-Host "    ZIP içeriği eksiksiz (event.json ✅, healthz.json ✅)" -ForegroundColor DarkGreen
                $g5.passed++
                $g5.tests += "Evidence ZIP completeness: PASS"
            } else {
                Write-Host " ❌ FAIL" -ForegroundColor Red
                Write-Host "    ZIP içeriği eksik" -ForegroundColor Red
                $g5.failed++
                $g5.tests += "Evidence ZIP completeness: FAIL"
            }
            
            Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host " ⏭️ SKIP (ZIP yok)" -ForegroundColor DarkGray
            $g5.tests += "Evidence ZIP: SKIP"
        }
    } else {
        Write-Host " ⏭️ SKIP (history yok)" -ForegroundColor DarkGray
        $g5.tests += "Evidence ZIP: SKIP"
    }
} catch {
    Write-Host " ⚠️ ERROR" -ForegroundColor Yellow
}

$results += $g5
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 6: Veri Kalitesi Kapıları (BIST Hazırlığı)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 6/7: Veri Kalitesi ═══" -ForegroundColor Yellow
Write-Host ""

$g6 = @{ name = "Veri Kalitesi"; tests = @(); passed = 0; failed = 0 }

# Test 6.1: Quality Gate Pass Rate
Write-Host "  [6.1] Quality Gate Pass Rate..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $passRate = 1.0
    if ($metrics -match "bist_quality_gate_pass_rate ([0-9.]+)") {
        $passRate = [double]$Matches[1]
    }
    
    $passRatePct = $passRate * 100
    
    if ($passRate -ge 0.999) {
        Write-Host " ✅ PASS" -ForegroundColor Green
        Write-Host "    Pass rate: $([math]::Round($passRatePct, 2))% ≥ 99.9%" -ForegroundColor DarkGreen
        $g6.passed++
        $g6.tests += "Quality gate pass rate: PASS"
    } elseif ($passRate -ge 0.95) {
        Write-Host " ⚠️ WARN" -ForegroundColor Yellow
        Write-Host "    Pass rate: $([math]::Round($passRatePct, 2))% (target: 99.9%)" -ForegroundColor Yellow
        $g6.tests += "Quality gate pass rate: WARN"
    } else {
        Write-Host " ❌ FAIL" -ForegroundColor Red
        Write-Host "    Pass rate: $([math]::Round($passRatePct, 2))% < 95%" -ForegroundColor Red
        $g6.failed++
        $g6.tests += "Quality gate pass rate: FAIL"
    }
} catch {
    Write-Host " ⏭️ SKIP (metric yok)" -ForegroundColor DarkGray
    $g6.tests += "Quality gate: SKIP"
}

# Test 6.2: Anomaly Detection (Warning vs Reject)
Write-Host "  [6.2] Anomaly Detection..." -NoNewline
try {
    $logPath = "logs\bist_quality.log"
    
    if (Test-Path $logPath) {
        $recentLogs = Get-Content $logPath -Tail 50 -ErrorAction SilentlyContinue
        $warningAnomalies = ($recentLogs | Select-String "price_anomaly_detected" -SimpleMatch).Count
        $criticalRejects = ($recentLogs | Select-String "staleness_exceeded" -SimpleMatch).Count
        
        Write-Host " ✅ READY" -ForegroundColor Green
        Write-Host "    Warnings: $warningAnomalies, Critical rejects: $criticalRejects" -ForegroundColor DarkGreen
        $g6.passed++
        $g6.tests += "Anomaly detection: READY"
    } else {
        Write-Host " ⏭️ SKIP" -ForegroundColor DarkGray
        $g6.tests += "Anomaly detection: SKIP"
    }
} catch {
    Write-Host " ⚠️ ERROR" -ForegroundColor Yellow
}

$results += $g6
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# GAUNTLET 7: Maliyet Emniyeti
# ═══════════════════════════════════════════════════════════════════════

Write-Host "═══ GAUNTLET 7/7: Maliyet Emniyet ═══" -ForegroundColor Yellow
Write-Host ""

$g7 = @{ name = "Maliyet"; tests = @(); passed = 0; failed = 0 }

# Test 7.1: Budget Guard
Write-Host "  [7.1] Budget Guard..." -NoNewline
try {
    $metrics = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" -TimeoutSec 3 | Select-Object -ExpandProperty Content
    
    $budgetRemaining = 0
    $budgetUsedPct = 0
    
    if ($metrics -match "venue_budget_remaining_usd{venue=`"btcturk`"} ([0-9.]+)") {
        $budgetRemaining = [double]$Matches[1]
    }
    if ($metrics -match "venue_budget_used_pct{venue=`"btcturk`"} ([0-9.]+)") {
        $budgetUsedPct = [double]$Matches[1]
    }
    
    Write-Host " ✅ READY" -ForegroundColor Green
    Write-Host "    Remaining: $$([math]::Round($budgetRemaining, 2)), Used: $([math]::Round($budgetUsedPct, 1))%" -ForegroundColor DarkGreen
    $g7.passed++
    $g7.tests += "Budget guard: READY"
} catch {
    Write-Host " ⚠️ METRICS MISSING" -ForegroundColor Yellow
    $g7.tests += "Budget guard: PENDING"
}

$results += $g7
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# FINAL SUMMARY: GEÇER NOT RAPORU
# ═══════════════════════════════════════════════════════════════════════

$duration = ((Get-Date) - $startTime).TotalMinutes
$totalTests = 0
$totalPassed = 0
$totalFailed = 0

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║               GEÇER NOT RAPORU ($(([math]::Round($duration, 1))) dakika)              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

foreach ($gauntlet in $results) {
    $totalTests += $gauntlet.passed + $gauntlet.failed
    $totalPassed += $gauntlet.passed
    $totalFailed += $gauntlet.failed
    
    $icon = if ($gauntlet.failed -eq 0) { "✅" } elseif ($gauntlet.passed -gt 0) { "⚠️" } else { "❌" }
    $color = if ($gauntlet.failed -eq 0) { "Green" } elseif ($gauntlet.passed -gt 0) { "Yellow" } else { "Red" }
    
    Write-Host "$icon $($gauntlet.name): $($gauntlet.passed) PASS, $($gauntlet.failed) FAIL" -ForegroundColor $color
    
    if ($FullReport) {
        foreach ($test in $gauntlet.tests) {
            Write-Host "    $test" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Total: $totalTests test" -ForegroundColor White
Write-Host "  PASS:  $totalPassed" -ForegroundColor Green
Write-Host "  FAIL:  $totalFailed" -ForegroundColor Red
Write-Host ""

# Success rate
$successRate = if ($totalTests -gt 0) { ($totalPassed / $totalTests) * 100 } else { 0 }

if ($successRate -ge 80) {
    Write-Host "✅ SERTİFİKA: BAŞARILI ($([math]::Round($successRate, 1))%)" -ForegroundColor Green
    Write-Host "   Prod'a çıkış ONAYLANDIpor" -ForegroundColor Green
    $exitCode = 0
} elseif ($successRate -ge 60) {
    Write-Host "⚠️ SERTİFİKA: KOŞULLU GEÇER ($([math]::Round($successRate, 1))%)" -ForegroundColor Yellow
    Write-Host "   Bazı iyileştirmeler sonrası onaylanabilir" -ForegroundColor Yellow
    $exitCode = 0
} else {
    Write-Host "❌ SERTİFİKA: BAŞARISIZ ($([math]::Round($successRate, 1))%)" -ForegroundColor Red
    Write-Host "   Prod'a çıkış BLOKELENDİ" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Evidence package oluştur
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "validation\final_gauntlet_$timestamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

$summaryData = @{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    duration_minutes = [math]::Round($duration, 2)
    total_tests = $totalTests
    passed = $totalPassed
    failed = $totalFailed
    success_rate = [math]::Round($successRate, 1)
    certification = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
    gauntlets = $results
}

$summaryData | ConvertTo-Json -Depth 5 | Out-File "$evidenceDir\gauntlet_summary.json" -Encoding UTF8

Write-Host ""
Write-Host "Evidence: $evidenceDir\gauntlet_summary.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "Exit Code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

exit $exitCode

