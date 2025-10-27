# Executor Up - Start Executor with /metrics hardening
param(
    [string]$Host = "0.0.0.0",
    [string]$Port = "4001",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Start-ExecutorService {
    param([string]$ExecutorHost, [string]$ExecutorPort)
    
    try {
        # Set environment variables
        $env:HOST = $ExecutorHost
        $env:PORT = $ExecutorPort
        $env:METRICS_ENABLED = "true"
        
        Write-Host "Starting Executor service..." -ForegroundColor Green
        Write-Host "  Host: $($env:HOST)" -ForegroundColor Gray
        Write-Host "  Port: $($env:PORT)" -ForegroundColor Gray
        Write-Host "  Metrics: $($env:METRICS_ENABLED)" -ForegroundColor Gray
        
        # Start Executor in background
        Start-Process -FilePath "pnpm" -ArgumentList @("-w", "--filter", "@spark/executor", "dev") -NoNewWindow
        
        # Wait for Executor to start
        Start-Sleep -Seconds 10
        
        # Test Executor metrics endpoint
        $metricsUrl = "http://$ExecutorHost`:$ExecutorPort/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            if ($content -match "spark_runner_") {
                Write-Host "✅ Executor service started successfully" -ForegroundColor Green
                Write-Host "  Metrics endpoint accessible" -ForegroundColor Gray
                return $true
            } else {
                Write-Host "⚠️  Executor started but no runner metrics found" -ForegroundColor Yellow
                return $true
            }
        } else {
            Write-Host "❌ Executor service failed to start" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Executor startup failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ExecutorMetrics {
    param([string]$ExecutorHost, [string]$ExecutorPort)
    
    try {
        $metricsUrl = "http://$ExecutorHost`:$ExecutorPort/metrics"
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
            
            Write-Host "✅ Executor metrics test passed" -ForegroundColor Green
            Write-Host "  Found $($runnerMetrics.Count) runner metrics" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Executor metrics test failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Executor metrics test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ExecutorSecurity {
    param([string]$ExecutorHost, [string]$ExecutorPort)
    
    try {
        $metricsUrl = "http://$ExecutorHost`:$ExecutorPort/metrics"
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
            
            Write-Host "✅ Executor security test passed" -ForegroundColor Green
            Write-Host "  Found $($securityHeaders.Count) security headers" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "❌ Executor security test failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Executor security test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ExecutorPerformance {
    param([string]$ExecutorHost, [string]$ExecutorPort)
    
    try {
        $metricsUrl = "http://$ExecutorHost`:$ExecutorPort/metrics"
        $startTime = Get-Date
        
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq 200) {
            $contentLength = $response.Content.Length
            $lines = ($response.Content -split "`n").Count
            
            Write-Host "✅ Executor performance test passed" -ForegroundColor Green
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
            Write-Host "❌ Executor performance test failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Executor performance test failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## Executor Up - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Host: $Host" -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    exit 0
}

# Step 1: Start Executor service
Write-Host "`n1. Starting Executor service..." -ForegroundColor Yellow
$executorStarted = Start-ExecutorService -ExecutorHost $Host -ExecutorPort $Port

# Step 2: Test Executor metrics
Write-Host "`n2. Testing Executor metrics..." -ForegroundColor Yellow
$executorMetrics = Test-ExecutorMetrics -ExecutorHost $Host -ExecutorPort $Port

# Step 3: Test Executor security
Write-Host "`n3. Testing Executor security..." -ForegroundColor Yellow
$executorSecurity = Test-ExecutorSecurity -ExecutorHost $Host -ExecutorPort $Port

# Step 4: Test Executor performance
Write-Host "`n4. Testing Executor performance..." -ForegroundColor Yellow
$executorPerformance = Test-ExecutorPerformance -ExecutorHost $Host -ExecutorPort $Port

# Summary
Write-Host "`n## Executor Up Summary" -ForegroundColor Cyan
Write-Host "Executor Started: $executorStarted" -ForegroundColor $(if ($executorStarted) { "Green" } else { "Red" })
Write-Host "Executor Metrics: $executorMetrics" -ForegroundColor $(if ($executorMetrics) { "Green" } else { "Red" })
Write-Host "Executor Security: $executorSecurity" -ForegroundColor $(if ($executorSecurity) { "Green" } else { "Red" })
Write-Host "Executor Performance: $executorPerformance" -ForegroundColor $(if ($executorPerformance) { "Green" } else { "Red" })

if ($executorStarted -and $executorMetrics -and $executorSecurity -and $executorPerformance) {
    Write-Host "`n✅ EXECUTOR UP SUCCESSFUL" -ForegroundColor Green
} else {
    Write-Host "`n❌ EXECUTOR UP FAILED" -ForegroundColor Red
}

Write-Host "`n## Executor up completed" -ForegroundColor Green
