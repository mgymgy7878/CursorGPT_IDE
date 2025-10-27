# SPARK TRADING PLATFORM - PRODUCTION DEPLOYMENT SCRIPT
# Windows PowerShell Deployment Script

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Force = $false
)

Write-Host "🚀 SPARK TRADING PLATFORM - PRODUCTION DEPLOYMENT" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Skip Tests: $SkipTests" -ForegroundColor Yellow
Write-Host "Force: $Force" -ForegroundColor Red

# 1. Pre-deployment Checks
Write-Host "`n📋 Pre-deployment Checks..." -ForegroundColor Yellow

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    exit 1
}

# Check if services are running
$runningServices = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($runningServices) {
    if (-not $Force) {
        Write-Host "⚠️  Node.js processes are running. Use -Force to continue" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "🔄 Stopping existing Node.js processes..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    }
}

# 2. Environment Setup
Write-Host "`n🔧 Environment Setup..." -ForegroundColor Yellow

# Check .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production file not found" -ForegroundColor Red
    Write-Host "Please create .env.production with production values" -ForegroundColor Yellow
    exit 1
}

# Copy environment file
Copy-Item ".env.production" ".env" -Force
Write-Host "✅ Environment file configured" -ForegroundColor Green

# 3. Build Process
Write-Host "`n🔨 Build Process..." -ForegroundColor Yellow

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pnpm -w install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build executor
Write-Host "🔨 Building executor..." -ForegroundColor Cyan
Set-Location services\executor
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build executor" -ForegroundColor Red
    exit 1
}
Set-Location ..\..

# Build web-next
Write-Host "🔨 Building web-next..." -ForegroundColor Cyan
Set-Location apps\web-next
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build web-next" -ForegroundColor Red
    exit 1
}
Set-Location ..\..

Write-Host "✅ Build completed successfully" -ForegroundColor Green

# 4. Docker Deployment
Write-Host "`n🐳 Docker Deployment..." -ForegroundColor Yellow

# Stop existing containers
Write-Host "🔄 Stopping existing containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml down

# Build and start containers
Write-Host "🚀 Starting production containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.prod.yml up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for services to start
Write-Host "⏰ Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# 5. Health Checks
Write-Host "`n🏥 Health Checks..." -ForegroundColor Yellow

# Check executor health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Executor health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Executor health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Executor health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check web-next health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Web-next health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Web-next health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Web-next health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. Smoke Tests
if (-not $SkipTests) {
    Write-Host "`n🧪 Running Smoke Tests..." -ForegroundColor Yellow
    
    # Run smoke tests with lock
    $smokeResult = & ".\tools\once-lock.ps1" -Name "prod-deploy-smoke" -TtlSec 300
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Smoke tests failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Smoke tests passed (Exit Code: $smokeResult)" -ForegroundColor Green
}

# 7. Monitoring Setup
Write-Host "`n📊 Monitoring Setup..." -ForegroundColor Yellow

# Check Prometheus
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Prometheus is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Prometheus is not accessible" -ForegroundColor Yellow
}

# Check Grafana
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Grafana is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Grafana is not accessible" -ForegroundColor Yellow
}

# 8. Deployment Summary
Write-Host "`n🎯 DEPLOYMENT SUMMARY" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Environment: $Environment" -ForegroundColor Green
Write-Host "✅ Build: Successful" -ForegroundColor Green
Write-Host "✅ Docker: Running" -ForegroundColor Green
Write-Host "✅ Health Checks: Passed" -ForegroundColor Green
if (-not $SkipTests) {
    Write-Host "✅ Smoke Tests: Passed" -ForegroundColor Green
}
Write-Host "`n🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "   Web Application: http://localhost:3003" -ForegroundColor White
Write-Host "   Executor API: http://localhost:4001" -ForegroundColor White
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana: http://localhost:3000" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run Canary Test: .\tools\canary-dryrun.ps1" -ForegroundColor White
Write-Host "   2. Monitor Grafana Dashboard" -ForegroundColor White
Write-Host "   3. Check Strategy Lab: http://localhost:3003/strategy-lab" -ForegroundColor White
Write-Host "   4. Review prod-checklist.md for full production checklist" -ForegroundColor White

Write-Host "`n🚀 DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
