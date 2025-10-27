# Create Release Bundle (v1.8.0-rc1)
# Packages all artifacts with SHA256 checksums
param(
    [string]$Version = "v1.8.0-rc1"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RELEASE BUNDLE CREATOR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version: $Version" -ForegroundColor Yellow
Write-Host ""

# Create release directory
$releaseDir = "releases\$Version"
Write-Host "[1/6] Creating release directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

# Copy artifacts
Write-Host "[2/6] Copying artifacts..." -ForegroundColor Cyan
$items = @(
    "docs",
    "rules",
    "scripts",
    "grafana-ml-dashboard.json",
    "CHANGELOG.md",
    "GREEN_EVIDENCE_v1.8.md"
)

foreach ($item in $items) {
    if (Test-Path $item) {
        Copy-Item -Recurse -Force $item -Destination $releaseDir
        Write-Host "   Copied: $item" -ForegroundColor Gray
    }
}

# Copy evidence (selective)
Write-Host "   Copying evidence (selective)..." -ForegroundColor Gray
New-Item -ItemType Directory -Force -Path "$releaseDir\evidence\ml" | Out-Null
Get-ChildItem "evidence\ml\*.json" | Copy-Item -Destination "$releaseDir\evidence\ml\"
Get-ChildItem "evidence\ml\*.txt" | Copy-Item -Destination "$releaseDir\evidence\ml\"

# Git commit hash
Write-Host "[3/6] Recording git commit..." -ForegroundColor Cyan
try {
    git rev-parse HEAD 2>$null | Out-File -Encoding ascii "$releaseDir\COMMIT.txt"
    git log -1 --format="%H%n%an%n%ae%n%ai%n%s" 2>$null | Out-File -Encoding ascii "$releaseDir\GIT_INFO.txt"
} catch {
    "unknown (git not available)" | Out-File -Encoding ascii "$releaseDir\COMMIT.txt"
    Write-Host "   Git not available, using placeholder" -ForegroundColor Gray
}

# Version manifest
Write-Host "[4/6] Creating version manifest..." -ForegroundColor Cyan
$gitCommit = try { git rev-parse HEAD 2>$null } catch { "unknown" }

$manifest = @{
    version = $Version
    created = (Get-Date -Format "o")
    git_commit = $gitCommit
    platform = "Spark Trading Platform"
    component = "ML Pipeline"
    status = "observe-only"
    promote_blocked = $true
    promote_blocker = "PSI drift (1.25 > 0.2)"
    gates = @{
        total = 6
        passed = 5
        failed = 1
        blocking = @("PSI")
    }
    evidence_files = (Get-ChildItem -Recurse "$releaseDir\evidence" -File).Count
    documentation_files = (Get-ChildItem "$releaseDir\docs" -File).Count
    scripts = (Get-ChildItem "$releaseDir\scripts" -File).Count
} | ConvertTo-Json -Depth 5

$manifest | Out-File -Encoding utf8 "$releaseDir\MANIFEST.json"

# SHA256 checksums
Write-Host "[5/6] Generating SHA256 checksums..." -ForegroundColor Cyan
$checksums = Get-ChildItem -Recurse "$releaseDir" -File |
    Get-FileHash -Algorithm SHA256 |
    Sort-Object Path |
    ForEach-Object {
        $relativePath = $_.Path.Replace("$PWD\$releaseDir\", "")
        "$($_.Hash)  $relativePath"
    }

$checksums | Out-File -Encoding ascii "$releaseDir\SHA256SUMS.txt"
Write-Host "   Generated $(($checksums | Measure-Object).Count) checksums" -ForegroundColor Gray

# Create archive
Write-Host "[6/6] Creating release archive..." -ForegroundColor Cyan
$archivePath = "releases\$Version.zip"

if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}

Compress-Archive -Path $releaseDir -DestinationPath $archivePath -CompressionLevel Optimal
$archiveSize = [math]::Round((Get-Item $archivePath).Length / 1MB, 2)

# Archive checksum
$archiveHash = (Get-FileHash -Algorithm SHA256 $archivePath).Hash
"$archiveHash  $Version.zip" | Out-File -Encoding ascii "$archivePath.sha256"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RELEASE BUNDLE COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Version:  $Version" -ForegroundColor White
Write-Host "Archive:  $archivePath" -ForegroundColor White
Write-Host "Size:     ${archiveSize} MB" -ForegroundColor White
Write-Host "Checksum: $($archiveHash.Substring(0, 16))..." -ForegroundColor White
Write-Host ""
Write-Host "Contents:" -ForegroundColor Yellow
Write-Host "  - Documentation: $((Get-ChildItem "$releaseDir\docs" -File).Count) files" -ForegroundColor White
Write-Host "  - Scripts: $((Get-ChildItem "$releaseDir\scripts" -File).Count) files" -ForegroundColor White
Write-Host "  - Rules: $((Get-ChildItem "$releaseDir\rules" -File).Count) files" -ForegroundColor White
Write-Host "  - Evidence: $((Get-ChildItem -Recurse "$releaseDir\evidence" -File).Count) files" -ForegroundColor White
Write-Host ""
Write-Host "Files:" -ForegroundColor Yellow
Write-Host "  $releaseDir/ (extracted)" -ForegroundColor White
Write-Host "  $archivePath (archive)" -ForegroundColor White
Write-Host "  $archivePath.sha256 (checksum)" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify: (Get-FileHash $archivePath).Hash -eq (Get-Content $archivePath.sha256).Split(' ')[0]" -ForegroundColor White
Write-Host "  2. Archive: Upload to artifact store / S3" -ForegroundColor White
Write-Host "  3. Tag: git tag $Version -m 'ML Pipeline observe-only complete'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

