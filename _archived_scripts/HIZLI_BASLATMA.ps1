# HIZLI BASLATMA SCRIPT - Spark Trading Platform
# cursor (Claude 3.5 Sonnet) - 9 Ekim 2025

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPARK TRADING PLATFORM" -ForegroundColor Cyan
Write-Host "  Hızlı Başlatma Script v1.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Çalışma dizinini kontrol et
$projectRoot = "C:\dev\CursorGPT_IDE"
if (-not (Test-Path $projectRoot)) {
    Write-Host "❌ HATA: Proje dizini bulunamadı: $projectRoot" -ForegroundColor Red
    exit 1
}

Set-Location $projectRoot
Write-Host "✅ Proje dizini: $projectRoot" -ForegroundColor Green
Write-Host ""

# Mevcut çalışan servisleri kontrol et
Write-Host "🔍 Mevcut servis durumu kontrol ediliyor..." -ForegroundColor Yellow

$port3003 = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
$port4001 = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue

if ($port3003) {
    Write-Host "⚠️  Port 3003 zaten kullanımda (Web-Next çalışıyor olabilir)" -ForegroundColor Yellow
}
if ($port4001) {
    Write-Host "⚠️  Port 4001 zaten kullanımda (Executor çalışıyor olabilir)" -ForegroundColor Yellow
}

Write-Host ""

