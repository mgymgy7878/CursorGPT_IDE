# P0 Chain - Production Secrets Setup
param(
  [string]$SSHHost = "",
  [string]$SSHUser = "",
  [string]$SSHKeyPath = "$HOME\.ssh\id_rsa",
  [string]$CDNHost = "",
  [switch]$DryRun = $false
)

$ErrorActionPreference = 'Stop'
$repo = "mgymgy7878/CursorGPT_IDE"

Write-Host "`n=== P0 Chain - Production Setup ===" -ForegroundColor Cyan

# 1. Auth Check
Write-Host "`n1. GitHub CLI Auth..." -ForegroundColor Yellow
gh auth status
Write-Host "Auth OK" -ForegroundColor Green

# 2. Validate
Write-Host "`n2. Validating Parameters..." -ForegroundColor Yellow
if ([string]::IsNullOrEmpty($SSHHost)) { Write-Host "ERROR: -SSHHost required" -ForegroundColor Red; exit 1 }
if ([string]::IsNullOrEmpty($SSHUser)) { Write-Host "ERROR: -SSHUser required" -ForegroundColor Red; exit 1 }
if ([string]::IsNullOrEmpty($CDNHost)) { Write-Host "ERROR: -CDNHost required" -ForegroundColor Red; exit 1 }
if (-not (Test-Path $SSHKeyPath)) { Write-Host "ERROR: SSH key not found: $SSHKeyPath" -ForegroundColor Red; exit 1 }

Write-Host "Parameters OK" -ForegroundColor Green
Write-Host "  SSH_HOST: $SSHHost"
Write-Host "  SSH_USER: $SSHUser"
Write-Host "  SSH_KEY: $SSHKeyPath"
Write-Host "  CDN_HOST: $CDNHost"

# 3. Set Secrets
Write-Host "`n3. Setting Secrets..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "DRY-RUN MODE - Secrets NOT set" -ForegroundColor Yellow
} else {
  echo $SSHHost | gh secret set SSH_HOST --repo $repo
  echo $SSHUser | gh secret set SSH_USER --repo $repo
  Get-Content $SSHKeyPath -Raw | gh secret set SSH_KEY --repo $repo --body -
  echo $CDNHost | gh secret set CDN_HOST --repo $repo
  Write-Host "Secrets set" -ForegroundColor Green
}

# 4. Verify
Write-Host "`n4. Verifying Secrets..." -ForegroundColor Yellow
gh secret list --repo $repo

# 5. Trigger
Write-Host "`n5. Triggering Workflow..." -ForegroundColor Yellow
if ($DryRun) {
  Write-Host "DRY-RUN MODE - Workflow NOT triggered" -ForegroundColor Yellow
} else {
  gh workflow run p0-chain.yml --ref main
  Write-Host "Workflow triggered" -ForegroundColor Green
  
  Start-Sleep -Seconds 5
  $run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
  Write-Host "Run ID: $run" -ForegroundColor Cyan
  Write-Host "URL: https://github.com/$repo/actions/runs/$run" -ForegroundColor Cyan
  
  Write-Host "`n6. Watching Run..." -ForegroundColor Yellow
  gh run watch $run
  
  Write-Host "`n7. Downloading Artifacts..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Force -Path evidence | Out-Null
  try {
    gh run download $run -n p0-artifacts -D evidence
    Write-Host "Artifacts downloaded" -ForegroundColor Green
    Write-Host "`nFINAL SUMMARY:" -ForegroundColor Cyan
    Get-Content evidence/final_summary.txt | Select-Object -First 1
  } catch {
    Write-Host "No artifacts (workflow may have failed)" -ForegroundColor Yellow
  }
}

Write-Host "`n=== Complete ===" -ForegroundColor Cyan

