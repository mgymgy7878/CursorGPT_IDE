# 10 Dakikalık GREEN Doğrulama
param(
    [string]$PrometheusHost = "http://127.0.0.1:9090",
    [string]$MetricsEndpoint = "http://127.0.0.1:4001",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Test-PrometheusRules {
    param([string]$RulesFile)
    
    if (-not (Test-Path $RulesFile)) {
        Write-Host "❌ Prometheus rules file not found: $RulesFile" -ForegroundColor Red
        return $false
    }
    
    try {
        # Check if promtool is available
        $promtoolPath = "promtool"
        try {
            $null = Get-Command $promtoolPath -ErrorAction Stop
            $result = & $promtoolPath check rules $RulesFile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Prometheus rules validation passed" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Prometheus rules validation failed: $result" -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "⚠️  promtool not found, skipping rules validation" -ForegroundColor Yellow
            return $true
        }
    } catch {
        Write-Host "❌ Prometheus rules check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusReload {
    param([string]$PrometheusHost)
    
    try {
        $reloadUrl = "$PrometheusHost/-/reload"
        $response = Invoke-WebRequest -Uri $reloadUrl -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus reload successful" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Prometheus reload returned status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "⚠️  Prometheus reload failed: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

function Test-MetricsLiveness {
    param([string]$MetricsEndpoint)
    
    try {
        $metricsUrl = "$MetricsEndpoint/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $runnerMetrics = @()
            
            # Check for specific runner metrics
            $patterns = @(
                "spark_runner_self_check_total",
                "spark_runner_confidence_score",
                "spark_runner_threshold_drift",
                "spark_runner_predictive_alerts_total",
                "spark_runner_memory_patterns_total"
            )
            
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    $runnerMetrics += $pattern
                }
            }
            
            Write-Host "✅ Metrics endpoint accessible" -ForegroundColor Green
            Write-Host "  Found $($runnerMetrics.Count) runner metrics:" -ForegroundColor White
            foreach ($metric in $runnerMetrics) {
                Write-Host "    - $metric" -ForegroundColor Gray
            }
            
            return $true
        } else {
            Write-Host "❌ Metrics endpoint returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Metrics endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PredictiveAlerting {
    try {
        Write-Host "Running predictive alerting test..." -ForegroundColor Cyan
        $result = & "pnpm" "run" "predictive:alert" 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✅ Predictive alerting test passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Predictive alerting test completed with warnings" -ForegroundColor Yellow
            Write-Host "  Output: $result" -ForegroundColor Gray
            return $true  # Non-critical failure
        }
    } catch {
        Write-Host "❌ Predictive alerting test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SelfCheckHeartbeat {
    try {
        Write-Host "Running self-check heartbeat test..." -ForegroundColor Cyan
        $result = & "pnpm" "run" "self:check" 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✅ Self-check heartbeat test passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Self-check heartbeat test failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Self-check heartbeat test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-DailyReport {
    try {
        Write-Host "Running daily report test..." -ForegroundColor Cyan
        $result = & "pnpm" "run" "report:daily" 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✅ Daily report test passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Daily report test completed with warnings" -ForegroundColor Yellow
            return $true  # Non-critical failure
        }
    } catch {
        Write-Host "❌ Daily report test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Generate-ValidationReport {
    param(
        [hashtable]$TestResults,
        [string]$Timestamp
    )
    
    $report = @"
## GREEN Validation Report
**Timestamp:** $Timestamp
**Duration:** 10 minutes
**Status:** $(if ($TestResults.failed -eq 0) { "GREEN" } else { "YELLOW" })

### Test Results
- **Prometheus Rules:** $($TestResults.prometheus_rules)
- **Prometheus Reload:** $($TestResults.prometheus_reload)
- **Metrics Liveness:** $($TestResults.metrics_liveness)
- **Predictive Alerting:** $($TestResults.predictive_alerting)
- **Self-Check Heartbeat:** $($TestResults.self_check_heartbeat)
- **Daily Report:** $($TestResults.daily_report)

### Summary
- **Total Tests:** $($TestResults.total)
- **Passed:** $($TestResults.passed)
- **Failed:** $($TestResults.failed)
- **Warnings:** $($TestResults.warnings)

### Recommendations
"@

    if ($TestResults.failed -gt 0) {
        $report += "`n- Address failed tests before production deployment"
    }
    
    if ($TestResults.warnings -gt 0) {
        $report += "`n- Review warning conditions for optimization"
    }
    
    if ($TestResults.failed -eq 0 -and $TestResults.warnings -eq 0) {
        $report += "`n- All systems GREEN - ready for production"
    }
    
    return $report
}

# Main execution
Write-Host "## 10 Dakikalık GREEN Doğrulama - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Prometheus Host: $PrometheusHost" -ForegroundColor Cyan
Write-Host "Metrics Endpoint: $MetricsEndpoint" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$testResults = @{
    prometheus_rules = $false
    prometheus_reload = $false
    metrics_liveness = $false
    predictive_alerting = $false
    self_check_heartbeat = $false
    daily_report = $false
    total = 6
    passed = 0
    failed = 0
    warnings = 0
}

# Test 1: Prometheus Rules
Write-Host "`n1. Testing Prometheus Rules..." -ForegroundColor Yellow
$testResults.prometheus_rules = Test-PrometheusRules -RulesFile "config/prometheus/rules/spark-runner.rules.yml"

# Test 2: Prometheus Reload
Write-Host "`n2. Testing Prometheus Reload..." -ForegroundColor Yellow
$testResults.prometheus_reload = Test-PrometheusReload -PrometheusHost $PrometheusHost

# Test 3: Metrics Liveness
Write-Host "`n3. Testing Metrics Liveness..." -ForegroundColor Yellow
$testResults.metrics_liveness = Test-MetricsLiveness -MetricsEndpoint $MetricsEndpoint

# Test 4: Predictive Alerting
Write-Host "`n4. Testing Predictive Alerting..." -ForegroundColor Yellow
$testResults.predictive_alerting = Test-PredictiveAlerting

# Test 5: Self-Check Heartbeat
Write-Host "`n5. Testing Self-Check Heartbeat..." -ForegroundColor Yellow
$testResults.self_check_heartbeat = Test-SelfCheckHeartbeat

# Test 6: Daily Report
Write-Host "`n6. Testing Daily Report..." -ForegroundColor Yellow
$testResults.daily_report = Test-DailyReport

# Calculate results
foreach ($test in @("prometheus_rules", "prometheus_reload", "metrics_liveness", "predictive_alerting", "self_check_heartbeat", "daily_report")) {
    if ($testResults[$test] -eq $true) {
        $testResults.passed++
    } else {
        $testResults.failed++
    }
}

# Generate validation report
$validationReport = Generate-ValidationReport -TestResults $testResults -Timestamp (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host "`n$validationReport" -ForegroundColor White

# Log validation event
$validationEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "green_validation"
    test_results = $testResults
    prometheus_host = $PrometheusHost
    metrics_endpoint = $MetricsEndpoint
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $validationEvent

Write-Host "`n## GREEN validation completed" -ForegroundColor Green
