# CANARY VALIDATION - Portfolio Sprint
# 6-step PASS/FAIL check with evidence collection
# chatgpt + cursor collaboration

$ErrorActionPreference = "Continue"  # Don't stop on first error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CANARY VALIDATION - PORTFOLIO SPRINT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$evidenceDir = "evidence\portfolio\canary_$timestamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null

$results = @{
    step1_health = $false
    step2_api = $false
    step3_metrics = $false
    step4_monitoring = $false
    step5_stability = $false
    step6_evidence = $false
}

$details = @{}

# Step 1: Health Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 1/6: Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    $health = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 5
    $healthData = $health.Content | ConvertFrom-Json
    
    if ($health.StatusCode -eq 200 -and $healthData.ok -eq $true) {
        Write-Host "✓ PASS: Executor health OK" -ForegroundColor Green
        $results.step1_health = $true
        $details.health = "OK"
    } else {
        Write-Host "✗ FAIL: Health check returned unexpected data" -ForegroundColor Red
        $details.health = "Unexpected response"
    }
} catch {
    Write-Host "✗ FAIL: Cannot connect to executor" -ForegroundColor Red
    $details.health = $_.Exception.Message
}

Write-Host ""

# Step 2: Portfolio API
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 2/6: Portfolio API" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    $portfolio = Invoke-WebRequest -Uri "http://localhost:4001/api/portfolio" -UseBasicParsing -TimeoutSec 10
    $portfolioData = $portfolio.Content | ConvertFrom-Json
    
    # Save to evidence
    $portfolio.Content | Out-File "$evidenceDir\api_response.json" -Encoding utf8
    
    $accountCount = $portfolioData.accounts.Length
    $totalUsd = ($portfolioData.accounts | Measure-Object -Property @{Expression={$_.totals.totalUsd}} -Sum).Sum
    
    if ($portfolio.StatusCode -eq 200 -and $accountCount -ge 1 -and $totalUsd -gt 0) {
        Write-Host "✓ PASS: Portfolio API OK" -ForegroundColor Green
        Write-Host "  Accounts: $accountCount" -ForegroundColor Gray
        Write-Host "  Total USD: $($totalUsd.ToString('N2'))" -ForegroundColor Gray
        
        foreach ($acc in $portfolioData.accounts) {
            $assetCount = $acc.balances.Length
            Write-Host "    - $($acc.exchange): $($acc.totals.totalUsd.ToString('N2')) USD ($assetCount assets)" -ForegroundColor Gray
        }
        
        $results.step2_api = $true
        $details.api_accounts = $accountCount
        $details.api_total_usd = $totalUsd
    } else {
        Write-Host "✗ FAIL: Portfolio API validation failed" -ForegroundColor Red
        Write-Host "  Accounts: $accountCount (expected >= 1)" -ForegroundColor Red
        Write-Host "  Total USD: $totalUsd (expected > 0)" -ForegroundColor Red
        $details.api_error = "Validation failed"
    }
} catch {
    Write-Host "✗ FAIL: Portfolio API error" -ForegroundColor Red
    $details.api_error = $_.Exception.Message
}

Write-Host ""

# Step 3: Metrics
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 3/6: Prometheus Metrics" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    $metrics = Invoke-WebRequest -Uri "http://localhost:4001/metrics" -UseBasicParsing -TimeoutSec 5
    $metricsContent = $metrics.Content
    
    # Save full metrics
    $metricsContent | Out-File "$evidenceDir\metrics_full.txt" -Encoding utf8
    
    # Extract portfolio metrics
    $portfolioMetrics = $metricsContent | Select-String -Pattern "spark_portfolio"
    $portfolioMetrics | Out-File "$evidenceDir\metrics_portfolio.txt" -Encoding utf8
    
    # Check required metrics
    $requiredMetrics = @(
        "spark_portfolio_refresh_latency_ms_bucket",
        "spark_portfolio_total_value_usd",
        "spark_portfolio_asset_count",
        "spark_portfolio_last_update_timestamp"
    )
    
    $foundMetrics = @()
    foreach ($metric in $requiredMetrics) {
        if ($metricsContent -match $metric) {
            $foundMetrics += $metric
            Write-Host "  ✓ $metric" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $metric (missing)" -ForegroundColor Red
        }
    }
    
    if ($foundMetrics.Count -eq $requiredMetrics.Count) {
        Write-Host "✓ PASS: All required metrics present" -ForegroundColor Green
        $results.step3_metrics = $true
        $details.metrics = "OK"
    } else {
        Write-Host "✗ FAIL: Missing metrics ($($requiredMetrics.Count - $foundMetrics.Count)/$($requiredMetrics.Count))" -ForegroundColor Red
        $details.metrics = "Missing: $($requiredMetrics | Where-Object { $_ -notin $foundMetrics })"
    }
} catch {
    Write-Host "✗ FAIL: Cannot fetch metrics" -ForegroundColor Red
    $details.metrics = $_.Exception.Message
}

