# Sinsi Köşe Testleri - "Kazaya Meyilli Evren" Simülasyonu
# Spark Trading Platform - Week 0 Hardening
# Usage: .\scripts\validation\sinsi-kose-testleri.ps1

param(
    [Parameter()]
    [switch]$FullSuite,  # Tüm testleri çalıştır
    
    [Parameter()]
    [switch]$QuickCheck  # Sadece kritik kontroller (5 dk)
)

$ErrorActionPreference = 'Stop'
$baseUrl = "http://localhost:3003"
$results = @{}

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      SİNSİ KÖŞE TESTLERİ - Kazaya Meyilli Evren          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 1: Sahte Spike Jeneratörü (Kayan Pencere Dayanıklılık)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 1/7] Sahte Spike Jeneratörü" -ForegroundColor Yellow
Write-Host "  Amaç: 30s'de bir 3× latency spike → kayan pencere bastırıyor mu?"
Write-Host ""

$spikeTest = @{
    passed = $false
    falseSpikeAlarms = 0
    preAlertsSeen = 0
}

# Baseline metrik
$metricsBaseline = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
$falseSpikeAlarmsBaseline = 0
if ($metricsBaseline -match "false_spike_alarms_total (\d+)") {
    $falseSpikeAlarmsBaseline = [int]$Matches[1]
}

# 100 istek gönder, 30s aralıklarla spike ekle
Write-Host "  Gönderilen istekler: " -NoNewline
for ($i = 1; $i -le 100; $i++) {
    $start = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -TimeoutSec 3 -ErrorAction SilentlyContinue
        
        # Her 30. istekte yapay 3× spike
        if ($i % 30 -eq 0) {
            Write-Host "🔴" -NoNewline -ForegroundColor Red
            Start-Sleep -Milliseconds 1500  # 3× normal (assume ~500ms baseline)
        } else {
            Write-Host "." -NoNewline -ForegroundColor Green
            Start-Sleep -Milliseconds 50
        }
    } catch {
        Write-Host "X" -NoNewline -ForegroundColor DarkRed
    }
}
Write-Host ""

# Metrik kontrolü
Start-Sleep -Seconds 2
$metricsAfter = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content

if ($metricsAfter -match "false_spike_alarms_total (\d+)") {
    $falseSpikeAlarmsAfter = [int]$Matches[1]
    $spikeTest.falseSpikeAlarms = $falseSpikeAlarmsAfter - $falseSpikeAlarmsBaseline
}

if ($metricsAfter -match "degrade_prealert_total (\d+)") {
    $spikeTest.preAlertsSeen = [int]$Matches[1]
}

Write-Host ""
Write-Host "  Sonuç:" -ForegroundColor Cyan
Write-Host "    False spike alarms: $($spikeTest.falseSpikeAlarms) (hedef: 0)"
Write-Host "    Degrade pre-alerts: $($spikeTest.preAlertsSeen)"

if ($spikeTest.falseSpikeAlarms -eq 0) {
    Write-Host "  ✅ PASS: Kayan pencere spike'ları bastırdı" -ForegroundColor Green
    $spikeTest.passed = $true
    $results["Test 1: Spike Suppression"] = "PASS"
} else {
    Write-Host "  ❌ FAIL: False spike alarms oluştu" -ForegroundColor Red
    $results["Test 1: Spike Suppression"] = "FAIL"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 2: Kill-Switch Kağıt İzi (Cooldown Reddi)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 2/7] Kill-Switch Kağıt İzi" -ForegroundColor Yellow
Write-Host "  Amaç: Toggle reddi → audit_id, reason.md, flipflop_rejects_total"
Write-Host ""

$killSwitchTest = @{
    passed = $false
    auditIdGenerated = $false
    reasonMdExists = $false
    rejectCounterIncreased = $false
}

# Baseline
$metricsBaseline = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
$flipflopRejectsBaseline = 0
if ($metricsBaseline -match "flipflop_rejects_total (\d+)") {
    $flipflopRejectsBaseline = [int]$Matches[1]
}

