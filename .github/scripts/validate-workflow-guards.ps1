# GitHub Actions Workflow Fork Guard Validator
# Purpose: Ensure all workflows using secrets have fork guard protection
# Usage: Run in CI to block PRs that introduce unprotected secrets

Param()

$ErrorActionPreference = 'Stop'

$wfDir = Join-Path (Join-Path $PSScriptRoot '..') 'workflows'
if (-not (Test-Path $wfDir)) {
    Write-Host "ERROR: Workflow directory not found: $wfDir"
    exit 1
}

$wfDirResolved = Resolve-Path $wfDir
$files = Get-ChildItem $wfDirResolved -Filter '*.yml' | Where-Object { $_.Name -notmatch 'guard-validate.yml' }

Write-Host "=== Workflow Fork Guard Validator ==="
Write-Host "Scanning: $wfDirResolved"
Write-Host "Files: $($files.Count)"
Write-Host ""

$bad = @()

foreach ($f in $files) {
    $txt = Get-Content $f.FullName -Raw
    
    # Check if workflow uses secrets
    $usesSecrets = [regex]::IsMatch($txt, '(?m)\bsecrets\.')
    
    if ($usesSecrets) {
        # Check if fork guard is present
        $hasGuard = $txt -match 'if:\s*\$\{\{\s*!github\.event\.pull_request\.head\.repo\.fork\s*\}\}'
        
        if (-not $hasGuard) {
            $bad += $f.Name
            Write-Host "FAIL: $($f.Name) - uses secrets but lacks fork guard"
        } else {
            Write-Host "PASS: $($f.Name) - fork guard detected"
        }
    } else {
        Write-Host "SKIP: $($f.Name) - no secrets used"
    }
}

Write-Host ""

if ($bad.Count -gt 0) {
    Write-Host "================================"
    Write-Host "VALIDATION FAILED"
    Write-Host "================================"
    Write-Host ""
    Write-Host "The following workflows use secrets without fork guards:"
    $bad | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Required pattern:"
    Write-Host '  if: ${{ !github.event.pull_request.head.repo.fork }}'
    Write-Host ""
    Write-Host "See .github/WORKFLOW_CONTEXT_WARNINGS.md for details."
    exit 1
}

Write-Host "================================"
Write-Host "VALIDATION PASSED"
Write-Host "================================"
Write-Host ""
Write-Host "All workflows with secrets have fork guards."
exit 0

