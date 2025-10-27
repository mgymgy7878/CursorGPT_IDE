# 24H MONITORING LOOP - Automated Health Checks
# Runs periodic checks every 6 hours and logs status
# chatgpt + cursor collaboration

param(
    [string]$Prom = "http://localhost:9090",
    [string]$Env = "development",
    [string]$LogFile = "evidence\portfolio\monitoring_24h.log"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  24H MONITORING LOOP" -ForegroundColor Cyan
Write-Host "  (Periodic Health Checks)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $root "..")
$logPath = Join-Path $repo $LogFile

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Prometheus: $Prom" -ForegroundColor Gray
Write-Host "  Environment: $Env" -ForegroundColor Gray
Write-Host "  Log file: $logPath" -ForegroundColor Gray
Write-Host "  Check interval: 6 hours" -ForegroundColor Gray
Write-Host "  Total duration: 24 hours" -ForegroundColor Gray
Write-Host ""

# Create log file
New-Item -ItemType File -Path $logPath -Force | Out-Null
"24H MONITORING LOG - Started $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Add-Content $logPath
"" | Add-Content $logPath

# Query helper
function Query-Prometheus($expr) {
    try {
        $response = Invoke-WebRequest -Uri "$Prom/api/v1/query?query=$([uri]::EscapeDataString($expr))" -UseBasicParsing -TimeoutSec 5
        $result = ($response.Content | ConvertFrom-Json)
        if ($result.data.result.Count -gt 0) {
            return $result.data.result[0].value[1]
        }
        return $null
    } catch {
        return $null
    }
}

# Health check function
function Run-HealthCheck {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $checkNum = $args[0]
    
    Write-Host "[$timestamp] Check #$checkNum/4" -ForegroundColor Cyan
    "[$timestamp] Check #$checkNum/4" | Add-Content $logPath
    
    # Query metrics
    $p95 = Query-Prometheus "job:spark_portfolio_latency_p95:5m{environment=""$Env""}"
    $stale = Query-Prometheus "max(job:spark_portfolio_staleness{environment=""$Env""})"
    $err = Query-Prometheus "sum(job:spark_exchange_api_error_rate:5m{environment=""$Env""})"
    $tv = Query-Prometheus "sum(job:spark_portfolio_total_value:current{environment=""$Env""})"
    
    $p95 = if ($p95) { [int]([double]$p95) } else { 0 }
    $stale = if ($stale) { [int]([double]$stale) } else { 0 }
    $err = if ($err) { [double]$err } else { 0.0 }
    $tv = if ($tv) { [double]$tv } else { 0.0 }
    
    # Status determination
    $status = "🟢 GREEN"
    $issues = @()
    
    if ($p95 -gt 3000 -or $stale -gt 300 -or $err -gt 0.05) {
        $status = "🔴 RED"
        if ($p95 -gt 3000) { $issues += "Latency CRITICAL" }
        if ($stale -gt 300) { $issues += "Staleness CRITICAL" }
        if ($err -gt 0.05) { $issues += "Error rate CRITICAL" }
    } elseif ($p95 -gt 1500 -or $stale -gt 60 -or $err -gt 0.01) {
        $status = "🟡 YELLOW"
        if ($p95 -gt 1500) { $issues += "Latency WARNING" }
        if ($stale -gt 60) { $issues += "Staleness WARNING" }
        if ($err -gt 0.01) { $issues += "Error rate WARNING" }
    }
    
    # Log and display
    $logLine = "  Status: $status | p95: $p95 ms, stale: $stale s, err: $("{0:N4}" -f $err)/s, value: `$$("{0:N0}" -f $tv)"
    Write-Host $logLine
    $logLine | Add-Content $logPath
    
    if ($issues.Count -gt 0) {
        $issueText = "  Issues: $($issues -join ', ')"
        Write-Host $issueText -ForegroundColor Yellow
        $issueText | Add-Content $logPath
    }
    
    "" | Add-Content $logPath
    Write-Host ""
    
    return $status
}

# Run checks every 6 hours (4 checks in 24h)
$checkInterval = 6 * 60 * 60  # 6 hours in seconds
$checkCount = 0

while ($true) {
    $checkCount++
    $status = Run-HealthCheck $checkCount
    
    # If we've done 4 checks (24 hours), we're done
    if ($checkCount -ge 4) {
        break
    }
    
    # If critical status, recommend immediate action
    if ($status -eq "🔴 RED") {
        Write-Host "⚠️  CRITICAL STATUS DETECTED!" -ForegroundColor Red
        Write-Host "Recommend running: .\scripts\quick-diagnostic.ps1" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Wait for next check
    $nextCheck = (Get-Date).AddSeconds($checkInterval)
    Write-Host "Next check: $($nextCheck.ToString("yyyy-MM-dd HH:mm:ss")) (in 6 hours)" -ForegroundColor Gray
    Write-Host "Sleeping..." -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep $checkInterval
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  24H MONITORING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Log file: $logPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review log: type $logPath" -ForegroundColor White
Write-Host "  2. Generate 24h report: .\scripts\render-24h-report-v2.ps1" -ForegroundColor White
Write-Host "  3. Auto-tune alerts: .\scripts\alert-autotune-v2.ps1 -PerExchange" -ForegroundColor White
Write-Host ""

