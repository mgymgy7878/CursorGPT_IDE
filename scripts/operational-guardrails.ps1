# OPERATIONAL GUARDRAILS - Safety Belt for Production
# Monitors critical thresholds and triggers rollback if needed
# chatgpt + cursor collaboration

param(
    [string]$Prom = "http://localhost:9090",
    [string]$Env = "development",
    [int]$MonitorDurationMinutes = 15,
    [switch]$AutoRollback
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OPERATIONAL GUARDRAILS" -ForegroundColor Cyan
Write-Host "  (Continuous Safety Monitoring)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Query helper
function Query-Prometheus($expr) {
    try {
        $response = Invoke-WebRequest -Uri "$Prom/api/v1/query?query=$([uri]::EscapeDataString($expr))" -UseBasicParsing -TimeoutSec 5
        $result = ($response.Content | ConvertFrom-Json)
        if ($result.data.result.Count -gt 0) {
            return $result.data.result[0].value[1]
        }
        return $null
    } catch {
        return $null
    }
}

# Guardrails thresholds (chatgpt's spec)
$THRESHOLDS = @{
    latency_warning = 1500    # ms
    latency_critical = 3000   # ms
    staleness_warning = 60    # seconds
    staleness_critical = 300  # seconds
    error_warning = 0.01      # errors/second
    error_critical = 0.05     # errors/second
}

Write-Host "Guardrails Configuration:" -ForegroundColor Yellow
Write-Host "  Latency: warning $($THRESHOLDS.latency_warning)ms, critical $($THRESHOLDS.latency_critical)ms" -ForegroundColor Gray
Write-Host "  Staleness: warning $($THRESHOLDS.staleness_warning)s, critical $($THRESHOLDS.staleness_critical)s" -ForegroundColor Gray
Write-Host "  Error rate: warning $($THRESHOLDS.error_warning)/s, critical $($THRESHOLDS.error_critical)/s" -ForegroundColor Gray
Write-Host "  Monitor duration: $MonitorDurationMinutes minutes" -ForegroundColor Gray
Write-Host "  Auto-rollback: $AutoRollback" -ForegroundColor Gray
Write-Host ""

$violations = @{
    latency = 0
    staleness = 0
    errors = 0
}

$criticalViolations = 0
$startTime = Get-Date

Write-Host "Starting continuous monitoring..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

while ($true) {
    $elapsed = ((Get-Date) - $startTime).TotalMinutes
    
    if ($elapsed -ge $MonitorDurationMinutes) {
        Write-Host ""
        Write-Host "Monitor duration reached ($MonitorDurationMinutes minutes)" -ForegroundColor Yellow
        break
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    # Query current metrics
    $p95 = Query-Prometheus "job:spark_portfolio_latency_p95:5m{environment=""$Env""}"
    $stale = Query-Prometheus "max(job:spark_portfolio_staleness{environment=""$Env""})"
    $err = Query-Prometheus "sum(job:spark_exchange_api_error_rate:5m{environment=""$Env""})"
    
    $p95 = if ($p95) { [int]([double]$p95) } else { 0 }
    $stale = if ($stale) { [int]([double]$stale) } else { 0 }
    $err = if ($err) { [double]$err } else { 0.0 }
    
    # Check thresholds
    $currentStatus = "🟢 GREEN"
    $issues = @()
    
    # Latency check
    if ($p95 -gt $THRESHOLDS.latency_critical) {
        $issues += "🔴 CRITICAL: Latency $p95 ms > $($THRESHOLDS.latency_critical) ms"
        $violations.latency++
        $criticalViolations++
        $currentStatus = "🔴 RED"
    } elseif ($p95 -gt $THRESHOLDS.latency_warning) {
        $issues += "🟡 WARNING: Latency $p95 ms > $($THRESHOLDS.latency_warning) ms"
        if ($currentStatus -eq "🟢 GREEN") { $currentStatus = "🟡 YELLOW" }
    }
    
    # Staleness check
    if ($stale -gt $THRESHOLDS.staleness_critical) {
        $issues += "🔴 CRITICAL: Staleness $stale s > $($THRESHOLDS.staleness_critical) s"
        $violations.staleness++
        $criticalViolations++
        $currentStatus = "🔴 RED"
    } elseif ($stale -gt $THRESHOLDS.staleness_warning) {
        $issues += "🟡 WARNING: Staleness $stale s > $($THRESHOLDS.staleness_warning) s"
        if ($currentStatus -eq "🟢 GREEN") { $currentStatus = "🟡 YELLOW" }
    }
    
    # Error rate check
    if ($err -gt $THRESHOLDS.error_critical) {
        $issues += "🔴 CRITICAL: Error rate $("{0:N4}" -f $err)/s > $($THRESHOLDS.error_critical)/s"
        $violations.errors++
        $criticalViolations++
        $currentStatus = "🔴 RED"
    } elseif ($err -gt $THRESHOLDS.error_warning) {
        $issues += "🟡 WARNING: Error rate $("{0:N4}" -f $err)/s > $($THRESHOLDS.error_warning)/s"
        if ($currentStatus -eq "🟢 GREEN") { $currentStatus = "🟡 YELLOW" }
    }
    
    # Display status
    Write-Host "[$timestamp] $currentStatus | p95: $p95 ms, stale: $stale s, err: $("{0:N4}" -f $err)/s" -ForegroundColor White
    
    if ($issues.Count -gt 0) {
        foreach ($issue in $issues) {
            Write-Host "  $issue" -ForegroundColor Yellow
        }
    }
    
    # Check for critical violations (chatgpt's rollback trigger)
    # Rollback trigger: ≥2 critical violations sustained for 15 minutes
    if ($criticalViolations -ge 2 -and $elapsed -ge 15) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ROLLBACK TRIGGER ACTIVATED" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Reason: ≥2 critical threshold violations sustained for 15+ minutes" -ForegroundColor Red
        Write-Host "  Latency violations: $($violations.latency)" -ForegroundColor Red
        Write-Host "  Staleness violations: $($violations.staleness)" -ForegroundColor Red
        Write-Host "  Error violations: $($violations.errors)" -ForegroundColor Red
        Write-Host ""
        
        if ($AutoRollback) {
            Write-Host "Auto-rollback enabled, executing rollback procedure..." -ForegroundColor Yellow
            Write-Host ""
            
            # Execute rollback
            cd C:\dev\CursorGPT_IDE
            .\durdur.ps1
            
            Write-Host "Restoring environment files..." -ForegroundColor Yellow
            
            # Restore .env backups (if exist)
            $executorEnvBackup = Get-ChildItem "services\executor\.env.backup.*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($executorEnvBackup) {
                Copy-Item $executorEnvBackup.FullName "services\executor\.env" -Force
                Write-Host "  ✓ Restored executor .env" -ForegroundColor Green
            }
            
            $webEnvBackup = Get-ChildItem "apps\web-next\.env.local.backup.*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($webEnvBackup) {
                Copy-Item $webEnvBackup.FullName "apps\web-next\.env.local" -Force
                Write-Host "  ✓ Restored web-next .env.local" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "Restarting services with previous configuration..." -ForegroundColor Yellow
            .\basla.ps1
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  ROLLBACK COMPLETE" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            
            exit 1
        } else {
            Write-Host "⚠️  Auto-rollback disabled. Manual intervention required." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To rollback manually:" -ForegroundColor Cyan
            Write-Host "  1. cd C:\dev\CursorGPT_IDE" -ForegroundColor White
            Write-Host "  2. .\durdur.ps1" -ForegroundColor White
            Write-Host "  3. Restore .env files from backups" -ForegroundColor White
            Write-Host "  4. .\basla.ps1" -ForegroundColor White
            Write-Host ""
            
            exit 1
        }
    }
    
    # Wait before next check
    Start-Sleep 30
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MONITORING COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Violations Summary ($MonitorDurationMinutes minutes):" -ForegroundColor Cyan
Write-Host "  Latency violations: $($violations.latency)" -ForegroundColor White
Write-Host "  Staleness violations: $($violations.staleness)" -ForegroundColor White
Write-Host "  Error violations: $($violations.errors)" -ForegroundColor White
Write-Host "  Total critical: $criticalViolations" -ForegroundColor White
Write-Host ""

if ($criticalViolations -eq 0) {
    Write-Host "✅ ALL GUARDRAILS PASSED - System healthy" -ForegroundColor Green
} elseif ($criticalViolations -lt 2) {
    Write-Host "⚠️  Minor violations detected - Monitor closely" -ForegroundColor Yellow
} else {
    Write-Host "🔴 CRITICAL VIOLATIONS - Action required" -ForegroundColor Red
}

Write-Host ""

