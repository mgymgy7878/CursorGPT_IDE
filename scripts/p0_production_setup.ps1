# P0 Chain - Production Secrets Setup & Workflow Execution
# Bu script production secrets'ları ekler ve P0 Chain'i tetikler

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

# 1. GH-CLI Auth Check
Write-Host "`n1️⃣  GitHub CLI Auth..." -ForegroundColor Yellow
gh auth status
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ GitHub auth failed. Run: gh auth login" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Auth OK" -ForegroundColor Green

# 2. Validate Parameters
Write-Host "`n2️⃣  Validating Parameters..." -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($SSHHost)) {
  Write-Host "❌ SSH_HOST is required. Use -SSHHost parameter" -ForegroundColor Red
  Write-Host "   Example: -SSHHost 'prod.yourdomain.com'" -ForegroundColor Gray
  exit 1
}

if ([string]::IsNullOrEmpty($SSHUser)) {
  Write-Host "❌ SSH_USER is required. Use -SSHUser parameter" -ForegroundColor Red
  Write-Host "   Example: -SSHUser 'deploy'" -ForegroundColor Gray
  exit 1
}

if ([string]::IsNullOrEmpty($CDNHost)) {
  Write-Host "❌ CDN_HOST is required. Use -CDNHost parameter" -ForegroundColor Red
  Write-Host "   Example: -CDNHost 'cdn.yourdomain.com'" -ForegroundColor Gray
  exit 1
}

if (-not (Test-Path $SSHKeyPath)) {
  Write-Host "❌ SSH key not found: $SSHKeyPath" -ForegroundColor Red
  Write-Host "   Use -SSHKeyPath to specify custom path" -ForegroundColor Gray
  exit 1
}

Write-Host "✅ Parameters validated" -ForegroundColor Green
Write-Host "   SSH_HOST: $SSHHost" -ForegroundColor Gray
Write-Host "   SSH_USER: $SSHUser" -ForegroundColor Gray
Write-Host "   SSH_KEY: $SSHKeyPath" -ForegroundColor Gray
Write-Host "   CDN_HOST: $CDNHost" -ForegroundColor Gray

# 3. Set Secrets
Write-Host "`n3️⃣  Setting Production Secrets..." -ForegroundColor Yellow

if ($DryRun) {
  Write-Host "⚠️  DRY-RUN MODE - Secrets will NOT be set" -ForegroundColor Yellow
} else {
  # SSH_HOST
  Write-Host "  Setting SSH_HOST..." -ForegroundColor Gray
  echo $SSHHost | gh secret set SSH_HOST --repo $repo
  
  # SSH_USER
  Write-Host "  Setting SSH_USER..." -ForegroundColor Gray
  echo $SSHUser | gh secret set SSH_USER --repo $repo
  
  # SSH_KEY
  Write-Host "  Setting SSH_KEY..." -ForegroundColor Gray
  Get-Content $SSHKeyPath -Raw | gh secret set SSH_KEY --repo $repo --body -
  
  # CDN_HOST
  Write-Host "  Setting CDN_HOST..." -ForegroundColor Gray
  echo $CDNHost | gh secret set CDN_HOST --repo $repo
  
  Write-Host "✅ Secrets set successfully" -ForegroundColor Green
}

# 4. Verify Secrets
Write-Host "`n4️⃣  Verifying Secrets..." -ForegroundColor Yellow
gh secret list --repo $repo
Write-Host "✅ Secrets verified" -ForegroundColor Green

# 5. Workflow Visibility Check
Write-Host "`n5️⃣  Checking Workflow Visibility..." -ForegroundColor Yellow
$workflows = gh workflow list | findstr p0-chain
if ($workflows) {
  Write-Host "✅ p0-chain.yml found on default branch" -ForegroundColor Green
} else {
  Write-Host "❌ p0-chain.yml not found on default branch" -ForegroundColor Red
  exit 1
}

# 6. Trigger Workflow
Write-Host "`n6️⃣  Triggering P0 Chain Workflow..." -ForegroundColor Yellow

if ($DryRun) {
  Write-Host "⚠️  DRY-RUN MODE - Workflow will NOT be triggered" -ForegroundColor Yellow
} else {
  gh workflow run p0-chain.yml --ref main
  Write-Host "✅ Workflow triggered" -ForegroundColor Green
}

# 7. Wait and Get Run ID
Write-Host "`n7️⃣  Waiting for Run to Start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$run = (gh run list --workflow=p0-chain.yml --limit 1 --json databaseId -q '.[0].databaseId')
Write-Host "✅ Run ID: $run" -ForegroundColor Green
Write-Host "   URL: https://github.com/$repo/actions/runs/$run" -ForegroundColor Cyan

# 8. Watch Run
Write-Host "`n8️⃣  Watching Run..." -ForegroundColor Yellow

if ($DryRun) {
  Write-Host "⚠️  DRY-RUN MODE - Skipping watch" -ForegroundColor Yellow
} else {
  gh run watch $run
}

# 9. Download Artifacts
Write-Host "`n9️⃣  Downloading Artifacts..." -ForegroundColor Yellow

if ($DryRun) {
  Write-Host "⚠️  DRY-RUN MODE - Artifacts will NOT be downloaded" -ForegroundColor Yellow
} else {
  New-Item -ItemType Directory -Force -Path evidence | Out-Null
  
  try {
    gh run download $run -n p0-artifacts -D evidence
    Write-Host "✅ Artifacts downloaded to evidence/" -ForegroundColor Green
  } catch {
    Write-Host "⚠️  No artifacts available (workflow may have failed)" -ForegroundColor Yellow
  }
}

# 10. Final Summary
Write-Host "`n🎯 FINAL SUMMARY" -ForegroundColor Cyan

if (-not $DryRun -and (Test-Path "evidence/final_summary.txt")) {
  Write-Host "`n" -NoNewline
  Get-Content evidence/final_summary.txt | Select-Object -First 1
  
  Write-Host "`n📁 Evidence Files:" -ForegroundColor Yellow
  Get-ChildItem evidence -File | Select-Object Name, @{N='Size(KB)';E={[math]::Round($_.Length/1KB,2)}} | Format-Table -AutoSize
} else {
  Write-Host "Run ID: $run" -ForegroundColor White
  Write-Host "Status: Check GitHub Actions UI" -ForegroundColor White
  Write-Host "URL: https://github.com/$repo/actions/runs/$run" -ForegroundColor Cyan
}

Write-Host "`n=== Script Complete ===" -ForegroundColor Cyan

<#
Usage Examples:
===============

DRY-RUN (test parameters):
powershell -File scripts/p0_production_setup.ps1 -SSHHost "prod.example.com" -SSHUser "deploy" -CDNHost "cdn.example.com" -DryRun

PRODUCTION (real execution):
powershell -File scripts/p0_production_setup.ps1 -SSHHost "prod.yourdomain.com" -SSHUser "deploy" -CDNHost "cdn.yourdomain.com"

Custom SSH key:
powershell -File scripts/p0_production_setup.ps1 -SSHHost "prod.example.com" -SSHUser "deploy" -CDNHost "cdn.example.com" -SSHKeyPath "C:/custom/key.pem"
#>

