# ═══════════════════════════════════════════════════════════
# CANARY NODE 20 SETUP & HYBRID MODE
# ═══════════════════════════════════════════════════════════
#
# Bu scripti Node 20.16.0 kurulumu SONRASI YENİ PowerShell'de çalıştır!
#

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    CANARY: NODE 20 REBUILD & HYBRID MODE STARTUP        ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

# ─── STEP 1: Node Version Check ───────────────────────────
Write-Host "STEP 1: Node Version Doğrulaması..." -ForegroundColor Cyan
$nodeVersion = node -v
Write-Host "   Current: $nodeVersion" -ForegroundColor $(if ($nodeVersion -match "v20") { "Green" } else { "Red" })

if ($nodeVersion -notmatch "v20") {
    Write-Host "   ❌ ERROR: Node 20.x gerekli! Lütfen Node 20.16.0 kur." -ForegroundColor Red
    Write-Host "   İndir: https://nodejs.org/dist/v20.16.0/node-v20.16.0-x64.msi`n" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ Node 20 detected!`n" -ForegroundColor Green

# ─── STEP 2: Workspace Clean & Rebuild ────────────────────
Write-Host "STEP 2: Workspace Rebuild (5-10 dakika)..." -ForegroundColor Cyan
cd C:\dev\CursorGPT_IDE

Write-Host "   → pnpm -r clean..." -ForegroundColor Gray
pnpm -r clean 2>$null

Write-Host "   → pnpm -r install..." -ForegroundColor Gray
pnpm -r install

Write-Host "   → pnpm -r build..." -ForegroundColor Gray
pnpm -r build

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Workspace rebuild başarılı!`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Build hatası olabilir, devam ediyoruz...`n" -ForegroundColor Yellow
}

# ─── STEP 3: Port Cleanup ──────────────────────────────────
Write-Host "STEP 3: Port 4001 Temizliği..." -ForegroundColor Cyan
$port = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   → Mevcut process kapatılıyor (PID: $($port.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $port.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Port temizlendi!`n" -ForegroundColor Green
} else {
    Write-Host "   ✅ Port zaten boş!`n" -ForegroundColor Green
}

# ─── STEP 4: Redis Check ───────────────────────────────────
Write-Host "STEP 4: Redis Kontrolü..." -ForegroundColor Cyan
try {
    $redisStatus = docker ps --filter "name=redis" --format "{{.Status}}" 2>$null
    if ($redisStatus) {
        Write-Host "   ✅ Redis: $redisStatus`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Redis bulunamadı, başlatılıyor..." -ForegroundColor Yellow
        docker start redis
        Start-Sleep -Seconds 3
        Write-Host "   ✅ Redis başlatıldı!`n" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Redis kontrol edilemedi (Docker yok?)...`n" -ForegroundColor Yellow
}

# ─── STEP 5: Executor Hybrid Mode Başlatma ────────────────
Write-Host "STEP 5: Executor Hybrid Mode (REAL_ROUTES=run)..." -ForegroundColor Cyan
Write-Host "   YENİ PowerShell penceresi açılıyor...`n" -ForegroundColor Yellow

cd C:\dev\CursorGPT_IDE\services\executor

Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
`$Host.UI.RawUI.WindowTitle='🎯 CANARY: HYBRID MODE (run)'
Write-Host ''
Write-Host '╔════════════════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║  🎯 CANARY DEPLOYMENT - HYBRID MODE           ║' -ForegroundColor Green
Write-Host '║  REAL_ROUTES=run (Node 20.16.0)              ║' -ForegroundColor Green
Write-Host '╚════════════════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''
cd C:\dev\CursorGPT_IDE\services\executor
`$env:REAL_ROUTES='run'
`$env:PORT='4001'
`$env:HOST='0.0.0.0'
`$env:REDIS_URL='redis://127.0.0.1:6379'
`$env:NODE_ENV='development'
Write-Host '⏳ Başlatılıyor: pnpm dev' -ForegroundColor Yellow
Write-Host 'Beklenen: [BOOT] enabling REAL /backtest/run' -ForegroundColor Gray
Write-Host ''
pnpm dev
"@

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Executor başlatıldı! 10 saniye boot bekleniyor..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

Start-Sleep -Seconds 12

# ─── STEP 6: Health Check ──────────────────────────────────
Write-Host "STEP 6: Health Check..." -ForegroundColor Cyan
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing -TimeoutSec 5 | % Content | ConvertFrom-Json
    Write-Host "   ✅ Health: HTTP 200" -ForegroundColor Green
    Write-Host "      mode: $($health.mode)" -ForegroundColor Gray
    Write-Host "      realRoutes: [$($health.realRoutes -join ',')]`n" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️  Health check failed (executor still booting?)`n" -ForegroundColor Yellow
}

# ─── STEP 7: Test Komutları ────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "           📊 TEST KOMUTLARI" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "# Health Check" -ForegroundColor Green
Write-Host "iwr http://127.0.0.1:4001/health | % Content`n" -ForegroundColor White

Write-Host "# Gerçek Backtest (mock=false bekleniyor)" -ForegroundColor Green
Write-Host "`$body = @{symbol='BTCUSDT';timeframe='15m';start='2024-01-01';end='2024-01-03';exchange='binance';config=@{indicators=@{emaFast=20;emaSlow=50;atr=14}}} | ConvertTo-Json -Depth 10" -ForegroundColor White
Write-Host "iwr http://127.0.0.1:4001/backtest/run -Method POST -ContentType 'application/json' -Body `$body -UseBasicParsing | % Content`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "           🎯 BEKLENEN MÜHÜR CÜMLESİ" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
Write-Host "CANARY-HYBRID ✅ /health: mode=hybrid realRoutes=[run], /backtest/run: mock=false`n" -ForegroundColor Green

Write-Host "Bu cümleyi aldığında paylaş! 🚀" -ForegroundColor Yellow
Write-Host "Ardından walkforward ve portfolio rotalarını açarız.`n" -ForegroundColor Gray