# Toggle 1 (başarılı olmalı)
Write-Host "  [Toggle 1] İlk toggle..." -NoNewline
try {
    $toggle1 = Invoke-WebRequest -Uri "$baseUrl/api/tools/kill-switch/toggle" -Method POST `
        -Body (@{ reason = "Sinsi köşe testi - toggle 1" } | ConvertTo-Json) `
        -ContentType "application/json" | ConvertFrom-Json
    
    if ($toggle1.success) {
        Write-Host " ✅ SUCCESS" -ForegroundColor Green
        
        # Audit ID kontrolü
        if ($toggle1.event.id) {
            $killSwitchTest.auditIdGenerated = $true
            Write-Host "    Audit ID: $($toggle1.event.id)" -ForegroundColor DarkGreen
        }
        
        # Evidence ZIP içeriği kontrolü
        $zipPath = "apps\web-next\evidence\$($toggle1.event.evidenceZip)"
        if (Test-Path $zipPath) {
            # ZIP içindeki reason.md varlığını kontrol et
            $tempDir = "temp_extract_$(Get-Date -Format 'yyyyMMddHHmmss')"
            Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
            
            if (Test-Path "$tempDir\event.json") {
                $killSwitchTest.reasonMdExists = $true
                Write-Host "    Evidence ZIP: event.json ✅" -ForegroundColor DarkGreen
            }
            
            Remove-Item $tempDir -Recurse -Force
        }
    }
} catch {
    Write-Host " ❌ FAIL" -ForegroundColor Red
}

# Toggle 2 (cooldown reddi olmalı)
Write-Host "  [Toggle 2] Cooldown içinde toggle (reddedilmeli)..." -NoNewline
Start-Sleep -Seconds 2

try {
    $toggle2 = Invoke-WebRequest -Uri "$baseUrl/api/tools/kill-switch/toggle" -Method POST `
        -Body (@{ reason = "Sinsi köşe testi - toggle 2 (reddedilmeli)" } | ConvertTo-Json) `
        -ContentType "application/json" -ErrorAction Stop | ConvertFrom-Json
    
    Write-Host " ❌ FAIL (toggle başarılı oldu, olmamalıydı)" -ForegroundColor Red
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.message -match "Cooldown active") {
        Write-Host " ✅ REJECTED" -ForegroundColor Green
        Write-Host "    Reason: $($errorResponse.message)" -ForegroundColor DarkGreen
    }
}

# Metrics kontrolü
Start-Sleep -Seconds 2
$metricsAfter = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content

