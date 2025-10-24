# Check and trigger P0 workflow
# This script waits for default branch change and triggers workflow

Write-Host "=== P0 Workflow Trigger Script ===" -ForegroundColor Cyan

# Check default branch
Write-Host "`nChecking default branch..." -ForegroundColor Yellow
$defaultBranch = gh api repos/mgymgy7878/CursorGPT_IDE -q '.default_branch'
Write-Host "Current default branch: $defaultBranch" -ForegroundColor Green

if ($defaultBranch -eq "main") {
    Write-Host "`n✅ Default branch is 'main'. Triggering workflow..." -ForegroundColor Green
    
    # Trigger workflow
    gh workflow run p0-chain.yml --ref main
    
    # Wait a bit
    Start-Sleep -Seconds 3
    
    # List recent runs
    Write-Host "`nRecent workflow runs:" -ForegroundColor Yellow
    gh run list --limit 5
    
    # Get the latest run
    Write-Host "`nFetching latest workflow run..." -ForegroundColor Yellow
    $latestRun = gh run list --workflow=p0-chain.yml --limit 1 --json databaseId,status,conclusion,url | ConvertFrom-Json
    
    if ($latestRun) {
        Write-Host "`nLatest P0 Chain run:" -ForegroundColor Cyan
        Write-Host "  Run ID: $($latestRun.databaseId)" -ForegroundColor White
        Write-Host "  Status: $($latestRun.status)" -ForegroundColor White
        Write-Host "  Conclusion: $($latestRun.conclusion)" -ForegroundColor White
        Write-Host "  URL: $($latestRun.url)" -ForegroundColor White
        
        # Monitor the run
        Write-Host "`nMonitoring workflow run..." -ForegroundColor Yellow
        gh run watch $latestRun.databaseId
        
        # Download artifacts if run completed
        if ($latestRun.status -eq "completed") {
            Write-Host "`nDownloading artifacts..." -ForegroundColor Yellow
            gh run download $latestRun.databaseId -D ./evidence/github-artifacts
            Write-Host "✅ Artifacts downloaded to ./evidence/github-artifacts" -ForegroundColor Green
        }
    }
} else {
    Write-Host "`n❌ Default branch is still '$defaultBranch'. Please change it to 'main' in GitHub Settings." -ForegroundColor Red
    Write-Host "`nSteps:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://github.com/mgymgy7878/CursorGPT_IDE/settings/branches" -ForegroundColor White
    Write-Host "  2. Click 'Switch to another branch' under Default branch" -ForegroundColor White
    Write-Host "  3. Select 'main'" -ForegroundColor White
    Write-Host "  4. Click 'Update'" -ForegroundColor White
    Write-Host "  5. Confirm the change" -ForegroundColor White
    Write-Host "`nThen run this script again." -ForegroundColor Yellow
}

Write-Host "`n=== Script Complete ===" -ForegroundColor Cyan

