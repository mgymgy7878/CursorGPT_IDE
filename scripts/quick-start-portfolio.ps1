# QUICK START - PORTFOLIO SPRINT v1.9-p3
# 5-minute setup script
# cursor (Claude 3.5 Sonnet) + chatgpt

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PORTFOLIO SPRINT - QUICK START" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env files already exist
$executorEnv = "C:\dev\CursorGPT_IDE\services\executor\.env"
$webEnv = "C:\dev\CursorGPT_IDE\apps\web-next\.env.local"

if (Test-Path $executorEnv) {
    Write-Host "⚠️  Executor .env zaten mevcut" -ForegroundColor Yellow
    Write-Host "   Dosya: $executorEnv" -ForegroundColor Gray
    $overwrite = Read-Host "Üzerine yaz? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "Executor .env atlandı" -ForegroundColor Yellow
    } else {
        Remove-Item $executorEnv -Force
        Write-Host "✓ Eski .env silindi" -ForegroundColor Green
    }
}

if (-not (Test-Path $executorEnv)) {
    Write-Host ""
    Write-Host "📝 Executor .env Oluşturuluyor..." -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Binance API Key (read-only): " -ForegroundColor Yellow -NoNewline
    $binanceKey = Read-Host
    
    Write-Host "Binance API Secret: " -ForegroundColor Yellow -NoNewline
    $binanceSecret = Read-Host -AsSecureString
    $binanceSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($binanceSecret)
    )
    
    Write-Host "BTCTurk API Key (read-only): " -ForegroundColor Yellow -NoNewline
    $btcturkKey = Read-Host
    
    Write-Host "BTCTurk API Secret (Base64): " -ForegroundColor Yellow -NoNewline
    $btcturkSecret = Read-Host -AsSecureString
    $btcturkSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($btcturkSecret)
    )
    
    # Generate admin token
    $adminToken = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    
    # Create .env
    $envContent = @"
# Spark Executor Service - Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Sprint: v1.9-p3 Portfolio Real Data Integration

# Server Configuration
PORT=4001
HOST=0.0.0.0
NODE_ENV=development

# Binance API (READ-ONLY permissions only!)
BINANCE_API_KEY=$binanceKey
BINANCE_API_SECRET=$binanceSecretPlain
BINANCE_TESTNET=0
BINANCE_RECV_WINDOW=5000

# BTCTurk API (READ-ONLY permissions only!)
BTCTURK_API_KEY=$btcturkKey
BTCTURK_API_SECRET_BASE64=$btcturkSecretPlain

# Security
ADMIN_TOKEN=$adminToken

# Optional: Real routes configuration
# REAL_ROUTES=run,walkforward,portfolio,optimize
"@
    
    $envContent | Out-File $executorEnv -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "✓ Executor .env oluşturuldu" -ForegroundColor Green
    Write-Host "  Admin Token: $($adminToken.Substring(0,16))..." -ForegroundColor Gray
}

# Web-Next .env.local
if (-not (Test-Path $webEnv)) {
    Write-Host ""
    Write-Host "📝 Web-Next .env.local Oluşturuluyor..." -ForegroundColor Cyan
    
    $webEnvContent = @"
# Spark Web-Next - Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Sprint: v1.9-p3 Portfolio Real Data Integration

# Application Environment
NEXT_PUBLIC_APP_ENV=local

# Executor Service URL (backend)
EXECUTOR_BASE_URL=http://127.0.0.1:4001

# Public variables (accessible in browser)
NEXT_PUBLIC_EXECUTOR_BASE_URL=http://127.0.0.1:4001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001/ws/live
NEXT_PUBLIC_ADMIN_ENABLED=true
"@
    
    $webEnvContent | Out-File $webEnv -Encoding utf8 -NoNewline
    Write-Host "✓ Web-Next .env.local oluşturuldu" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✓ Web-Next .env.local zaten mevcut" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ENVIRONMENT SETUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Backup .env files
Write-Host "💾 Backup oluşturuluyor..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $executorEnv "$executorEnv.backup.$timestamp" -Force
Copy-Item $webEnv "$webEnv.backup.$timestamp" -Force
Write-Host "✓ Backup: .env.backup.$timestamp" -ForegroundColor Green
Write-Host ""

# Start services?
Write-Host "🚀 Servisleri başlatmak ister misin? (y/n): " -ForegroundColor Yellow -NoNewline
$startServices = Read-Host

if ($startServices -eq 'y') {
    Write-Host ""
    Write-Host "Servisler başlatılıyor..." -ForegroundColor Cyan
    cd C:\dev\CursorGPT_IDE
    .\basla.ps1
    
    Write-Host ""
    Write-Host "⏳ Servislerin başlaması bekleniyor (15 saniye)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    Write-Host ""
    Write-Host "🔍 Smoke Tests..." -ForegroundColor Cyan
    
    # Health checks
    try {
        $execHealth = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ Executor Health: $($execHealth.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Executor Health: FAILED" -ForegroundColor Red
    }
    
    try {
        $portfolioApi = Invoke-WebRequest -Uri "http://localhost:4001/api/portfolio" -UseBasicParsing -TimeoutSec 10
        $data = $portfolioApi.Content | ConvertFrom-Json
        Write-Host "✓ Portfolio API: $($portfolioApi.StatusCode)" -ForegroundColor Green
        Write-Host "  Accounts: $($data.accounts.Length)" -ForegroundColor Gray
        foreach ($acc in $data.accounts) {
            Write-Host "    - $($acc.exchange): $($acc.totals.totalUsd) USD ($($acc.balances.Length) assets)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ Portfolio API: FAILED" -ForegroundColor Red
    }
    
    try {
        $webHealth = Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ Web-Next: $($webHealth.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Web-Next: FAILED" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  SMOKE TEST COMPLETE" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open UI: http://localhost:3003/portfolio" -ForegroundColor White
    Write-Host "  2. Check metrics: curl http://localhost:4001/metrics | Select-String 'spark_portfolio'" -ForegroundColor White
    Write-Host "  3. Start monitoring: docker compose up -d prometheus grafana" -ForegroundColor White
    Write-Host "  4. View Grafana: http://localhost:3005 (admin/admin)" -ForegroundColor White
    Write-Host ""
    
    # Open browser?
    Write-Host "Tarayıcıda portfolio sayfasını aç? (y/n): " -ForegroundColor Yellow -NoNewline
    $openBrowser = Read-Host
    if ($openBrowser -eq 'y') {
        Start-Process "http://localhost:3003/portfolio"
    }
} else {
    Write-Host ""
    Write-Host "Manuel başlatma için:" -ForegroundColor Yellow
    Write-Host "  cd C:\dev\CursorGPT_IDE" -ForegroundColor White
    Write-Host "  .\basla.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "🎉 Setup tamamlandı!" -ForegroundColor Green
Write-Host ""

