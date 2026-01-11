# Hydration Bisect Test Script
# Her gate'i sırayla test eder ve sonuçları toplar

Write-Host "=== Hydration Bisect Test ===" -ForegroundColor Cyan
Write-Host ""

$gates = @("topbar", "sidebar", "main", "copilot")
$results = @{}
$badgeVisible = @{}

foreach ($gate in $gates) {
    Write-Host "=== Testing Gate: $gate ===" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Komut:" -ForegroundColor Gray
    Write-Host "  `$env:NEXT_PUBLIC_HYDRATION_BISECT='1'; `$env:NEXT_PUBLIC_HYDRATION_GATES='$gate'; pnpm --filter web-next dev -- --port 3003" -ForegroundColor White
    Write-Host ""
    Write-Host "ADIMLAR:" -ForegroundColor White
    Write-Host "1. Dev server'ı başlat (yukarıdaki komutu çalıştır)" -ForegroundColor White
    Write-Host "2. Tarayıcıda http://127.0.0.1:3003/dashboard aç" -ForegroundColor White
    Write-Host "3. Hard reload yap (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "4. SOL ÜSTTE 'BISECT ON · gates: $gate' badge'i görünüyor mu? (y/n)" -ForegroundColor Yellow
    Write-Host "5. 'Unhandled Runtime Error' overlay görünüyor mu? (y/n)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Badge görünüyor mu? (y/n): " -ForegroundColor Cyan -NoNewline
    $badgeResponse = Read-Host
    $badgeVisible[$gate] = $badgeResponse -eq "y" -or $badgeResponse -eq "Y"

    Write-Host "Overlay görünüyor mu? (y/n): " -ForegroundColor Cyan -NoNewline
    $response = Read-Host
    $results[$gate] = $response -eq "y" -or $response -eq "Y"

    Write-Host ""
    Write-Host "Dev server'ı durdurmak için CTRL+C yapın, sonra Enter'a basın..." -ForegroundColor Gray
    Read-Host
    Write-Host ""
}

Write-Host "=== Bisect Sonuçları ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "KOPYALA-YAPIŞTIR FORMATI:" -ForegroundColor Yellow
Write-Host "---" -ForegroundColor Gray

foreach ($gate in $gates) {
    $overlayStatus = if ($results[$gate]) { "VAR" } else { "YOK" }
    $badgeStatus = if ($badgeVisible[$gate]) { "GÖRÜNDÜ" } else { "GÖRÜNMEDI" }
    Write-Host "$gate : overlay $overlayStatus (badge: $badgeStatus)" -ForegroundColor $(if ($results[$gate]) { "Red" } else { "Green" })
}

Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "DETAYLI SONUÇLAR:" -ForegroundColor Cyan
Write-Host ""

foreach ($gate in $gates) {
    $overlayStatus = if ($results[$gate]) { "❌ OVERLAY VAR" } else { "✅ OVERLAY YOK" }
    $badgeStatus = if ($badgeVisible[$gate]) { "✅ Badge göründü" } else { "⚠️ Badge görünmedi (env/restart sorunu olabilir!)" }
    Write-Host "$gate : $overlayStatus | $badgeStatus" -ForegroundColor $(if ($results[$gate]) { "Red" } else { "Green" })
}

Write-Host ""
Write-Host "=== Yorumlama ===" -ForegroundColor Cyan
Write-Host ""

$errorGates = $results.GetEnumerator() | Where-Object { $_.Value -eq $false } | Select-Object -ExpandProperty Name

if ($errorGates.Count -eq 0) {
    Write-Host "⚠️  TÜM GATE'LERDE OVERLAY VAR" -ForegroundColor Yellow
    Write-Host "→ Mismatch bu blokların dışında (layout.tsx/html/body) veya çoklu blok etkileşimi" -ForegroundColor Gray
    Write-Host "→ Çiftli test yapın: GATES=topbar,main" -ForegroundColor Gray
} elseif ($errorGates.Count -eq 1) {
    Write-Host "✅ SUÇLU BULUNDU: $($errorGates[0])" -ForegroundColor Green
    Write-Host "→ Mismatch $($errorGates[0]) subtree'sinde" -ForegroundColor Gray
    Write-Host "→ O subtree içinde ikinci tur bisect yapılmalı" -ForegroundColor Gray
} else {
    Write-Host "⚠️  BİRDEN FAZLA GATE OVERLAY'I SÖNDÜRDÜ" -ForegroundColor Yellow
    Write-Host "→ Mismatch birden fazla blokta olabilir veya bloklar arası etkileşim var" -ForegroundColor Gray
    Write-Host "→ Suçlu gate'ler: $($errorGates -join ', ')" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Sonuçları not alın ve paylaşın!" -ForegroundColor Cyan

