$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$tmpl = Join-Path $root "docs\monitoring\SLO-RULES.template.yml"
$outDir = Join-Path $root "prometheus\rules"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir "spark-smoke.yml"

$TARGET_P95_MS = $env:TARGET_P95_MS; if(-not $TARGET_P95_MS){ $TARGET_P95_MS = "1200" }
$TARGET_P95_MS_CRIT = $env:TARGET_P95_MS_CRIT; if(-not $TARGET_P95_MS_CRIT){ $TARGET_P95_MS_CRIT = "2400" }
$STALENESS_S = $env:STALENESS_S; if(-not $STALENESS_S){ $STALENESS_S = "30" }

$content = Get-Content $tmpl -Raw
$content = $content -replace '\$\{TARGET_P95_MS\}', [regex]::Escape($TARGET_P95_MS)
$content = $content -replace '\$\{TARGET_P95_MS_CRIT\}', [regex]::Escape($TARGET_P95_MS_CRIT)
$content = $content -replace '\$\{STALENESS_S\}', [regex]::Escape($STALENESS_S)
$content | Out-File -Encoding UTF8 -FilePath $out
Write-Host "Rendered rules: $out"


