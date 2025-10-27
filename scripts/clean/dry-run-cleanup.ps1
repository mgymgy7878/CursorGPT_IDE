param([switch]$VerboseMode)
$ErrorActionPreference = "Stop"

$dups = @(
  "components/components",
  "contexts/contexts",
  "docs/docs",
  "lib/lib",
  "__tests__/__tests__",
  "apps/web-next/apps/web-next"
)

Write-Host "== DRY RUN =="
foreach ($p in $dups) {
  if (Test-Path $p) {
    $count = (Get-ChildItem -Recurse -File $p | Measure-Object).Count
    Write-Host "[FOUND] $p"
    Write-Host ("  Files: {0}" -f $count)
    if ($VerboseMode) {
      Write-Host "  Imports referencing?"
      try { Select-String -Path * -Pattern [regex]::Escape($p) -List | ForEach-Object { $_.Path + ':' + $_.LineNumber } } catch {}
    }
  } else {
    Write-Host "[MISS]  $p"
  }
}

Write-Host "== GREP imports =="
try { Select-String -Path * -Pattern "components/components|contexts/contexts|docs/docs|lib/lib|__tests__/__tests__|apps/web-next/apps/web-next" -AllMatches } catch {}

Write-Host "== SUGGESTED ACTIONS =="
Write-Host "1) Move/merge duplicated content to parent folders."
Write-Host "2) Adjust imports; run typecheck/build/e2e."
Write-Host "3) git rm duplicated dirs (IN A NEW BRANCH)." 