# CI Visual Regression Test Script (PowerShell)
#
# Kullanım:
#   .\scripts\ci-visual-regression.ps1
#
# PR pipeline'da çalıştırılır:
#   1. Dev server'ı başlat (background)
#   2. Golden Master testlerini çalıştır
#   3. Snapshot farkı varsa exit 1 (PR kırmızı)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "🔍 Visual Regression Test - CI Pipeline" -ForegroundColor Cyan

# Dev server'ı başlat (background)
Write-Host "📦 Starting dev server..." -ForegroundColor Yellow
$devJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    pnpm --filter web-next dev -- --port 3003 --hostname 127.0.0.1
}
$DEV_PID = $devJob.Id

# Server'ın hazır olmasını bekle (45-60sn polling)
Write-Host "⏳ Waiting for server to be ready (healthz polling)..." -ForegroundColor Yellow
$maxRetries = 30
$retryInterval = 2
$retryCount = 0
$serverReady = $false

for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/healthz" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop

        # 200 (UI ready) veya 503 (executor kapalı, beklenen) → ready
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is ready (HTTP 200)" -ForegroundColor Green
            $serverReady = $true
            break
        } elseif ($response.StatusCode -eq 503) {
            # 503 beklenen (UI-only mode, executor kapalı)
            Write-Host "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)" -ForegroundColor Yellow
            $serverReady = $true
            break
        }
    } catch {
        $statusCode = $null
        try {
            $statusCode = $_.Exception.Response.StatusCode.value__
        } catch {
            # StatusCode yok, connection refused olabilir
        }

        if ($statusCode -eq 503) {
            # 503 beklenen (UI-only mode, executor kapalı)
            Write-Host "✅ Server is ready (HTTP 503 - executor down, expected in UI-only mode)" -ForegroundColor Yellow
            $serverReady = $true
            break
        } elseif ($_.Exception -match "ECONNREFUSED|Connection refused|Unable to connect") {
            # Port henüz hazır değil, retry
            Write-Host "⏳ Waiting for port 3003... ($i/$maxRetries)" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    if ($i -lt $maxRetries) {
        Start-Sleep -Seconds $retryInterval
    }
}

if (-not $serverReady) {
    Write-Host "❌ Server failed to start after $($maxRetries * $retryInterval) seconds" -ForegroundColor Red
    Write-Host "   Check: Is port 3003 free? (netstat -ano | findstr :3003)" -ForegroundColor Yellow
    # Clean stop
    Stop-Job -Job $devJob -ErrorAction SilentlyContinue
    Remove-Job -Job $devJob -ErrorAction SilentlyContinue
    # PID ile process'i de durdur (güvenlik için)
    try {
        $process = Get-Process -Id $DEV_PID -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $DEV_PID -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Process zaten durmuş olabilir
    }
    exit 1
}

# Golden Master testlerini çalıştır (tüm visual testler)
# PowerShell wildcard sorununu önlemek için Get-ChildItem + argument array kullan
Write-Host "📸 Running Golden Master tests..." -ForegroundColor Yellow
try {
    # Tam deterministik: array garantisi + sıralama (log/teşhis tutarlı)
    $testFiles = @(Get-ChildItem -Path "apps/web-next/tests/visual" -Filter "*.spec.ts" -Recurse | Sort-Object FullName | ForEach-Object { $_.FullName })

    if ($testFiles.Count -eq 0) {
        Write-Host "❌ No test files found in tests/visual/" -ForegroundColor Red
        throw "No visual spec files found."
    }

    # Argument array ile güvenli çalıştırma (Invoke-Expression yerine)
    $args = @("--filter", "web-next", "exec", "playwright", "test") + $testFiles
    & pnpm @args

    if ($LASTEXITCODE -ne 0) {
        throw "Playwright tests failed with exit code $LASTEXITCODE"
    }

    $testFailed = $false
} catch {
    Write-Host "❌ Test execution failed: $($_.Exception.Message)" -ForegroundColor Red
    $testFailed = $true
}

# Dev server'ı durdur (clean stop)
Write-Host "🛑 Stopping dev server..." -ForegroundColor Yellow
Stop-Job -Job $devJob -ErrorAction SilentlyContinue
Remove-Job -Job $devJob -ErrorAction SilentlyContinue
# PID ile process'i de durdur (güvenlik için)
try {
    $process = Get-Process -Id $DEV_PID -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $DEV_PID -Force -ErrorAction SilentlyContinue
    }
} catch {
    # Process zaten durmuş olabilir
}

# Test başarısızsa exit 1
if ($testFailed) {
    Write-Host "❌ Visual regression test failed - PR should be blocked" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Visual regression test passed" -ForegroundColor Green
exit 0

