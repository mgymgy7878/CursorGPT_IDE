# Comprehensive Smoke Test Suite
# Runs after all PR merges to validate integration

Write-Host "🧪 Comprehensive Smoke Test Suite" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$results = @()
$passed = 0
$failed = 0

# 1. Health Checks
Write-Host "1️⃣  Health Checks..." -ForegroundColor Yellow

$healthTests = @{
  "Web root" = "http://127.0.0.1:3003/"
  "Dashboard" = "http://127.0.0.1:3003/dashboard"
  "Strategy Lab" = "http://127.0.0.1:3003/strategy-lab"
  "Strategies" = "http://127.0.0.1:3003/strategies"
  "Running" = "http://127.0.0.1:3003/running"
  "Settings" = "http://127.0.0.1:3003/settings"
  "Backtest redirect" = "http://127.0.0.1:3003/backtest"
  "Executor health" = "http://127.0.0.1:4001/healthz"
}

foreach ($name in $healthTests.Keys) {
  try {
    $status = (Invoke-WebRequest -UseBasicParsing $healthTests[$name] -TimeoutSec 5).StatusCode
    if ($status -eq 200) {
      Write-Host "  ✅ $name : $status" -ForegroundColor Green
      $results += "PASS: $name ($status)"
      $passed++
    } else {
      Write-Host "  ⚠️  $name : $status" -ForegroundColor Yellow
      $results += "WARN: $name ($status)"
    }
  } catch {
    Write-Host "  ❌ $name : FAIL" -ForegroundColor Red
    $results += "FAIL: $name"
    $failed++
  }
}

Write-Host ""

# 2. i18n Check
Write-Host "2️⃣  i18n Check..." -ForegroundColor Yellow

try {
  $html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content

  $trWords = @('Anasayfa', 'Strateji Lab', 'Stratejilerim', 'Çalışan Stratejiler', 'Ayarlar', 'Koruma Doğrulama')
  $foundCount = 0

  foreach ($word in $trWords) {
    if ($html -match $word) {
      $foundCount++
      Write-Host "  ✅ Found: $word" -ForegroundColor Green
    } else {
      Write-Host "  ❌ Missing: $word" -ForegroundColor Red
    }
  }

  Write-Host "  📊 TR words: $foundCount / $($trWords.Count)" -ForegroundColor Cyan

  if ($foundCount -eq $trWords.Count) {
    $results += "PASS: i18n TR words ($foundCount/$($trWords.Count))"
    $passed++
  } else {
    $results += "FAIL: i18n incomplete ($foundCount/$($trWords.Count))"
    $failed++
  }
} catch {
  Write-Host "  ❌ i18n check failed" -ForegroundColor Red
  $results += "FAIL: i18n check error"
  $failed++
}

Write-Host ""

# 3. Redirect Test
Write-Host "3️⃣  Redirect Test..." -ForegroundColor Yellow

try {
  $response = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/backtest -TimeoutSec 5

  if ($response.StatusCode -eq 200 -and $response.Content -match 'strategy-lab') {
    Write-Host "  ✅ /backtest → /strategy-lab (client-side redirect)" -ForegroundColor Green
    $results += "PASS: Redirect works"
    $passed++
  } else {
    Write-Host "  ⚠️  /backtest status: $($response.StatusCode)" -ForegroundColor Yellow
    $results += "WARN: Redirect status $($response.StatusCode)"
  }
} catch {
  Write-Host "  ❌ Redirect test failed" -ForegroundColor Red
  $results += "FAIL: Redirect error"
  $failed++
}

Write-Host ""

# 4. Component Presence
Write-Host "4️⃣  Component Presence..." -ForegroundColor Yellow

try {
  $html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content

  $components = @{
    "Copilot button" = "Copilot"
    "Navigation" = "Anasayfa"
    "StatusBar" = "Koruma Doğrulama"
  }

  foreach ($comp in $components.Keys) {
    if ($html -match $components[$comp]) {
      Write-Host "  ✅ $comp : Found" -ForegroundColor Green
      $passed++
    } else {
      Write-Host "  ❌ $comp : Missing" -ForegroundColor Red
      $failed++
    }
  }
} catch {
  Write-Host "  ❌ Component check failed" -ForegroundColor Red
  $failed += 3
}

Write-Host ""

# Summary
Write-Host "📊 SMOKE TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

# Save results
$results | Out-File evidence/smoke_results.txt

if ($failed -eq 0) {
  Write-Host "✅ ALL TESTS PASSED - Ready for production" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌ SOME TESTS FAILED - Review required" -ForegroundColor Red
  exit 1
}

