# Rollback Script for Spark Trading Platform
# Single-command rollback with evidence collection

param(
    [Parameter(Mandatory=$true)]
    [string]$Reason,
    
    [Parameter(Mandatory=$false)]
    [string]$Stage = "unknown",
    
    [Parameter(Mandatory=$false)]
    [string]$TargetVersion = "v1.3.1",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "  🚨 ROLLBACK INITIATED 🚨" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""
Write-Host "Reason: $Reason" -ForegroundColor Yellow
Write-Host "Stage: $Stage" -ForegroundColor Yellow
Write-Host "Target Version: $TargetVersion" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host ""

# Create evidence directory
$evidenceDir = "evidence"
if (!(Test-Path $evidenceDir)) {
    New-Item -ItemType Directory -Path $evidenceDir | Out-Null
}

# Record rollback decision
$rollbackFile = "$evidenceDir/rollback_$timestamp.txt"
@"
ROLLBACK DECISION
=================
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
Reason: $Reason
Stage: $Stage
Target Version: $TargetVersion
Triggered By: $env:USERNAME
Dry Run: $DryRun

"@ | Out-File -FilePath $rollbackFile -Encoding UTF8

Write-Host "📝 Recording rollback decision: $rollbackFile" -ForegroundColor Cyan

# Step 1: Snapshot current metrics
Write-Host ""
Write-Host "Step 1/6: Capturing current metrics..." -ForegroundColor Cyan

try {
    $metricsFile = "$evidenceDir/metrics_before_rollback_$timestamp.txt"
    Invoke-WebRequest -Uri "http://localhost:4001/api/public/metrics.prom" -OutFile $metricsFile
    Write-Host "✅ Metrics captured: $metricsFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed to capture metrics: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 2: Stop application services
Write-Host ""
Write-Host "Step 2/6: Stopping application services..." -ForegroundColor Cyan

if (!$DryRun) {
    try {
        # Stop services (adjust based on your deployment)
        # For Docker Compose
        if (Test-Path "docker-compose.yml") {
            docker-compose down
            Write-Host "✅ Docker services stopped" -ForegroundColor Green
        }
        
        # For systemd (if on Linux via WSL or remote)
        # systemctl stop spark-trading-api spark-trading-web
    } catch {
        Write-Host "⚠️  Failed to stop services: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "🔍 [DRY RUN] Would stop services" -ForegroundColor Gray
}

# Step 3: Checkout target version
Write-Host ""
Write-Host "Step 3/6: Checking out target version..." -ForegroundColor Cyan

if (!$DryRun) {
    try {
        git fetch origin
        git checkout $TargetVersion
        Write-Host "✅ Checked out $TargetVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to checkout $TargetVersion : $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
} else {
    Write-Host "🔍 [DRY RUN] Would checkout $TargetVersion" -ForegroundColor Gray
}

# Step 4: Rebuild application
Write-Host ""
Write-Host "Step 4/6: Rebuilding application..." -ForegroundColor Cyan

if (!$DryRun) {
    try {
        pnpm install --frozen-lockfile
        pnpm build
        Write-Host "✅ Application rebuilt" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to rebuild: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
} else {
    Write-Host "🔍 [DRY RUN] Would run: pnpm install && pnpm build" -ForegroundColor Gray
}

# Step 5: Database rollback (if needed)
Write-Host ""
Write-Host "Step 5/6: Checking database state..." -ForegroundColor Cyan

if (!$DryRun) {
    try {
        # Check if migration rollback needed
        $dbStatus = pnpm prisma migrate status
        
        if ($dbStatus -match "Database schema is ahead") {
            Write-Host "⚠️  Database migration rollback required" -ForegroundColor Yellow
            Write-Host "   See: scripts/runbook-db-restore.md" -ForegroundColor Yellow
            Write-Host "   Manual intervention required for database rollback" -ForegroundColor Yellow
            
            # Prompt for confirmation
            $confirm = Read-Host "Continue without database rollback? (y/n)"
            if ($confirm -ne "y") {
                throw "Rollback cancelled - database intervention required"
            }
        } else {
            Write-Host "✅ Database schema compatible" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Database check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "🔍 [DRY RUN] Would check database migration status" -ForegroundColor Gray
}

# Step 6: Restart services
Write-Host ""
Write-Host "Step 6/6: Restarting services..." -ForegroundColor Cyan

if (!$DryRun) {
    try {
        # Restart services
        if (Test-Path "docker-compose.yml") {
            docker-compose up -d
            Write-Host "✅ Docker services started" -ForegroundColor Green
        }
        
        # Wait for services to be ready
        Start-Sleep -Seconds 10
    } catch {
        Write-Host "❌ Failed to restart services: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
} else {
    Write-Host "🔍 [DRY RUN] Would restart services" -ForegroundColor Gray
}

# Verify rollback
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔍 VERIFICATION" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (!$DryRun) {
    try {
        # Check health endpoint
        $health = Invoke-RestMethod -Uri "http://localhost:4001/api/healthz"
        Write-Host "✅ Health check: $($health.status)" -ForegroundColor Green
        Write-Host "   Version: $($health.version)" -ForegroundColor Gray
        
        # Capture post-rollback metrics
        $metricsAfterFile = "$evidenceDir/metrics_after_rollback_$timestamp.txt"
        Invoke-WebRequest -Uri "http://localhost:4001/api/public/metrics.prom" -OutFile $metricsAfterFile
        Write-Host "✅ Post-rollback metrics captured" -ForegroundColor Green
        
        # Compare key metrics
        Write-Host ""
        Write-Host "Key Metrics Comparison:" -ForegroundColor Cyan
        
        $before = Get-Content $metricsFile | Select-String "http_request_duration_seconds" | Select-Object -First 1
        $after = Get-Content $metricsAfterFile | Select-String "http_request_duration_seconds" | Select-Object -First 1
        
        Write-Host "  Before: $before" -ForegroundColor Gray
        Write-Host "  After:  $after" -ForegroundColor Gray
        
    } catch {
        Write-Host "⚠️  Verification failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Check logs and metrics manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "🔍 [DRY RUN] Would verify health endpoint and capture metrics" -ForegroundColor Gray
}

# Update rollback record
@"

ROLLBACK COMPLETED
==================
Completed At: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC")
Status: $(if (!$DryRun) { "SUCCESS" } else { "DRY RUN" })
Target Version: $TargetVersion
Services Restarted: $(if (!$DryRun) { "YES" } else { "N/A (DRY RUN)" })

Evidence Files:
- Rollback decision: $rollbackFile
- Metrics before: $metricsFile
- Metrics after: $metricsAfterFile

Next Steps:
1. Monitor metrics for 30 minutes
2. Create incident report
3. Schedule post-mortem
4. Update stakeholders

"@ | Out-File -FilePath $rollbackFile -Append -Encoding UTF8

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ ROLLBACK COMPLETE" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Evidence recorded: $rollbackFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔔 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Monitor metrics for 30 minutes" -ForegroundColor White
Write-Host "  2. Create incident report (.github/INCIDENT_TEMPLATE.md)" -ForegroundColor White
Write-Host "  3. Notify stakeholders (#spark-incidents)" -ForegroundColor White
Write-Host "  4. Schedule post-mortem" -ForegroundColor White
Write-Host ""

# Notify (if webhook configured)
if ($env:SLACK_WEBHOOK_URL) {
    try {
        $payload = @{
            text = "🚨 Rollback executed: $Reason"
            attachments = @(
                @{
                    color = "danger"
                    fields = @(
                        @{ title = "Stage"; value = $Stage; short = $true }
                        @{ title = "Target Version"; value = $TargetVersion; short = $true }
                        @{ title = "Triggered By"; value = $env:USERNAME; short = $true }
                        @{ title = "Evidence"; value = $rollbackFile; short = $true }
                    )
                }
            )
        } | ConvertTo-Json -Depth 10
        
        Invoke-RestMethod -Uri $env:SLACK_WEBHOOK_URL -Method Post -Body $payload -ContentType "application/json"
        Write-Host "✅ Slack notification sent" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to send Slack notification: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

exit 0
