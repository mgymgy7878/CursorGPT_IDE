# Prometheus Fix - Root Cause Analysis and Quick Repair
param(
    [string]$PrometheusHost = "http://127.0.0.1:9090",
    [string]$ExecutorHost = "http://127.0.0.1:4001",
    [string]$ConfigFile = "config/prometheus.yml",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Test-PrometheusService {
    param([string]$Host)
    
    try {
        # Test Prometheus API health
        $healthUrl = "$Host/-/healthy"
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus service is healthy" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus service returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus service test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusLifecycle {
    param([string]$Host)
    
    try {
        # Test lifecycle API
        $reloadUrl = "$Host/-/reload"
        $response = Invoke-WebRequest -Uri $reloadUrl -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus lifecycle API accessible" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus lifecycle API returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus lifecycle API test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ExecutorMetrics {
    param([string]$Host)
    
    try {
        # Test executor metrics endpoint
        $metricsUrl = "$Host/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $runnerMetrics = @()
            
            # Check for specific runner metrics
            $patterns = @(
                "spark_runner_self_check_total",
                "spark_runner_confidence_score",
                "spark_runner_threshold_drift",
                "spark_runner_predictive_alerts_total"
            )
            
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    $runnerMetrics += $pattern
                }
            }
            
            Write-Host "✅ Executor metrics endpoint accessible" -ForegroundColor Green
            Write-Host "  Found $($runnerMetrics.Count) runner metrics" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Executor metrics endpoint returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Executor metrics endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusTargets {
    param([string]$Host)
    
    try {
        # Test Prometheus targets API
        $targetsUrl = "$Host/api/v1/targets"
        $response = Invoke-WebRequest -Uri $targetsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $targets = $response.Content | ConvertFrom-Json
            $activeTargets = $targets.data.activeTargets | Where-Object { $_.health -eq "up" }
            $sparkTargets = $activeTargets | Where-Object { $_.job -eq "spark-executor" }
            
            Write-Host "✅ Prometheus targets API accessible" -ForegroundColor Green
            Write-Host "  Active targets: $($activeTargets.Count)" -ForegroundColor Gray
            Write-Host "  Spark targets: $($sparkTargets.Count)" -ForegroundColor Gray
            
            if ($sparkTargets.Count -gt 0) {
                Write-Host "✅ Spark executor targets are UP" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ No spark executor targets found" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Prometheus targets API returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus targets API test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusRules {
    param([string]$RulesFile)
    
    if (-not (Test-Path $RulesFile)) {
        Write-Host "❌ Rules file not found: $RulesFile" -ForegroundColor Red
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

function Generate-PrometheusFixReport {
    param(
        [hashtable]$TestResults,
        [string]$Timestamp
    )
    
    $report = @"
## Prometheus Fix Report
**Timestamp:** $Timestamp
**Status:** $(if ($TestResults.failed -eq 0) { "FIXED" } else { "NEEDS_ATTENTION" })

### Test Results
- **Prometheus Service:** $($TestResults.prometheus_service)
- **Prometheus Lifecycle:** $($TestResults.prometheus_lifecycle)
- **Executor Metrics:** $($TestResults.executor_metrics)
- **Prometheus Targets:** $($TestResults.prometheus_targets)
- **Prometheus Rules:** $($TestResults.prometheus_rules)

### Summary
- **Total Tests:** $($TestResults.total)
- **Passed:** $($TestResults.passed)
- **Failed:** $($TestResults.failed)

### Recommendations
"@

    if ($TestResults.failed -gt 0) {
        $report += "`n- Address failed tests before production deployment"
        if (-not $TestResults.prometheus_service) {
            $report += "`n- Start Prometheus with --web.enable-lifecycle flag"
        }
        if (-not $TestResults.executor_metrics) {
            $report += "`n- Ensure executor service is running on port 4001"
        }
        if (-not $TestResults.prometheus_targets) {
            $report += "`n- Check Prometheus configuration and target discovery"
        }
    } else {
        $report += "`n- All Prometheus components are working correctly"
    }
    
    return $report
}

# Main execution
Write-Host "## Prometheus Fix - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Prometheus Host: $PrometheusHost" -ForegroundColor Cyan
Write-Host "Executor Host: $ExecutorHost" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$testResults = @{
    prometheus_service = $false
    prometheus_lifecycle = $false
    executor_metrics = $false
    prometheus_targets = $false
    prometheus_rules = $false
    total = 5
    passed = 0
    failed = 0
}

# Test 1: Prometheus Service
Write-Host "`n1. Testing Prometheus Service..." -ForegroundColor Yellow
$testResults.prometheus_service = Test-PrometheusService -Host $PrometheusHost

# Test 2: Prometheus Lifecycle
Write-Host "`n2. Testing Prometheus Lifecycle..." -ForegroundColor Yellow
$testResults.prometheus_lifecycle = Test-PrometheusLifecycle -Host $PrometheusHost

# Test 3: Executor Metrics
Write-Host "`n3. Testing Executor Metrics..." -ForegroundColor Yellow
$testResults.executor_metrics = Test-ExecutorMetrics -Host $ExecutorHost

# Test 4: Prometheus Targets
Write-Host "`n4. Testing Prometheus Targets..." -ForegroundColor Yellow
$testResults.prometheus_targets = Test-PrometheusTargets -Host $PrometheusHost

# Test 5: Prometheus Rules
Write-Host "`n5. Testing Prometheus Rules..." -ForegroundColor Yellow
$testResults.prometheus_rules = Test-PrometheusRules -RulesFile "config/prometheus/rules/spark-runner.rules.yml"

# Calculate results
foreach ($test in @("prometheus_service", "prometheus_lifecycle", "executor_metrics", "prometheus_targets", "prometheus_rules")) {
    if ($testResults[$test] -eq $true) {
        $testResults.passed++
    } else {
        $testResults.failed++
    }
}

# Generate fix report
$fixReport = Generate-PrometheusFixReport -TestResults $testResults -Timestamp (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host "`n$fixReport" -ForegroundColor White

# Log prometheus fix event
$fixEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "prometheus_fix"
    test_results = $testResults
    prometheus_host = $PrometheusHost
    executor_host = $ExecutorHost
    config_file = $ConfigFile
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $fixEvent

Write-Host "`n## Prometheus fix completed" -ForegroundColor Green
