# Evidence Freshness Log Script
# Collects marketdata and executor status for 2-3 minutes to prove freshness

$logFile = "evidence_freshness.log"
$iterations = 40
$sleepSeconds = 5

Write-Host "=== EVIDENCE FRESHNESS LOG ===" -ForegroundColor Cyan
Write-Host "Collecting $iterations iterations (every ${sleepSeconds}s)..." -ForegroundColor Yellow
Write-Host "Output: $logFile" -ForegroundColor Gray
Write-Host ""

# Clear previous log
if (Test-Path $logFile) {
    Remove-Item $logFile
}

for ($i = 0; $i -lt $iterations; $i++) {
    $timestamp = Get-Date -Format "o"
    
    try {
        $md = Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/marketdata/latest?symbol=BTCUSDT&timeframe=1m" -ErrorAction Stop
        $mdJson = $md | ConvertTo-Json -Compress
        "$timestamp MD=$mdJson" | Out-File -Append $logFile
    } catch {
        "$timestamp MD=ERROR: $_" | Out-File -Append $logFile
    }
    
    try {
        $ex = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/exec/status" -ErrorAction Stop
        $exJson = $ex | ConvertTo-Json -Compress
        "$timestamp EX=$exJson" | Out-File -Append $logFile
    } catch {
        "$timestamp EX=ERROR: $_" | Out-File -Append $logFile
    }
    
    Write-Host "[$($i + 1)/$iterations] Logged" -ForegroundColor Gray
    Start-Sleep -Seconds $sleepSeconds
}

Write-Host ""
Write-Host "✅ Evidence collection complete!" -ForegroundColor Green
Write-Host "Log file: $logFile" -ForegroundColor Cyan
Write-Host "`nTo analyze:" -ForegroundColor Yellow
Write-Host "  Get-Content $logFile | Select-String 'candleAgeSec|marketdataAgeSec|degraded'" -ForegroundColor Gray
