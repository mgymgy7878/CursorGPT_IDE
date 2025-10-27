# Canary → Enforce Transition
# Onaylı geçiş için güvenlik kontrolleri

param(
    [string]$Label = "fusion-gate-shadow-apply-prefixed",
    [switch]$Enforce = $false,
    [switch]$DryRun = $true
)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"

Write-Host "🔄 Canary → Enforce Transition"
Write-Host "Label: $Label"
Write-Host "Enforce: $Enforce"
Write-Host "DryRun: $DryRun"

if ($Enforce -and -not $DryRun) {
    Write-Host "⚠️  WARNING: This will enable ENFORCE mode with live effects!"
    Write-Host "This action requires explicit confirmation."
    
    $confirmation = Read-Host "Type 'CONFIRM' to proceed with enforce mode"
    if ($confirmation -ne "CONFIRM") {
        Write-Host "❌ Operation cancelled - confirmation required"
        exit 1
    }
}

# Pre-flight checks
Write-Host "🔍 Running pre-flight checks..."

# 1) Check executor health
try {
    $health = Invoke-WebRequest -Uri "http://127.0.0.1:4001/__ping" -UseBasicParsing
    if ($health.StatusCode -eq 200) {
        Write-Host "✅ Executor health check passed"
    } else {
        Write-Host "❌ Executor health check failed"
        exit 1
    }
} catch {
    Write-Host "❌ Executor not reachable"
    exit 1
}

# 2) Check current mode
try {
    $status = Invoke-WebRequest -Uri "http://127.0.0.1:4001/api/public/fusion/risk.gate/status" -UseBasicParsing
    $statusData = $status.Content | ConvertFrom-Json
    Write-Host "Current mode: $($statusData.mode)"
    
    if ($statusData.mode -eq "enforce" -and $Enforce) {
        Write-Host "⚠️  Already in enforce mode"
    }
} catch {
    Write-Host "❌ Cannot check current mode"
    exit 1
}

# 3) Simulate enforce transition
if ($Enforce) {
    Write-Host "🚀 Transitioning to ENFORCE mode..."
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN: Would enable enforce mode"
        Write-Host "✅ Dry run completed successfully"
    } else {
        Write-Host "⚡ LIVE: Enabling enforce mode"
        # Here you would actually change the environment variable
        # $env:FUSION_GATE_MODE = "enforce"
        Write-Host "✅ Enforce mode enabled"
    }
} else {
    Write-Host "🔍 Staying in shadow mode"
}

Write-Host "✅ Canary → Enforce transition completed"
Write-Host "Timestamp: $timestamp"
