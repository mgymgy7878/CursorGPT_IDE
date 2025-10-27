# QUICK DIAGNOSTIC - Portfolio Sprint
# Single-line troubleshooting for common issues
# chatgpt + cursor

param(
    [string]$Issue = "all"
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QUICK DIAGNOSTIC - PORTFOLIO SPRINT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-PortfolioAPI {
    Write-Host "📋 Diagnosing: Portfolio API" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $response = Invoke-WebRequest "http://localhost:4001/api/portfolio" -UseBasicParsing -TimeoutSec 10
        $data = $response.Content | ConvertFrom-Json
        
        if ($data.accounts.Length -eq 0) {
            Write-Host "✗ ISSUE: API returned empty accounts" -ForegroundColor Red
            Write-Host ""
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  1. API keys not configured in .env" -ForegroundColor White
            Write-Host "  2. API keys invalid or expired" -ForegroundColor White
            Write-Host "  3. API keys don't have read-only permission" -ForegroundColor White
            Write-Host "  4. Time synchronization issue (clock skew)" -ForegroundColor White
            Write-Host ""
            Write-Host "Quick fixes:" -ForegroundColor Cyan
            Write-Host "  • Check .env: type services\executor\.env" -ForegroundColor White
            Write-Host "  • Verify keys: curl https://api.binance.com/api/v3/account" -ForegroundColor White
            Write-Host "  • Sync time: w32tm /resync" -ForegroundColor White
        } else {
            Write-Host "✓ API returned $($data.accounts.Length) account(s)" -ForegroundColor Green
            foreach ($acc in $data.accounts) {
                Write-Host "  $($acc.exchange): $($acc.totals.totalUsd) USD" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "✗ ERROR: Cannot connect to Portfolio API" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Quick fixes:" -ForegroundColor Cyan
        Write-Host "  • Check executor running: Get-Job | Where-Object { `$_.Name -like '*executor*' }" -ForegroundColor White
        Write-Host "  • Check port: netstat -ano | findstr ':4001'" -ForegroundColor White
        Write-Host "  • Restart: .\durdur.ps1 && .\basla.ps1" -ForegroundColor White
    }
    Write-Host ""
}

function Test-Metrics {
    Write-Host "📊 Diagnosing: Prometheus Metrics" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $metrics = Invoke-WebRequest "http://localhost:4001/metrics" -UseBasicParsing -TimeoutSec 5
        $content = $metrics.Content
        
        $portfolioMetrics = $content | Select-String -Pattern "spark_portfolio" -AllMatches
        
        if ($portfolioMetrics.Matches.Count -eq 0) {
            Write-Host "✗ ISSUE: No portfolio metrics found" -ForegroundColor Red
            Write-Host ""
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  1. Metrics not initialized (cold start)" -ForegroundColor White
            Write-Host "  2. Portfolio API never called" -ForegroundColor White
            Write-Host "  3. Metrics module not loaded" -ForegroundColor White
            Write-Host ""
            Write-Host "Quick fixes:" -ForegroundColor Cyan
            Write-Host "  • Trigger metrics: curl http://localhost:4001/api/portfolio" -ForegroundColor White
            Write-Host "  • Wait 10s and retry: Start-Sleep 10; curl http://localhost:4001/metrics" -ForegroundColor White
            Write-Host "  • Check logs: Receive-Job -Name spark-executor -Keep | Select-Object -Last 50" -ForegroundColor White
        } else {
            Write-Host "✓ Found $($portfolioMetrics.Matches.Count) portfolio metric lines" -ForegroundColor Green
            
            # Check specific metrics
            $requiredMetrics = @(
                "spark_portfolio_refresh_latency_ms",
                "spark_portfolio_total_value_usd",
                "spark_portfolio_asset_count",
                "spark_portfolio_last_update_timestamp"
            )
            
            foreach ($metric in $requiredMetrics) {
                if ($content -match $metric) {
                    Write-Host "  ✓ $metric" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ $metric (missing)" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "✗ ERROR: Cannot fetch metrics" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Quick fixes:" -ForegroundColor Cyan
        Write-Host "  • Same as Portfolio API issues (executor not running)" -ForegroundColor White
    }
    Write-Host ""
}

function Test-Grafana {
    Write-Host "📈 Diagnosing: Grafana Dashboard" -ForegroundColor Yellow
    Write-Host ""
    
    # Check Prometheus first
    try {
        $promTargets = Invoke-WebRequest "http://localhost:9090/api/v1/targets" -UseBasicParsing -TimeoutSec 5
        $targetsData = $promTargets.Content | ConvertFrom-Json
        
        $executorTarget = $targetsData.data.activeTargets | Where-Object { $_.labels.job -eq "spark-executor" }
        
        if (!$executorTarget) {
            Write-Host "✗ ISSUE: Prometheus target 'spark-executor' not found" -ForegroundColor Red
            Write-Host ""
            Write-Host "Possible causes:" -ForegroundColor Yellow
            Write-Host "  1. Prometheus scrape config missing" -ForegroundColor White
            Write-Host "  2. Wrong job name in prometheus.yml" -ForegroundColor White
            Write-Host ""
            Write-Host "Quick fixes:" -ForegroundColor Cyan
            Write-Host "  • Check config: type prometheus\prometheus.yml" -ForegroundColor White
            Write-Host "  • Reload Prometheus: curl -X POST http://localhost:9090/-/reload" -ForegroundColor White
        } elseif ($executorTarget.health -ne "up") {
            Write-Host "✗ ISSUE: Prometheus target DOWN" -ForegroundColor Red
            Write-Host "  Last error: $($executorTarget.lastError)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Quick fixes:" -ForegroundColor Cyan
            Write-Host "  • Check executor health: curl http://localhost:4001/health" -ForegroundColor White
            Write-Host "  • Check network: Test-NetConnection localhost -Port 4001" -ForegroundColor White
        } else {
            Write-Host "✓ Prometheus: executor target UP" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ ERROR: Prometheus not running" -ForegroundColor Red
        Write-Host ""
        Write-Host "Quick fixes:" -ForegroundColor Cyan
        Write-Host "  • Start Prometheus: docker compose up -d prometheus" -ForegroundColor White
        Write-Host "  • Check Docker: docker ps | findstr prometheus" -ForegroundColor White
    }
    
    # Check Grafana
    try {
        $grafana = Invoke-WebRequest "http://localhost:3005/api/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ Grafana: Running" -ForegroundColor Green
        
        # Check datasource
        try {
            $datasources = Invoke-WebRequest "http://localhost:3005/api/datasources" `
                -Headers @{ "Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin")) } `
                -UseBasicParsing -TimeoutSec 5
            $dsData = $datasources.Content | ConvertFrom-Json
            
            $promDs = $dsData | Where-Object { $_.type -eq "prometheus" }
            if ($promDs) {
                Write-Host "✓ Grafana: Prometheus datasource configured" -ForegroundColor Green
            } else {
                Write-Host "✗ Grafana: Prometheus datasource missing" -ForegroundColor Red
                Write-Host "  Add datasource: http://localhost:3005/datasources/new" -ForegroundColor White
            }
        } catch {
            Write-Host "⚠ Grafana: Cannot check datasources (auth issue?)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ ERROR: Grafana not running" -ForegroundColor Red
        Write-Host ""
        Write-Host "Quick fixes:" -ForegroundColor Cyan
        Write-Host "  • Start Grafana: docker compose up -d grafana" -ForegroundColor White
        Write-Host "  • Check Docker: docker ps | findstr grafana" -ForegroundColor White
    }
    Write-Host ""
}

function Test-Errors {
    Write-Host "🔍 Diagnosing: Common Errors" -ForegroundColor Yellow
    Write-Host ""
    
    # Check executor logs for errors
    $executorJob = Get-Job | Where-Object { $_.Name -like "*executor*" } | Select-Object -First 1
    
    if (!$executorJob) {
        Write-Host "✗ Executor job not found" -ForegroundColor Red
        Write-Host "  Run: .\basla.ps1" -ForegroundColor White
        return
    }
    
    $logs = Receive-Job -Id $executorJob.Id -Keep 2>&1 | Out-String
    
    # Common error patterns
    $errorPatterns = @{
        "429" = @{
            name = "Rate Limit (429)"
            cause = "Too many requests to exchange API"
            fix = "• Increase refresh interval to 60s`n  • Add exponential backoff (future sprint)"
        }
        "ETIMEDOUT|timeout" = @{
            name = "Network Timeout"
            cause = "Slow network or exchange API down"
            fix = "• Check internet connection`n  • Increase timeout in connector`n  • Check exchange status page"
        }
        "ECONNREFUSED" = @{
            name = "Connection Refused"
            cause = "Exchange API blocking requests"
            fix = "• Check firewall/antivirus`n  • Verify API endpoint URL`n  • Check if testnet mode enabled by mistake"
        }
        "401|403|auth" = @{
            name = "Authentication Error"
            cause = "Invalid or expired API key"
            fix = "• Regenerate API key in exchange portal`n  • Update .env file`n  • Verify read-only permission enabled"
        }
        "signature" = @{
            name = "Signature Error"
            cause = "API secret incorrect or time skew"
            fix = "• Check API_SECRET in .env (Base64 for BTCTurk)`n  • Sync system time: w32tm /resync`n  • Check RECV_WINDOW setting"
        }
    }
    
    $foundErrors = @()
    foreach ($pattern in $errorPatterns.Keys) {
        if ($logs -match $pattern) {
            $foundErrors += $errorPatterns[$pattern]
        }
    }
    
    if ($foundErrors.Count -eq 0) {
        Write-Host "✓ No common errors found in logs" -ForegroundColor Green
    } else {
        Write-Host "⚠ Found $($foundErrors.Count) error pattern(s):" -ForegroundColor Yellow
        Write-Host ""
        foreach ($error in $foundErrors) {
            Write-Host "  ■ $($error.name)" -ForegroundColor Red
            Write-Host "    Cause: $($error.cause)" -ForegroundColor Gray
            Write-Host "    Fix:" -ForegroundColor Cyan
            $error.fix -split "`n" | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
            Write-Host ""
        }
    }
}

# Main execution
switch ($Issue.ToLower()) {
    "api" { Test-PortfolioAPI }
    "metrics" { Test-Metrics }
    "grafana" { Test-Grafana }
    "errors" { Test-Errors }
    "all" {
        Test-PortfolioAPI
        Test-Metrics
        Test-Grafana
        Test-Errors
    }
    default {
        Write-Host "Unknown issue: $Issue" -ForegroundColor Red
        Write-Host "Usage: .\scripts\quick-diagnostic.ps1 [-Issue <api|metrics|grafana|errors|all>]" -ForegroundColor Yellow
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed troubleshooting, see:" -ForegroundColor Gray
Write-Host "  • PORTFOLIO_ENTEGRASYON_REHBERI.md (section: Sorun Giderme)" -ForegroundColor White
Write-Host "  • Executor logs: Receive-Job -Name spark-executor -Keep" -ForegroundColor White
Write-Host "  • Evidence collection: .\scripts\portfolio-sprint-evidence.ps1" -ForegroundColor White
Write-Host ""

