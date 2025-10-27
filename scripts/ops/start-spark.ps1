# --- Spark quick start (UI:3003, API:4001) ---
$ErrorActionPreference = "Stop"
Set-Location "C:\dev\CursorGPT_IDE"

# 0) Ortam
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { throw "pnpm yok. Node 20+ ve pnpm 8+ kur." }
if (-not (Get-Command pm2  -ErrorAction SilentlyContinue)) { npm i -g pm2 }

# 1) Bağımlılıklar (gerekirse hızlı doğrulama)
if (-not (Test-Path "node_modules")) { pnpm install }

# 2) PM2 ile başlat
pm2 start ecosystem.config.cjs --silent

# 3) Sağlık doğrulaması
Start-Sleep -Seconds 3
$api  = (curl http://127.0.0.1:4001/health    -UseBasicParsing).Content
$ui   = (curl http://127.0.0.1:3003           -UseBasicParsing).StatusCode
$btct = (curl "http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY" -UseBasicParsing).Content

"--- SPARK START EVIDENCE ---"
"API /health  : $api"
"UI          : HTTP $ui"
"BTCTRY mock : $btct"
"PM2 status  :"
pm2 status

