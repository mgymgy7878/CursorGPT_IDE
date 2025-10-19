# Smoke Test - Real Data Integration
# BTCTurk + BIST API validation

$ErrorActionPreference = 'Continue'

Write-Host "🧪 SMOKE TEST - REAL DATA INTEGRATION" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3003"
$tests = @()

# Test 1: BTCTurk Ticker
Write-Host "Test 1: BTCTurk Ticker" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/market/btcturk/ticker?symbol=BTC_TRY" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -and $data.data.symbol -match "SPARK:BTCTURK:") {
        Write-Host "  ✅ BTCTurk ticker OK" -ForegroundColor Green
        Write-Host "    Symbol: $($data.data.symbol)" -ForegroundColor Gray
        Write-Host "    Price: $($data.data.price)" -ForegroundColor Gray
        $tests += [PSCustomObject]@{Test="BTCTurk Ticker";Result="PASS"}
    } else {
        Write-Host "  ❌ Invalid response structure" -ForegroundColor Red
        $tests += [PSCustomObject]@{Test="BTCTurk Ticker";Result="FAIL"}
    }
} catch {
    Write-Host "  ❌ BTCTurk API error: $($_.Exception.Message)" -ForegroundColor Red
    $tests += [PSCustomObject]@{Test="BTCTurk Ticker";Result="FAIL"}
}

Write-Host ""

# Test 2: BIST Snapshot
Write-Host "Test 2: BIST Snapshot" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/market/bist/snapshot?symbols=THYAO,AKBNK" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success -and $data.data.Count -ge 1) {
        Write-Host "  ✅ BIST snapshot OK" -ForegroundColor Green
        Write-Host "    Count: $($data.count)" -ForegroundColor Gray
        Write-Host "    Symbols: $($data.data[0].symbol)" -ForegroundColor Gray
        $tests += [PSCustomObject]@{Test="BIST Snapshot";Result="PASS"}
    } else {
        Write-Host "  ❌ Invalid response structure" -ForegroundColor Red
        $tests += [PSCustomObject]@{Test="BIST Snapshot";Result="FAIL"}
    }
} catch {
    Write-Host "  ❌ BIST API error: $($_.Exception.Message)" -ForegroundColor Red
    $tests += [PSCustomObject]@{Test="BIST Snapshot";Result="FAIL"}
}

Write-Host ""

# Test 3: Health with Venues
Write-Host "Test 3: Health with Venues" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -UseBasicParsing
    $health = $response.Content | ConvertFrom-Json
    
    if ($health.venues) {
        Write-Host "  ✅ Venue tracking active" -ForegroundColor Green
        Write-Host "    BTCTurk: $($health.venues.btcturk.status) (Staleness: $($health.venues.btcturk.stalenessSec)s)" -ForegroundColor Gray
        Write-Host "    BIST: $($health.venues.bist.status) (Staleness: $($health.venues.bist.stalenessSec)s)" -ForegroundColor Gray
        $tests += [PSCustomObject]@{Test="Health Venues";Result="PASS"}
    } else {
        Write-Host "  ❌ Venue tracking missing" -ForegroundColor Red
        $tests += [PSCustomObject]@{Test="Health Venues";Result="FAIL"}
    }
} catch {
    Write-Host "  ❌ Health check error: $($_.Exception.Message)" -ForegroundColor Red
    $tests += [PSCustomObject]@{Test="Health Venues";Result="FAIL"}
}

Write-Host ""

# Test 4: SLO Thresholds
Write-Host "Test 4: SLO Thresholds" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/healthz" -UseBasicParsing
    $health = $response.Content | ConvertFrom-Json
    
    $slo = $health.slo
    $thresholds = $health.thresholds
    
    $sloPass = (
        $slo.latencyP95 -eq $null -or $slo.latencyP95 -lt $thresholds.latencyP95Target
    ) -and (
        $slo.errorRate -lt $thresholds.errorRateTarget
    ) -and (
        $slo.stalenessSec -lt $thresholds.stalenessTarget
    )
    
    if ($sloPass) {
        Write-Host "  ✅ SLO thresholds met" -ForegroundColor Green
        Write-Host "    P95: $($slo.latencyP95)ms (<$($thresholds.latencyP95Target)ms)" -ForegroundColor Gray
        Write-Host "    Error: $($slo.errorRate)% (<$($thresholds.errorRateTarget)%)" -ForegroundColor Gray
        $tests += [PSCustomObject]@{Test="SLO Thresholds";Result="PASS"}
    } else {
        Write-Host "  ⚠️ SLO threshold breach" -ForegroundColor Yellow
        $tests += [PSCustomObject]@{Test="SLO Thresholds";Result="WARN"}
    }
} catch {
    Write-Host "  ❌ SLO check error" -ForegroundColor Red
    $tests += [PSCustomObject]@{Test="SLO Thresholds";Result="FAIL"}
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host ""
$tests | Format-Table -AutoSize

$passCount = ($tests | Where-Object {$_.Result -eq "PASS"}).Count
$totalCount = $tests.Count

Write-Host "Result: $passCount/$totalCount PASS" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passCount -eq $totalCount) {
    Write-Host "✅ ALL REAL DATA TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ SOME TESTS FAILED" -ForegroundColor Yellow
    exit 1
}

