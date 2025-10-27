# SPARK TRADING PLATFORM - BASLATMA V2
# PM2 daemon penceresini gizler

param([switch]$HidePM2Window = $true)

$ErrorActionPreference = "Continue"

# Ana proje dizini
$projectRoot = "C:\dev\CursorGPT_IDE"
Set-Location $projectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Baslatma V2 (Gorunmez Mod)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PM2'yi gorunmez modda baslat
if ($HidePM2Window) {
    # PM2 daemon'u arka planda baslat
    $env:PM2_HOME = "$env:USERPROFILE\.pm2"
    
    # Onceki servisleri durdur
    Write-Host "Mevcut servisler temizleniyor..." -ForegroundColor Yellow
    Start-Process -WindowStyle Hidden -FilePath "pm2" -ArgumentList "delete", "all" -Wait -NoNewWindow 2>$null
    
    # Yeni servisi baslat (gorunmez)
    Write-Host "Web-Next baslatiliyor (PM2 - Gorunmez)..." -ForegroundColor Cyan
    $pm2Process = Start-Process -WindowStyle Hidden -FilePath "pm2" -ArgumentList "start", "ecosystem.config.cjs" -PassThru -NoNewWindow
    
    Start-Sleep -Seconds 3
    
    Write-Host "Web-Next baslatildi" -ForegroundColor Green
} else {
    # Normal baslatma
    pm2 delete all 2>$null
    pm2 start ecosystem.config.cjs
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DURUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Durum goster
Start-Process -WindowStyle Hidden -FilePath "pm2" -ArgumentList "status" -Wait

Write-Host ""
Write-Host "SERVISLER:" -ForegroundColor Green
Write-Host "  Web-Next : http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "KOMUTLAR:" -ForegroundColor Yellow
Write-Host "  pm2 status  - Durum goster" -ForegroundColor White
Write-Host "  pm2 logs    - Loglari izle" -ForegroundColor White
Write-Host "  .\durdur.ps1 - Durdur" -ForegroundColor White
Write-Host ""

Write-Host "NOT: Executor icin ayri terminalde 'pnpm dev' calistirin" -ForegroundColor Yellow
Write-Host ""

