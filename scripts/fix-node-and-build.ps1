# scripts\fix-node-and-build.ps1  (v2 with MSI fallback)
$ErrorActionPreference = "Stop"
$ROOT = (Get-Location)
$EVID = Join-Path $ROOT "logs\evidence\node20_build\$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Force -Path $EVID | Out-Null

function Ensure-Node20 {
  try { $nv = (node -v) } catch { $nv = "" }
  if ($nv -like "v20.10*") { return }
  if (Get-Command nvm -ErrorAction SilentlyContinue) {
    Write-Host "NVM detected → installing 20.10.0 ..."
    nvm install 20.10.0
    nvm use 20.10.0
  } else {
    Write-Host "NVM not found → using MSI fallback ..."
    & "$ROOT\scripts\install-node20-msi.ps1"
  }
  node -v | Tee-Object "$EVID\node_version.txt"
}

Write-Host "== 0) Kill stray node processes ==" -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "== 1) Ensure Node 20.10.0 ==" -ForegroundColor Cyan
Ensure-Node20

Write-Host "`n== 2) pnpm kurulumu ve cache temizliği ==" -ForegroundColor Cyan
# pnpm güncelleme
npm i -g pnpm@10
$pnpmVersion = pnpm -v
$pnpmVersion | Tee-Object "$EVID\pnpm_version.txt"
Write-Host "pnpm versiyonu: $pnpmVersion" -ForegroundColor Green

# Cache temizliği
Write-Host "pnpm store temizleniyor..." -ForegroundColor Yellow
pnpm store prune

# node_modules temizliği
Write-Host "node_modules temizleniyor..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
  Remove-Item -Recurse -Force node_modules
}

# Taze kurulum
Write-Host "pnpm workspace install başlatılıyor..." -ForegroundColor Yellow
pnpm -w install 2>&1 | Tee-Object "$EVID\pnpm_install.log"

Write-Host "`n== 3) Build zinciri ==" -ForegroundColor Cyan

# Tür üretimi
Write-Host "1/4: @spark/types build..." -ForegroundColor Yellow
try {
  pnpm --filter @spark/types run build 2>&1 | Tee-Object "$EVID\build_types.log"
  Write-Host "✅ @spark/types build başarılı" -ForegroundColor Green
} catch {
  Write-Host "❌ @spark/types build hatası: $($_.Exception.Message)" -ForegroundColor Red
  $_.Exception.Message | Out-File "$EVID\build_types_error.log"
}

# Çekirdek paketler build
Write-Host "2/4: Core packages build..." -ForegroundColor Yellow
try {
  pnpm -w run build:core 2>&1 | Tee-Object "$EVID\build_core.log"
  Write-Host "✅ Core packages build başarılı" -ForegroundColor Green
} catch {
  Write-Host "❌ Core packages build hatası: $($_.Exception.Message)" -ForegroundColor Red
  $_.Exception.Message | Out-File "$EVID\build_core_error.log"
}

# Web-next build
Write-Host "3/4: web-next build..." -ForegroundColor Yellow
try {
  pnpm --filter web-next run build 2>&1 | Tee-Object "$EVID\web_next_build.log"
  Write-Host "✅ web-next build başarılı" -ForegroundColor Green
} catch {
  Write-Host "❌ web-next build hatası: $($_.Exception.Message)" -ForegroundColor Red
  $_.Exception.Message | Out-File "$EVID\web_next_build_error.log"
}

# Executor build
Write-Host "4/4: executor build..." -ForegroundColor Yellow
try {
  pnpm --filter executor run build 2>&1 | Tee-Object "$EVID\executor_build.log"
  Write-Host "✅ executor build başarılı" -ForegroundColor Green
} catch {
  Write-Host "❌ executor build hatası: $($_.Exception.Message)" -ForegroundColor Red
  $_.Exception.Message | Out-File "$EVID\executor_build_error.log"
}

