# CSS Smoke Test - Production Simulasyon
# Build + Start (ayri port) -> Smoke Test

param(
    [int]$Port = 3004,
    [int]$TimeoutSec = 30
)

$ErrorActionPreference = "Stop"

Write-Host "Production Simulasyon CSS Smoke Test Baslatiyor..." -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Gray
Write-Host ""

# 1. Build
Write-Host "1. Production build yapiliyor..." -ForegroundColor Yellow
Set-Location C:\dev\CursorGPT_IDE
try {
    $buildOutput = pnpm --filter web-next build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAIL: Build basarisiz" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
    Write-Host "OK: Build basarili" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Build hatasi: $_" -ForegroundColor Red
    exit 1
}

# 2. Port kontrolu
Write-Host ""
Write-Host "2. Port kontrol ediliyor..." -ForegroundColor Yellow
$existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "WARN: Port $Port zaten kullaniliyor, durduruluyor..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.Id -eq $existing.OwningProcess} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 3. Production server baslat
Write-Host ""
Write-Host "3. Production server baslatiliyor (port $Port)..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$serverJob = Start-Job -ScriptBlock {
    param($port)
    Set-Location C:\dev\CursorGPT_IDE\apps\web-next
    $env:PORT = $port
    node .next/standalone/server.js
} -ArgumentList $Port

# Server'in baslamasini bekle
Write-Host "   Server baslamasi bekleniyor..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Port kontrolu
$maxRetries = 10
$retryCount = 0
$serverReady = $false
while ($retryCount -lt $maxRetries) {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn -and $conn.State -eq "Listen") {
        $serverReady = $true
        break
    }
    Start-Sleep -Seconds 2
    $retryCount++
}

if (-not $serverReady) {
    Write-Host "FAIL: Server baslamadi (port $Port)" -ForegroundColor Red
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "OK: Server basladi (port $Port)" -ForegroundColor Green

# 4. Smoke test calistir
Write-Host ""
Write-Host "4. CSS smoke test calistiriliyor..." -ForegroundColor Yellow
try {
    $baseUrl = "http://127.0.0.1:$Port"
    if (Test-Path "tools\css-smoke-test.mjs") {
        # Node.js versiyonu (tercih edilen)
        $env:SMOKE_BASE_URL = $baseUrl
        node tools/css-smoke-test.mjs
        $testResult = $LASTEXITCODE
    } else {
        # PowerShell versiyonu (fallback)
        powershell -NoProfile -ExecutionPolicy Bypass -File ./tools/css-smoke-test.ps1 -BaseUrl $baseUrl -TimeoutSec $TimeoutSec
        $testResult = $LASTEXITCODE
    }
} catch {
    Write-Host "FAIL: Smoke test hatasi: $_" -ForegroundColor Red
    $testResult = 1
}

# 5. Server'i durdur
Write-Host ""
Write-Host "5. Production server durduruluyor..." -ForegroundColor Yellow
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -eq "node" -and (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess -eq $_.Id} | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "OK: Server durduruldu" -ForegroundColor Green

# 6. Sonuc
Write-Host ""
if ($testResult -eq 0) {
    Write-Host "OK: PRODUCTION SIMULASYON BASARILI" -ForegroundColor Green
    Write-Host "   CSS dosyalari production build'de de dogru yukleniyor" -ForegroundColor Green
    exit 0
} else {
    Write-Host "FAIL: PRODUCTION SIMULASYON BASARISIZ" -ForegroundColor Red
    Write-Host "   Production build'de CSS yukleme sorunu var!" -ForegroundColor Red
    exit 1
}

