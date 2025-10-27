# SPARK TRADING PLATFORM - OBSERVABILITY STARTUP SCRIPT
# Prometheus + Grafana + Spark Services

param(
    [switch]$SkipBuild,
    [switch]$DevMode
)

Write-Host "🚀 Spark Trading Platform - Observability Stack Başlatılıyor..." -ForegroundColor Green

# Renkler
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

# 1. Pre-checks
Write-Host "`n📋 Pre-checks..." -ForegroundColor $Yellow

# Docker kontrolü
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker bulunamadı!" -ForegroundColor $Red
    exit 1
}

if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose bulunamadı!" -ForegroundColor $Red
    exit 1
}

Write-Host "✅ Docker ve Docker Compose mevcut" -ForegroundColor $Green

# 2. Environment Setup
Write-Host "`n🔧 Environment Setup..." -ForegroundColor $Yellow

# .env dosyası kontrolü
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env dosyası oluşturuldu" -ForegroundColor $Green
    } else {
        Write-Host "⚠️  .env dosyası bulunamadı, devam ediliyor..." -ForegroundColor $Yellow
    }
}

# 3. Build Process (eğer skip edilmemişse)
if (!$SkipBuild) {
    Write-Host "`n🔨 Build Process..." -ForegroundColor $Yellow
    
    # Dependencies
    Write-Host "📦 Dependencies yükleniyor..." -ForegroundColor $Cyan
    pnpm -w install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Dependencies yüklenemedi!" -ForegroundColor $Red
        exit 1
    }
    
    # Executor build
    Write-Host "🔨 Executor build ediliyor..." -ForegroundColor $Cyan
    Set-Location "services/executor"
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Executor build edilemedi!" -ForegroundColor $Red
        exit 1
    }
    Set-Location "../.."
    
    # Web build
    Write-Host "🔨 Web build ediliyor..." -ForegroundColor $Cyan
    Set-Location "apps/web-next"
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Web build edilemedi!" -ForegroundColor $Red
        exit 1
    }
    Set-Location "../.."
    
    Write-Host "✅ Build tamamlandı" -ForegroundColor $Green
}

# 4. Docker Services
Write-Host "`n🐳 Docker Services Başlatılıyor..." -ForegroundColor $Yellow

# Mevcut container'ları durdur
Write-Host "🔄 Mevcut container'lar durduruluyor..." -ForegroundColor $Cyan
docker-compose -f docker-compose.observability.yml down

# Services başlat
Write-Host "🚀 Observability stack başlatılıyor..." -ForegroundColor $Cyan
docker-compose -f docker-compose.observability.yml up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker services başlatılamadı!" -ForegroundColor $Red
    exit 1
}

# 5. Health Checks
Write-Host "`n🏥 Health Checks..." -ForegroundColor $Yellow

# Wait for services
Write-Host "⏰ Servislerin başlaması bekleniyor..." -ForegroundColor $Cyan
Start-Sleep -Seconds 30

# Prometheus check
$prometheusUrl = "http://localhost:9090"
$maxRetries = 10
$retryCount = 0

do {
    try {
        $response = Invoke-RestMethod -Uri "$prometheusUrl/api/v1/query?query=up" -Method GET
        Write-Host "✅ Prometheus erişilebilir" -ForegroundColor $Green
        break
    } catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Host "❌ Prometheus erişilemiyor!" -ForegroundColor $Red
            break
        }
        Write-Host "⏳ Prometheus bekleniyor... ($retryCount/$maxRetries)" -ForegroundColor $Yellow
        Start-Sleep -Seconds 5
    }
} while ($retryCount -lt $maxRetries)

# Grafana check
$grafanaUrl = "http://localhost:3000"
$retryCount = 0

do {
    try {
        $response = Invoke-RestMethod -Uri "$grafanaUrl/api/health" -Method GET
        Write-Host "✅ Grafana erişilebilir" -ForegroundColor $Green
        break
    } catch {
        $retryCount++
        if ($retryCount -ge $maxRetries) {
            Write-Host "❌ Grafana erişilemiyor!" -ForegroundColor $Red
            break
        }
        Write-Host "⏳ Grafana bekleniyor... ($retryCount/$maxRetries)" -ForegroundColor $Yellow
        Start-Sleep -Seconds 5
    }
} while ($retryCount -lt $maxRetries)

# Spark services check
$sparkServices = @(
    @{Name="Web"; Url="http://localhost:3003/api/public/health"},
    @{Name="Executor"; Url="http://localhost:4001/api/public/health"}
)

foreach ($service in $sparkServices) {
    try {
        $response = Invoke-RestMethod -Uri $service.Url -Method GET
        Write-Host "✅ $($service.Name) erişilebilir" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️  $($service.Name) erişilemiyor" -ForegroundColor $Yellow
    }
}

# 6. Summary
Write-Host "`n🎯 OBSERVABILITY STACK SUMMARY" -ForegroundColor $Green
Write-Host "=================================" -ForegroundColor $Green
Write-Host "✅ Prometheus: http://localhost:9090" -ForegroundColor $Green
Write-Host "✅ Grafana: http://localhost:3000 (admin/spark123)" -ForegroundColor $Green
Write-Host "✅ Web: http://localhost:3003" -ForegroundColor $Green
Write-Host "✅ Executor: http://localhost:4001" -ForegroundColor $Green

Write-Host "`n📊 Monitoring URLs:" -ForegroundColor $Cyan
Write-Host "   Prometheus Targets: http://localhost:9090/targets" -ForegroundColor White
Write-Host "   Grafana Dashboards: http://localhost:3000/dashboards" -ForegroundColor White
Write-Host "   Executor Metrics: http://localhost:4001/api/public/metrics" -ForegroundColor White
Write-Host "   Web Metrics: http://localhost:3003/api/public/metrics" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor $Yellow
Write-Host "   1. Grafana'da Prometheus data source ekle" -ForegroundColor White
Write-Host "   2. Dashboard'ları import et" -ForegroundColor White
Write-Host "   3. Alert rules'ları yapılandır" -ForegroundColor White
Write-Host "   4. BTCTurk entegrasyonunu test et" -ForegroundColor White

Write-Host "`n🚀 OBSERVABILITY STACK BAŞLATILDI!" -ForegroundColor $Green
