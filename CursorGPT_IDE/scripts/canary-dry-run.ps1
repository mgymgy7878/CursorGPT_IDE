$ErrorActionPreference = "Stop"
$ROOT = (Get-Location)
$EVID = Join-Path $ROOT "logs\evidence\canary_$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Force -Path $EVID | Out-Null

Write-Host "🔍 Canary Dry-Run Test Başlatılıyor..." -ForegroundColor Yellow
Write-Host "📁 Evidence klasörü: $EVID" -ForegroundColor Cyan

# 1) Baz bilgi
Write-Host "📋 Sistem bilgileri toplanıyor..." -ForegroundColor Yellow
node -v | Tee-Object "$EVID\node_version.txt"
pnpm -v | Tee-Object "$EVID\pnpm_version.txt"
Get-Date | Tee-Object "$EVID\test_timestamp.txt"

# 2) Canary DRY-RUN
Write-Host "🧪 Canary dry-run testi çalıştırılıyor..." -ForegroundColor Yellow
try {
  $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 `
    "http://127.0.0.1:4001/canary/run?dry=true"
  $resp.Content | Out-File "$EVID\canary_response.json" -Encoding UTF8
  Write-Host "✅ Canary dry-run başarılı: $($resp.StatusCode)" -ForegroundColor Green
} catch {
  "canary_error=$($_.Exception.Message)" | Out-File "$EVID\canary_response.json"
  Write-Host "❌ Canary dry-run hatası: $($_.Exception.Message)" -ForegroundColor Red
}

# 3) Prometheus metrikleri (UI proxy üzerinden)
Write-Host "📊 Prometheus metrikleri toplanıyor..." -ForegroundColor Yellow
try {
  (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/api/public/metrics/prom").Content `
    | Out-File "$EVID\metrics.prom" -Encoding UTF8
  Write-Host "✅ Prometheus metrikleri toplandı" -ForegroundColor Green
} catch {
  "metrics_error=$($_.Exception.Message)" | Out-File "$EVID\metrics.prom"
  Write-Host "❌ Prometheus metrikleri hatası: $($_.Exception.Message)" -ForegroundColor Red
}

# 4) Sağlık tekrar
Write-Host "🏥 Servis sağlık durumu kontrol ediliyor..." -ForegroundColor Yellow
(Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/api/public/health").Content `
  | Out-File "$EVID\web_health.json"
(Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/health").Content `
  | Out-File "$EVID\exec_health.json"

Write-Host "✅ Canary dry-run tamamlandı. Evidence: $EVID" -ForegroundColor Green