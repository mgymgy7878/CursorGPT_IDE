# Runner Config Schema Validation
param(
    [string]$ConfigPath = "config/runner.json",
    [switch]$Strict = $false
)

$ErrorActionPreference = "Stop"

function Test-ConfigSchema {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        throw "Config file not found: $Path"
    }
    
    try {
        $config = Get-Content $Path -Raw | ConvertFrom-Json
    } catch {
        throw "Invalid JSON in config file: $($_.Exception.Message)"
    }
    
    # Required top-level keys
    $requiredKeys = @("timeouts", "environments", "command_types", "metrics", "logging", "security")
    foreach ($key in $requiredKeys) {
        if (-not $config.PSObject.Properties.Name -contains $key) {
            throw "Missing required key: $key"
        }
    }
    
    # Validate timeouts structure
    $timeoutKeys = @("idle_ms", "hard_ms", "grace_ms")
    foreach ($key in $timeoutKeys) {
        if (-not $config.timeouts.PSObject.Properties.Name -contains $key) {
            throw "Missing timeout key: timeouts.$key"
        }
        if ($config.timeouts.$key -notmatch '^\d+$') {
            throw "Invalid timeout value: timeouts.$key must be positive integer"
        }
    }
    
    # Validate environments structure
    foreach ($envName in $config.environments.PSObject.Properties.Name) {
        $env = $config.environments.$envName
        if ($env.PSObject.Properties.Name -notcontains "idle_ms") {
            throw "Missing idle_ms in environment: $envName"
        }
        if ($env.PSObject.Properties.Name -notcontains "hard_ms") {
            throw "Missing hard_ms in environment: $envName"
        }
    }
    
    # Validate command_types structure
    foreach ($cmdType in $config.command_types.PSObject.Properties.Name) {
        $cmd = $config.command_types.$cmdType
        $requiredCmdKeys = @("idle_ms", "hard_ms", "retry_count")
        foreach ($key in $requiredCmdKeys) {
            if (-not $cmd.PSObject.Properties.Name -contains $key) {
                throw "Missing command type key: command_types.$cmdType.$key"
            }
        }
    }
    
    # Validate metrics structure
    if (-not $config.metrics.PSObject.Properties.Name -contains "endpoint") {
        throw "Missing metrics.endpoint"
    }
    if (-not $config.metrics.PSObject.Properties.Name -contains "enabled") {
        throw "Missing metrics.enabled"
    }
    
    # Validate logging structure
    if (-not $config.logging.PSObject.Properties.Name -contains "evidence_dir") {
        throw "Missing logging.evidence_dir"
    }
    if (-not $config.logging.PSObject.Properties.Name -contains "retention_days") {
        throw "Missing logging.retention_days"
    }
    
    # Validate security structure
    if (-not $config.security.PSObject.Properties.Name -contains "allowed_commands") {
        throw "Missing security.allowed_commands"
    }
    if (-not $config.security.PSObject.Properties.Name -contains "blocked_patterns") {
        throw "Missing security.blocked_patterns"
    }
    
    # Strict mode validations
    if ($Strict) {
        # Check for dangerous timeout values
        if ($config.timeouts.idle_ms -lt 5000) {
            throw "Dangerous timeout: idle_ms too low ($($config.timeouts.idle_ms)ms < 5000ms)"
        }
        if ($config.timeouts.hard_ms -gt 600000) {
            throw "Dangerous timeout: hard_ms too high ($($config.timeouts.hard_ms)ms > 600000ms)"
        }
        
        # Check for empty security lists
        if ($config.security.allowed_commands.Count -eq 0) {
            throw "Security risk: allowed_commands is empty"
        }
        if ($config.security.blocked_patterns.Count -eq 0) {
            throw "Security risk: blocked_patterns is empty"
        }
        
        # Check for wildcard commands
        foreach ($cmd in $config.security.allowed_commands) {
            if ($cmd -eq "*" -or $cmd -eq ".*") {
                throw "Security risk: wildcard command found: $cmd"
            }
        }
    }
    
    return $true
}

function Test-ConfigDiff {
    param([string]$ConfigPath)
    
    $gitStatus = git status --porcelain $ConfigPath 2>$null
    if ($LASTEXITCODE -eq 0 -and $gitStatus) {
        Write-Host "⚠️  WARNING: Config file has uncommitted changes" -ForegroundColor Yellow
        Write-Host "   Run 'git diff $ConfigPath' to review changes" -ForegroundColor Yellow
        return $false
    }
    return $true
}

# Main execution
Write-Host "## Config Schema Validation - $(Get-Date)" -ForegroundColor Cyan

try {
    # Test schema validity
    Test-ConfigSchema -Path $ConfigPath
    Write-Host "✅ Config schema is valid" -ForegroundColor Green
    
    # Test for uncommitted changes (if in git repo)
    if (Test-Path ".git") {
        try {
            Test-ConfigDiff -ConfigPath $ConfigPath
        } catch {
            Write-Host "⚠️  Git check failed (git not available): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    # Additional validations
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    
    # Check timeout consistency
    $baseIdle = $config.timeouts.idle_ms
    $baseHard = $config.timeouts.hard_ms
    
    foreach ($envName in $config.environments.PSObject.Properties.Name) {
        $env = $config.environments.$envName
        if ($env.idle_ms -gt $baseIdle * 2) {
            Write-Host "⚠️  WARNING: Environment '$envName' idle_ms is >2x base value" -ForegroundColor Yellow
        }
        if ($env.hard_ms -lt $baseHard * 0.5) {
            Write-Host "⚠️  WARNING: Environment '$envName' hard_ms is <0.5x base value" -ForegroundColor Yellow
        }
    }
    
    Write-Host "## Schema validation completed successfully" -ForegroundColor Green
    exit 0
    
} catch {
    Write-Host "❌ Schema validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
