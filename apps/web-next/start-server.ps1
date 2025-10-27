# Spark Platform Server Başlatıcı
# Bu script'i ayrı PowerShell penceresinde çalıştırın

Write-Host "🚀 Spark Platform Server Başlatılıyor..." -ForegroundColor Green

# Port temizliği
Write-Host "🔍 Port 3005 temizleniyor..." -ForegroundColor Yellow
$existing = Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue
if ($existing) {
    $existing | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }
    Write-Host "✅ Port 3005 temizlendi" -ForegroundColor Green
}

# Environment variables
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:PORT = "3005"

# Dizin kontrolü
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json bulunamadı! Doğru dizinde olduğunuzdan emin olun." -ForegroundColor Red
    Write-Host "📍 Mevcut dizin: $(Get-Location)" -ForegroundColor Yellow
    Read-Host "Devam etmek için Enter'a basın"
    exit 1
}

Write-Host "📦 Dependencies kontrol ediliyor..." -ForegroundColor Yellow
pnpm install

Write-Host "🌐 Next.js Server başlatılıyor..." -ForegroundColor Cyan
Write-Host "📍 URL: http://localhost:3005" -ForegroundColor Green
Write-Host "⏹️  Durdurmak için Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Server'ı başlat
try {
    pnpm dev -- -p 3005 -H 0.0.0.0
} catch {
    Write-Host "❌ Server başlatılamadı: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Devam etmek için Enter'a basın"
}

Write-Host "🛑 Server durduruldu" -ForegroundColor Red
Read-Host "Çıkmak için Enter'a basın"
