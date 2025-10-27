# Operational Hardening - Production Security Enforcement
param(
    [string]$ConfigFile = "config/runner.json",
    [string]$RulesFile = "config/prometheus/rules/spark-runner.rules.yml",
    [switch]$Enforce = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Test-AdaptiveThresholdFreeze {
    param([string]$ConfigPath)
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "❌ Config file not found: $ConfigPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        
        if ($config.security -and $config.security.threshold_freeze -and $config.security.threshold_freeze.enabled) {
            Write-Host "✅ Adaptive threshold freeze enabled" -ForegroundColor Green
            Write-Host "  PR Required: $($config.security.threshold_freeze.pr_required)" -ForegroundColor Gray
            Write-Host "  Auto Approve: $($config.security.threshold_freeze.auto_approve)" -ForegroundColor Gray
            Write-Host "  Freeze Duration: $($config.security.threshold_freeze.freeze_duration_hours) hours" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Adaptive threshold freeze not properly configured" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Config validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusAccess {
    param([string]$PrometheusHost = "http://127.0.0.1:9090")
    
    try {
        # Test Prometheus API access
        $apiUrl = "$PrometheusHost/api/v1/query?query=up"
        $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus API accessible" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus API returned status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus API access failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-MetricsEndpoint {
    param([string]$MetricsEndpoint = "http://127.0.0.1:4001")
    
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
                "spark_runner_predictive_alerts_total"
            )
            
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    $runnerMetrics += $pattern
                }
            }
            
            Write-Host "✅ Metrics endpoint accessible" -ForegroundColor Green
            Write-Host "  Found $($runnerMetrics.Count) runner metrics" -ForegroundColor Gray
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

function Test-CIThresholdChange {
    param([string]$ConfigPath)
    
    try {
        # Check if we're in a CI environment
        $ciEnv = $env:CI -or $env:GITHUB_ACTIONS -or $env:JENKINS_URL
        
        if ($ciEnv) {
            Write-Host "🔍 CI environment detected - checking for threshold changes" -ForegroundColor Yellow
            
            # Check if threshold_freeze is enabled
            $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            if ($config.security.threshold_freeze.enabled) {
                Write-Host "✅ Threshold freeze enabled in CI" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ PROD GUARD BLOCKED: Threshold freeze not enabled in CI" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "ℹ️  Not in CI environment - threshold change check skipped" -ForegroundColor Gray
            return $true
        }
    } catch {
        Write-Host "❌ CI threshold change check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-AutomationCoverage {
    param([int]$Days = 7)
    
    try {
        $cutoffTime = (Get-Date).AddDays(-$Days)
        $automationEvents = 0
        $totalEvents = 0
        
        if (Test-Path "evidence/runner/stall-events.jsonl") {
            $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
            foreach ($event in $allEvents) {
                try {
                    $eventObj = $event | ConvertFrom-Json
                    $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                    if ($eventTime -gt $cutoffTime) {
                        $totalEvents++
                        if ($eventObj.event -match "self_check|neural_feedback|automation") {
                            $automationEvents++
                        }
                    }
                } catch {
                    # Skip invalid JSON
                }
            }
        }
        
        $coverage = if ($totalEvents -gt 0) { [math]::Round(($automationEvents / $totalEvents) * 100, 1) } else { 0 }
        
        if ($coverage -ge 60) {
            Write-Host "✅ Automation coverage: $coverage% (HIGH)" -ForegroundColor Green
            return $true
        } elseif ($coverage -ge 30) {
            Write-Host "⚠️  Automation coverage: $coverage% (MEDIUM)" -ForegroundColor Yellow
            return $true
        } else {
            Write-Host "❌ Automation coverage: $coverage% (LOW)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Automation coverage check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Get-ConfidenceScore {
    param([int]$Days = 7)
    
    try {
        $cutoffTime = (Get-Date).AddDays(-$Days)
        $confidenceScores = @()
        
        if (Test-Path "evidence/runner/stall-events.jsonl") {
            $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
            foreach ($event in $allEvents) {
                try {
                    $eventObj = $event | ConvertFrom-Json
                    if ($eventObj.event -eq "neural_feedback_loop" -and $eventObj.confidence_score) {
                        $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                        if ($eventTime -gt $cutoffTime) {
                            $confidenceScores += $eventObj.confidence_score.overall_score
                        }
                    }
                } catch {
                    # Skip invalid JSON
                }
            }
        }
        
        if ($confidenceScores.Count -gt 0) {
            $avgConfidence = ($confidenceScores | Measure-Object -Average).Average
            return [math]::Round($avgConfidence, 2)
        } else {
            return 0.0
        }
    } catch {
        return 0.0
    }
}

function Get-PredictiveAlertsCount {
    param([int]$Hours = 24)
    
    try {
        $cutoffTime = (Get-Date).AddHours(-$Hours)
        $alertCount = 0
        
        if (Test-Path "evidence/runner/stall-events.jsonl") {
            $allEvents = Get-Content "evidence/runner/stall-events.jsonl" -ErrorAction SilentlyContinue
            foreach ($event in $allEvents) {
                try {
                    $eventObj = $event | ConvertFrom-Json
                    if ($eventObj.event -eq "predictive_alerting" -and $eventObj.predictions) {
                        $eventTime = [DateTime]::ParseExact($eventObj.ts.Replace('Z', ''), 'yyyy-MM-ddTHH:mm:ss', $null)
                        if ($eventTime -gt $cutoffTime) {
                            $alertCount += $eventObj.predictions.Count
                        }
                    }
                } catch {
                    # Skip invalid JSON
                }
            }
        }
        
        return $alertCount
    } catch {
        return 0
    }
}

function Generate-HealthReport {
    param(
        [hashtable]$TestResults,
        [float]$ConfidenceScore,
        [int]$PredictiveAlerts
    )
    
    $healthStatus = if ($TestResults.failed -eq 0) { "GREEN" } else { "YELLOW" }
    $healthIcon = if ($healthStatus -eq "GREEN") { "✅" } else { "⚠️" }
    
    $report = @"
## HEALTH: $healthStatus $healthIcon

### System Status
- **Prometheus Reload:** $(if ($TestResults.prometheus_access) { "OK" } else { "FAILED" })
- **Metrics Liveness:** $(if ($TestResults.metrics_endpoint) { "OK" } else { "FAILED" })
- **Prod Guards:** $(if ($TestResults.threshold_freeze -and $TestResults.ci_threshold) { "SECURE" } else { "INSECURE" })
- **Automation Coverage:** $(if ($TestResults.automation_coverage) { "HIGH" } else { "LOW" })

### Neural System Metrics
- **Confidence Score (7d):** $ConfidenceScore
- **Predictive Alerts (24h):** $PredictiveAlerts

### Operational Status
- **Total Tests:** $($TestResults.total)
- **Passed:** $($TestResults.passed)
- **Failed:** $($TestResults.failed)
- **Enforcement:** $(if ($Enforce) { "ENABLED" } else { "DISABLED" })
"@

    return $report
}

# Main execution
Write-Host "## Operational Hardening - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Rules File: $RulesFile" -ForegroundColor Cyan
Write-Host "Enforce: $Enforce" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$testResults = @{
    threshold_freeze = $false
    prometheus_access = $false
    metrics_endpoint = $false
    ci_threshold = $false
    automation_coverage = $false
    total = 5
    passed = 0
    failed = 0
}

# Test 1: Adaptive Threshold Freeze
Write-Host "`n1. Testing Adaptive Threshold Freeze..." -ForegroundColor Yellow
$testResults.threshold_freeze = Test-AdaptiveThresholdFreeze -ConfigPath $ConfigFile

# Test 2: Prometheus Access
Write-Host "`n2. Testing Prometheus Access..." -ForegroundColor Yellow
$testResults.prometheus_access = Test-PrometheusAccess

# Test 3: Metrics Endpoint
Write-Host "`n3. Testing Metrics Endpoint..." -ForegroundColor Yellow
$testResults.metrics_endpoint = Test-MetricsEndpoint

# Test 4: CI Threshold Change
Write-Host "`n4. Testing CI Threshold Change..." -ForegroundColor Yellow
$testResults.ci_threshold = Test-CIThresholdChange -ConfigPath $ConfigFile

# Test 5: Automation Coverage
Write-Host "`n5. Testing Automation Coverage..." -ForegroundColor Yellow
$testResults.automation_coverage = Test-AutomationCoverage

# Calculate results
foreach ($test in @("threshold_freeze", "prometheus_access", "metrics_endpoint", "ci_threshold", "automation_coverage")) {
    if ($testResults[$test] -eq $true) {
        $testResults.passed++
    } else {
        $testResults.failed++
    }
}

# Get neural system metrics
$confidenceScore = Get-ConfidenceScore -Days 7
$predictiveAlerts = Get-PredictiveAlertsCount -Hours 24

# Generate health report
$healthReport = Generate-HealthReport -TestResults $testResults -ConfidenceScore $confidenceScore -PredictiveAlerts $predictiveAlerts
Write-Host "`n$healthReport" -ForegroundColor White

# Enforcement logic
if ($Enforce -and $testResults.failed -gt 0) {
    Write-Host "`n❌ DEPLOYMENT STOPPED: Operational hardening failed" -ForegroundColor Red
    Write-Host "  Failed tests: $($testResults.failed)" -ForegroundColor Red
    Write-Host "  Run maintenance:run for rollback plan" -ForegroundColor Yellow
    exit 1
}

# Log operational hardening event
$hardeningEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "operational_hardening"
    test_results = $testResults
    confidence_score = $confidenceScore
    predictive_alerts = $predictiveAlerts
    enforce = $Enforce
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $hardeningEvent

Write-Host "`n## Operational hardening completed" -ForegroundColor Green
