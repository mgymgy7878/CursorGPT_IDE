Param(
  [string]$ExecutorBase = "https://testnet.binancefuture.com",
  [string]$ExecutorPrefix = "/fapi/v1",
  [string]$ExecutorHost = "http://127.0.0.1:4001"
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$execEnv = Join-Path $root "services/executor/.env.local"
$webEnv  = Join-Path $root "apps/web-next/.env.local"

$execContent = @"
BINANCE_FUTURES_BASE_URL=$ExecutorBase
BINANCE_FUTURES_PREFIX=$ExecutorPrefix
BINANCE_FUTURES_API_KEY=
BINANCE_FUTURES_API_SECRET=
BINANCE_FUTURES_RECV_WINDOW=5000

LIVE_TRADING=false
LIVE_FUTURES_ENABLED=false
MAX_LEVERAGE_DEFAULT=5
MAX_NOTIONAL_USDT=25
"@

$webContent = @"
NEXT_PUBLIC_EXECUTOR_BASE=$ExecutorHost
"@

New-Item -ItemType Directory -Path (Split-Path $execEnv) -Force | Out-Null
Set-Content -Path $execEnv -Value $execContent -Encoding UTF8

New-Item -ItemType Directory -Path (Split-Path $webEnv) -Force | Out-Null
Set-Content -Path $webEnv -Value $webContent -Encoding UTF8

Write-Host "[OK] .env.local files written:" -ForegroundColor Green
Write-Host "  - $execEnv"
Write-Host "  - $webEnv"
