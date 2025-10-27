# One-Shot Recovery - Prometheus + Executor + GREEN Validation
param(
    [string]$PrometheusPath = "C:\prometheus\prometheus.exe",
    [string]$ConfigFile = "config/prometheus.yml",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "SilentlyContinue"

function Start-PrometheusService {
    param([string]$PromPath, [string]$Config)
    
    try {
        # Kill existing Prometheus process
        Write-Host "Stopping existing Prometheus processes..." -ForegroundColor Yellow
        taskkill /F /IM prometheus.exe 2>$null
        Start-Sleep -Seconds 2
        
        # Start Prometheus with lifecycle enabled
        Write-Host "Starting Prometheus with lifecycle enabled..." -ForegroundColor Green
        $arguments = @("--config.file=$Config", "--web.enable-lifecycle")
        Start-Process -FilePath $PromPath -ArgumentList $arguments -NoNewWindow
        
        # Wait for Prometheus to start
        Start-Sleep -Seconds 5
        
        # Test Prometheus health
        $healthUrl = "http://127.0.0.1:9090/-/healthy"
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus service started successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus service failed to start" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus startup failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Start-ExecutorService {
    try {
        # Set environment variables for Executor
        $env:HOST = "0.0.0.0"
        $env:PORT = "4001"
        $env:METRICS_ENABLED = "true"
        
        Write-Host "Starting Executor service..." -ForegroundColor Green
        Write-Host "  Host: $env:HOST" -ForegroundColor Gray
        Write-Host "  Port: $env:PORT" -ForegroundColor Gray
        Write-Host "  Metrics: $env:METRICS_ENABLED" -ForegroundColor Gray
        
        # Start Executor in background
        Start-Process -FilePath "pnpm" -ArgumentList @("--filter", "@spark/executor", "dev") -NoNewWindow
        
        # Wait for Executor to start
        Start-Sleep -Seconds 10
        
        # Test Executor metrics endpoint
        $metricsUrl = "http://127.0.0.1:4001/metrics"
        $response = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            if ($content -match "spark_runner_") {
                Write-Host "✅ Executor service started successfully" -ForegroundColor Green
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

function Test-ServicesHealth {
    try {
        Write-Host "Testing services health..." -ForegroundColor Yellow
        
        # Test Prometheus
        $prometheusUrl = "http://127.0.0.1:9090/-/healthy"
        $prometheusResponse = Invoke-WebRequest -Uri $prometheusUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        # Test Executor
        $executorUrl = "http://127.0.0.1:4001/metrics"
        $executorResponse = Invoke-WebRequest -Uri $executorUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        $prometheusOk = $prometheusResponse.StatusCode -eq 200
        $executorOk = $executorResponse.StatusCode -eq 200
        
        if ($prometheusOk -and $executorOk) {
            Write-Host "✅ Both services are healthy" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Services health check failed" -ForegroundColor Red
            Write-Host "  Prometheus: $($prometheusResponse.StatusCode)" -ForegroundColor Red
            Write-Host "  Executor: $($executorResponse.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Services health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Invoke-PrometheusReload {
    try {
        Write-Host "Reloading Prometheus configuration..." -ForegroundColor Yellow
        $reloadUrl = "http://127.0.0.1:9090/-/reload"
        $response = Invoke-WebRequest -Uri $reloadUrl -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus configuration reloaded" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus reload failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus reload failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Invoke-GREENValidation {
    try {
        Write-Host "Running GREEN validation..." -ForegroundColor Yellow
        $result = & "pnpm" "run" "green:validate" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ GREEN validation passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ GREEN validation failed" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ GREEN validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Save-Evidence {
    try {
        # Create evidence directory
        $evidenceDir = "evidence\ops"
        if (-not (Test-Path $evidenceDir)) {
            New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
        }
        
        # Save green probe timestamp
        $greenProbeFile = "$evidenceDir\green_probe.txt"
        (Get-Date).ToString("s") | Out-File -FilePath $greenProbeFile -Force
        
        # Save Prometheus reload result
        $promReloadFile = "$evidenceDir\prom_reload.txt"
        try {
            $reloadResult = Invoke-WebRequest -Uri "http://127.0.0.1:9090/-/reload" -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
            $reloadResult.StatusCode | Out-File -FilePath $promReloadFile -Force
        } catch {
            "FAILED" | Out-File -FilePath $promReloadFile -Force
        }
        
        # Save Executor metrics
        $executorMetricsFile = "$evidenceDir\executor_metrics.txt"
        try {
            $metricsResult = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
            $metricsResult.Content | Out-File -FilePath $executorMetricsFile -Force
        } catch {
            "FAILED" | Out-File -FilePath $executorMetricsFile -Force
        }
        
        # Save GREEN validation result
        $greenValidateFile = "$evidenceDir\green_validate.txt"
        try {
            $greenResult = & "pnpm" "run" "green:validate" 2>&1
            $greenResult | Out-File -FilePath $greenValidateFile -Force
        } catch {
            "FAILED" | Out-File -FilePath $greenValidateFile -Force
        }
        
        Write-Host "✅ Evidence saved to $evidenceDir" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Evidence saving failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## One-Shot Recovery - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Prometheus Path: $PrometheusPath" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    exit 0
}

# Step 1: Start Prometheus
Write-Host "`n1. Starting Prometheus service..." -ForegroundColor Yellow
$prometheusStarted = Start-PrometheusService -PromPath $PrometheusPath -Config $ConfigFile

# Step 2: Start Executor
Write-Host "`n2. Starting Executor service..." -ForegroundColor Yellow
$executorStarted = Start-ExecutorService

# Step 3: Test services health
Write-Host "`n3. Testing services health..." -ForegroundColor Yellow
$servicesHealthy = Test-ServicesHealth

# Step 4: Reload Prometheus
Write-Host "`n4. Reloading Prometheus configuration..." -ForegroundColor Yellow
$prometheusReloaded = Invoke-PrometheusReload

# Step 5: Run GREEN validation
Write-Host "`n5. Running GREEN validation..." -ForegroundColor Yellow
$greenValidation = Invoke-GREENValidation

# Step 6: Save evidence
Write-Host "`n6. Saving evidence..." -ForegroundColor Yellow
$evidenceSaved = Save-Evidence

# Summary
Write-Host "`n## Recovery Summary" -ForegroundColor Cyan
Write-Host "Prometheus Started: $prometheusStarted" -ForegroundColor $(if ($prometheusStarted) { "Green" } else { "Red" })
Write-Host "Executor Started: $executorStarted" -ForegroundColor $(if ($executorStarted) { "Green" } else { "Red" })
Write-Host "Services Healthy: $servicesHealthy" -ForegroundColor $(if ($servicesHealthy) { "Green" } else { "Red" })
Write-Host "Prometheus Reloaded: $prometheusReloaded" -ForegroundColor $(if ($prometheusReloaded) { "Green" } else { "Red" })
Write-Host "GREEN Validation: $greenValidation" -ForegroundColor $(if ($greenValidation) { "Green" } else { "Red" })
Write-Host "Evidence Saved: $evidenceSaved" -ForegroundColor $(if ($evidenceSaved) { "Green" } else { "Red" })

if ($prometheusStarted -and $executorStarted -and $servicesHealthy -and $prometheusReloaded -and $greenValidation) {
    Write-Host "`n✅ ONE-SHOT RECOVERY SUCCESSFUL" -ForegroundColor Green
    Write-Host "HEALTH: GREEN ✅" -ForegroundColor Green
} else {
    Write-Host "`n❌ ONE-SHOT RECOVERY FAILED" -ForegroundColor Red
    Write-Host "HEALTH: YELLOW ⚠️" -ForegroundColor Yellow
}

Write-Host "`n## One-shot recovery completed" -ForegroundColor Green
