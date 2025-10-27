# SPARK TRADING PLATFORM - PENCERESIZ BASLATMA
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025
# PowerShell Background Jobs - HICBIR pencere acmaz

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Penceresiz Baslatma v3.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Proje dizinine git
$projectRoot = "C:\dev\CursorGPT_IDE"
Set-Location $projectRoot

# Eski job'lari temizle
Write-Host "Eski job'lar temizleniyor..." -ForegroundColor Yellow
Get-Job | Where-Object { $_.Name -like "spark-*" } | Stop-Job -PassThru | Remove-Job

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
            } catch {}
        }
    }
}

Write-Host "Temizlik tamamlandi" -ForegroundColor Green
Write-Host ""

# Web-Next'i background job olarak baslat
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WEB-NEXT BASLATILIYOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$webJob = Start-Job -Name "spark-web-next" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\apps\web-next"
    $env:NODE_ENV = "development"
    $env:EXECUTOR_BASE_URL = "http://127.0.0.1:4001"
    $env:NEXT_PUBLIC_WS_URL = "ws://127.0.0.1:4001/ws/live"
    $env:NEXT_PUBLIC_ADMIN_ENABLED = "1"
    
    & pnpm dev -- -p 3003
}

Write-Host "Web-Next baslatildi (Job ID: $($webJob.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXECUTOR BASLATILIYOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$executorJob = Start-Job -Name "spark-executor" -ScriptBlock {
    Set-Location "C:\dev\CursorGPT_IDE\services\executor"
    $env:NODE_ENV = "development"
    $env:PORT = "4001"
    $env:LOG_LEVEL = "debug"
    
    & pnpm dev
}

Write-Host "Executor baslatildi (Job ID: $($executorJob.Id))" -ForegroundColor Green

# Servislerin hazir olmasini bekle
Write-Host ""
Write-Host "Servisler hazir oluyor (15 saniye)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Durum kontrolu
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DURUM KONTROLU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Job durumlarini goster
Get-Job | Where-Object { $_.Name -like "spark-*" } | Format-Table -AutoSize

# Port kontrolu
Write-Host ""
Write-Host "PORT KONTROLLERI:" -ForegroundColor Cyan

try {
    $web = Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  Web-Next (3003) : CALISIR DURUMDA ($($web.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Web-Next (3003) : HENUZ HAZIR DEGIL" -ForegroundColor Yellow
}

try {
    $exec = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  Executor (4001) : CALISIR DURUMDA ($($exec.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Executor (4001) : HENUZ HAZIR DEGIL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BASLATMA TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ERISIM ADRESLERI:" -ForegroundColor Green
Write-Host "  Web-Next    : http://localhost:3003" -ForegroundColor Cyan
Write-Host "  Dashboard   : http://localhost:3003/" -ForegroundColor White
Write-Host "  Executor    : http://localhost:4001" -ForegroundColor Cyan
Write-Host "  Health      : http://localhost:4001/health" -ForegroundColor White
Write-Host ""

Write-Host "JOB YONETIMI:" -ForegroundColor Yellow
Write-Host "  Get-Job                         # Job'lari listele" -ForegroundColor White
Write-Host "  Receive-Job -Name spark-web-next # Web-Next loglari" -ForegroundColor White
Write-Host "  Receive-Job -Name spark-executor # Executor loglari" -ForegroundColor White
Write-Host "  .\durdur-penceresiz.ps1         # Tumunu durdur" -ForegroundColor White
Write-Host ""

Write-Host "NOT: Hicbir ek pencere acilmadi! Servisler arka planda calisiyor." -ForegroundColor Green
Write-Host ""

