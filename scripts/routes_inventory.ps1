# routes_inventory.ps1 — pages vs app envanter ve çakışma çıkarıcı
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Join-Path $PSScriptRoot ".."
$web  = Join-Path $root "apps/web-next"

$pages = @()
$app   = @()
if (Test-Path (Join-Path $web "pages")) {
  $pages = Get-ChildItem (Join-Path $web "pages") -Recurse -Include *.ts,*.tsx | ForEach-Object { $_.FullName.Replace($web, "") }
}
if (Test-Path (Join-Path $web "app")) {
  $app   = Get-ChildItem (Join-Path $web "app")   -Recurse -Include page.tsx,route.ts,layout.tsx | ForEach-Object { $_.FullName.Replace($web, "") }
}

$pagesNorm = $pages | ForEach-Object { ($_ -replace 'index\.tsx$', '') -replace '\.tsx$|\.ts$', '' } | Sort-Object
$appNorm   = $app   | ForEach-Object { ($_ -replace '\\page\.tsx$','' -replace '\\route\.ts$','') } | Sort-Object

"== CONFLICTS =="
Compare-Object -ReferenceObject $pagesNorm -DifferenceObject $appNorm -IncludeEqual -ExcludeDifferent | ForEach-Object { $_.InputObject }

"== PAGES-ONLY =="
Compare-Object $pagesNorm $appNorm | Where-Object { $_.SideIndicator -eq '<=' } | ForEach-Object { $_.InputObject }

"== APP-ONLY =="
Compare-Object $pagesNorm $appNorm | Where-Object { $_.SideIndicator -eq '=>' } | ForEach-Object { $_.InputObject } 