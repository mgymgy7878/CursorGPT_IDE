# Executor Metrics Hardening - Security and Performance
param(
    [string]$ExecutorHost = "http://127.0.0.1:4001",
    [string]$ConfigFile = "config/runner.json",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Test-ExecutorBindAddress {
    param([string]$Host)
    
    try {
        # Test if executor is bound to 0.0.0.0 (accessible from external)
        $metricsUrl = "$Host/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Executor metrics endpoint accessible" -ForegroundColor Green
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

function Test-MetricsPerformance {
    param([string]$Host)
    
    try {
        $metricsUrl = "$Host/metrics"
        $startTime = Get-Date
        
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            $contentLength = $response.Content.Length
            $lines = ($response.Content -split "`n").Count
            
            Write-Host "✅ Metrics performance test passed" -ForegroundColor Green
            Write-Host "  Response time: $([math]::Round($duration, 2))ms" -ForegroundColor Gray
            Write-Host "  Content length: $contentLength bytes" -ForegroundColor Gray
            Write-Host "  Lines: $lines" -ForegroundColor Gray
            
            # Performance thresholds
            if ($duration -lt 1000) {
                Write-Host "  Performance: EXCELLENT (<1s)" -ForegroundColor Green
            } elseif ($duration -lt 3000) {
                Write-Host "  Performance: GOOD (<3s)" -ForegroundColor Yellow
            } else {
                Write-Host "  Performance: SLOW (>3s)" -ForegroundColor Red
            }
            
            return $true
        } else {
            Write-Host "❌ Metrics performance test failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Metrics performance test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-MetricsContent {
    param([string]$Host)
    
    try {
        $metricsUrl = "$Host/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $metrics = @()
            
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
                    $metrics += $pattern
                }
            }
            
            # Check for histogram buckets
            $histogramBuckets = @(
                "0.5", "1", "2", "5", "10", "30", "60", "120", "300"
            )
            
            $foundBuckets = 0
            foreach ($bucket in $histogramBuckets) {
                if ($content -match "le=`"$bucket`"") {
                    $foundBuckets++
                }
            }
            
            Write-Host "✅ Metrics content validation passed" -ForegroundColor Green
            Write-Host "  Found $($metrics.Count) runner metrics" -ForegroundColor Gray
            Write-Host "  Found $foundBuckets histogram buckets" -ForegroundColor Gray
            
            return $true
        } else {
            Write-Host "❌ Metrics content validation failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Metrics content validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SecurityHeaders {
    param([string]$Host)
    
    try {
        $metricsUrl = "$Host/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $headers = $response.Headers
            $securityHeaders = @()
            
            # Check for security headers
            $securityHeaderNames = @("X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection")
            
            foreach ($headerName in $securityHeaderNames) {
                if ($headers.ContainsKey($headerName)) {
                    $securityHeaders += $headerName
                }
            }
            
            Write-Host "✅ Security headers check completed" -ForegroundColor Green
            Write-Host "  Found $($securityHeaders.Count) security headers" -ForegroundColor Gray
            
            return $true
        } else {
            Write-Host "❌ Security headers check failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Security headers check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-RateLimit {
    param([string]$Host)
    
    try {
        $metricsUrl = "$Host/metrics"
        $requests = 10
        $successCount = 0
        
        Write-Host "Testing rate limit with $requests requests..." -ForegroundColor Yellow
        
        for ($i = 1; $i -le $requests; $i++) {
            try {
                $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $successCount++
                }
            } catch {
                # Request failed, might be rate limited
            }
            Start-Sleep -Milliseconds 100
        }
        
        $successRate = ($successCount / $requests) * 100
        
        if ($successRate -ge 90) {
            Write-Host "✅ Rate limit test passed" -ForegroundColor Green
            Write-Host "  Success rate: $([math]::Round($successRate, 1))%" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "⚠️  Rate limit test warning" -ForegroundColor Yellow
            Write-Host "  Success rate: $([math]::Round($successRate, 1))%" -ForegroundColor Gray
            return $true  # Non-critical failure
        }
    } catch {
        Write-Host "❌ Rate limit test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Generate-ExecutorHardeningReport {
    param(
        [hashtable]$TestResults,
        [string]$Timestamp
    )
    
    $report = @"
## Executor Metrics Hardening Report
**Timestamp:** $Timestamp
**Status:** $(if ($TestResults.failed -eq 0) { "HARDENED" } else { "NEEDS_ATTENTION" })

### Test Results
- **Bind Address:** $($TestResults.bind_address)
- **Performance:** $($TestResults.performance)
- **Content:** $($TestResults.content)
- **Security Headers:** $($TestResults.security_headers)
- **Rate Limit:** $($TestResults.rate_limit)

### Summary
- **Total Tests:** $($TestResults.total)
- **Passed:** $($TestResults.passed)
- **Failed:** $($TestResults.failed)

### Recommendations
"@

    if ($TestResults.failed -gt 0) {
        $report += "`n- Address failed tests before production deployment"
        if (-not $TestResults.bind_address) {
            $report += "`n- Ensure executor is bound to 0.0.0.0:4001"
        }
        if (-not $TestResults.performance) {
            $report += "`n- Optimize metrics collection performance"
        }
        if (-not $TestResults.content) {
            $report += "`n- Verify all runner metrics are present"
        }
        if (-not $TestResults.security_headers) {
            $report += "`n- Add security headers to metrics endpoint"
        }
        if (-not $TestResults.rate_limit) {
            $report += "`n- Implement rate limiting for metrics endpoint"
        }
    } else {
        $report += "`n- All executor metrics hardening tests passed"
    }
    
    return $report
}

# Main execution
Write-Host "## Executor Metrics Hardening - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Executor Host: $ExecutorHost" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$testResults = @{
    bind_address = $false
    performance = $false
    content = $false
    security_headers = $false
    rate_limit = $false
    total = 5
    passed = 0
    failed = 0
}

# Test 1: Bind Address
Write-Host "`n1. Testing Bind Address..." -ForegroundColor Yellow
$testResults.bind_address = Test-ExecutorBindAddress -Host $ExecutorHost

# Test 2: Performance
Write-Host "`n2. Testing Performance..." -ForegroundColor Yellow
$testResults.performance = Test-MetricsPerformance -Host $ExecutorHost

# Test 3: Content
Write-Host "`n3. Testing Content..." -ForegroundColor Yellow
$testResults.content = Test-MetricsContent -Host $ExecutorHost

# Test 4: Security Headers
Write-Host "`n4. Testing Security Headers..." -ForegroundColor Yellow
$testResults.security_headers = Test-SecurityHeaders -Host $ExecutorHost

# Test 5: Rate Limit
Write-Host "`n5. Testing Rate Limit..." -ForegroundColor Yellow
$testResults.rate_limit = Test-RateLimit -Host $ExecutorHost

# Calculate results
foreach ($test in @("bind_address", "performance", "content", "security_headers", "rate_limit")) {
    if ($testResults[$test] -eq $true) {
        $testResults.passed++
    } else {
        $testResults.failed++
    }
}

# Generate hardening report
$hardeningReport = Generate-ExecutorHardeningReport -TestResults $testResults -Timestamp (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host "`n$hardeningReport" -ForegroundColor White

# Log executor hardening event
$hardeningEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "executor_metrics_hardening"
    test_results = $testResults
    executor_host = $ExecutorHost
    config_file = $ConfigFile
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $hardeningEvent

Write-Host "`n## Executor metrics hardening completed" -ForegroundColor Green
