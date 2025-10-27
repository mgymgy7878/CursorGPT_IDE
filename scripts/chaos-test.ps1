# Chaos Testing for Runner Watchdog
param(
    [string]$TestType = "all",
    [int]$Duration = 300,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Test-IOWaitSimulation {
    Write-Host "## Chaos Test: I/O Wait Simulation" -ForegroundColor Yellow
    
    # Simulate I/O wait by creating a command that reads/writes continuously
    $ioCommand = @"
`$temp = [System.IO.Path]::GetTempFileName()
for (`$i = 0; `$i -lt 1000; `$i++) {
    Add-Content `$temp "Line `$i - `$(Get-Date)"
    Start-Sleep -Milliseconds 10
}
Remove-Item `$temp -Force
Write-Host "I/O simulation completed"
"@
    
    Write-Host "Running I/O wait simulation (should trigger idle timeout)..." -ForegroundColor Cyan
    node tools/runStepConfigurable.cjs $ioCommand "chaos-io" "development"
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 124) {
        Write-Host "✅ I/O wait simulation correctly triggered timeout" -ForegroundColor Green
    } else {
        Write-Host "❌ I/O wait simulation did not trigger timeout (exit: $exitCode)" -ForegroundColor Red
    }
}

function Test-ChildHangSimulation {
    Write-Host "## Chaos Test: Child Process Hang" -ForegroundColor Yellow
    
    # Simulate child process hang by spawning a process that doesn't respond
    $hangCommand = "Start-Process powershell -ArgumentList '-Command', 'Start-Sleep -Seconds 300' -WindowStyle Hidden; Start-Sleep -Seconds 60"
    
    Write-Host "Running child hang simulation (should trigger hard timeout)..." -ForegroundColor Cyan
    $env:RUNNER_HARD_MS = "30000"  # 30 second hard timeout for chaos test
    node tools/runStepConfigurable.cjs $hangCommand "chaos-hang" "development"
    $exitCode = $LASTEXITCODE
    
    # Cleanup any orphaned processes
    Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt (Get-Date).AddMinutes(-2) } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    if ($exitCode -eq 124) {
        Write-Host "✅ Child hang simulation correctly triggered hard timeout" -ForegroundColor Green
    } else {
        Write-Host "❌ Child hang simulation did not trigger hard timeout (exit: $exitCode)" -ForegroundColor Red
    }
}

function Test-StallBurstSimulation {
    Write-Host "## Chaos Test: Stall Burst Simulation" -ForegroundColor Yellow
    
    # Run multiple stall commands rapidly to test burst detection
    Write-Host "Running stall burst simulation (multiple rapid stalls)..." -ForegroundColor Cyan
    
    $burstResults = @()
    for ($i = 1; $i -le 5; $i++) {
        Write-Host "Burst attempt $i/5..." -ForegroundColor Cyan
        node tools/runStepConfigurable.cjs "Write-Host 'Burst test'; Start-Sleep -Seconds 20" "chaos-burst" "development"
        $burstResults += $LASTEXITCODE
        Start-Sleep -Seconds 2
    }
    
    $timeoutCount = ($burstResults | Where-Object { $_ -eq 124 }).Count
    Write-Host "Burst results: $timeoutCount/5 timeouts triggered" -ForegroundColor Cyan
    
    if ($timeoutCount -ge 3) {
        Write-Host "✅ Stall burst simulation correctly detected multiple timeouts" -ForegroundColor Green
    } else {
        Write-Host "❌ Stall burst simulation did not detect expected timeouts" -ForegroundColor Red
    }
}

function Test-MetricsIntegration {
    Write-Host "## Chaos Test: Metrics Integration" -ForegroundColor Yellow
    
    # Test if metrics are being sent (even if they fail due to missing endpoint)
    Write-Host "Testing metrics integration..." -ForegroundColor Cyan
    
    node tools/runStepConfigurable.cjs "Write-Host 'Metrics test'; Start-Sleep -Seconds 1" "chaos-metrics" "development"
    $exitCode = $LASTEXITCODE
    
    # Check if stall events were logged
    $stallEvents = Get-Content "evidence/runner/stall-events.jsonl" -Tail 5 -ErrorAction SilentlyContinue
    $metricsEvents = $stallEvents | Where-Object { $_ -match '"commandType":"chaos-metrics"' }
    
    if ($metricsEvents) {
        Write-Host "✅ Metrics integration test logged events" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Metrics integration test did not log expected events" -ForegroundColor Yellow
    }
}

