# SPARK TRADING PLATFORM - TAMAMEN GIZLI BASLATMA
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025
# PM2 daemon mode - hicbir pencere acmaz

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Tamamen Gizli Baslatma v1.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Proje dizinine git
$projectRoot = "C:\dev\CursorGPT_IDE"
Set-Location $projectRoot

# PM2 kurulu mu kontrol et
Write-Host "PM2 kontrol ediliyor..." -ForegroundColor Yellow
$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue

if (-not $pm2Installed) {
    Write-Host "PM2 bulunamadi. Kuruluyor..." -ForegroundColor Yellow
    npm install -g pm2
    Write-Host "PM2 kuruldu" -ForegroundColor Green
} else {
    Write-Host "PM2 zaten kurulu" -ForegroundColor Green
}

Write-Host ""

# PM2 daemon'u durdur ve yeniden baslat (background mode)
Write-Host "PM2 daemon temizleniyor..." -ForegroundColor Yellow
pm2 kill | Out-Null

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

# PM2'yi sessiz modda baslat
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WEB-NEXT BASLATILIYOR (Gizli Mode)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# PM2'yi redirect ile calistir (konsol ciktisini bastir)
$env:PM2_HOME = "$env:USERPROFILE\.pm2"
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "pm2"
$startInfo.Arguments = "start ecosystem.config.cjs"
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.WorkingDirectory = $projectRoot

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $startInfo
$process.Start() | Out-Null
$process.WaitForExit()

if ($process.ExitCode -eq 0) {
    Write-Host "Web-Next baslatildi (Gizli Mode)" -ForegroundColor Green
} else {
    Write-Host "Web-Next baslatilamadi" -ForegroundColor Red
    Write-Host "Hata kodu: $($process.ExitCode)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5 saniye bekle
Write-Host "Bekleniyor: Web-Next hazir oluyor (5 saniye)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Durum goster (sessizce)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PM2 DURUM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$statusInfo = New-Object System.Diagnostics.ProcessStartInfo
$statusInfo.FileName = "pm2"
$statusInfo.Arguments = "status"
$statusInfo.UseShellExecute = $false
$statusInfo.CreateNoWindow = $true
$statusInfo.RedirectStandardOutput = $true

$statusProc = New-Object System.Diagnostics.Process
$statusProc.StartInfo = $statusInfo
$statusProc.Start() | Out-Null
$output = $statusProc.StandardOutput.ReadToEnd()
$statusProc.WaitForExit()

Write-Host $output

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BASLATMA TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "CALISAN SERVISLER:" -ForegroundColor Green
Write-Host "   Web-Next (PM2)  : http://localhost:3003" -ForegroundColor Cyan
Write-Host ""

Write-Host "MANUEL BASLATILMASI GEREKEN:" -ForegroundColor Yellow
Write-Host "   Executor        : Ayri terminalde 'pnpm dev' calistirin" -ForegroundColor White
Write-Host "   Veya            : .\executor-basla.ps1" -ForegroundColor White
Write-Host ""

Write-Host "PM2 KOMUTLARI:" -ForegroundColor Cyan
Write-Host "   pm2 status              # Durum goster" -ForegroundColor White
Write-Host "   pm2 logs                # Loglari izle" -ForegroundColor White
Write-Host "   pm2 restart all         # Yeniden baslat" -ForegroundColor White
Write-Host "   .\durdur.ps1            # Tumunu durdur" -ForegroundColor White
Write-Host ""

Write-Host "NOT: Hicbir ek pencere acilmadi!" -ForegroundColor Green
Write-Host ""

