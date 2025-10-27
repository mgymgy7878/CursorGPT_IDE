# SPARK TRADING PLATFORM - BASLATMA BETIGI
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025
# PowerShell Job tabanli - HICBIR PENCERE ACMAZ

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Baslatma Betigi v3.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Proje dizinine git
$projectRoot = "C:\dev\CursorGPT_IDE"
Set-Location $projectRoot

Write-Host ""

# Mevcut servisleri durdur
Write-Host "Mevcut servisler temizleniyor..." -ForegroundColor Yellow

# PM2 varsa durdur
try {
    & pm2 delete all 2>$null | Out-Null
    & pm2 kill 2>$null | Out-Null
} catch {}

# Background job'lari durdur
Get-Job | Where-Object { $_.Name -like "*spark*" } | Stop-Job
Get-Job | Where-Object { $_.Name -like "*spark*" } | Remove-Job

# Portlari temizle
@(3003, 4001) | ForEach-Object {
    $port = $_
    $processes = netstat -ano | findstr ":$port" | ForEach-Object { 
        ($_ -split '\s+')[-1] 
    } | Select-Object -Unique
    
    foreach ($pid in $processes) {
        if ($pid -match '^\d+$') {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }
}

Write-Host "Temizlik tamamlandi" -ForegroundColor Green
Write-Host ""

# Web-Next'i Background Job ile baslat
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  1/2: WEB-NEXT (Background Job)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$webNextJob = Start-Job -Name "spark-web-next" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\apps\web-next"
    $env:NODE_ENV = "development"
    $env:EXECUTOR_BASE_URL = "http://127.0.0.1:4001"
    $env:NEXT_PUBLIC_WS_URL = "ws://127.0.0.1:4001/ws/live"
    $env:NEXT_PUBLIC_ADMIN_ENABLED = "1"
    & pnpm dev -- -p 3003
}

Write-Host "Web-Next baslatildi (Job ID: $($webNextJob.Id))" -ForegroundColor Green
Write-Host ""

# Executor'u Background Job ile baslat
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  2/2: EXECUTOR (Background Job)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$executorJob = Start-Job -Name "spark-executor" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\services\executor"
    $env:NODE_ENV = "development"
    $env:PORT = "4001"
    $env:HOST = "0.0.0.0"
    & pnpm dev
}

Write-Host "Executor baslatildi (Job ID: $($executorJob.Id))" -ForegroundColor Green
Write-Host ""

# 8 saniye bekle
Write-Host "Bekleniyor: Servisler hazir oluyor (8 saniye)..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Job durumunu goster
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKGROUND JOB DURUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Get-Job | Where-Object { $_.Name -like "*spark*" } | Format-Table -Property Id, Name, State -AutoSize

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BASLATMA TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "CALISAN SERVISLER:" -ForegroundColor Green
Write-Host "   Web-Next (Job)  : http://localhost:3003" -ForegroundColor Cyan
Write-Host "   Job ID          : $($webNextJob.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "   Executor (Job)  : http://localhost:4001" -ForegroundColor Cyan
Write-Host "   Job ID          : $($executorJob.Id)" -ForegroundColor Gray
Write-Host ""

Write-Host "JOB KOMUTLARI:" -ForegroundColor Cyan
Write-Host "   Get-Job                          # Job durumunu goster" -ForegroundColor White
Write-Host "   Receive-Job -Id $($webNextJob.Id) -Keep     # Web-Next loglarini goster" -ForegroundColor White
Write-Host "   Receive-Job -Id $($executorJob.Id) -Keep    # Executor loglarini goster" -ForegroundColor White
Write-Host "   .\durdur.ps1                     # Tumunu durdur" -ForegroundColor White
Write-Host ""

Write-Host "ERISIM ADRESLERI:" -ForegroundColor Cyan
Write-Host "   Dashboard       : http://localhost:3003" -ForegroundColor White
Write-Host "   Portfolio       : http://localhost:3003/portfolio" -ForegroundColor White
Write-Host "   Executor Health : http://localhost:4001/health" -ForegroundColor White
Write-Host "   Portfolio API   : http://localhost:4001/api/portfolio" -ForegroundColor White
Write-Host ""

# Test et
Write-Host "Servisler test ediliyor..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($webResponse -and $webResponse.StatusCode -eq 200) {
        Write-Host "✓ Web-Next: Erislebilir (Status: 200)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Web-Next: Henuz hazir degil" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Web-Next: Henuz hazir degil" -ForegroundColor Yellow
}

try {
    $execResponse = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($execResponse -and $execResponse.StatusCode -eq 200) {
        Write-Host "✓ Executor: Erislebilir (Status: 200)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Executor: Henuz hazir degil" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Executor: Henuz hazir degil, biraz daha bekleyin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "NOT: Servisler tamamen hazir olmasi 15-30 saniye surebilir" -ForegroundColor Gray
Write-Host ""