function Test-EvidenceIntegrity {
    Write-Host "## Chaos Test: Evidence Integrity" -ForegroundColor Yellow
    
    # Verify evidence files are being created and contain valid data
    $evidenceFiles = @(
        "evidence/runner/stall-events.jsonl",
        "evidence/runner/smoke.txt"
    )
    
    $integrityResults = @()
    foreach ($file in $evidenceFiles) {
        if (Test-Path $file) {
            $size = (Get-Item $file).Length
            if ($size -gt 0) {
                Write-Host "✅ Evidence file integrity OK: $file ($size bytes)" -ForegroundColor Green
                $integrityResults += $true
            } else {
                Write-Host "❌ Evidence file is empty: $file" -ForegroundColor Red
                $integrityResults += $false
            }
        } else {
            Write-Host "❌ Evidence file missing: $file" -ForegroundColor Red
            $integrityResults += $false
        }
    }
    
    $successRate = ($integrityResults | Where-Object { $_ }).Count / $integrityResults.Count
    Write-Host "Evidence integrity success rate: $([math]::Round($successRate * 100, 1))%" -ForegroundColor Cyan
}

function Show-ChaosReport {
    Write-Host "## Chaos Test Report" -ForegroundColor Cyan
    
    # Analyze recent stall events
    if (Test-Path "evidence/runner/stall-events.jsonl") {
        $recentEvents = Get-Content "evidence/runner/stall-events.jsonl" -Tail 20 -ErrorAction SilentlyContinue
        $chaosEvents = $recentEvents | Where-Object { $_ -match '"commandType":"chaos-' }
        
        Write-Host "Recent chaos test events: $($chaosEvents.Count)" -ForegroundColor Cyan
        
        foreach ($event in $chaosEvents) {
            try {
                $eventObj = $event | ConvertFrom-Json
                Write-Host "  - $($eventObj.commandType): $($eventObj.event) at $($eventObj.ts)" -ForegroundColor Gray
            } catch {
                Write-Host "  - Invalid JSON event: $event" -ForegroundColor Red
            }
        }
    }
    
    # Check for evidence rotation needs
    $evidenceSize = if (Test-Path "evidence/runner") { 
        [math]::Round((Get-ChildItem "evidence/runner" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    } else { 0 }
    
    Write-Host "Evidence directory size: $evidenceSize MB" -ForegroundColor Cyan
    if ($evidenceSize -gt 50) {
        Write-Host "⚠️  Consider running evidence rotation (size > 50MB)" -ForegroundColor Yellow
    }
}

# Main execution
Write-Host "## Chaos Testing - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Test Type: $TestType" -ForegroundColor Cyan
Write-Host "Duration: $Duration seconds" -ForegroundColor Cyan
Write-Host "Dry Run: $DryRun" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual tests will be executed" -ForegroundColor Yellow
    exit 0
}

# Ensure evidence directory exists
New-Item -ItemType Directory -Path "evidence/runner" -Force | Out-Null

# Run selected tests
switch ($TestType.ToLower()) {
    "io" { Test-IOWaitSimulation }
    "hang" { Test-ChildHangSimulation }
    "burst" { Test-StallBurstSimulation }
    "metrics" { Test-MetricsIntegration }
    "evidence" { Test-EvidenceIntegrity }
    "all" {
        Test-IOWaitSimulation
        Test-ChildHangSimulation
        Test-StallBurstSimulation
        Test-MetricsIntegration
        Test-EvidenceIntegrity
    }
    default {
        Write-Host "Unknown test type: $TestType" -ForegroundColor Red
        Write-Host "Valid types: io, hang, burst, metrics, evidence, all" -ForegroundColor Cyan
        exit 1
    }
}

Show-ChaosReport

Write-Host "## Chaos testing completed" -ForegroundColor Green
