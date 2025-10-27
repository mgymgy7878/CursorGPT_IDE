$dir = ".\docs\evidence\ai_generate"
if(-not (Test-Path $dir)){ "NO_HEALTH_DIR"; exit 0 }
$fixed = Join-Path $dir "health_.md"
if(Test-Path $fixed){ (Get-Item $fixed).FullName; exit 0 }
$f = Get-ChildItem $dir -Filter "health_*.md" | Sort-Object LastWriteTime -Desc | Select-Object -First 1
if($f){ $f.FullName } else { "NO_HEALTH_FILE" }
