# CSS Smoke Test - "Ciplak HTML" Regresyon Yakalayici
# Bu script /dashboard HTML'inden CSS linkini cekip CSS gercekten CSS mi diye kontrol eder

param(
    [string]$BaseUrl = "http://127.0.0.1:3003",
    [int]$TimeoutSec = 10
)

$ErrorActionPreference = "Stop"

Write-Host "CSS Smoke Test Baslatiyor..." -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host ""

# 1. Dashboard HTML'ini al
Write-Host "1. Dashboard HTML'i aliniyor..." -ForegroundColor Yellow
try {
    $htmlResponse = Invoke-WebRequest -Uri "$BaseUrl/dashboard" -UseBasicParsing -TimeoutSec $TimeoutSec
    if ($htmlResponse.StatusCode -ne 200) {
        Write-Host "FAIL: Dashboard 200 donmedi: $($htmlResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Dashboard HTML alindi (Status: $($htmlResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Dashboard'a erisilemedi: $_" -ForegroundColor Red
    exit 1
}

# 2. CSS linklerini bul
Write-Host ""
Write-Host "2. CSS linkleri araniyor..." -ForegroundColor Yellow
$cssLinks = @()
$hrefMatches = [regex]::Matches($htmlResponse.Content, 'href="([^"]*\.css[^"]*)"')
foreach ($match in $hrefMatches) {
    $cssLinks += $match.Groups[1].Value
}
$hrefMatches2 = [regex]::Matches($htmlResponse.Content, "href='([^']*\.css[^']*)'")
foreach ($match in $hrefMatches2) {
    $cssLinks += $match.Groups[1].Value
}

if ($cssLinks.Count -eq 0) {
    Write-Host "WARN: CSS linki bulunamadi! (Ciplak HTML riski)" -ForegroundColor Red
    exit 1
}

Write-Host "OK: $($cssLinks.Count) CSS linki bulundu" -ForegroundColor Green

# 3. Her CSS dosyasini kontrol et
Write-Host ""
Write-Host "3. CSS dosyalari kontrol ediliyor..." -ForegroundColor Yellow
$allPassed = $true

foreach ($cssLink in $cssLinks) {
    # Relative URL'yi absolute'e cevir
    if ($cssLink.StartsWith("/")) {
        $cssUrl = "$BaseUrl$cssLink"
    } elseif ($cssLink.StartsWith("http")) {
        $cssUrl = $cssLink
    } else {
        $cssUrl = "$BaseUrl/$cssLink"
    }

    Write-Host "  Kontrol ediliyor: $cssLink" -ForegroundColor Gray

    try {
        $cssResponse = Invoke-WebRequest -Uri $cssUrl -UseBasicParsing -TimeoutSec $TimeoutSec

        # Status kontrolu
        if ($cssResponse.StatusCode -ne 200) {
            Write-Host "    FAIL: Status: $($cssResponse.StatusCode) (200 bekleniyordu)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        # Content-Type kontrolu
        $contentType = $cssResponse.Headers["Content-Type"]
        if ($contentType -notlike "text/css*" -and $contentType -notlike "text/css;*") {
            Write-Host "    FAIL: Content-Type: $contentType (text/css bekleniyordu)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        # HTML iceriyor mu kontrolu (middleware redirect'i yakalamak icin)
        $contentStart = $cssResponse.Content.Substring(0, [Math]::Min(50, $cssResponse.Content.Length)).ToLower()
        if ($contentStart -like "*<!doctype*" -or $contentStart -like "*<html*" -or $contentStart -like "*<head*") {
            Write-Host "    FAIL: CSS dosyasi HTML iceriyor! (Middleware redirect riski)" -ForegroundColor Red
            $preview = $cssResponse.Content.Substring(0, [Math]::Min(100, $cssResponse.Content.Length))
            Write-Host "    Ilk 100 karakter: $preview" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        # CSS icerik kontrolu (basit)
        if ($cssResponse.Content.Length -lt 10) {
            Write-Host "    WARN: CSS dosyasi cok kisa ($($cssResponse.Content.Length) byte)" -ForegroundColor Yellow
        }

        Write-Host "    OK: Status: $($cssResponse.StatusCode), Content-Type: $contentType, Size: $($cssResponse.Content.Length) bytes" -ForegroundColor Green

    } catch {
        Write-Host "    FAIL: CSS dosyasina erisilemedi: $_" -ForegroundColor Red
        $allPassed = $false
    }
}

# 4. Sonuc
Write-Host ""
if ($allPassed) {
    Write-Host "OK: TUM CSS DOSYALARI DOGRU YUKLENIYOR" -ForegroundColor Green
    Write-Host "   'Ciplak HTML' riski yok" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAIL: BAZI CSS DOSYALARINDA SORUN VAR" -ForegroundColor Red
    Write-Host "   'Ciplak HTML' riski mevcut!" -ForegroundColor Red
    exit 1
}