Write-Host "`n== 4) Dev servisleri başlatma ==" -ForegroundColor Cyan
# Mevcut süreçleri temizle
Write-Host "Mevcut dev süreçleri temizleniyor..." -ForegroundColor Yellow
try {
  Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {
  Write-Host "Node süreçleri temizlenemedi (normal olabilir)" -ForegroundColor Yellow
}

# Dev servislerini arka planda başlat
Write-Host "web-next dev servisi başlatılıyor..." -ForegroundColor Yellow
$webProcess = Start-Process -WindowStyle Hidden -FilePath "pnpm" -ArgumentList "--filter", "web-next", "run", "dev" -PassThru

Write-Host "executor dev servisi başlatılıyor..." -ForegroundColor Yellow
$execProcess = Start-Process -WindowStyle Hidden -FilePath "pnpm" -ArgumentList "--filter", "executor", "run", "dev" -PassThru

# Servislerin başlaması için bekleme
Write-Host "Servislerin başlaması bekleniyor (15 saniye)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n== 5) Health & Metrics kontrolü ==" -ForegroundColor Cyan

# Web-next health check
Write-Host "web-next health check (port 3003)..." -ForegroundColor Yellow
try {
  $webHealth = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "http://127.0.0.1:3003/api/public/health"
  $webHealth.Content | Out-File -Encoding UTF8 "$EVID\web_health.json"
  Write-Host "✅ web-next health: $($webHealth.StatusCode)" -ForegroundColor Green
} catch {
  $errorMsg = "web-next health check failed: $($_.Exception.Message)"
  Write-Host "❌ $errorMsg" -ForegroundColor Red
  $errorMsg | Out-File "$EVID\web_health_error.log"
}

# Executor health check
Write-Host "executor health check (port 4001)..." -ForegroundColor Yellow
try {
  $execHealth = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "http://127.0.0.1:4001/health"
  $execHealth.Content | Out-File -Encoding UTF8 "$EVID\executor_health.json"
  Write-Host "✅ executor health: $($execHealth.StatusCode)" -ForegroundColor Green
} catch {
  $errorMsg = "executor health check failed: $($_.Exception.Message)"
  Write-Host "❌ $errorMsg" -ForegroundColor Red
  $errorMsg | Out-File "$EVID\executor_health_error.log"
}

# Prometheus metrics
Write-Host "Prometheus metrics kontrolü..." -ForegroundColor Yellow
try {
  $metrics = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 "http://127.0.0.1:3003/api/public/metrics/prom"
  $metrics.Content | Out-File -Encoding UTF8 "$EVID\metrics.prom"
  Write-Host "✅ Prometheus metrics alındı" -ForegroundColor Green
} catch {
  $errorMsg = "Prometheus metrics unavailable: $($_.Exception.Message)"
  Write-Host "⚠️ $errorMsg" -ForegroundColor Yellow
  $errorMsg | Out-File "$EVID\metrics_error.log"
}

Write-Host "`n== 6) BUILD_ID & Sürüm İzleri ==" -ForegroundColor Cyan

# BUILD_ID kontrolü
if (Test-Path "$ROOT\apps\web-next\.next\BUILD_ID") {
  $buildId = Get-Content "$ROOT\apps\web-next\.next\BUILD_ID"
  $buildId | Out-File "$EVID\web_next_BUILD_ID.txt"
  Write-Host "✅ web-next BUILD_ID: $buildId" -ForegroundColor Green
} else {
  "BUILD_ID not found" | Out-File "$EVID\web_next_BUILD_ID_missing.log"
  Write-Host "⚠️ web-next BUILD_ID bulunamadı" -ForegroundColor Yellow
}

# Package.json listesi
$packageJsonFiles = Get-ChildItem -Recurse -Filter package.json | Select-Object -ExpandProperty FullName
$packageJsonFiles | Out-File "$EVID\package_json_list.txt"
Write-Host "✅ $($packageJsonFiles.Count) package.json dosyası bulundu" -ForegroundColor Green

# Süreç ID'leri
$webProcess.Id | Out-File "$EVID\web_process_id.txt"
$execProcess.Id | Out-File "$EVID\exec_process_id.txt"

Write-Host "`n== 7) Özet Raporu ==" -ForegroundColor Cyan
$report = @"
Spark Trading Platform - Node 20.10.0 Migration Raporu
=====================================================
Tarih: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Node Versiyonu: $nodeVersion
npm Versiyonu: $npmVersion
pnpm Versiyonu: $pnpmVersion

Build Durumu:
- @spark/types: $(if (Test-Path "$EVID\build_types.log") { "✅" } else { "❌" })
- Core packages: $(if (Test-Path "$EVID\build_core.log") { "✅" } else { "❌" })
- web-next: $(if (Test-Path "$EVID\web_next_build.log") { "✅" } else { "❌" })
- executor: $(if (Test-Path "$EVID\executor_build.log") { "✅" } else { "❌" })

Health Check:
- web-next (3003): $(if (Test-Path "$EVID\web_health.json") { "✅" } else { "❌" })
- executor (4001): $(if (Test-Path "$EVID\executor_health.json") { "✅" } else { "❌" })
- Prometheus metrics: $(if (Test-Path "$EVID\metrics.prom") { "✅" } else { "⚠️" })

Kanıt Dosyaları: $EVID
"@

$report | Out-File "$EVID\migration_report.txt"
Write-Host $report -ForegroundColor White

Write-Host "`n✅ Migration tamamlandı!" -ForegroundColor Green
Write-Host "Kanıt klasörü: $EVID" -ForegroundColor Yellow
Write-Host "`nSonraki adımlar:" -ForegroundColor Cyan
Write-Host "- Health check'leri doğrulayın: http://127.0.0.1:3003/api/public/health" -ForegroundColor White
Write-Host "- Executor health: http://127.0.0.1:4001/health" -ForegroundColor White
Write-Host "- Prometheus metrics: http://127.0.0.1:3003/api/public/metrics/prom" -ForegroundColor White
Write-Host "- Canary testleri için: pnpm smoke:all" -ForegroundColor White
