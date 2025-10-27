# Otomatik İşlem Devam Sistemi
# Kullanım: .\auto-continue.ps1

Write-Host "🔄 Otomatik işlem devam sistemi başlıyor..." -ForegroundColor Yellow

# 1. Durum Kontrolü
Write-Host "`n🔍 Mevcut durum kontrol ediliyor..." -ForegroundColor Cyan
& ".\auto-status-check.ps1"

# 2. Takılan İşlem Tespiti
Write-Host "`n🔍 Takılan işlemler tespit ediliyor..." -ForegroundColor Cyan

$stuckProcesses = @()

# PM2 kontrolü
try {
    $pm2Status = pm2 status 2>$null
    if ($pm2Status -match "stopped|errored") {
        $stuckProcesses += "PM2"
    }
} catch {
    $stuckProcesses += "PM2"
}

# Build kontrolü
if (-not (Test-Path "apps\web-next\.next")) {
    $stuckProcesses += "Build"
}

# Endpoint kontrolü
$endpointErrors = 0
try {
    Invoke-RestMethod http://127.0.0.1:3003/ops -TimeoutSec 3 | Out-Null
} catch {
    $endpointErrors++
}

if ($endpointErrors -gt 0) {
    $stuckProcesses += "Endpoints"
}

# 3. Otomatik Düzeltme
if ($stuckProcesses.Count -gt 0) {
    Write-Host "`n🔧 Takılan işlemler tespit edildi: $($stuckProcesses -join ', ')" -ForegroundColor Yellow
    
    foreach ($process in $stuckProcesses) {
        switch ($process) {
            "PM2" {
                Write-Host "🔄 PM2 yeniden başlatılıyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 3 -Message "PM2 restart"
                pm2 restart all
            }
            "Build" {
                Write-Host "🏗️ Build yeniden yapılıyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 5 -Message "Build process"
                cd apps\web-next
                $env:NEXT_TELEMETRY_DISABLED="1"
                $env:EXECUTOR_ORIGIN="http://127.0.0.1:4001"
                pnpm build
                cd ..\..
            }
            "Endpoints" {
                Write-Host "🌐 Endpoint'ler test ediliyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 3 -Message "Endpoint test"
                & ".\auto-status-check.ps1"
            }
        }
    }
} else {
    Write-Host "`n✅ Tüm işlemler normal çalışıyor!" -ForegroundColor Green
}

# 4. Son Durum Raporu
Write-Host "`n📊 Son durum raporu:" -ForegroundColor Cyan
& ".\auto-status-check.ps1"

Write-Host "`n✅ Otomatik işlem devam sistemi tamamlandı!" -ForegroundColor Green
