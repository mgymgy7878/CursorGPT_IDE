# Spark TA Module v1.0.0 - Production Deployment Script (PowerShell)

Write-Host "🚀 Spark TA Module v1.0.0 - Production Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker is required" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and -not (Get-Command docker compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is required" -ForegroundColor Red
    exit 1
}

# Environment check
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✅ .env created. Please review and update before continuing." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ .env.example not found. Create .env manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "1️⃣  Checking environment variables..." -ForegroundColor Cyan
# Load .env (basic parsing for PowerShell)
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$requiredVars = @("REDIS_URL", "EXECUTOR_URL", "SCHEDULER_ENABLED")
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        Write-Host "❌ Missing required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Environment variables OK" -ForegroundColor Green

Write-Host ""
Write-Host "2️⃣  Pulling latest images..." -ForegroundColor Cyan
docker compose pull
Write-Host "✅ Images pulled" -ForegroundColor Green

Write-Host ""
Write-Host "3️⃣  Building services..." -ForegroundColor Cyan
docker compose build
Write-Host "✅ Build complete" -ForegroundColor Green

Write-Host ""
Write-Host "4️⃣  Starting services..." -ForegroundColor Cyan
docker compose up -d
Write-Host "✅ Services started" -ForegroundColor Green

Write-Host ""
Write-Host "5️⃣  Waiting for services to be ready (30s)..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "6️⃣  Health checks..." -ForegroundColor Cyan

# Executor health
try {
    $response = Invoke-WebRequest -Uri http://localhost:4001/health -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Executor: healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Executor: unhealthy" -ForegroundColor Red
        docker logs executor-1 --tail 20
        exit 1
    }
} catch {
    Write-Host "❌ Executor: unhealthy" -ForegroundColor Red
    docker logs executor-1 --tail 20
    exit 1
}

# Web-Next health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=1" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Web-Next: healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Web-Next: unhealthy" -ForegroundColor Red
        docker logs web-next-1 --tail 20
        exit 1
    }
} catch {
    Write-Host "❌ Web-Next: unhealthy" -ForegroundColor Red
    docker logs web-next-1 --tail 20
    exit 1
}

# Redis health
$redisHealth = docker exec spark-redis redis-cli PING 2>&1
if ($redisHealth -eq "PONG") {
    Write-Host "✅ Redis: healthy" -ForegroundColor Green
} else {
    Write-Host "❌ Redis: unhealthy" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "7️⃣  Checking leader election..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
$leaderLogs = docker logs executor-1 2>&1 | Select-String "became leader"
if ($leaderLogs.Count -gt 0) {
    Write-Host "✅ Leader elected (executor-1)" -ForegroundColor Green
} else {
    Write-Host "⚠️  No leader yet (will elect within 35s)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Services:"
Write-Host "   Executor:  http://localhost:4001"
Write-Host "   Web-Next:  http://localhost:3000"
Write-Host "   Metrics:   http://localhost:4001/metrics"
Write-Host ""
Write-Host "🔍 Next steps:"
Write-Host "   1. Run smoke tests:"
Write-Host "      bash scripts/smoke-test-v1.0.0.sh"
Write-Host ""
Write-Host "   2. Run regression tests:"
Write-Host "      bash scripts/regression-suite.sh"
Write-Host ""
Write-Host "   3. Import Grafana dashboard:"
Write-Host "      monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json"
Write-Host ""
Write-Host "   4. Monitor for 60 minutes (see docs/operations/HYPERCARE-CHECKLIST.md)"
Write-Host ""
Write-Host "📚 Documentation:"
Write-Host "   - DEPLOYMENT_GUIDE.md"
Write-Host "   - TROUBLESHOOTING.md"
Write-Host "   - API_REFERENCE.md"
Write-Host ""

