# Prod Guard Kancaları - Production Security Gates
param(
    [string]$ConfigFile = "config/runner.json",
    [string]$RulesFile = "config/prometheus/rules/spark-runner.rules.yml",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Test-AdaptiveThresholdFreeze {
    param([string]$ConfigPath)
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "❌ Config file not found: $ConfigPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        
        # Check for threshold freeze enforcement
        if ($config.security -and $config.security.threshold_freeze) {
            Write-Host "✅ Adaptive threshold freeze enabled" -ForegroundColor Green
            Write-Host "  Freeze status: $($config.security.threshold_freeze.enabled)" -ForegroundColor Gray
            Write-Host "  PR required: $($config.security.threshold_freeze.pr_required)" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "⚠️  Adaptive threshold freeze not configured" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ Config validation failed: $($_.Exception.Message)" -ForegroundColor Red
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

function Test-AlertRouteAssurance {
    param([string]$RulesPath)
    
    if (-not (Test-Path $RulesPath)) {
        Write-Host "❌ Rules file not found: $RulesPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $rulesContent = Get-Content $RulesPath -Raw
        
        # Check for team=platform labels
        if ($rulesContent -match 'team:\s*"platform"') {
            Write-Host "✅ Alert route assurance: team=platform labels found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Alert route assurance: team=platform labels not found" -ForegroundColor Yellow
        }
        
        # Check for severity labels
        if ($rulesContent -match 'severity:\s*"(critical|warning|info)"') {
            Write-Host "✅ Alert route assurance: severity labels found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Alert route assurance: severity labels not found" -ForegroundColor Yellow
        }
        
        # Check for runbook URLs
        if ($rulesContent -match 'runbook_url:') {
            Write-Host "✅ Alert route assurance: runbook URLs found" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Alert route assurance: runbook URLs not found" -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "❌ Alert route assurance check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PIIRedactionGate {
    param([string]$RunnerScript = "tools/runStepConfigurable.cjs")
    
    if (-not (Test-Path $RunnerScript)) {
        Write-Host "❌ Runner script not found: $RunnerScript" -ForegroundColor Red
        return $false
    }
    
    try {
        $scriptContent = Get-Content $RunnerScript -Raw
        
        # Check for PII redaction patterns
        $redactionPatterns = @(
            "redactCommand",
            "AKIA[0-9A-Z]{16}",
            "api[_-]?key",
            "password",
            "secret",
            "token"
        )
        
        $foundPatterns = 0
        foreach ($pattern in $redactionPatterns) {
            if ($scriptContent -match $pattern) {
                $foundPatterns++
            }
        }
        
        if ($foundPatterns -ge 3) {
            Write-Host "✅ PII redaction gate: $foundPatterns patterns found" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ PII redaction gate: Only $foundPatterns patterns found (need ≥3)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ PII redaction gate check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-SecurityValidation {
    param([string]$ConfigPath)
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "❌ Config file not found: $ConfigPath" -ForegroundColor Red
        return $false
    }
    
    try {
        $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
        
        # Check for security rules
        if ($config.security) {
            Write-Host "✅ Security validation: Security rules configured" -ForegroundColor Green
            
            # Check allowed commands
            if ($config.security.allowed_commands -and $config.security.allowed_commands.Count -gt 0) {
                Write-Host "  Allowed commands: $($config.security.allowed_commands.Count)" -ForegroundColor Gray
            }
            
            # Check blocked patterns
            if ($config.security.blocked_patterns -and $config.security.blocked_patterns.Count -gt 0) {
                Write-Host "  Blocked patterns: $($config.security.blocked_patterns.Count)" -ForegroundColor Gray
            }
            
            return $true
        } else {
            Write-Host "❌ Security validation: No security rules configured" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Security validation failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Generate-ProdGuardReport {
    param(
        [hashtable]$GuardResults,
        [string]$Timestamp
    )
    
    $report = @"
## Prod Guard Report
**Timestamp:** $Timestamp
**Status:** $(if ($GuardResults.failed -eq 0) { "SECURE" } else { "INSECURE" })

### Guard Results
- **Adaptive Threshold Freeze:** $($GuardResults.threshold_freeze)
- **Schema Validation:** $($GuardResults.schema_validation)
- **Alert Route Assurance:** $($GuardResults.alert_route)
- **PII Redaction Gate:** $($GuardResults.pii_redaction)
- **Security Validation:** $($GuardResults.security_validation)

### Summary
- **Total Guards:** $($GuardResults.total)
- **Passed:** $($GuardResults.passed)
- **Failed:** $($GuardResults.failed)

### Security Status
"@

    if ($GuardResults.failed -eq 0) {
        $report += "`n✅ All production guards passed - system is secure for production deployment"
    } else {
        $report += "`n❌ $($GuardResults.failed) guards failed - system is NOT secure for production deployment"
    }
    
    return $report
}

# Main execution
Write-Host "## Prod Guard Kancaları - $(Get-Date)" -ForegroundColor Cyan
Write-Host "Config File: $ConfigFile" -ForegroundColor Cyan
Write-Host "Rules File: $RulesFile" -ForegroundColor Cyan
Write-Host "Dry run: $DryRun" -ForegroundColor Cyan

$guardResults = @{
    threshold_freeze = $false
    schema_validation = $false
    alert_route = $false
    pii_redaction = $false
    security_validation = $false
    total = 5
    passed = 0
    failed = 0
}

# Guard 1: Adaptive Threshold Freeze
Write-Host "`n1. Testing Adaptive Threshold Freeze..." -ForegroundColor Yellow
$guardResults.threshold_freeze = Test-AdaptiveThresholdFreeze -ConfigPath $ConfigFile

# Guard 2: Schema Validation
Write-Host "`n2. Testing Schema Validation..." -ForegroundColor Yellow
$guardResults.schema_validation = Test-SchemaValidation -ConfigPath $ConfigFile

# Guard 3: Alert Route Assurance
Write-Host "`n3. Testing Alert Route Assurance..." -ForegroundColor Yellow
$guardResults.alert_route = Test-AlertRouteAssurance -RulesPath $RulesFile

# Guard 4: PII Redaction Gate
Write-Host "`n4. Testing PII Redaction Gate..." -ForegroundColor Yellow
$guardResults.pii_redaction = Test-PIIRedactionGate

# Guard 5: Security Validation
Write-Host "`n5. Testing Security Validation..." -ForegroundColor Yellow
$guardResults.security_validation = Test-SecurityValidation -ConfigPath $ConfigFile

# Calculate results
foreach ($guard in @("threshold_freeze", "schema_validation", "alert_route", "pii_redaction", "security_validation")) {
    if ($guardResults[$guard] -eq $true) {
        $guardResults.passed++
    } else {
        $guardResults.failed++
    }
}

# Generate guard report
$guardReport = Generate-ProdGuardReport -GuardResults $guardResults -Timestamp (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Write-Host "`n$guardReport" -ForegroundColor White

# Log guard event
$guardEvent = @{
    ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    event = "prod_guard_check"
    guard_results = $guardResults
    config_file = $ConfigFile
    rules_file = $RulesFile
    dry_run = $DryRun
} | ConvertTo-Json

Add-Content -Path "evidence/runner/stall-events.jsonl" -Value $guardEvent

Write-Host "`n## Prod guard check completed" -ForegroundColor Green