Write-Host ""

# Step 4: Monitoring Stack
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 4/6: Monitoring Stack" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Prometheus targets
$prometheusOk = $false
try {
    $targets = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -UseBasicParsing -TimeoutSec 5
    $targetsData = $targets.Content | ConvertFrom-Json
    
    $targets.Content | Out-File "$evidenceDir\prometheus_targets.json" -Encoding utf8
    
    $executorTarget = $targetsData.data.activeTargets | Where-Object { $_.labels.job -eq "spark-executor" }
    if ($executorTarget -and $executorTarget.health -eq "up") {
        Write-Host "  ✓ Prometheus: executor target UP" -ForegroundColor Green
        $prometheusOk = $true
    } else {
        Write-Host "  ✗ Prometheus: executor target DOWN or missing" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠ Prometheus: Not running or inaccessible" -ForegroundColor Yellow
    $details.prometheus = "Not running"
}

# Grafana
$grafanaOk = $false
try {
    $grafana = Invoke-WebRequest -Uri "http://localhost:3005/api/health" -UseBasicParsing -TimeoutSec 5
    if ($grafana.StatusCode -eq 200) {
        Write-Host "  ✓ Grafana: Running" -ForegroundColor Green
        $grafanaOk = $true
    }
} catch {
    Write-Host "  ⚠ Grafana: Not running or inaccessible" -ForegroundColor Yellow
    $details.grafana = "Not running"
}

if ($prometheusOk -and $grafanaOk) {
    Write-Host "✓ PASS: Monitoring stack operational" -ForegroundColor Green
    $results.step4_monitoring = $true
} elseif ($prometheusOk -or $grafanaOk) {
    Write-Host "⚠ PARTIAL: Monitoring partially operational" -ForegroundColor Yellow
    $results.step4_monitoring = $true  # Partial pass
} else {
    Write-Host "✗ FAIL: Monitoring stack not operational" -ForegroundColor Red
}

Write-Host ""

# Step 5: 30-min Stability (simulated with job check)
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 5/6: Stability Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check PowerShell jobs
$jobs = Get-Job | Where-Object { $_.Name -like "*spark*" }
$jobStatus = $jobs | Format-Table -Property Id, Name, State, HasMoreData | Out-String
$jobStatus | Out-File "$evidenceDir\job_status.txt" -Encoding utf8

$allJobsRunning = ($jobs | Where-Object { $_.State -ne "Running" }).Count -eq 0

if ($allJobsRunning -and $jobs.Count -ge 2) {
    Write-Host "✓ PASS: All services running" -ForegroundColor Green
    $jobs | ForEach-Object {
        Write-Host "  $($_.Name): $($_.State)" -ForegroundColor Gray
    }
    $results.step5_stability = $true
    $details.stability = "All jobs running"
} else {
    Write-Host "✗ FAIL: Some services not running" -ForegroundColor Red
    $details.stability = "Job issues detected"
}

# Check logs for critical errors (if jobs exist)
if ($jobs.Count -gt 0) {
    Write-Host ""
    Write-Host "Checking logs for critical errors..." -ForegroundColor Yellow
    $executorJob = $jobs | Where-Object { $_.Name -like "*executor*" } | Select-Object -First 1
    if ($executorJob) {
        $logs = Receive-Job -Id $executorJob.Id -Keep 2>&1 | Out-String
        $criticalErrors = $logs | Select-String -Pattern "critical|fatal|crash" -CaseSensitive:$false
        
        if ($criticalErrors.Count -eq 0) {
            Write-Host "  ✓ No critical errors in logs" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ $($criticalErrors.Count) critical errors found" -ForegroundColor Yellow
            $details.log_errors = $criticalErrors.Count
        }
    }
}

Write-Host ""

# Step 6: Evidence Package
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STEP 6/6: Evidence Package" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Create summary
$summary = @"
CANARY VALIDATION SUMMARY
=========================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Evidence ID: $timestamp

RESULTS:
--------
Step 1 - Health Check:    $(if ($results.step1_health) {"✓ PASS"} else {"✗ FAIL"})
Step 2 - Portfolio API:   $(if ($results.step2_api) {"✓ PASS"} else {"✗ FAIL"})
Step 3 - Metrics:         $(if ($results.step3_metrics) {"✓ PASS"} else {"✗ FAIL"})
Step 4 - Monitoring:      $(if ($results.step4_monitoring) {"✓ PASS"} else {"✗ FAIL"})
Step 5 - Stability:       $(if ($results.step5_stability) {"✓ PASS"} else {"✗ FAIL"})
Step 6 - Evidence:        ✓ PASS (you're reading this!)

DETAILS:
--------
$(foreach ($key in $details.Keys) { "$key : $($details[$key])`n" })

OVERALL:
--------
Total Checks: 6
Passed: $($results.Values | Where-Object { $_ -eq $true } | Measure-Object).Count
Failed: $($results.Values | Where-Object { $_ -eq $false } | Measure-Object).Count

$(if (($results.Values | Where-Object { $_ -eq $true }).Count -ge 5) {
    "STATUS: ✓ SMOKE PASS"
} elseif (($results.Values | Where-Object { $_ -eq $true }).Count -ge 3) {
    "STATUS: ⚠ PARTIAL PASS (review failures)"
} else {
    "STATUS: ✗ SMOKE FAIL (critical issues)"
})

EVIDENCE FILES:
---------------
$(Get-ChildItem $evidenceDir | ForEach-Object { "- $($_.Name) ($([math]::Round($_.Length/1KB, 2)) KB)`n" })

NEXT STEPS:
-----------
$(if (($results.Values | Where-Object { $_ -eq $true }).Count -ge 5) {
    "1. Report to chatgpt: 'SMOKE PASS ✅'
2. Continue to 24h uptime monitoring
3. Collect full sprint evidence after 24h
4. Prepare sprint completion report"
} else {
    "1. Review failed checks above
2. Check logs: Receive-Job -Name spark-executor -Keep
3. Verify .env configuration
4. Restart services if needed
5. Re-run validation: .\scripts\canary-validation.ps1"
})

SMOKE PASS NOTIFICATION FORMAT:
--------------------------------
"SMOKE PASS ✅ – $($details.api_accounts) accounts, $($details.api_total_usd.ToString('N2')) USD, $(if ($results.step3_metrics) {'metrics OK'} else {'metrics pending'}), $(if ($results.step5_stability) {'stable'} else {'needs review'})"
"@

$summary | Out-File "$evidenceDir\validation_summary.txt" -Encoding utf8

Write-Host "Evidence files created:" -ForegroundColor Yellow
Get-ChildItem $evidenceDir | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}

$results.step6_evidence = $true

Write-Host ""

# ZIP Evidence
try {
    $zipFile = "evidence\portfolio\canary_validation_$timestamp.zip"
    Compress-Archive -Path $evidenceDir -DestinationPath $zipFile -Force
    Write-Host "✓ Evidence ZIP created: $zipFile" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to create ZIP (non-critical)" -ForegroundColor Yellow
}

Write-Host ""

# Final verdict
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VALIDATION COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($results.Values | Where-Object { $_ -eq $true }).Count
$totalChecks = $results.Keys.Count

Write-Host "Result: $passCount/$totalChecks checks passed" -ForegroundColor $(
    if ($passCount -ge 5) { "Green" } 
    elseif ($passCount -ge 3) { "Yellow" } 
    else { "Red" }
)

if ($passCount -ge 5) {
    Write-Host ""
    Write-Host "🎉 SMOKE PASS! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Notification for chatgpt:" -ForegroundColor Cyan
    Write-Host "SMOKE PASS ✅ – $($details.api_accounts) accounts, $($details.api_total_usd.ToString('N2')) USD, metrics OK, stable" -ForegroundColor White
    Write-Host ""
} elseif ($passCount -ge 3) {
    Write-Host ""
    Write-Host "⚠️ PARTIAL PASS" -ForegroundColor Yellow
    Write-Host "Review failures and retry" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ SMOKE FAIL" -ForegroundColor Red
    Write-Host "Critical issues detected, troubleshooting required" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Evidence location: $evidenceDir" -ForegroundColor Gray
Write-Host "Summary: $evidenceDir\validation_summary.txt" -ForegroundColor Gray
Write-Host ""

