# ═══════════════════════════════════════════════════════════
# CANARY TEST COMMANDS - Node 20 Setup Sonrası
# ═══════════════════════════════════════════════════════════

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           CANARY DOĞRULAMA TESTLERİ                     ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ─── TEST 1: Health Check ──────────────────────────────────
Write-Host "TEST 1: Health Endpoint..." -ForegroundColor Yellow
try {
    $health = (Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✅ HTTP 200" -ForegroundColor Green
    Write-Host "   mode: $($health.mode)" -ForegroundColor Gray
    Write-Host "   realRoutes: [$($health.realRoutes -join ',')]" -ForegroundColor Gray
    Write-Host "   version: $($health.version)`n" -ForegroundColor Gray
    
    if ($health.realRoutes -contains 'run') {
        Write-Host "   ✅ REAL_ROUTES aktif!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  REAL_ROUTES boş, mock mode!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

# ─── TEST 2: Real Backtest ─────────────────────────────────
Write-Host "`nTEST 2: Gerçek Backtest (mock=false check)..." -ForegroundColor Yellow
try {
    $body = @{
        symbol = 'BTCUSDT'
        timeframe = '15m'
        start = '2024-01-01'
        end = '2024-01-03'
        exchange = 'binance'
        useCache = $true
        config = @{
            indicators = @{
                emaFast = 20
                emaSlow = 50
                atr = 14
            }
        }
    } | ConvertTo-Json -Depth 10
    
    $response = (Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/run" -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing -TimeoutSec 30).Content | ConvertFrom-Json
    
    Write-Host "✅ HTTP 200" -ForegroundColor Green
    Write-Host "   mock: $($response.mock)" -ForegroundColor $(if ($response.mock -eq $false) { "Green" } else { "Yellow" })
    
    if ($response.mock -eq $false) {
        Write-Host "   🎉 GERÇEK BACKTEST ÇALIŞIYOR!" -ForegroundColor Green
        if ($response.metrics) {
            Write-Host "`n   Metrics:" -ForegroundColor Gray
            Write-Host "     PnL: $($response.metrics.pnl)" -ForegroundColor Gray
            Write-Host "     Win Rate: $(($response.metrics.winrate * 100).ToString('0.00'))%" -ForegroundColor Gray
            Write-Host "     Sharpe: $($response.metrics.sharpe)" -ForegroundColor Gray
            Write-Host "     Max DD: $($response.metrics.maxdd)%" -ForegroundColor Gray
            Write-Host "     Trades: $($response.metrics.trades)`n" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Hâlâ mock mode!`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

# ─── TEST 3: Metrics Snapshot ──────────────────────────────
Write-Host "TEST 3: Metrics Endpoint..." -ForegroundColor Yellow
try {
    $metrics = (Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing).Content
    $cacheHit = ($metrics -split "`n" | Select-String "^spark_backtest_cache_hit_total" | Select-Object -First 1) -replace '\D+',''
    Write-Host "✅ HTTP 200" -ForegroundColor Green
    Write-Host "   Cache hits: $cacheHit`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

# ─── FINAL REPORT ──────────────────────────────────────────
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "           🎯 MÜHÜR CÜMLESİ (PAYLAŞ)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

try {
    $h = (Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -UseBasicParsing).Content | ConvertFrom-Json
    $b = @{symbol='BTCUSDT';timeframe='15m';start='2024-01-01';end='2024-01-02'} | ConvertTo-Json
    $r = (Invoke-WebRequest -Uri "http://127.0.0.1:4001/backtest/run" -Method POST -ContentType 'application/json' -Body $b -UseBasicParsing -TimeoutSec 30).Content | ConvertFrom-Json
    
    if ($h.realRoutes -contains 'run' -and $r.mock -eq $false) {
        Write-Host "CANARY-HYBRID ✅ /health: mode=$($h.mode) realRoutes=[$($h.realRoutes -join ',')], /backtest/run: mock=false" -ForegroundColor Green
        Write-Host "`n🎉 CANARY BAŞARILI! Bu satırı paylaş." -ForegroundColor Green
    } else {
        Write-Host "CANARY-HYBRID ⚠️  /health: mode=$($h.mode) realRoutes=[$($h.realRoutes -join ',')], /backtest/run: mock=$($r.mock)" -ForegroundColor Yellow
        Write-Host "`n⚠️  Mock mode hâlâ aktif, troubleshooting gerekli." -ForegroundColor Yellow
    }
} catch {
    Write-Host "CANARY-HYBRID ❌ Tests failed: $_" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

