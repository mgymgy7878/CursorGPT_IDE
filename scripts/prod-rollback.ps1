#!/usr/bin/env pwsh

# Production Rollback Script
# Usage: .\scripts\prod-rollback.ps1

param(
    [string]$Version = "v1.6",
    [string]$Environment = "production"
)

Write-Host "🔄 Starting Production Rollback to $Version" -ForegroundColor Yellow

# Check if PM2 is running
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Error "PM2 not found. Please install: npm install -g pm2"
    exit 1
}

# Save current deployment state
$currentState = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    action = "rollback"
    targetVersion = $Version
    environment = $Environment
}

# Check current PM2 status
Write-Host "📊 Current PM2 Status:" -ForegroundColor Cyan
pm2 status

# Stop all services
Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
pm2 stop all
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Some services may not have stopped cleanly"
}

# Revert to previous version
Write-Host "⏪ Reverting to version $Version..." -ForegroundColor Yellow

# Git operations (if using git-based deployment)
try {
    git fetch --tags
    git checkout $Version
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to checkout version $Version"
        exit 1
    }
} catch {
    Write-Warning "Git operations failed, continuing with current codebase"
}

# Restore environment variables
if (Test-Path "ops/deployments/$Version.env") {
    Write-Host "🔧 Restoring environment variables..." -ForegroundColor Yellow
    Copy-Item "ops/deployments/$Version.env" ".env.local" -Force
}

# Rebuild if necessary
Write-Host "🔨 Rebuilding packages..." -ForegroundColor Yellow
pnpm build:packages
if ($LASTEXITCODE -ne 0) {
    Write-Error "Package build failed during rollback"
    exit 1
}

Write-Host "🏗️ Rebuilding apps..." -ForegroundColor Yellow
pnpm build:apps
if ($LASTEXITCODE -ne 0) {
    Write-Error "App build failed during rollback"
    exit 1
}

# Restart services with previous version
Write-Host "🔄 Restarting services..." -ForegroundColor Yellow

$services = @("web-next", "executor", "backtest-engine", "streams")

foreach ($service in $services) {
    Write-Host "Starting $service..." -ForegroundColor Cyan
    pm2 startOrReload ops/pm2/ecosystem.config.cjs --only $service --env $Environment
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to restart $service"
    }
}

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Health checks
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

$healthEndpoints = @(
    @{Name="Web UI"; Url="http://localhost:3003/api/health"},
    @{Name="Executor"; Url="http://localhost:4001/api/health"},
    @{Name="Backtest Engine"; Url="http://localhost:4501/api/health"},
    @{Name="Streams"; Url="http://localhost:4601/api/health"}
)

$healthyServices = 0
foreach ($service in $healthEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
            $healthyServices++
        } else {
            Write-Warning "⚠️ $($service.Name) returned status $($response.StatusCode)"
        }
    } catch {
        Write-Error "❌ $($service.Name) health check failed: $($_.Exception.Message)"
    }
}

# Reload Nginx
Write-Host "🔄 Reloading Nginx..." -ForegroundColor Yellow
try {
    nginx -s reload
    Write-Host "✅ Nginx reloaded successfully" -ForegroundColor Green
} catch {
    Write-Warning "⚠️ Nginx reload failed: $($_.Exception.Message)"
}

# Update deployment info
$rollbackInfo = @{
    version = $Version
    environment = $Environment
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    action = "rollback"
    healthyServices = $healthyServices
    totalServices = $healthEndpoints.Count
    status = if ($healthyServices -eq $healthEndpoints.Count) { "successful" } else { "partial" }
}

$rollbackInfo | ConvertTo-Json | Out-File -FilePath "ops/deployments/rollback-$Version.json" -Encoding UTF8

# Final status
Write-Host "📊 Rollback Summary:" -ForegroundColor Cyan
Write-Host "  Target Version: $Version"
Write-Host "  Environment: $Environment"
Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  Healthy Services: $healthyServices/$($healthEndpoints.Count)"
Write-Host "  Status: $($rollbackInfo.status)"

if ($healthyServices -eq $healthEndpoints.Count) {
    Write-Host "🎉 Rollback completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Rollback completed with issues. Please check service logs." -ForegroundColor Yellow
}

Write-Host "📊 Current PM2 Status:" -ForegroundColor Cyan
pm2 status 