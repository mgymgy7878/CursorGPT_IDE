# SPARK TRADING PLATFORM - DURDURMA BETIGI
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Servisler Durduruluyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PM2 ile durdur (varsa)
Write-Host "PM2 servisleri durduruluyor..." -ForegroundColor Yellow
try {
    & pm2 stop all 2>$null | Out-Null
    & pm2 delete all 2>$null | Out-Null
    & pm2 kill 2>$null | Out-Null
    Write-Host "PM2 servisleri durduruldu" -ForegroundColor Green
} catch {
    Write-Host "PM2 servisleri yok (Normal)" -ForegroundColor Gray
}

Write-Host ""

# PowerShell Job'lari durdur
Write-Host "Background job'lar durduruluyor..." -ForegroundColor Yellow
$jobs = Get-Job | Where-Object { $_.Name -like "*spark*" }
if ($jobs) {
    $jobs | Stop-Job
    $jobs | Remove-Job -Force
    Write-Host "Background job'lar durduruldu ($($jobs.Count) adet)" -ForegroundColor Green
} else {
    Write-Host "Background job yok (Normal)" -ForegroundColor Gray
}

Write-Host ""

# Port temizligi
Write-Host "Portlar temizleniyor..." -ForegroundColor Yellow

@(3003, 4001, 4002, 4010) | ForEach-Object {
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
                Write-Host "  Port $port zaten bos" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TUM SERVISLER DURDURULDU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tekrar baslatmak icin: .\basla.ps1" -ForegroundColor Green
Write-Host ""
