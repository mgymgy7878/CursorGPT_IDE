# Staging Deployment Script
# Faz 6: Chunked Upload + SSE Retry

param(
    [string]$Environment = "staging",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "🚀 Staging Deployment - Faz 6" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow

# 1. Environment Setup
Write-Host "`n📋 Step 1: Environment Setup" -ForegroundColor Yellow

if (-not $DryRun) {
    # Load staging environment
    if (Test-Path "ops/staging.env") {
        Get-Content "ops/staging.env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
                if ($Verbose) {
                    Write-Host "  Set $($matches[1])=$($matches[2])" -ForegroundColor Gray
                }
            }
        }
        Write-Host "✅ Staging environment loaded" -ForegroundColor Green
    } else {
        Write-Host "❌ Staging environment file not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Environment setup (dry run)" -ForegroundColor Green
}

# 2. Dependencies Check
Write-Host "`n📋 Step 2: Dependencies Check" -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    $pnpmVersion = pnpm --version
    Write-Host "✅ Node: $nodeVersion, pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js/pnpm not found" -ForegroundColor Red
    exit 1
}

# 3. Build & Install
Write-Host "`n📋 Step 3: Build and Install" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        pnpm install --frozen-lockfile
        
        Write-Host "Building executor service..." -ForegroundColor Gray
        pnpm -C services/executor run build
        
        Write-Host "✅ Build completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Build and install (dry run)" -ForegroundColor Green
}

# 4. Storage Setup
Write-Host "`n📋 Step 4: Storage Setup" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        $chunkDir = ".data/chunks"
        if (-not (Test-Path $chunkDir)) {
            New-Item -ItemType Directory -Path $chunkDir -Force | Out-Null
            Write-Host "✅ Created chunk storage directory: $chunkDir" -ForegroundColor Green
        } else {
            Write-Host "✅ Chunk storage directory exists: $chunkDir" -ForegroundColor Green
        }
        
        # Set permissions (if needed)
        Write-Host "✅ Storage setup completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Storage setup failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Storage setup (dry run)" -ForegroundColor Green
}

# 5. Service Start
Write-Host "`n📋 Step 5: Service Start" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        Write-Host "Starting executor service..." -ForegroundColor Gray
        
        # Start service in background
        $job = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            pnpm -C services/executor run dev
        }
        
        # Wait for service to be ready
        $maxWait = 30
        $waited = 0
        do {
            Start-Sleep -Seconds 2
            $waited += 2
            try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:4001/health" -TimeoutSec 5 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Host "✅ Executor service started" -ForegroundColor Green
                    break
                }
            } catch {
                if ($waited -ge $maxWait) {
                    Write-Host "❌ Service startup timeout" -ForegroundColor Red
                    Stop-Job $job -ErrorAction SilentlyContinue
                    Remove-Job $job -ErrorAction SilentlyContinue
                    exit 1
                }
            }
        } while ($waited -lt $maxWait)
        
    } catch {
        Write-Host "❌ Service start failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Service start (dry run)" -ForegroundColor Green
}

# 6. Health Check
Write-Host "`n📋 Step 6: Health Check" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/health" -TimeoutSec 10
        if ($healthResponse.ok) {
            Write-Host "✅ Health check passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Health check failed" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Health check (dry run)" -ForegroundColor Green
}

# 7. Metrics Validation
Write-Host "`n📋 Step 7: Metrics Validation" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        $metricsResponse = Invoke-WebRequest -Uri "http://127.0.0.1:4001/metrics" -TimeoutSec 10
        $metricsContent = $metricsResponse.Content
        
        # Check for required metrics
        $requiredMetrics = @(
            "ai_payload_bytes",
            "ai_payload_truncated_total",
            "ai_chunk_upload_total",
            "sse_retry_total"
        )
        
        $foundMetrics = 0
        foreach ($metric in $requiredMetrics) {
            if ($metricsContent -match $metric) {
                $foundMetrics++
                Write-Host "✅ Found metric: $metric" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Missing metric: $metric" -ForegroundColor Yellow
            }
        }
        
        if ($foundMetrics -eq $requiredMetrics.Count) {
            Write-Host "✅ All required metrics found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Some metrics missing ($foundMetrics/$($requiredMetrics.Count))" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Metrics validation failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Metrics validation (dry run)" -ForegroundColor Green
}

# 8. Smoke Test
Write-Host "`n📋 Step 8: Smoke Test" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        Write-Host "Running smoke test..." -ForegroundColor Gray
        
        # Normal payload test
        $normalPayload = @{pair="BTCUSDT";tf="1h";risk="low"} | ConvertTo-Json
        $normalResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/ai/strategies/generate" `
            -Method POST -ContentType "application/json" -Body $normalPayload -TimeoutSec 30
        
        if ($normalResponse.ok) {
            Write-Host "✅ Normal payload test passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Normal payload test failed" -ForegroundColor Red
            exit 1
        }
        
        # Chunked payload test
        $largePayload = @{
            pair = "BTCUSDT"
            tf = "1h"
            risk = "low"
            largeData = ("x" * 500000)  # 500KB string
            items = @(1..2000)  # Large array
        }
        $largePayload.self = $largePayload  # Circular reference
        
        $body = $largePayload | ConvertTo-Json -Depth 6
        $largeResponse = Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/ai/strategies/generate" `
            -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
        
        if ($largeResponse.ok) {
            Write-Host "✅ Chunked payload test passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Chunked payload test failed" -ForegroundColor Red
            exit 1
        }
        
    } catch {
        Write-Host "❌ Smoke test failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Smoke test (dry run)" -ForegroundColor Green
}

# 9. Monitoring Setup
Write-Host "`n📋 Step 9: Monitoring Setup" -ForegroundColor Yellow

if (-not $DryRun) {
    try {
        # Check if Prometheus config exists
        if (Test-Path "ops/prometheus/prometheus-staging.yml") {
            Write-Host "✅ Prometheus config found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Prometheus config not found" -ForegroundColor Yellow
        }
        
        # Check if alert rules exist
        if (Test-Path "ops/alerts/ai-guardrails.yml" -and Test-Path "ops/alerts/ai-chunk-sse.yml") {
            Write-Host "✅ Alert rules found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Alert rules not found" -ForegroundColor Yellow
        }
        
        Write-Host "✅ Monitoring setup completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Monitoring setup failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Monitoring setup (dry run)" -ForegroundColor Green
}

# Summary
Write-Host "`n🎉 Staging Deployment Completed!" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Gray
Write-Host "Dry Run: $DryRun" -ForegroundColor Gray

if (-not $DryRun) {
    Write-Host "`n📊 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Monitor metrics: http://127.0.0.1:4001/metrics" -ForegroundColor Gray
    Write-Host "2. Check health: http://127.0.0.1:4001/health" -ForegroundColor Gray
    Write-Host "3. Run CI smoke test: .\scripts\ci\ai-guardrail-smoke.ps1" -ForegroundColor Gray
    Write-Host "4. Monitor for 2 hours before canary rollout" -ForegroundColor Gray
} else {
    Write-Host "`n📊 Dry Run Summary:" -ForegroundColor Yellow
    Write-Host "All steps would be executed in real deployment" -ForegroundColor Gray
}
