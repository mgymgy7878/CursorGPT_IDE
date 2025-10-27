# EXECUTOR BAŞLATMA BETİĞİ
# cursor (Claude 3.5 Sonnet) - 10 Ekim 2025

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK EXECUTOR" -ForegroundColor Cyan
Write-Host "  Başlatılıyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Executor dizinine git
$executorPath = "C:\dev\CursorGPT_IDE\services\executor"

if (-not (Test-Path $executorPath)) {
    Write-Host "❌ Executor dizini bulunamadı: $executorPath" -ForegroundColor Red
    exit 1
}

Set-Location $executorPath

# Env variables
$env:NODE_ENV = "development"
$env:PORT = "4001"
$env:LOG_LEVEL = "debug"

Write-Host "📂 Dizin: $executorPath" -ForegroundColor Green
Write-Host "🔧 Port: 4001" -ForegroundColor Green
Write-Host "🔍 Log Level: debug" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Executor başlatılıyor..." -ForegroundColor Yellow
Write-Host "⏹️  Durdurmak için Ctrl+C basın" -ForegroundColor Gray
Write-Host ""

# pnpm dev ile başlat
try {
    & pnpm dev
} catch {
    Write-Host ""
    Write-Host "❌ Executor başlatılamadı" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "📌 SORUN GİDERME:" -ForegroundColor Yellow
    Write-Host "   1. Bağımlılıkları kontrol edin: pnpm install" -ForegroundColor White
    Write-Host "   2. Port 4001'in kullanımda olmadığından emin olun" -ForegroundColor White
    Write-Host "   3. Logları kontrol edin: _evidence/" -ForegroundColor White
    exit 1
}

