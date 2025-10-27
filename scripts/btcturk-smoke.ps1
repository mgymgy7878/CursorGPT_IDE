$ErrorActionPreference = "Continue"
$ROOT = (Get-Location)
$EVID = Join-Path $ROOT "logs\evidence\btcturk_smoke_$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Force -Path $EVID | Out-Null

Write-Host "🔍 BTCTurk Smoke Test Başlatılıyor..." -ForegroundColor Yellow
Write-Host "📁 Evidence klasörü: $EVID" -ForegroundColor Cyan

function Grab($name, $url, $file) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 $url
    $r.Content | Out-File (Join-Path $EVID $file) -Encoding UTF8
    Write-Host "$name OK ($($r.StatusCode))" -ForegroundColor Green
  } catch {
    "$name ERROR: $($_.Exception.Message)" | Out-File (Join-Path $EVID $file)
    Write-Host "$name FAIL" -ForegroundColor Red
  }
}

# Sistem bilgileri
Write-Host "📋 Sistem bilgileri toplanıyor..." -ForegroundColor Yellow
node -v | Tee-Object "$EVID\node_version.txt"
pnpm -v | Tee-Object "$EVID\pnpm_version.txt"
Get-Date | Tee-Object "$EVID\test_timestamp.txt"

# BTCTurk API testleri
Write-Host "🔗 BTCTurk API testleri çalıştırılıyor..." -ForegroundColor Yellow

# UI proxy üzerinden BTCTurk testleri
Grab "BTCTurk Ticker BTCTRY" "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY" "ticker_BTCTRY.json"
Grab "BTCTurk Orderbook BTCTRY (50)" "http://127.0.0.1:3003/api/public/btcturk/orderbook?symbol=BTCTRY&depth=50" "orderbook_BTCTRY_50.json"

# Alternatif: Doğrudan executor üzerinden (eğer varsa)
Grab "Executor BTCTurk Ticker" "http://127.0.0.1:4001/api/public/btcturk/ticker?symbol=BTCTRY" "executor_ticker_BTCTRY.json"
Grab "Executor BTCTurk Orderbook" "http://127.0.0.1:4001/api/public/btcturk/orderbook?symbol=BTCTRY&depth=50" "executor_orderbook_BTCTRY_50.json"

# Servis sağlık durumu
Write-Host "🏥 Servis sağlık durumu kontrol ediliyor..." -ForegroundColor Yellow
(Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:3003/api/public/health").Content `
  | Out-File "$EVID\web_health.json"
(Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/health").Content `
  | Out-File "$EVID\exec_health.json"

Write-Host "✅ BTCTurk smoke tamamlandı. Evidence: $EVID" -ForegroundColor Green
