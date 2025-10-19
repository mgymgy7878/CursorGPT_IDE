$ErrorActionPreference = "Stop"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$evi = Join-Path $root "evidence\smoke_$ts"
New-Item -ItemType Directory -Force -Path $evi | Out-Null

# 0) Ortam
Write-Host ">> ENV SNAPSHOT"
@"
NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
PORT_UI=3003
EXECUTOR_URL=${env:EXECUTOR_URL}
"@ | Out-File -Encoding utf8 -FilePath (Join-Path $evi "env.txt")

# 1) UI Dev başlat (yoksa) — kullanıcı zaten çalıştırdıysa geçer
Write-Host ">> Ensure UI dev on :3003 (best effort)"
Start-Job -Name spark-web-next -ScriptBlock {
  Set-Location "$using:root\apps\web-next"
  pnpm dev
} | Out-Null
Start-Sleep -Seconds 5

# 2) Executor health
Write-Host ">> Executor health"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/health -OutFile (Join-Path $evi "executor_health.json")

# 3) Backtest proxy testleri (UI üzerinden)
Write-Host ">> Backtest/run"
$bodyRun = '{"symbol":"BTCUSDT","timeframe":"1h","from":"2024-05-01","to":"2024-06-01"}'
Invoke-WebRequest -UseBasicParsing -Method Post -ContentType "application/json" `
  -Body $bodyRun -Uri http://127.0.0.1:3003/api/backtest/run `
  -OutFile (Join-Path $evi "backtest_run.json")

Write-Host ">> Backtest/walkforward"
$bodyWF = '{"symbol":"BTCUSDT","timeframe":"4h","from":"2024-01-01","to":"2024-03-01"}'
Invoke-WebRequest -UseBasicParsing -Method Post -ContentType "application/json" `
  -Body $bodyWF -Uri http://127.0.0.1:3003/api/backtest/walkforward `
  -OutFile (Join-Path $evi "backtest_walkforward.json")

Write-Host ">> Backtest/portfolio"
$bodyPF = '{"symbols":["BTCUSDT","ETHUSDT"],"timeframe":"1h","from":"2024-02-01","to":"2024-03-01"}'
Invoke-WebRequest -UseBasicParsing -Method Post -ContentType "application/json" `
  -Body $bodyPF -Uri http://127.0.0.1:3003/api/backtest/portfolio `
  -OutFile (Join-Path $evi "backtest_portfolio.json")

# 4) Portfolio API route (UI → EXECUTOR_URL)
Write-Host ">> Portfolio API"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/api/portfolio `
  -OutFile (Join-Path $evi "portfolio_api.json")

# 5) SSE akışı (first 30 lines)
Write-Host ">> SSE stream sample"
$sseOut = Join-Path $evi "sse_stream_sample.txt"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList @(
  "-NoProfile","-Command",
  "Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3003/api/marketdata/stream?symbol=BTCUSDT&timeframe=1m' -OutFile $sseOut"
) ; Start-Sleep 3 ; Get-Content $sseOut -TotalCount 30 | Set-Content (Join-Path $evi "sse_head.txt")

# 6) Metrics
Write-Host ">> /metrics snapshot"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/metrics `
  -OutFile (Join-Path $evi "executor_metrics.prom")

# 7) Logs topla
Write-Host ">> Collect logs"
powershell -ExecutionPolicy Bypass -File "$root\scripts\collect-logs.ps1" "$evi"

# 8) Özet
Write-Host ">> DONE: $evi"


