# SPARK TRADING PLATFORM - PENCERESIZ DURDURMA
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Servisler Durduruluyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Job'lari durdur
Write-Host "Background job'lar durduruluyor..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.Name -like "spark-*" } | Stop-Job -PassThru | Remove-Job
Write-Host "Job'lar durduruldu" -ForegroundColor Green

Write-Host ""

# Portlari temizle
Write-Host "Portlar temizleniyor..." -ForegroundColor Yellow

@(3003, 4001) | ForEach-Object {
    $port = $_
    $processes = netstat -ano | findstr ":$port" | ForEach-Object { 
        ($_ -split '\s+')[-1] 
    } | Select-Object -Unique
    
    foreach ($pid in $processes) {
        if ($pid -match '^\d+$') {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  Port $port temizlendi (PID: $pid)" -ForegroundColor Green
            } catch {
                Write-Host "  Port $port temizlenemedi (PID: $pid)" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUM SERVISLER DURDURULDU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tekrar baslatmak icin: .\basla-penceresiz.ps1" -ForegroundColor Green
Write-Host ""

