# Port Proxy - 3004 → 3003 (Windows netsh)
# Yönetici yetkisi gerekir

param(
    [switch]$Create,
    [switch]$Delete,
    [switch]$List,
    [switch]$Status
)

$ListenPort = 3004
$RedirectPort = 3003
$ListenAddr = "127.0.0.1"
$ConnectAddr = "127.0.0.1"

if ($Create) {
    Write-Host "→ Port proxy oluşturuluyor: $ListenAddr`:$ListenPort → $ConnectAddr`:$RedirectPort" -ForegroundColor Cyan

    # Mevcut proxy'yi sil (varsa)
    netsh interface portproxy delete v4tov4 listenaddress=$ListenAddr listenport=$ListenPort 2>$null

    # Yeni proxy oluştur
    netsh interface portproxy add v4tov4 listenaddress=$ListenAddr listenport=$ListenPort connectaddress=$ConnectAddr connectport=$RedirectPort

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Port proxy oluşturuldu" -ForegroundColor Green
        Write-Host "  Test: http://$ListenAddr`:$ListenPort/dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Başarısız (Yönetici yetkisi gerekir)" -ForegroundColor Red
        exit 1
    }
}
elseif ($Delete) {
    Write-Host "→ Port proxy siliniyor: $ListenAddr`:$ListenPort" -ForegroundColor Yellow
    netsh interface portproxy delete v4tov4 listenaddress=$ListenAddr listenport=$ListenPort

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Silindi" -ForegroundColor Green
    } else {
        Write-Host "✗ Proxy bulunamadı" -ForegroundColor Red
        exit 1
    }
}
elseif ($List) {
    Write-Host "→ Tüm port proxy'leri listeleniyor..." -ForegroundColor Cyan
    netsh interface portproxy show all
}
elseif ($Status) {
    $conn = Get-NetTCPConnection -LocalPort $ListenPort -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "✓ Port $ListenPort dinlemede" -ForegroundColor Green
    } else {
        Write-Host "✗ Port $ListenPort dinlemiyor" -ForegroundColor Red
    }
}
else {
    Write-Host "Port Proxy Yönetimi - 3004 → 3003" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Kullanım:" -ForegroundColor Yellow
    Write-Host "  .\tools\redirect-3004.ps1 -Create    # Proxy oluştur"
    Write-Host "  .\tools\redirect-3004.ps1 -Delete    # Proxy sil"
    Write-Host "  .\tools\redirect-3004.ps1 -List      # Tüm proxy'leri listele"
    Write-Host "  .\tools\redirect-3004.ps1 -Status    # Durum kontrolü"
    Write-Host ""
    Write-Host "Not: netsh komutları yönetici yetkisi gerektirir" -ForegroundColor Gray
}

