#!/usr/bin/env pwsh
# ============================================================================
# Spark Web-Next — Tek Komutla Başlatıcı (Log + Health + Auto-Restart)
# ============================================================================
# Kullanım: .\tools\start-web-dev.ps1
# ============================================================================

param(
    [int]$Port = 3003,
    [int]$HealthCheckRetries = 30,
    [int]$HealthCheckDelay = 2000,
    [switch]$NoClean
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Renkli log helpers
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Failure { Write-Host "✗ $args" -ForegroundColor Red }

# Banner
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  🚀 Spark Web-Next Dev Server" -ForegroundColor Magenta
Write-Host "  Port: $Port" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Magenta

# 1️⃣ Süreç temizliği
Write-Info "1/6 Node/PNPM süreçleri kontrol ediliyor..."
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue
$pnpmProcs = Get-Process pnpm -ErrorAction SilentlyContinue

if ($nodeProcs -or $pnpmProcs) {
    Write-Warning "Eski süreçler bulundu, kapatılıyor..."
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    $pnpmProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Success "Süreçler temizlendi"
} else {
    Write-Success "Aktif süreç yok"
}

# 2️⃣ Port kontrolü
Write-Info "2/6 Port $Port kontrol ediliyor..."
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($portInUse) {
    Write-Warning "Port $Port kullanımda, süreç sonlandırılıyor..."
    $pid = (netstat -ano | findstr LISTENING | findstr ":$Port" | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -First 1)
    if ($pid) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Write-Success "Port temizlendi"
    }
} else {
    Write-Success "Port $Port müsait"
}

# 3️⃣ Cache temizliği
if (-not $NoClean) {
    Write-Info "3/6 Cache temizleniyor..."
    Push-Location "$PSScriptRoot\..\apps\web-next"

    if (Test-Path .next) {
        Remove-Item .next -Recurse -Force
        Write-Success ".next/ temizlendi"
    }

    if (Test-Path "node_modules\.cache") {
        Remove-Item "node_modules\.cache" -Recurse -Force
        Write-Success "node_modules/.cache temizlendi"
    }

    Pop-Location
} else {
    Write-Info "3/6 Cache temizliği atlandı (--NoClean)"
}

# 4️⃣ .env.local kontrolü
Write-Info "4/6 .env.local kontrol ediliyor..."
$envPath = "$PSScriptRoot\..\apps\web-next\.env.local"

if (-not (Test-Path $envPath)) {
    Write-Warning ".env.local bulunamadı, oluşturuluyor..."
    @"
NEXT_PUBLIC_API_URL=http://127.0.0.1:4001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
"@ | Out-File -Encoding UTF8 $envPath
    Write-Success ".env.local oluşturuldu"
} else {
    Write-Success ".env.local mevcut"
}

# 5️⃣ Dev server başlatma
Write-Info "5/6 Dev server başlatılıyor..."
Write-Host ""

Push-Location "$PSScriptRoot\..\apps\web-next"

$env:PORT = $Port.ToString()
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# pnpm dev'i arka planda başlat
$job = Start-Job -ScriptBlock {
    param($port, $dir)
    Set-Location $dir
    $env:PORT = $port
    $env:NODE_OPTIONS = "--max-old-space-size=4096"
    pnpm dev 2>&1
} -ArgumentList $Port, (Get-Location).Path

Write-Success "Dev server başlatıldı (Job ID: $($job.Id))"
Write-Host ""

# 6️⃣ Health check döngüsü
Write-Info "6/6 Health check yapılıyor..."
$attempt = 0
$healthy = $false

while ($attempt -lt $HealthCheckRetries) {
    $attempt++
    Write-Host "  [$attempt/$HealthCheckRetries] Bağlantı deneniyor..." -NoNewline

    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            Write-Host " ✓" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host " ✗" -ForegroundColor DarkGray
    }

    Start-Sleep -Milliseconds $HealthCheckDelay
}

Pop-Location

# Sonuç
Write-Host ""
if ($healthy) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "  ✅ SERVER HAZIR" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Success "Web: http://127.0.0.1:$Port"
    Write-Success "Dashboard: http://127.0.0.1:$Port/dashboard"
    Write-Success "Market: http://127.0.0.1:$Port/market"
    Write-Host ""

    # Metrics smoke test
    Write-Info "📊 Metrics kontrol ediliyor..."
    try {
        $metrics = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/public/metrics" -TimeoutSec 5
        Write-Success "JSON metrics: OK"

        $promMetrics = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/public/metrics.prom" -UseBasicParsing -TimeoutSec 5
        $contentType = $promMetrics.Headers["Content-Type"]
        Write-Success "Prometheus metrics: $contentType"
    } catch {
        Write-Warning "Metrics ulaşılamadı (backend kapalı olabilir)"
    }

    Write-Host ""
    Write-Info "Logları görmek için: Receive-Job -Id $($job.Id) -Keep"
    Write-Info "Durdurmak için: Stop-Job -Id $($job.Id); Remove-Job -Id $($job.Id)"
    Write-Host ""

    # Job çıktısını stream et
    Write-Host "━━━━━━━━━━━━ DEV SERVER LOGS ━━━━━━━━━━━━" -ForegroundColor DarkGray
    Receive-Job -Id $job.Id -Keep -Wait

} else {
    Write-Failure "Server $HealthCheckRetries deneme sonrası ayağa kalkmadı"
    Write-Warning "Job logları:"
    Receive-Job -Id $job.Id
    Stop-Job -Id $job.Id
    Remove-Job -Id $job.Id
    exit 1
}

