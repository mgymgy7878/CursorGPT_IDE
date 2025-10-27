# Prometheus Up - Find and Start Prometheus (Windows + Docker fallback)
param(
    [string]$ConfigFile = "config/prometheus.yml",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Find-PrometheusBinary {
    $searchPaths = @(
        "C:\prometheus\prometheus.exe",
        "C:\Program Files\Prometheus\prometheus.exe",
        "$env:USERPROFILE\prometheus\prometheus.exe",
        "prometheus.exe"
    )
    
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            Write-Host "✅ Found Prometheus at: $path" -ForegroundColor Green
            return $path
        }
    }
    
    Write-Host "❌ Prometheus binary not found in standard locations" -ForegroundColor Red
    return $null
}

function Start-PrometheusNative {
    param([string]$PromPath, [string]$Config)
    
    try {
        # Kill existing Prometheus processes
        Write-Host "Stopping existing Prometheus processes..." -ForegroundColor Yellow
        taskkill /F /IM prometheus.exe 2>$null
        Start-Sleep -Seconds 2
        
        # Start Prometheus with lifecycle enabled
        Write-Host "Starting Prometheus natively..." -ForegroundColor Green
        $arguments = @("--config.file=$Config", "--web.enable-lifecycle")
        Start-Process -FilePath $PromPath -ArgumentList $arguments -NoNewWindow
        
        # Wait for Prometheus to start
        Start-Sleep -Seconds 5
        
        # Test Prometheus health
        $healthUrl = "http://127.0.0.1:9090/-/healthy"
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus started successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Prometheus health check failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus startup failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Start-PrometheusDocker {
    param([string]$Config)
    
    try {
        # Stop existing Docker container
        Write-Host "Stopping existing Prometheus Docker container..." -ForegroundColor Yellow
        docker stop spark-prom 2>$null
        docker rm spark-prom 2>$null
        
        # Start Prometheus with Docker
        Write-Host "Starting Prometheus with Docker..." -ForegroundColor Green
        $configPath = (Resolve-Path $Config).Path
        $dockerArgs = @(
            "run", "-d", "--name", "spark-prom",
            "-p", "9090:9090",
            "-v", "${configPath}:/etc/prometheus/prometheus.yml",
            "prom/prometheus:latest",
            "--web.enable-lifecycle"
        )
        
        $result = & docker $dockerArgs 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Prometheus Docker container started" -ForegroundColor Green
            Write-Host "Container ID: $result" -ForegroundColor Gray
            
            # Wait for container to start
            Start-Sleep -Seconds 10
            
            # Test Prometheus health
            $healthUrl = "http://127.0.0.1:9090/-/healthy"
            $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Prometheus Docker health check passed" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Prometheus Docker health check failed" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Prometheus Docker startup failed: $result" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus Docker startup failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PrometheusReload {
    try {
        Write-Host "Testing Prometheus reload..." -ForegroundColor Yellow
        $reloadUrl = "http://127.0.0.1:9090/-/reload"
        $response = Invoke-WebRequest -Uri $reloadUrl -Method POST -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Prometheus reload successful" -ForegroundColor Green
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

function Test-PrometheusTargets {
    try {
        Write-Host "Testing Prometheus targets..." -ForegroundColor Yellow
        $targetsUrl = "http://127.0.0.1:9090/api/v1/targets"
        $response = Invoke-WebRequest -Uri $targetsUrl -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            $targets = $response.Content | ConvertFrom-Json
            $activeTargets = $targets.data.activeTargets | Where-Object { $_.health -eq "up" }
            $sparkTargets = $activeTargets | Where-Object { $_.job -eq "spark-executor" }
            
            Write-Host "✅ Prometheus targets accessible" -ForegroundColor Green
            Write-Host "  Active targets: $($activeTargets.Count)" -ForegroundColor Gray
            Write-Host "  Spark targets: $($sparkTargets.Count)" -ForegroundColor Gray
            
            return $true
        } else {
            Write-Host "❌ Prometheus targets check failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Prometheus targets check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "## Prometheus Up - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    exit 0
}

# Step 1: Find Prometheus binary
Write-Host "`n1. Finding Prometheus binary..." -ForegroundColor Yellow
$prometheusPath = Find-PrometheusBinary

# Step 2: Start Prometheus (native or Docker)
Write-Host "`n2. Starting Prometheus..." -ForegroundColor Yellow
$prometheusStarted = $false

if ($prometheusPath) {
    $prometheusStarted = Start-PrometheusNative -PromPath $prometheusPath -Config $ConfigFile
} else {
    Write-Host "Native Prometheus not found, trying Docker fallback..." -ForegroundColor Yellow
    $prometheusStarted = Start-PrometheusDocker -Config $ConfigFile
}

# Step 3: Test Prometheus reload
Write-Host "`n3. Testing Prometheus reload..." -ForegroundColor Yellow
$prometheusReloaded = Test-PrometheusReload

# Step 4: Test Prometheus targets
Write-Host "`n4. Testing Prometheus targets..." -ForegroundColor Yellow
$prometheusTargets = Test-PrometheusTargets

# Summary
Write-Host "`n## Prometheus Up Summary" -ForegroundColor Cyan
Write-Host "Prometheus Started: $prometheusStarted" -ForegroundColor $(if ($prometheusStarted) { "Green" } else { "Red" })
Write-Host "Prometheus Reloaded: $prometheusReloaded" -ForegroundColor $(if ($prometheusReloaded) { "Green" } else { "Red" })
Write-Host "Prometheus Targets: $prometheusTargets" -ForegroundColor $(if ($prometheusTargets) { "Green" } else { "Red" })

if ($prometheusStarted -and $prometheusReloaded -and $prometheusTargets) {
    Write-Host "`n✅ PROMETHEUS UP SUCCESSFUL" -ForegroundColor Green
} else {
    Write-Host "`n❌ PROMETHEUS UP FAILED" -ForegroundColor Red
}

Write-Host "`n## Prometheus up completed" -ForegroundColor Green
