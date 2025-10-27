# Otomatik Islem Devam Sistemi
# Kullanim: .\auto-continue-fixed.ps1

Write-Host "Otomatik islem devam sistemi basliyor..." -ForegroundColor Yellow

# 1. Durum Kontrolu
Write-Host "`nMevcut durum kontrol ediliyor..." -ForegroundColor Cyan
& ".\auto-status-check.ps1"

# 2. Takilan Islem Tespiti
Write-Host "`nTakilan islemler tespit ediliyor..." -ForegroundColor Cyan

$stuckProcesses = @()

# PM2 kontrolu
try {
    $pm2Status = pm2 status 2>$null
    if ($pm2Status -match "stopped|errored") {
        $stuckProcesses += "PM2"
    }
} catch {
    $stuckProcesses += "PM2"
}

# Build kontrolu
if (-not (Test-Path "..\apps\web-next\.next")) {
    $stuckProcesses += "Build"
}

# Endpoint kontrolu
$endpointErrors = 0
try {
    Invoke-RestMethod http://127.0.0.1:3003/ops -TimeoutSec 3 | Out-Null
} catch {
    $endpointErrors++
}

if ($endpointErrors -gt 0) {
    $stuckProcesses += "Endpoints"
}

# 3. Otomatik Duzeltme
if ($stuckProcesses.Count -gt 0) {
    Write-Host "`nTakilan islemler tespit edildi: $($stuckProcesses -join ', ')" -ForegroundColor Yellow
    
    foreach ($process in $stuckProcesses) {
        switch ($process) {
            "PM2" {
                Write-Host "PM2 yeniden baslatiliyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 3 -Message "PM2 restart"
                pm2 restart all
            }
            "Build" {
                Write-Host "Build yeniden yapiliyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 5 -Message "Build process"
                cd ..\apps\web-next
                $env:NEXT_TELEMETRY_DISABLED="1"
                $env:EXECUTOR_ORIGIN="http://127.0.0.1:4001"
                pnpm build
                cd ..\..\scripts
            }
            "Endpoints" {
                Write-Host "Endpoint'ler test ediliyor..." -ForegroundColor Cyan
                & ".\auto-countdown.ps1" -Seconds 3 -Message "Endpoint test"
                & ".\auto-status-check.ps1"
            }
        }
    }
} else {
    Write-Host "`nTum islemler normal calisiyor!" -ForegroundColor Green
}

# 4. Son Durum Raporu
Write-Host "`nSon durum raporu:" -ForegroundColor Cyan
& ".\auto-status-check.ps1"

Write-Host "`nOtomatik islem devam sistemi tamamlandi!" -ForegroundColor Green
