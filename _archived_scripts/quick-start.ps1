# quick-start.ps1
$ErrorActionPreference = "Stop"
Set-Location -Path "$PSScriptRoot"

Write-Host "🚀 Spark Trading Platform - Quick Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# 1) Husky kapalı
$env:HUSKY = "0"
Write-Host "✅ Husky disabled" -ForegroundColor Green

# 2) Bağımlılıklar
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm i

# 3) Derleme
Write-Host "🔨 Building project..." -ForegroundColor Yellow
pnpm -w build

# 4) Executor (4001)
Write-Host "`n==> Starting Executor (4001)" -ForegroundColor Cyan
Start-Process -NoNewWindow -PassThru -FilePath "node" -ArgumentList "services/executor/dist/index.cjs" | Out-Null
Start-Sleep -Seconds 3

# 5) Health dumanı
Write-Host "🔍 Testing Executor health..." -ForegroundColor Yellow
try {
  $resp = Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/health"
  Write-Host "✅ Executor /health: $($resp.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "❌ Executor /health FAILED" -ForegroundColor Red
  Write-Host "Trying to start executor manually..." -ForegroundColor Yellow
  Set-Location "services/executor"
  Start-Process -NoNewWindow -PassThru -FilePath "pnpm" -ArgumentList "dev"
  Set-Location "../.."
  Start-Sleep -Seconds 5
}

# 6) UI (4000): executora bağla
Write-Host "`n==> Starting UI (4000)" -ForegroundColor Cyan
$env:EXECUTOR_BASE_URL = "http://127.0.0.1:4001"
Set-Location "apps/web-next"

# dev:ui mevcutsa onu kullan; yoksa pnpm dev
$pkg = (Get-Content package.json -Raw | ConvertFrom-Json)
if ($pkg.scripts."dev:ui") { 
  Write-Host "Using dev:ui script..." -ForegroundColor Yellow
  pnpm run dev:ui 
} else { 
  Write-Host "Using pnpm dev..." -ForegroundColor Yellow
  pnpm dev 
}

Write-Host "`n🎉 Spark Platform Started!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Executor: http://127.0.0.1:4001" -ForegroundColor Cyan
Write-Host "UI: http://127.0.0.1:4000" -ForegroundColor Cyan
Write-Host "Admin Params: http://127.0.0.1:4000/admin/params" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop services" -ForegroundColor Yellow
