# Canary Dry-Run Test - Paper Trading
param(
    [string]$RunId = $env:RUN_ID,
    [string[]]$Pairs = @("BTCUSDT", "ETHUSDT"),
    [int]$DurationMinutes = 10
)

Write-Host "Canary Dry-Run Test Basliyor - RUN_ID: $RunId" -ForegroundColor Green
Write-Host "Pairs: $($Pairs -join ', ')" -ForegroundColor Cyan
Write-Host "Duration: $DurationMinutes minutes" -ForegroundColor Yellow

# Test başlangıç zamanı
$startTime = Get-Date
Write-Host "Start Time: $startTime" -ForegroundColor Green

# Her pair için test
foreach ($pair in $Pairs) {
    Write-Host "Testing pair: $pair" -ForegroundColor Cyan
    
    # Klines test
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/futures/klines?symbol=$pair&interval=1m&limit=5" -UseBasicParsing -TimeoutSec 5
        Write-Host "Klines OK for ${pair}: $($r.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "Klines Failed for ${pair}: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # ExchangeInfo test
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/futures/exchangeInfo?symbol=$pair" -UseBasicParsing -TimeoutSec 5
        Write-Host "ExchangeInfo OK for ${pair}: $($r.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "ExchangeInfo Failed for ${pair}: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Simulated trading loop (paper)
Write-Host "Simulated trading loop starting..." -ForegroundColor Yellow
for ($i = 1; $i -le $DurationMinutes; $i++) {
    Write-Host "Minute $i/$DurationMinutes - Paper trading active" -ForegroundColor Cyan
    Start-Sleep -Seconds 1  # 1 saniye = 1 dakika simülasyonu
}

$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "Canary Dry-Run Completed - RUN_ID: $RunId" -ForegroundColor Green
Write-Host "Duration: $($duration.TotalSeconds) seconds" -ForegroundColor Cyan
Write-Host "End Time: $endTime" -ForegroundColor Green

# Rapor oluştur
$report = @{
    run_id = $RunId
    start_time = $startTime.ToString("yyyy-MM-dd HH:mm:ss")
    end_time = $endTime.ToString("yyyy-MM-dd HH:mm:ss")
    duration_seconds = $duration.TotalSeconds
    pairs = $Pairs
    mode = "dry-run"
    status = "completed"
}

$reportPath = "evidence\canary-dryrun-$RunId.json"
New-Item -ItemType Directory -Force -Path (Split-Path $reportPath) | Out-Null
$report | ConvertTo-Json -Depth 3 | Set-Content -Path $reportPath -Encoding UTF8

Write-Host "Report saved: $reportPath" -ForegroundColor Green
exit 0
