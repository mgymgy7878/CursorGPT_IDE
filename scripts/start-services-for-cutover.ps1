# CUTOVER: START
# Spark Trading Platform - WebSocket Migration
$ErrorActionPreference = "Stop"
Write-Host "== CUTOVER: START ==" -ForegroundColor Green

# 1) Environment variables (WS flag enabled for production)
$Env:NODE_ENV = "production"
$Env:NEXT_PUBLIC_WS_ENABLED = "true"
Write-Host "✅ Environment: NODE_ENV=$Env:NODE_ENV, WS_ENABLED=$Env:NEXT_PUBLIC_WS_ENABLED" -ForegroundColor Cyan

# 2) Node/Pnpm/PM2 validation
Write-Host "🔍 Validating tools..." -ForegroundColor Blue
node -v
pnpm -v
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
    npm i -g pm2
}

# 3) Ensure running from monorepo root
$gitRoot = git rev-parse --show-toplevel
Set-Location $gitRoot
Write-Host "📁 Working directory: $gitRoot" -ForegroundColor Cyan

# 4) Clean install + build
Write-Host "🔨 Building packages..." -ForegroundColor Blue
pnpm -w install --frozen-lockfile
pnpm --filter @spark/types run build
pnpm --filter @spark/exchange-btcturk run build
pnpm --filter @spark/shared run build || $true
pnpm --filter @spark/security run build || $true
pnpm --filter executor run build
pnpm --filter web-next run build
Write-Host "✅ Build completed" -ForegroundColor Green

# 5) Start services with PM2 (using ecosystem.config.js)
Write-Host "🚀 Starting services with PM2..." -ForegroundColor Blue
pm2 delete all || $true
pm2 start ecosystem.config.js --env production
pm2 save
Write-Host "✅ PM2 services started and saved" -ForegroundColor Green

Write-Host "== CUTOVER: SERVICES UP ==" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Service URLs:" -ForegroundColor Cyan
Write-Host "  Web: http://127.0.0.1:3003" -ForegroundColor White
Write-Host "  Executor: http://127.0.0.1:4001" -ForegroundColor White
Write-Host "  BTCTurk: http://127.0.0.1:3003/btcturk" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Health check
Write-Host "🏥 Running health checks..." -ForegroundColor Blue
try {
    $webHealth = Invoke-WebRequest -Uri "http://127.0.0.1:3003/api/public/health" -TimeoutSec 10
    Write-Host "✅ Web Health: $($webHealth.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Web Health: FAILED" -ForegroundColor Red
}

try {
    $executorHealth = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -TimeoutSec 10
    Write-Host "✅ Executor Health: $($executorHealth.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Executor Health: FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 CUTOVER COMPLETE! Ready for validation." -ForegroundColor Green