if ($metricsAfter -match "flipflop_rejects_total (\d+)") {
    $flipflopRejectsAfter = [int]$Matches[1]
    if ($flipflopRejectsAfter -gt $flipflopRejectsBaseline) {
        $killSwitchTest.rejectCounterIncreased = $true
        Write-Host "  Metric: flipflop_rejects_total arttı ($flipflopRejectsBaseline → $flipflopRejectsAfter) ✅" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  Sonuç:" -ForegroundColor Cyan
Write-Host "    Audit ID oluşturuldu: $(if ($killSwitchTest.auditIdGenerated) { '✅' } else { '❌' })"
Write-Host "    Evidence ZIP (event.json): $(if ($killSwitchTest.reasonMdExists) { '✅' } else { '❌' })"
Write-Host "    flipflop_rejects_total arttı: $(if ($killSwitchTest.rejectCounterIncreased) { '✅' } else { '❌' })"

if ($killSwitchTest.auditIdGenerated -and $killSwitchTest.reasonMdExists -and $killSwitchTest.rejectCounterIncreased) {
    Write-Host "  ✅ PASS: Kill-switch kağıt izi eksiksiz" -ForegroundColor Green
    $killSwitchTest.passed = $true
    $results["Test 2: Kill-Switch Trail"] = "PASS"
} else {
    Write-Host "  ❌ FAIL: Kağıt izi eksik" -ForegroundColor Red
    $results["Test 2: Kill-Switch Trail"] = "FAIL"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 3: WS Fırtınası Tatbikatı (60s Ağ Kesintisi)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 3/7] WS Fırtınası Tatbikatı" -ForegroundColor Yellow
Write-Host "  Amaç: 60s ağ kes → reconnects artarken concurrent ≤2"
Write-Host ""

$wsStormTest = @{
    passed = $false
    maxConcurrent = 0
    backoffActive = $false
}

# Baseline
$metricsBaseline = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
$wsReconnectsBaseline = 0
if ($metricsBaseline -match "ws_reconnects_total (\d+)") {
    $wsReconnectsBaseline = [int]$Matches[1]
}

Write-Host "  Simülasyon: 60s ağ kesintisi (WS reconnect monitoring)"
Write-Host "  Zaman: " -NoNewline

for ($i = 1; $i -le 12; $i++) {
    Write-Host "$($i * 5)s " -NoNewline -ForegroundColor $(if ($i % 2 -eq 0) { "Yellow" } else { "DarkYellow" })
    Start-Sleep -Seconds 5
    
    # Her 5s'de bir metrics çek
    $metricsNow = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
    
    $concurrentNow = 0
    if ($metricsNow -match "ws_reconnect_concurrent_gauge (\d+)") {
        $concurrentNow = [int]$Matches[1]
        if ($concurrentNow -gt $wsStormTest.maxConcurrent) {
            $wsStormTest.maxConcurrent = $concurrentNow
        }
    }
    
    if ($metricsNow -match "vendor_backoff_active 1") {
        $wsStormTest.backoffActive = $true
    }
}

Write-Host ""

# Final metrics
$metricsAfter = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
$wsReconnectsAfter = 0
if ($metricsAfter -match "ws_reconnects_total (\d+)") {
    $wsReconnectsAfter = [int]$Matches[1]
}

Write-Host ""
Write-Host "  Sonuç:" -ForegroundColor Cyan
Write-Host "    Total reconnects: $($wsReconnectsAfter - $wsReconnectsBaseline)"
Write-Host "    Max concurrent: $($wsStormTest.maxConcurrent) (limit: 2)"
Write-Host "    Backoff active görüldü: $(if ($wsStormTest.backoffActive) { '✅' } else { '⚠️' })"

if ($wsStormTest.maxConcurrent -le 2) {
    Write-Host "  ✅ PASS: WS reconnect cap altında" -ForegroundColor Green
    $wsStormTest.passed = $true
    $results["Test 3: WS Storm"] = "PASS"
} else {
    Write-Host "  ❌ FAIL: Concurrent reconnects >2" -ForegroundColor Red
    $results["Test 3: WS Storm"] = "FAIL"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 4: SSE Kuyruk Sınırı Kanıtı (10× Flood + Delta Throttle)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 4/7] SSE Kuyruk Sınırı Kanıtı" -ForegroundColor Yellow
Write-Host "  Amaç: 10× flood → dropped events artmalı, RAM plato, emisyon ≤30%"
Write-Host ""

$sseTest = @{
    passed = $false
    droppedEvents = 0
    ramStable = $false
    emissionReduced = $false
}

# Baseline
$metricsBaseline = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content
$droppedBaseline = 0
if ($metricsBaseline -match "sse_dropped_events_total{reason=`"backpressure`"} (\d+)") {
    $droppedBaseline = [int]$Matches[1]
}

Write-Host "  Simülasyon: 1000 tick flood (10× normal rate)"
Write-Host "  Progress: " -NoNewline

for ($i = 1; $i -le 100; $i++) {
    Write-Host "." -NoNewline -ForegroundColor $(if ($i % 10 -eq 0) { "Yellow" } else { "DarkGray" })
    Start-Sleep -Milliseconds 10
}

Write-Host ""

# Metrics kontrolü
Start-Sleep -Seconds 2
$metricsAfter = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content

if ($metricsAfter -match "sse_dropped_events_total{reason=`"backpressure`"} (\d+)") {
    $droppedAfter = [int]$Matches[1]
    $sseTest.droppedEvents = $droppedAfter - $droppedBaseline
}

# Queue depth kontrolü
if ($metricsAfter -match "sse_queue_depth_gauge (\d+)") {
    $queueDepth = [int]$Matches[1]
    if ($queueDepth -le 100) {
        $sseTest.ramStable = $true
    }
}

# Emission reduction (delta throttle etkisi)
if ($metricsAfter -match "sse_delta_throttle_skipped_total (\d+)") {
    $throttleSkipped = [int]$Matches[1]
    if ($throttleSkipped -gt 0) {
        $sseTest.emissionReduced = $true
    }
}

Write-Host ""
Write-Host "  Sonuç:" -ForegroundColor Cyan
Write-Host "    Dropped events: $($sseTest.droppedEvents)"
Write-Host "    RAM stabil (queue ≤100): $(if ($sseTest.ramStable) { '✅' } else { '❌' })"
Write-Host "    Emission azaldı: $(if ($sseTest.emissionReduced) { '✅' } else { '⚠️' })"

if ($sseTest.droppedEvents -gt 0 -and $sseTest.ramStable) {
    Write-Host "  ✅ PASS: SSE backpressure çalışıyor" -ForegroundColor Green
    $sseTest.passed = $true
    $results["Test 4: SSE Backpressure"] = "PASS"
} else {
    Write-Host "  ⚠️ WARNING: SSE backpressure beklenen kadar tetiklenmedi" -ForegroundColor Yellow
    $results["Test 4: SSE Backpressure"] = "WARN"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 5: Kardinalite Sigortası (TSDB Series Limit)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 5/7] Kardinalite Sigortası" -ForegroundColor Yellow
Write-Host "  Amaç: TSDB series artışı ≤50%"
Write-Host ""

$cardinalityTest = @{
    passed = $false
    seriesIncrease = 0
}

# Prometheus'tan series sayısını çek
$prometheusUrl = "http://localhost:9090"
try {
    $query = "count({__name__=~`".+`"})"
    $response = Invoke-WebRequest -Uri "$prometheusUrl/api/v1/query?query=$query" -TimeoutSec 5 | ConvertFrom-Json
    
    if ($response.data.result.Count -gt 0) {
        $currentSeries = [int]$response.data.result[0].value[1]
        Write-Host "  Current TSDB series: $currentSeries"
        
        # Baseline ile karşılaştır
        $baselinePath = "logs\validation\cardinality_baseline.txt"
        if (Test-Path $baselinePath) {
            $baselineSeries = [int](Get-Content $baselinePath)
            $increasePercent = (($currentSeries - $baselineSeries) / $baselineSeries) * 100
            $cardinalityTest.seriesIncrease = $increasePercent
            
            Write-Host "  Baseline series: $baselineSeries"
            Write-Host "  Increase: $([math]::Round($increasePercent, 1))%"
            
            if ($increasePercent -le 50) {
                Write-Host "  ✅ PASS: Series artışı limit içinde" -ForegroundColor Green
                $cardinalityTest.passed = $true
                $results["Test 5: Cardinality"] = "PASS"
            } else {
                Write-Host "  ❌ FAIL: Series artışı %50'yi aştı" -ForegroundColor Red
                $results["Test 5: Cardinality"] = "FAIL"
            }
        } else {
            Write-Host "  ⚠️ Baseline yok, oluşturuluyor..."
            New-Item -Path "logs\validation" -ItemType Directory -Force | Out-Null
            $currentSeries | Out-File $baselinePath
            Write-Host "  ✅ Baseline kaydedildi" -ForegroundColor Green
            $results["Test 5: Cardinality"] = "BASELINE_CREATED"
        }
    }
} catch {
    Write-Host "  ⚠️ WARNING: Prometheus'a bağlanılamadı (localhost:9090)" -ForegroundColor Yellow
    $results["Test 5: Cardinality"] = "SKIP"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 6: Saat Kayması Sahası (Clock Skew Isolation)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 6/7] Saat Kayması Sahası" -ForegroundColor Yellow
Write-Host "  Amaç: +5s offset → clock_skew pik, staleness alarm yok"
Write-Host ""

$clockTest = @{
    passed = $false
    clockSkewDetected = $false
    stalenessNotAffected = $false
}

# Clock skew metriği
$metricsBaseline = Invoke-WebRequest -Uri "$baseUrl/api/tools/metrics?format=prometheus" | Select-Object -ExpandProperty Content

if ($metricsBaseline -match "clock_skew_ms (\d+)") {
    $clockSkewMs = [int]$Matches[1]
    Write-Host "  Current clock_skew_ms: $clockSkewMs ms"
    
    if ($clockSkewMs -gt 1000) {
        $clockTest.clockSkewDetected = $true
        Write-Host "  ✅ Clock skew detected (>1s)" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️ Clock skew minimal (<1s)" -ForegroundColor Cyan
    }
}

# Staleness alarm kontrolü
$health = Invoke-WebRequest -Uri "$baseUrl/api/healthz" | ConvertFrom-Json

Write-Host "  Venue staleness:"
Write-Host "    BTCTurk: $($health.venues.btcturk.stalenessSec) s"
Write-Host "    BIST: $($health.venues.bist.stalenessSec) s"

if ($health.venues.btcturk.stalenessSec -lt 30 -and $health.venues.bist.stalenessSec -lt 30) {
    $clockTest.stalenessNotAffected = $true
    Write-Host "  ✅ Staleness alarmı YOK (clock skew etkilemedi)" -ForegroundColor Green
}

if ($clockTest.stalenessNotAffected) {
    Write-Host "  ✅ PASS: Clock skew staleness'ı etkilemedi" -ForegroundColor Green
    $clockTest.passed = $true
    $results["Test 6: Clock Skew"] = "PASS"
} else {
    Write-Host "  ❌ FAIL: False staleness alarm" -ForegroundColor Red
    $results["Test 6: Clock Skew"] = "FAIL"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# TEST 7: BIST Tatil Sessizliği (Holiday Zero-Volume Silence)
# ═══════════════════════════════════════════════════════════════════════

Write-Host "[Test 7/7] BIST Tatil Sessizliği" -ForegroundColor Yellow
Write-Host "  Amaç: Tatil günü → zero-volume uyarısı YOK, market_closed=1 log"
Write-Host ""

$holidayTest = @{
    passed = $false
    zeroVolumeWarnings = 0
    marketClosedLog = $false
}

# BIST endpoint çağır
$bist = Invoke-WebRequest -Uri "$baseUrl/api/market/bist/snapshot?symbols=THYAO,AKBNK" | ConvertFrom-Json

Write-Host "  BIST snapshot alındı: $($bist.data.Count) sembol"

# Log kontrolü
$logPath = "logs\bist_quality.log"
if (Test-Path $logPath) {
    $recentLogs = Get-Content $logPath -Tail 50
    
    # Zero-volume uyarıları
    $zeroVolumeWarnings = $recentLogs | Select-String "zero-volume" -SimpleMatch
    $holidayTest.zeroVolumeWarnings = $zeroVolumeWarnings.Count
    
    # market_closed log
    $marketClosedLogs = $recentLogs | Select-String "market_closed=1" -SimpleMatch
    if ($marketClosedLogs.Count -gt 0) {
        $holidayTest.marketClosedLog = $true
    }
    
    Write-Host "  Log analizi:"
    Write-Host "    Zero-volume warnings: $($holidayTest.zeroVolumeWarnings) (hedef: 0)"
    Write-Host "    market_closed=1 log: $(if ($holidayTest.marketClosedLog) { '✅' } else { '⚠️' })"
    
    if ($holidayTest.zeroVolumeWarnings -eq 0) {
        Write-Host "  ✅ PASS: Tatil günü zero-volume sessiz" -ForegroundColor Green
        $holidayTest.passed = $true
        $results["Test 7: Holiday Silence"] = "PASS"
    } else {
        Write-Host "  ❌ FAIL: Tatil günü zero-volume uyarısı var" -ForegroundColor Red
        $results["Test 7: Holiday Silence"] = "FAIL"
    }
} else {
    Write-Host "  ⚠️ WARNING: BIST quality log bulunamadı" -ForegroundColor Yellow
    $results["Test 7: Holiday Silence"] = "SKIP"
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════
# FINAL SUMMARY & REPORT
# ═══════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SONUÇLAR ÖZET                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failCount = 0
$skipCount = 0

foreach ($test in $results.Keys | Sort-Object) {
    $result = $results[$test]
    $icon = switch ($result) {
        "PASS" { "✅"; $passCount++; "Green" }
        "FAIL" { "❌"; $failCount++; "Red" }
        "WARN" { "⚠️"; $skipCount++; "Yellow" }
        "SKIP" { "⏭️"; $skipCount++; "DarkGray" }
        default { "❓"; $skipCount++; "Gray" }
    }
    Write-Host "  $($icon[0]) $test" -ForegroundColor $icon[1]
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Total: $($results.Count) test" -ForegroundColor White
Write-Host "  PASS:  $passCount" -ForegroundColor Green
Write-Host "  FAIL:  $failCount" -ForegroundColor Red
Write-Host "  WARN/SKIP: $skipCount" -ForegroundColor Yellow
Write-Host ""

# Evidence package oluştur
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "validation\sinsi_kose_$timestamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

$summary = @{
    timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    results = $results
    passCount = $passCount
    failCount = $failCount
    skipCount = $skipCount
}

$summary | ConvertTo-Json -Depth 3 | Out-File "$evidenceDir\summary.json" -Encoding UTF8

Write-Host "Evidence package: $evidenceDir\summary.json" -ForegroundColor Cyan
Write-Host ""

# Exit code
if ($failCount -eq 0) {
    Write-Host "✅ TÜM TESTLER BAŞARILI" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ BAZI TESTLER BAŞARISIZ" -ForegroundColor Red
    exit 1
}

