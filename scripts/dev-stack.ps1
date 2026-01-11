# Spark Trading Platform - Dev Stack Startup Script
# Starts PostgreSQL, Executor, and Web services in order

param(
    [switch]$SkipPostgres,
    [switch]$SkipExecutor,
    [switch]$SkipWeb,
    [int]$WebPort = 3003,
    [int]$ExecutorPort = 4001
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Spark Trading Platform Dev Stack..." -ForegroundColor Cyan

# 1. PostgreSQL (Docker)
if (-not $SkipPostgres) {
    Write-Host "`n📦 Starting PostgreSQL..." -ForegroundColor Yellow
    docker compose up -d postgres

    Write-Host "⏳ Waiting for PostgreSQL to be healthy..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        $status = docker compose ps postgres --format json | ConvertFrom-Json
        if ($status.Health -eq "healthy") {
            Write-Host "✅ PostgreSQL is healthy" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 2
        $waited += 2
    }

    if ($waited -ge $maxWait) {
        Write-Host "⚠️  PostgreSQL health check timeout, continuing anyway..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping PostgreSQL (--SkipPostgres)" -ForegroundColor Gray
}

# 2. Prisma Migration (if needed)
if (-not $SkipPostgres) {
    Write-Host "`n🔄 Checking Prisma migrations..." -ForegroundColor Yellow
    $migrationStatus = pnpm exec prisma migrate status 2>&1
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Host "✅ Database schema is up to date" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database schema may need migration, run: pnpm exec prisma migrate dev" -ForegroundColor Yellow
    }
}

# 3. Executor Service
if (-not $SkipExecutor) {
    Write-Host "`n⚡ Starting Executor service (port $ExecutorPort)..." -ForegroundColor Yellow

    # Check if port is already in use
    $portCheck = netstat -ano | Select-String ":$ExecutorPort.*LISTENING"
    if ($portCheck) {
        Write-Host "⚠️  Port $ExecutorPort is already in use, skipping Executor startup" -ForegroundColor Yellow
        Write-Host "   If you want to restart, stop the existing process first" -ForegroundColor Gray
    } else {
        Write-Host "   Starting: pnpm --filter @spark/executor dev" -ForegroundColor Gray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter @spark/executor dev" -WindowStyle Minimized

        # Wait for health endpoint
        Write-Host "⏳ Waiting for Executor health endpoint..." -ForegroundColor Yellow
        $maxWait = 20
        $waited = 0
        while ($waited -lt $maxWait) {
            try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:$ExecutorPort/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $health = $response.Content | ConvertFrom-Json
                    if ($health.status -eq "healthy") {
                        Write-Host "✅ Executor is healthy (DB: $($health.db))" -ForegroundColor Green
                        break
                    }
                }
            } catch {
                # Continue waiting
            }
            Start-Sleep -Seconds 1
            $waited += 1
        }

        if ($waited -ge $maxWait) {
            Write-Host "⚠️  Executor health check timeout, check manually: curl http://127.0.0.1:$ExecutorPort/health" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⏭️  Skipping Executor (--SkipExecutor)" -ForegroundColor Gray
}

# 4. Web Service
if (-not $SkipWeb) {
    Write-Host "`n🌐 Starting Web service (port $WebPort)..." -ForegroundColor Yellow

    # Check if port is already in use
    $portCheck = netstat -ano | Select-String ":$WebPort.*LISTENING"
    if ($portCheck) {
        Write-Host "⚠️  Port $WebPort is already in use, skipping Web startup" -ForegroundColor Yellow
        Write-Host "   If you want to restart, stop the existing process first" -ForegroundColor Gray
    } else {
        Write-Host "   Starting: pnpm --filter web-next dev -- --port $WebPort" -ForegroundColor Gray
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm --filter web-next dev -- --port $WebPort" -WindowStyle Minimized

        Write-Host "⏳ Waiting for Web service..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5

        Write-Host "✅ Web service starting (check http://127.0.0.1:$WebPort)" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Skipping Web (--SkipWeb)" -ForegroundColor Gray
}

# Summary
Write-Host "`n📊 Dev Stack Summary:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: http://localhost:5432" -ForegroundColor White
Write-Host "   Executor:   http://127.0.0.1:$ExecutorPort" -ForegroundColor White
Write-Host "   Web UI:     http://127.0.0.1:$WebPort" -ForegroundColor White
Write-Host "`n💡 Useful commands:" -ForegroundColor Cyan
Write-Host "   Health check: curl http://127.0.0.1:$ExecutorPort/health" -ForegroundColor Gray
Write-Host "   Seed DB:      pnpm db:seed" -ForegroundColor Gray
Write-Host "   Reset DB:     pnpm db:reset" -ForegroundColor Gray
Write-Host "`n✅ Dev stack startup complete!" -ForegroundColor Green

