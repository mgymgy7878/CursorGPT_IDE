$ErrorActionPreference = "Stop"

Write-Host "🚀 Web-Next Smoke Test Başlıyor..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 0) Port kill (temiz başlangıç)
Write-Host "🧹 Mevcut Node.js prosesleri kapatılıyor..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 1) CWD ve build kontrolü
Write-Host "📁 Dizin değiştiriliyor: apps/web-next" -ForegroundColor Cyan
Set-Location C:\dev\CursorGPT_IDE\apps\web-next

Write-Host "🔍 Build kontrolü yapılıyor..." -ForegroundColor Cyan
if (!(Test-Path .next\BUILD_ID)) { 
    Write-Host "⚠️  Build bulunamadı, build başlatılıyor..." -ForegroundColor Yellow
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build başarısız!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build tamamlandı!" -ForegroundColor Green
} else {
    Write-Host "✅ Build mevcut!" -ForegroundColor Green
}

# 2) Manual start (PM2 öncesi kanıt)
Write-Host "🚀 Manual Next.js başlatılıyor..." -ForegroundColor Cyan
$proc = Start-Process -FilePath ".\node_modules\.bin\next.cmd" -ArgumentList "start -p 3003" -PassThru -NoNewWindow

Write-Host "⏰ 10 saniye bekleniyor..." -ForegroundColor Yellow
for($i=10; $i -gt 0; $i--) { 
    Write-Host "⏳ $i saniye kaldı..." -ForegroundColor Cyan
    Start-Sleep -Seconds 1 
}

# 3) Sağlık doğrulama
Write-Host "🔍 Port kontrolü yapılıyor..." -ForegroundColor Cyan
$portCheck = Get-NetTCPConnection -LocalPort 3003 -State Listen -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "✅ Port 3003 dinleniyor!" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3003 dinlenmiyor!" -ForegroundColor Red
}

Write-Host "🌐 HTTP testleri yapılıyor..." -ForegroundColor Cyan
try {
    $root = Invoke-WebRequest http://127.0.0.1:3003/ -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ ROOT OK: $($root.StatusCode)" -ForegroundColor Green
} catch { 
    Write-Host "❌ ROOT FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $ops = Invoke-WebRequest http://127.0.0.1:3003/ops -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ OPS OK: $($ops.StatusCode)" -ForegroundColor Green
} catch { 
    Write-Host "❌ OPS FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# 4) Kapat ve PM2 ile kalıcı başlat
Write-Host "🔄 Manual servis kapatılıyor..." -ForegroundColor Yellow
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "🚀 PM2 ile kalıcı başlatma..." -ForegroundColor Cyan
Set-Location C:\dev\CursorGPT_IDE
pm2 delete web-next 2>$null | Out-Null
pm2 start ecosystem.config.js --only web-next

Write-Host "⏰ 5 saniye bekleniyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "📊 PM2 durumu:" -ForegroundColor Cyan
pm2 status

Write-Host "📋 PM2 logları (son 20 satır):" -ForegroundColor Cyan
pm2 logs web-next --lines 20

Write-Host "🎯 Final test:" -ForegroundColor Green
try {
    $final = Invoke-WebRequest http://127.0.0.1:3003/ -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ FINAL TEST OK: $($final.StatusCode)" -ForegroundColor Green
    Write-Host "🌐 Tarayıcıda test edin: http://127.0.0.1:3003/" -ForegroundColor Green
} catch { 
    Write-Host "❌ FINAL TEST FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=================================" -ForegroundColor Green
Write-Host "🏁 Smoke test tamamlandı!" -ForegroundColor Green