# EXECUTOR BAŞLAT
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  1/2: EXECUTOR BAŞLATILIYOR (Port 4001)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $port4001) {
    $executorPath = Join-Path $projectRoot "services\executor"
    
    if (Test-Path $executorPath) {
        Write-Host "📂 Executor dizini: $executorPath" -ForegroundColor Green
        
        # run-local.cjs var mı kontrol et
        $runLocalPath = Join-Path $executorPath "run-local.cjs"
        
        if (Test-Path $runLocalPath) {
            Write-Host "✅ run-local.cjs bulundu" -ForegroundColor Green
            Write-Host "🚀 Executor başlatılıyor..." -ForegroundColor Yellow
            Write-Host ""
            
            # Yeni terminal penceresi aç ve executor'ı başlat
            $executorCmd = @"
Set-Location '$executorPath'
`$env:PORT = '4001'
`$env:LOG_LEVEL = 'info'
`$env:NODE_ENV = 'development'
Write-Host '🚀 EXECUTOR BAŞLATILDI (Port 4001)' -ForegroundColor Green
Write-Host '📊 Health Check: http://localhost:4001/health' -ForegroundColor Cyan
Write-Host '📈 Metrics: http://localhost:4001/metrics' -ForegroundColor Cyan
Write-Host ''
node run-local.cjs
"@
            
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $executorCmd
            Write-Host "✅ Executor yeni terminal penceresinde başlatıldı" -ForegroundColor Green
            
            # Executor'ın başlamasını bekle
            Write-Host "⏳ Executor'ın hazır olması bekleniyor (5 saniye)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            # Health check
            try {
                $healthResponse = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 3
                Write-Host "✅ Executor health check: OK (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Executor health check başarısız (hala başlatılıyor olabilir)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ run-local.cjs bulunamadı: $runLocalPath" -ForegroundColor Red
            Write-Host "   Alternatif: Executor'ı manuel başlatmanız gerekebilir" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Executor dizini bulunamadı: $executorPath" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Executor zaten çalışıyor (Port 4001)" -ForegroundColor Green
}

Write-Host ""

# WEB-NEXT BAŞLAT
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  2/2: WEB-NEXT BAŞLATILIYOR (Port 3003)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $port3003) {
    $webNextPath = Join-Path $projectRoot "apps\web-next"
    
    if (Test-Path $webNextPath) {
        Write-Host "📂 Web-Next dizini: $webNextPath" -ForegroundColor Green
        
        # package.json var mı kontrol et
        $packageJsonPath = Join-Path $webNextPath "package.json"
        
        if (Test-Path $packageJsonPath) {
            Write-Host "✅ package.json bulundu" -ForegroundColor Green
            Write-Host "🚀 Web-Next başlatılıyor..." -ForegroundColor Yellow
            Write-Host ""
            
            # Yeni terminal penceresi aç ve web-next'i başlat
            $webNextCmd = @"
Set-Location '$webNextPath'
`$env:EXECUTOR_BASE_URL = 'http://127.0.0.1:4001'
`$env:NEXT_PUBLIC_WS_URL = 'ws://127.0.0.1:4001/ws/live'
`$env:NEXT_PUBLIC_ADMIN_ENABLED = '1'
`$env:NODE_ENV = 'development'
Write-Host '🚀 WEB-NEXT BAŞLATILDI (Port 3003)' -ForegroundColor Green
Write-Host '🌐 Arayüz: http://localhost:3003' -ForegroundColor Cyan
Write-Host '📊 Dashboard: http://localhost:3003/' -ForegroundColor Cyan
Write-Host '📈 Backtest: http://localhost:3003/backtest' -ForegroundColor Cyan
Write-Host '⚙️  Admin: http://localhost:3003/admin/params' -ForegroundColor Cyan
Write-Host ''
pnpm dev
"@
            
            Start-Process powershell -ArgumentList "-NoExit", "-Command", $webNextCmd
            Write-Host "✅ Web-Next yeni terminal penceresinde başlatıldı" -ForegroundColor Green
            
            # Web-Next'in başlamasını bekle
            Write-Host "⏳ Web-Next'in hazır olması bekleniyor (8 saniye)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 8
            
            # Health check (Next.js API route)
            try {
                $homeResponse = Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing -TimeoutSec 3
                Write-Host "✅ Web-Next erişilebilir (Status: $($homeResponse.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Web-Next henüz erişilebilir değil (hala başlatılıyor olabilir)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ package.json bulunamadı: $packageJsonPath" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Web-Next dizini bulunamadı: $webNextPath" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Web-Next zaten çalışıyor (Port 3003)" -ForegroundColor Green
}

Write-Host ""

# ÖZET
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BAŞLATMA TAMAMLANDI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ SERVİS DURUMU:" -ForegroundColor Green
Write-Host ""

# Port kontrolü (güncel)
$port3003Final = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
$port4001Final = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue

if ($port4001Final) {
    Write-Host "  ✅ Executor    : http://localhost:4001" -ForegroundColor Green
    Write-Host "     Health     : http://localhost:4001/health" -ForegroundColor Cyan
    Write-Host "     Metrics    : http://localhost:4001/metrics" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ Executor    : ÇALIŞMIYOR" -ForegroundColor Red
}

Write-Host ""

if ($port3003Final) {
    Write-Host "  ✅ Web-Next    : http://localhost:3003" -ForegroundColor Green
    Write-Host "     Dashboard  : http://localhost:3003/" -ForegroundColor Cyan
    Write-Host "     Backtest   : http://localhost:3003/backtest" -ForegroundColor Cyan
    Write-Host "     Admin      : http://localhost:3003/admin/params" -ForegroundColor Cyan
} else {
    Write-Host "  ❌ Web-Next    : ÇALIŞMIYOR" -ForegroundColor Red
}

Write-Host ""

if ($port3003Final -and $port4001Final) {
    Write-Host "🎉 TÜM SERVİSLER BAŞARILI BİR ŞEKİLDE BAŞLATILDI!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📌 SONRAKİ ADIMLAR:" -ForegroundColor Cyan
    Write-Host "   1. Tarayıcıda http://localhost:3003 adresini açın" -ForegroundColor White
    Write-Host "   2. Dashboard'u kontrol edin" -ForegroundColor White
    Write-Host "   3. Arayüz geliştirmesine başlayın" -ForegroundColor White
} elseif ($port3003Final -or $port4001Final) {
    Write-Host "⚠️  BAZI SERVİSLER BAŞLATILAMADI" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📌 SORUN GİDERME:" -ForegroundColor Cyan
    Write-Host "   1. Açılan terminal pencerelerindeki hata mesajlarını kontrol edin" -ForegroundColor White
    Write-Host "   2. Portların başka bir process tarafından kullanılmadığından emin olun" -ForegroundColor White
    Write-Host "   3. Log dosyalarını kontrol edin: _evidence\" -ForegroundColor White
} else {
    Write-Host "❌ HİÇBİR SERVİS BAŞLATILAMADI" -ForegroundColor Red
    Write-Host ""
    Write-Host "📌 SORUN GİDERME:" -ForegroundColor Cyan
    Write-Host "   1. Node.js kurulu mu kontrol edin: node --version" -ForegroundColor White
    Write-Host "   2. pnpm kurulu mu kontrol edin: pnpm --version" -ForegroundColor White
    Write-Host "   3. Bağımlılıkları yükleyin: pnpm install" -ForegroundColor White
    Write-Host "   4. Manuel başlatmayı deneyin (PROJE_DETAYLI_ANALIZ_RAPORU_2025_10_09.md'ye bakın)" -ForegroundColor White
}

Write-Host ""
Write-Host "📄 Detaylı rapor: PROJE_DETAYLI_ANALIZ_RAPORU_2025_10_09.md" -ForegroundColor Cyan
Write-Host ""

# Script tamamlandı
Write-Host "Script tamamlandı. Pencereyi kapatmak için herhangi bir tuşa basın..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

