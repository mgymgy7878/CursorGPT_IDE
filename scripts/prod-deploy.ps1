#!/usr/bin/env pwsh

# Production Deployment Script
# Usage: .\scripts\prod-deploy.ps1

param(
    [string]$Environment = "production",
    [string]$Version = "v1.7"
)

Write-Host "🚀 Starting Production Deployment - $Version" -ForegroundColor Green

# Check prerequisites
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Error "PM2 not found. Please install: npm install -g pm2"
    exit 1
}

if (-not (Get-Command nginx -ErrorAction SilentlyContinue)) {
    Write-Error "Nginx not found. Please install nginx."
    exit 1
}

# Environment variables
$env:NODE_ENV = $Environment
$env:VERSION = $Version

# Build all packages and apps
Write-Host "📦 Building packages..." -ForegroundColor Yellow
pnpm build:packages
if ($LASTEXITCODE -ne 0) {
    Write-Error "Package build failed"
    exit 1
}

Write-Host "🏗️ Building apps..." -ForegroundColor Yellow
pnpm build:apps
if ($LASTEXITCODE -ne 0) {
    Write-Error "App build failed"
    exit 1
}

# Start/Reload PM2 processes
Write-Host "🔄 Starting PM2 processes..." -ForegroundColor Yellow

# Web Next.js App
pm2 startOrReload ops/pm2/ecosystem.config.cjs --only web-next --env $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start web-next"
    exit 1
}

# Executor Service
pm2 startOrReload ops/pm2/ecosystem.config.cjs --only executor --env $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start executor"
    exit 1
}

# Backtest Engine
pm2 startOrReload ops/pm2/ecosystem.config.cjs --only backtest-engine --env $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start backtest-engine"
    exit 1
}

# Streams Service
pm2 startOrReload ops/pm2/ecosystem.config.cjs --only streams --env $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start streams"
    exit 1
}

# Reload Nginx
Write-Host "🔄 Reloading Nginx..." -ForegroundColor Yellow
nginx -s reload
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to reload nginx"
    exit 1
}

# Health checks
Write-Host "🏥 Running health checks..." -ForegroundColor Yellow

$services = @(
    @{Name="Web UI"; Url="http://localhost:3003/api/health"},
    @{Name="Executor"; Url="http://localhost:4001/api/health"},
    @{Name="Backtest Engine"; Url="http://localhost:4501/api/health"},
    @{Name="Streams"; Url="http://localhost:4601/api/health"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ $($service.Name) returned status $($response.StatusCode)"
        }
    } catch {
        Write-Error "❌ $($service.Name) health check failed: $($_.Exception.Message)"
    }
}

# Readiness checks
Write-Host "🔍 Running readiness checks..." -ForegroundColor Yellow

$readinessChecks = @(
    @{Name="Database"; Command="pnpm db:studio"},
    @{Name="Redis"; Command="redis-cli ping"},
    @{Name="Prometheus"; Command="curl -s http://localhost:9090/-/ready"}
)

foreach ($check in $readinessChecks) {
    try {
        $result = Invoke-Expression $check.Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $($check.Name) is ready" -ForegroundColor Green
        } else {
            Write-Warning "⚠️ $($check.Name) readiness check failed"
        }
    } catch {
        Write-Warning "⚠️ $($check.Name) readiness check failed: $($_.Exception.Message)"
    }
}

# Save deployment info
$deploymentInfo = @{
    version = $Version
    environment = $Environment
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    services = @("web-next", "executor", "backtest-engine", "streams")
    status = "deployed"
}

$deploymentInfo | ConvertTo-Json | Out-File -FilePath "ops/deployments/latest.json" -Encoding UTF8

Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 PM2 Status:" -ForegroundColor Cyan
pm2 status

Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Version: $Version"
Write-Host "  Environment: $Environment"
Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "  Services: web-next, executor, backtest-engine, streams" 