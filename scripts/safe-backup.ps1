param(
  [string]$Tag = "snapshot",
  [switch]$SkipBuild,
  [switch]$NoLint
)
$ErrorActionPreference = "Stop"
if ($NoLint) { $env:NEXT_IGNORE_ESLINT = "1" }

Write-Host "[safe-backup] Snapshot hazirlaniyor..."

git add -A
if (-not $SkipBuild) {
  Write-Host "[safe-backup] Build calisiyor (apps/web-next)..."
  npm run build -w apps/web-next
}

# Yerel kimlik yoksa minimal kimlik ata
try { $null = git config user.name } catch { git config user.name "Snapshot Bot" }
try { $null = git config user.email } catch { git config user.email "snapshot@example.com" }

$commitMsg = "chore: $Tag"
Write-Host "[safe-backup] Commit: $commitMsg"
try { git commit -m $commitMsg } catch { Write-Host "[safe-backup] Commit atlanmis olabilir: $($_.Exception.Message)" }

Write-Host "[safe-backup] Tag ekleniyor: $Tag"
try { git tag -a $Tag -m "snapshot: $Tag" } catch { Write-Host "[safe-backup] Tag atlama: $($_.Exception.Message)" }

# Remote varsa push et
$remoteUrl = $null
try { $remoteUrl = git remote get-url origin 2>$null } catch {}
if ($LASTEXITCODE -eq 0 -and $remoteUrl) {
  Write-Host "[safe-backup] Remote origin tespit edildi: $remoteUrl"
  git push -u origin HEAD
  git push --tags
} else {
  Write-Host "[safe-backup] Remote origin yok; push atlandi."
}

Write-Host "Backup tamam: $Tag" 