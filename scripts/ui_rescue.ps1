# UI Kurtarma Scripti - Beyaz Ekran Sorunları İçin
# Kullanım: .\scripts\ui_rescue.ps1

$ErrorActionPreference = "Stop"
$script:RootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script:WebNextDir = Join-Path $script:RootDir "apps\web-next"

Write-Host "🔧 UI Kurtarma Scripti Başlatılıyor..." -ForegroundColor Cyan

# 0) Hızlı sağlık kontrolü
Write-Host "`n[0/4] API sağlık kontrolü..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/metrics" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API canlı (200 OK)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API yanıt verdi ama beklenmeyen status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API erişilemiyor (muhtemelen durdurulmuş)" -ForegroundColor Red
}

# 1) Tüm Node süreçlerini kapat
Write-Host "`n[1/4] Node süreçleri durduruluyor..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ $($nodeProcesses.Count) Node süreci durduruldu" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Çalışan Node süreci yok" -ForegroundColor Gray
}

# 2) UI cache'lerini temizle
Write-Host "`n[2/4] UI cache'leri temizleniyor..." -ForegroundColor Yellow
Push-Location $script:WebNextDir

if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
    Write-Host "✅ .next/ dizini silindi" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next/ dizini zaten yok" -ForegroundColor Gray
}

$cacheDir = Join-Path $script:RootDir "node_modules\.cache"
if (Test-Path $cacheDir) {
    Remove-Item $cacheDir -Recurse -Force
    Write-Host "✅ node_modules/.cache/ dizini silindi" -ForegroundColor Green
} else {
    Write-Host "ℹ️  node_modules/.cache/ dizini zaten yok" -ForegroundColor Gray
}

Pop-Location

# 3) .env.local kontrolü ve oluşturma
Write-Host "`n[3/4] .env.local kontrolü..." -ForegroundColor Yellow
Push-Location $script:WebNextDir

$envLocalPath = ".env.local"
$needsEnv = $false

if (-not (Test-Path $envLocalPath)) {
    Write-Host "⚠️  .env.local bulunamadı, oluşturuluyor..." -ForegroundColor Yellow
    $needsEnv = $true
} else {
    $envContent = Get-Content $envLocalPath -Raw -ErrorAction SilentlyContinue
    if (-not $envContent -or -not ($envContent -match "NEXT_PUBLIC_API_URL") -or -not ($envContent -match "NEXT_PUBLIC_WS_URL")) {
        Write-Host "⚠️  .env.local eksik/bozuk, yeniden oluşturuluyor..." -ForegroundColor Yellow
        $needsEnv = $true
    } else {
        Write-Host "✅ .env.local mevcut ve geçerli görünüyor" -ForegroundColor Green
    }
}

if ($needsEnv) {
    @'
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
'@ | Out-File -FilePath $envLocalPath -Encoding utf8 -Force
    Write-Host "✅ .env.local oluşturuldu/güncellendi" -ForegroundColor Green
}

Pop-Location

# 4) Bağımlılıkları kontrol et ve dev'i başlat
Write-Host "`n[4/4] Bağımlılıklar kontrol ediliyor..." -ForegroundColor Yellow
Push-Location $script:RootDir

if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules bulunamadı, pnpm install çalıştırılıyor..." -ForegroundColor Yellow
    pnpm -w install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ pnpm install başarısız!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ Bağımlılıklar yüklendi" -ForegroundColor Green
} else {
    Write-Host "✅ node_modules mevcut" -ForegroundColor Green
}

Pop-Location

Write-Host "`n✅ Kurtarma işlemi tamamlandı!" -ForegroundColor Green
Write-Host "`n📝 Sonraki adımlar:" -ForegroundColor Cyan
Write-Host "   1. Dev sunucusunu başlat: pnpm --filter web-next dev -- --port 3003" -ForegroundColor White
Write-Host "   2. Tarayıcıda: F12 → Application → Clear storage → Clear site data" -ForegroundColor White
Write-Host "   3. Sayfayı yenile (Ctrl+Shift+R veya Cmd+Shift+R)" -ForegroundColor White
Write-Host "`n💡 Sorun sürerse:" -ForegroundColor Yellow
Write-Host "   - Konsol hatalarını kontrol et (ChunkLoadError?)" -ForegroundColor White
Write-Host "   - .env.local portlarını doğrula (API: 3001, WS: 4001)" -ForegroundColor White
Write-Host "   - NEXT_PUBLIC_DATA_MODE=mock ekleyerek mock modda test et" -ForegroundColor White

