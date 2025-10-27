# Canary Runner with Auto-Skip Retry Policy
param(
    [Parameter(Mandatory=$true)][string]$Command,
    [string]$CommandType = "canary",
    [int]$MaxRetries = 1,
    [int]$RetryDelaySeconds = 5
)

$ErrorActionPreference = "Continue"
$attempt = 0
$lastExitCode = 0

while ($attempt -le $MaxRetries) {
    $attempt++
    Write-Host "## Attempt $attempt/$($MaxRetries + 1) - $(Get-Date)" -ForegroundColor Yellow
    
    try {
        # Use metrics-enabled runner
        $env:RUNNER_IDLE_MS = "15000"  # 15s for canary operations
        $env:RUNNER_HARD_MS = "60000"  # 60s max for canary
        $env:SPARK_METRICS_ENDPOINT = "http://127.0.0.1:4001"
        
        node tools/runStepWithMetrics.cjs $Command $CommandType
        $lastExitCode = $LASTEXITCODE
        
        if ($lastExitCode -eq 0) {
            Write-Host "✅ Command succeeded on attempt $attempt" -ForegroundColor Green
            exit 0
        } elseif ($lastExitCode -eq 124) {
            Write-Host "⚠️ Command killed due to timeout on attempt $attempt" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Command failed with exit code $lastExitCode on attempt $attempt" -ForegroundColor Red
        }
        
        if ($attempt -le $MaxRetries) {
            Write-Host "⏳ Waiting $RetryDelaySeconds seconds before retry..." -ForegroundColor Cyan
            Start-Sleep -Seconds $RetryDelaySeconds
        }
        
    } catch {
        Write-Host "💥 Exception on attempt $attempt`: $($_.Exception.Message)" -ForegroundColor Red
        $lastExitCode = 1
    }
}

# All retries exhausted
Write-Host "🚫 Command failed after $($MaxRetries + 1) attempts. Auto-skipping..." -ForegroundColor Magenta
Write-Host "::CANARY::AUTO_SKIP::reason=max_retries_exhausted::exit_code=$lastExitCode" -ForegroundColor Magenta

# Send skip metric
try {
    $metrics = @{
        name = 'spark_canary_auto_skip_total'
        value = 1
        'label_reason' = 'max_retries_exhausted'
        'label_command_type' = $CommandType
    }
    $body = ($metrics.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join '&'
    Invoke-RestMethod -Uri "http://127.0.0.1:4001/api/metrics/counter?$body" -Method POST -ErrorAction SilentlyContinue
} catch {
    # Metrics failure is not critical
}

exit 0  # Auto-skip always succeeds
