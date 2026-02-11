# Spark Trading Platform - Windows Otomatik Başlatma Kurulum Scripti
# Bu script Windows Task Scheduler'a otomatik başlatma görevi ekler

param(
    [int]$Port = 3003,
    [string]$TaskName = "SparkTrading-WebNext-AutoStart",
    [switch]$Remove = $false
)

$ErrorActionPreference = "Stop"

# Yönetici yetkisi kontrolü
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Bu script yönetici yetkisi gerektirir!" -ForegroundColor Red
    Write-Host "PowerShell'i 'Yönetici olarak çalıştır' ile açın." -ForegroundColor Yellow
    exit 1
}

# Proje kök dizinini bul
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptPath ".."
$projectRoot = Resolve-Path $projectRoot

$startScript = Join-Path $projectRoot "scripts\start-web-next-auto.ps1"
if (-not (Test-Path $startScript)) {
    Write-Host "Başlatma scripti bulunamadı: $startScript" -ForegroundColor Red
    exit 1
}

Write-Host "=== Spark Trading Platform - Windows Otomatik Başlatma Kurulumu ===" -ForegroundColor Cyan
Write-Host "Proje Dizini: $projectRoot" -ForegroundColor Gray
Write-Host "Başlatma Scripti: $startScript" -ForegroundColor Gray
Write-Host "Port: $Port" -ForegroundColor Gray
Write-Host ""

if ($Remove) {
    Write-Host "Görev kaldırılıyor: $TaskName" -ForegroundColor Yellow
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "✅ Görev başarıyla kaldırıldı!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Görev bulunamadı veya zaten kaldırılmış: $_" -ForegroundColor Yellow
    }
    exit 0
}

# Mevcut görevi kontrol et
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Görev zaten mevcut: $TaskName" -ForegroundColor Yellow
    $response = Read-Host "Güncellemek ister misiniz? (E/H)"
    if ($response -ne "E" -and $response -ne "e") {
        Write-Host "İptal edildi." -ForegroundColor Gray
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Mevcut görev kaldırıldı." -ForegroundColor Yellow
}

# Task Action oluştur
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -Port $Port -WaitForPort" `
    -WorkingDirectory $projectRoot

# Task Trigger: Kullanıcı giriş yaptığında
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Task Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Task Principal: En yüksek yetki ile çalıştır
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

# Task oluştur
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Spark Trading Platform - Web-Next Development Server Otomatik Başlatma" `
        -Force | Out-Null

    Write-Host "✅ Görev başarıyla oluşturuldu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Görev Detayları:" -ForegroundColor Cyan
    Write-Host "  - Görev Adı: $TaskName" -ForegroundColor Gray
    Write-Host "  - Tetikleyici: Kullanıcı giriş yaptığında" -ForegroundColor Gray
    Write-Host "  - Port: $Port" -ForegroundColor Gray
    Write-Host "  - URL: http://127.0.0.1:$Port" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Görevi kontrol etmek için:" -ForegroundColor Yellow
    Write-Host "  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Görevi kaldırmak için:" -ForegroundColor Yellow
    Write-Host "  .\install-windows-autostart.ps1 -Remove" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Görevi manuel çalıştırmak için:" -ForegroundColor Yellow
    Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  NOT: Bir sonraki Windows girişinde server otomatik başlayacak." -ForegroundColor Cyan
    Write-Host "    Şimdi test etmek için: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Hata: $_" -ForegroundColor Red
    exit 1
}

