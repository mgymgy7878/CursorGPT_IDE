# Threshold Freeze Enforce - CI Pipeline Guard
param(
    [string]$ConfigFile = "config/runner.json",
    [string]$PreviousConfigFile = "config/runner.json.backup",
    [switch]$Enforce = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

function Test-ThresholdFreezeConfig {
    param([string]$ConfigPath)
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "❌ Config file not found: $ConfigPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        
        if ($config.security -and $config.security.threshold_freeze) {
            $freeze = $config.security.threshold_freeze
            
            if ($freeze.enabled -eq $true -and $freeze.pr_required -eq $true) {
                Write-Host "✅ Threshold freeze properly configured" -ForegroundColor Green
                Write-Host "  Enabled: $($freeze.enabled)" -ForegroundColor Gray
                Write-Host "  PR Required: $($freeze.pr_required)" -ForegroundColor Gray
                Write-Host "  Auto Approve: $($freeze.auto_approve)" -ForegroundColor Gray
                Write-Host "  Freeze Duration: $($freeze.freeze_duration_hours) hours" -ForegroundColor Gray
                return $true
            } else {
                Write-Host "❌ Threshold freeze not properly configured" -ForegroundColor Red
                Write-Host "  Enabled: $($freeze.enabled)" -ForegroundColor Red
                Write-Host "  PR Required: $($freeze.pr_required)" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "❌ Threshold freeze configuration missing" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Config validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-ThresholdChanges {
    param(
        [string]$CurrentConfig,
        [string]$PreviousConfig
    )
    
    if (-not (Test-Path $PreviousConfig)) {
        Write-Host "⚠️  Previous config not found: $PreviousConfig" -ForegroundColor Yellow
        Write-Host "  Assuming first deployment - no threshold changes to check" -ForegroundColor Gray
        return $true
    }
    
    try {
        $current = Get-Content $CurrentConfig -Raw | ConvertFrom-Json
        $previous = Get-Content $PreviousConfig -Raw | ConvertFrom-Json
        
        # Check for threshold changes
        $currentThresholds = @{}
        $previousThresholds = @{}
        
        if ($current.timeouts) {
            $currentThresholds.idle_ms = $current.timeouts.idle_ms
            $currentThresholds.hard_ms = $current.timeouts.hard_ms
            $currentThresholds.grace_ms = $current.timeouts.grace_ms
        }
        
        if ($previous.timeouts) {
            $previousThresholds.idle_ms = $previous.timeouts.idle_ms
            $previousThresholds.hard_ms = $previous.timeouts.hard_ms
            $previousThresholds.grace_ms = $previous.timeouts.grace_ms
        }
        
        $changes = @()
        
        foreach ($key in $currentThresholds.Keys) {
            if ($previousThresholds.ContainsKey($key)) {
                if ($currentThresholds[$key] -ne $previousThresholds[$key]) {
                    $changes += @{
                        key = $key
                        old_value = $previousThresholds[$key]
                        new_value = $currentThresholds[$key]
                        change = $currentThresholds[$key] - $previousThresholds[$key]
                    }
                }
            }
        }
        
        if ($changes.Count -gt 0) {
            Write-Host "❌ PROD GUARD BLOCKED: Threshold changes detected" -ForegroundColor Red
            Write-Host "  Changes found: $($changes.Count)" -ForegroundColor Red
            
            foreach ($change in $changes) {
                Write-Host "    $($change.key): $($change.old_value) -> $($change.new_value) (Delta$($change.change))" -ForegroundColor Red
            }
            
            return $false
        } else {
            Write-Host "✅ No threshold changes detected" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Threshold change detection failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-CIEnvironment {
    try {
        # Check if we're in a CI environment
        $ciEnv = $env:CI -or $env:GITHUB_ACTIONS -or $env:JENKINS_URL -or $env:BUILD_ID
        
        if ($ciEnv) {
            Write-Host "✅ CI environment detected" -ForegroundColor Green
            Write-Host "  CI: $($env:CI)" -ForegroundColor Gray
            Write-Host "  GitHub Actions: $($env:GITHUB_ACTIONS)" -ForegroundColor Gray
            Write-Host "  Jenkins: $($env:JENKINS_URL)" -ForegroundColor Gray
            Write-Host "  Build ID: $($env:BUILD_ID)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "⚠️  Not in CI environment - threshold freeze check skipped" -ForegroundColor Yellow
            return $true
        }
    } catch {
        Write-Host "❌ CI environment check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PRRequirements {
    try {
        # Check if PR is required for threshold changes
        $prNumber = $env:PR_NUMBER -or $env:GITHUB_PR_NUMBER -or $env:PULL_REQUEST_NUMBER
        
        if ($prNumber) {
            Write-Host "✅ PR detected: #$prNumber" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  No PR detected - direct commit to main branch" -ForegroundColor Yellow
            return $true  # Allow for emergency fixes
        }
    } catch {
        Write-Host "❌ PR requirements check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SchemaValidation {
    param([string]$ConfigPath)
    
    try {
        $result = & "pnpm" "run" "config:validate" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Schema validation passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Schema validation failed: $result" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Schema validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Generate-ThresholdFreezeReport {
    param(
        [hashtable]$TestResults,
        [string]$Timestamp
    )
    
    $report = @"
## Threshold Freeze Enforce Report
**Timestamp:** $Timestamp
**Status:** $(if ($TestResults.failed -eq 0) { "ENFORCED" } else { "BLOCKED" })

### Test Results
- **Threshold Freeze Config:** $($TestResults.threshold_freeze_config)
- **Threshold Changes:** $($TestResults.threshold_changes)
- **CI Environment:** $($TestResults.ci_environment)
- **PR Requirements:** $($TestResults.pr_requirements)
- **Schema Validation:** $($TestResults.schema_validation)

### Summary
- **Total Tests:** $($TestResults.total)
- **Passed:** $($TestResults.passed)
- **Failed:** $($TestResults.failed)
- **Enforcement:** $(if ($Enforce) { "ENABLED" } else { "DISABLED" })

### Guard Status
"@

    if ($TestResults.failed -eq 0) {
        $report += "`n✅ All threshold freeze guards passed - deployment allowed"
    } else {
        $report += "`n❌ PROD GUARD BLOCKED - deployment blocked"
        if (-not $TestResults.threshold_freeze_config) {
            $report += "`n- Threshold freeze not properly configured"
        }
        if (-not $TestResults.threshold_changes) {
            $report += "`n- Threshold changes detected - PR required"
        }
        if (-not $TestResults.schema_validation) {
            $report += "`n- Schema validation failed"
        }
    }
    
    return $report
}

# Main execution
Write-Host "## Threshold Freeze Enforce - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Previous Config: $PreviousConfigFile" -ForegroundColor Cyan
Write-Host "Enforce: $Enforce" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$testResults = @{
    threshold_freeze_config = $false
    threshold_changes = $false
    ci_environment = $false
    pr_requirements = $false
    schema_validation = $false
    total = 5
    passed = 0
    failed = 0
}

# Test 1: Threshold Freeze Config
Write-Host "`n1. Testing Threshold Freeze Config..." -ForegroundColor Yellow
$testResults.threshold_freeze_config = Test-ThresholdFreezeConfig -ConfigPath $ConfigFile

# Test 2: Threshold Changes
Write-Host "`n2. Testing Threshold Changes..." -ForegroundColor Yellow
$testResults.threshold_changes = Test-ThresholdChanges -CurrentConfig $ConfigFile -PreviousConfig $PreviousConfigFile

# Test 3: CI Environment
Write-Host "`n3. Testing CI Environment..." -ForegroundColor Yellow
$testResults.ci_environment = Test-CIEnvironment

# Test 4: PR Requirements
Write-Host "`n4. Testing PR Requirements..." -ForegroundColor Yellow
$testResults.pr_requirements = Test-PRRequirements

# Test 5: Schema Validation
Write-Host "`n5. Testing Schema Validation..." -ForegroundColor Yellow
$testResults.schema_validation = Test-SchemaValidation -ConfigPath $ConfigFile

# Calculate results
foreach ($test in @("threshold_freeze_config", "threshold_changes", "ci_environment", "pr_requirements", "schema_validation")) {
    if ($testResults[$test] -eq $true) {
        $testResults.passed++
    } else {
        $testResults.failed++
    }
}

# Generate threshold freeze report
$freezeReport = Generate-ThresholdFreezeReport -TestResults $testResults -Timestamp (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host "`n$freezeReport" -ForegroundColor White

# Enforcement logic
if ($Enforce -and $testResults.failed -gt 0) {
    Write-Host "`n❌ PROD GUARD BLOCKED: Threshold freeze enforcement failed" -ForegroundColor Red
    Write-Host "  Failed tests: $($testResults.failed)" -ForegroundColor Red
    Write-Host "  Deployment blocked" -ForegroundColor Red
    exit 1
}

# Log threshold freeze event
$freezeEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "threshold_freeze_enforce"
    test_results = $testResults
    config_file = $ConfigFile
    previous_config_file = $PreviousConfigFile
    enforce = $Enforce
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $freezeEvent

Write-Host "`n## Threshold freeze enforce completed" -ForegroundColor Green
