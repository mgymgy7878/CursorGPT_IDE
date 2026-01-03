# Merge Readiness Check - Stub and Real Engine Mode Validation
# Windows PowerShell script for PR merge readiness verification

param(
    [ValidateSet("stub", "real", "both")]
    [string]$Mode = "both"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Spark Merge Readiness Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Clean evidence directory
$evidenceDir = "evidence"
if (Test-Path $evidenceDir) {
    Remove-Item "$evidenceDir\*" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Cleaned evidence directory" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Path $evidenceDir | Out-Null
    Write-Host "✓ Created evidence directory" -ForegroundColor Green
}

# Function to run smoke test
function Run-SmokeTest {
    param(
        [string]$EngineMode,
        [string]$TestName
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  $TestName (Engine Mode: $EngineMode)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    # Set environment variables
    $env:SPARK_MODE = "paper"
    $env:NEXT_PUBLIC_SPARK_MODE = "paper"
    $env:SPARK_ENGINE_MODE = $EngineMode
    
    if ($EngineMode -eq "real") {
        # Real mode: don't set SPARK_ENGINE_REAL_ENABLE in dev (only needed in prod)
        Remove-Item Env:SPARK_ENGINE_REAL_ENABLE -ErrorAction SilentlyContinue
    } else {
        # Stub mode: ensure real enable is not set
        Remove-Item Env:SPARK_ENGINE_REAL_ENABLE -ErrorAction SilentlyContinue
    }
    
    Write-Host "Environment:" -ForegroundColor Gray
    Write-Host "  SPARK_MODE=$env:SPARK_MODE" -ForegroundColor Gray
    Write-Host "  NEXT_PUBLIC_SPARK_MODE=$env:NEXT_PUBLIC_SPARK_MODE" -ForegroundColor Gray
    Write-Host "  SPARK_ENGINE_MODE=$env:SPARK_ENGINE_MODE" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for dev server to be ready (if not already running)
    Write-Host "Waiting for dev server..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $serverReady = $false
    
    while ($waited -lt $maxWait) {
        try {
            $healthResponse = Invoke-WebRequest -Uri "http://localhost:3003/api/health" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($healthResponse.StatusCode -eq 200) {
                $serverReady = $true
                break
            }
        } catch {
            # Server not ready yet
        }
        Start-Sleep -Seconds 1
        $waited++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    
    if (-not $serverReady) {
        Write-Host "  ✗ Dev server not ready after $maxWait seconds" -ForegroundColor Red
        Write-Host "    Please start: pnpm --filter web-next dev" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "  ✓ Dev server ready" -ForegroundColor Green
    Write-Host ""
    
    # Run smoke test
    Write-Host "Running smoke test..." -ForegroundColor Yellow
    try {
        $smokeOutput = & powershell -ExecutionPolicy Bypass -File scripts/smoke-mode.ps1 2>&1
        $smokeExitCode = $LASTEXITCODE
        
        if ($smokeExitCode -eq 0) {
            Write-Host "  ✓ Smoke test completed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Smoke test failed (exit code: $smokeExitCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ✗ Smoke test error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to validate evidence
function Test-Evidence {
    param(
        [string]$EngineMode
    )
    
    Write-Host ""
    Write-Host "Validating evidence ($EngineMode mode)..." -ForegroundColor Yellow
    
    $requiredFiles = @(
        "smoke_summary.txt",
        "smoke_matrix.json",
        "health_testnet.json",
        "backtest_status.json",
        "optimize_status.json",
        "paper_state.json"
    )
    
    $optionalFiles = @(
        "klines_testnet_10.json"
    )
    
    $allValid = $true
    
    foreach ($file in $requiredFiles) {
        $filePath = "$evidenceDir\$file"
        if (-not (Test-Path $filePath)) {
            Write-Host "  ✗ Missing required file: $file" -ForegroundColor Red
            $allValid = $false
            continue
        }
        
        $fileInfo = Get-Item $filePath
        if ($fileInfo.Length -eq 0) {
            Write-Host "  ✗ Empty file: $file" -ForegroundColor Red
            $allValid = $false
            continue
        }
        
        Write-Host "  ✓ $file ($($fileInfo.Length) bytes)" -ForegroundColor Green
    }
    
    foreach ($file in $optionalFiles) {
        $filePath = "$evidenceDir\$file"
        if (Test-Path $filePath) {
            $fileInfo = Get-Item $filePath
            Write-Host "  ✓ $file ($($fileInfo.Length) bytes) [optional]" -ForegroundColor Gray
        }
    }
    
    # Validate smoke_matrix.json
    $matrixPath = "$evidenceDir\smoke_matrix.json"
    if (Test-Path $matrixPath) {
        try {
            $matrix = Get-Content $matrixPath | ConvertFrom-Json
            if ($matrix.engineMode -eq $EngineMode) {
                Write-Host "  ✓ smoke_matrix.json engineMode matches: $($matrix.engineMode)" -ForegroundColor Green
                
                # Check step statuses
                $steps = $matrix.steps
                $criticalSteps = @("backtest", "optimize", "paperState")
                foreach ($step in $criticalSteps) {
                    $status = $steps.$step
                    if ($status -like "PASS*") {
                        Write-Host "    ✓ $step : $status" -ForegroundColor Green
                    } else {
                        Write-Host "    ✗ $step : $status" -ForegroundColor Red
                        $allValid = $false
                    }
                }
            } else {
                Write-Host "  ⚠ smoke_matrix.json engineMode mismatch (expected: $EngineMode, got: $($matrix.engineMode))" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ✗ Failed to parse smoke_matrix.json: $($_.Exception.Message)" -ForegroundColor Red
            $allValid = $false
        }
    }
    
    return $allValid
}

# Run tests based on mode
if ($Mode -eq "stub" -or $Mode -eq "both") {
    $stubPassed = Run-SmokeTest -EngineMode "stub" -TestName "Stub Mode Smoke Test"
    if (-not $stubPassed) {
        $allPassed = $false
    } else {
        $stubEvidenceValid = Test-Evidence -EngineMode "stub"
        if (-not $stubEvidenceValid) {
            $allPassed = $false
        }
    }
}

if ($Mode -eq "real" -or $Mode -eq "both") {
    # For real mode, we need to wait a bit for stub test to complete
    if ($Mode -eq "both") {
        Write-Host ""
        Write-Host "Waiting 5 seconds before real mode test..." -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
    
    $realPassed = Run-SmokeTest -EngineMode "real" -TestName "Real Mode Smoke Test"
    if (-not $realPassed) {
        $allPassed = $false
    } else {
        $realEvidenceValid = Test-Evidence -EngineMode "real"
        if (-not $realEvidenceValid) {
            $allPassed = $false
        }
    }
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Merge Readiness Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allPassed) {
    Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Evidence files:" -ForegroundColor Yellow
    Get-ChildItem $evidenceDir | Sort-Object Name | Format-Table Name, Length -AutoSize
    Write-Host ""
    Write-Host "Ready for PR merge!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors above and fix before merging." -ForegroundColor Yellow
    exit 1
}

