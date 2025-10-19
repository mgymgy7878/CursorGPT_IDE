param([switch]$Tag, [string]$Version="v1.11.3", [string]$TagPrefix="canary-smoke")
$ErrorActionPreference = "Stop"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$root = (Resolve-Path "$PSScriptRoot\..").Path
$eviRoot = Join-Path $root "evidence\local\smoke"
New-Item -ItemType Directory -Force -Path $eviRoot | Out-Null
$evi = Join-Path $eviRoot ("smoke_" + $ts)
New-Item -ItemType Directory -Force -Path $evi | Out-Null

# 0) ENV
@"
NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)
PORT_UI=3003
PORT_API=4001
PROM=9090
EXECUTOR_URL=${env:EXECUTOR_URL}
"@ | Out-File -Encoding utf8 -FilePath (Join-Path $evi "env.txt")

function Write-Json($obj, $path){
  ($obj | ConvertTo-Json -Depth 10) | Out-File -Encoding utf8 -FilePath $path
}

Write-Host ">> Health checks"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/health -OutFile (Join-Path $evi "executor_health.json")
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:9090/-/healthy -OutFile (Join-Path $evi "prom_healthy.txt")

Write-Host ">> Public API smoke"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/api/public/btcturk/ticker?symbol=BTCTRY -OutFile (Join-Path $evi "btcturk_ticker.json")

Write-Host ">> Optimizer probe"
$bodyOpt = '{"action":"advisor.suggest","params":{"topic":"canary smoke","evidence":true},"dryRun":true,"confirm_required":false,"reason":"canary"}'
Invoke-WebRequest -UseBasicParsing -Method Post -ContentType "application/json" -Body $bodyOpt -Uri http://127.0.0.1:3003/api/advisor/suggest -OutFile (Join-Path $evi "advisor_suggest.json")

Write-Host ">> Metrics snapshot"
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/metrics -OutFile (Join-Path $evi "executor_metrics.prom")

Write-Host ">> Parse metrics (p95, staleness)"
$metricsPath = Join-Path $evi "executor_metrics.prom"
$metrics = try { Get-Content $metricsPath -ErrorAction Stop } catch { @() }
function Get-FirstNumber($line){
  if(-not $line){ return $null }
  $m = [regex]::Match($line, '([0-9]+\.?[0-9]*(?:e[+-]?[0-9]+)?)$',[System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if($m.Success){ return [double]$m.Groups[1].Value } else { return $null }
}

$p95Ms = $null
if($metrics.Count -gt 0){
  $q95 = $metrics | Where-Object { $_ -match 'quantile="0.95"' -and ($_ -match '_seconds' -or $_ -match 'spark_.*_seconds') } | Select-Object -First 1
  if($q95){ $v = Get-FirstNumber $q95; if($null -ne $v){ $p95Ms = [math]::Round($v * 1000) } }
  if($null -eq $p95Ms){
    $p95 = $metrics | Where-Object { $_ -match '_p95' } | Select-Object -First 1
    if($p95){
      $v = Get-FirstNumber $p95
      if($null -ne $v){
        if($p95 -match '_latency_ms_p95' -or $p95 -match 'ms_p95'){ $p95Ms = [math]::Round($v) }
        elseif($p95 -match '_seconds' -or $p95 -match '_sec'){ $p95Ms = [math]::Round($v * 1000) }
        else { $p95Ms = [math]::Round($v * 1000) }
      }
    }
  }
  if($null -eq $p95Ms){
    $alt = $metrics | Where-Object { $_ -match '_latency_ms_p95' } | Select-Object -First 1
    if($alt){ $v = Get-FirstNumber $alt; if($null -ne $v){ $p95Ms = [math]::Round($v) } }
  }
}
if($null -eq $p95Ms){ $p95Ms = -1 }

$stalenessS = $null
if($metrics.Count -gt 0){
  $st1 = $metrics | Where-Object { $_ -match '^spark_.*_staleness_seconds' } | Select-Object -First 1
  if($st1){ $v = Get-FirstNumber $st1; if($null -ne $v){ $stalenessS = [math]::Round($v) } }
  if($null -eq $stalenessS){
    $st2 = $metrics | Where-Object { $_ -match '_staleness_seconds' } | Select-Object -First 1
    if($st2){ $v = Get-FirstNumber $st2; if($null -ne $v){ $stalenessS = [math]::Round($v) } }
  }
}
if($null -eq $stalenessS){
  try {
    $health = Get-Content (Join-Path $evi 'executor_health.json') | ConvertFrom-Json
    if($null -ne $health.stalenessSec){ $stalenessS = [int]$health.stalenessSec }
    elseif($null -ne $health.staleness_seconds){ $stalenessS = [int]$health.staleness_seconds }
  } catch {}
}
if($null -eq $stalenessS){ $stalenessS = -1 }

Write-Host ">> Docker compose status (optional)"
try { docker compose ps | Out-File -Encoding utf8 -FilePath (Join-Path $evi "docker_ps.txt") } catch {}
try { docker compose logs --no-color | Out-File -Encoding utf8 -FilePath (Join-Path $evi "docker_logs.txt") } catch {}

Write-Host ">> INDEX"
Get-ChildItem $evi | Select-Object Name,Length | Format-Table | Out-String | Out-File -Encoding utf8 -FilePath (Join-Path $evi "INDEX.txt")

Write-Host ">> DONE: $evi"

# ===== Harden: Manifest + SHA256, INDEX enrich, Exit codes, Optional ZIP =====
$last = $evi

Write-Host ">> MANIFEST & SHA256"
$files = Get-ChildItem $last -File -Recurse
$manifest = $files | ForEach-Object {
  $sha = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
  '{0},{1},{2},{3}' -f $_.FullName.Replace("$last\", ''), $_.Length, $_.LastWriteTimeUtc.ToString("yyyy-MM-ddTHH:mm:ssZ"), $sha
}
$manifest | Out-File (Join-Path $last "MANIFEST.csv") -Encoding UTF8
(Get-FileHash (Join-Path $last "MANIFEST.csv") -Algorithm SHA256).Hash | Out-File (Join-Path $last "MANIFEST.sha256") -Encoding ascii

Write-Host ">> INDEX enrich"
$indexHeader = @"
CANARY_SMOKE=$Version
TIMESTAMP=$(Get-Date -Format "yyyy-MM-dd HH:mm:ss K")
HOST=$env:COMPUTERNAME
UI=3003  API=4001  PROM=9090
P95_LATENCY_MS=$p95Ms
STALENESS_S=$stalenessS
FILES=$((Get-ChildItem $last -File | Measure-Object).Count)
"@
$indexPath = Join-Path $last "INDEX.txt"
$indexHeader | Out-File $indexPath -Encoding UTF8
"`n--- FILE LIST ---`n" | Out-File $indexPath -Append -Encoding UTF8
Get-ChildItem $last | Select-Object Name,Length,LastWriteTime | Format-Table | Out-String | Out-File $indexPath -Append -Encoding UTF8

Write-Host ">> SUMMARY (markdown)"
$exitPreview = 0
$coreOk = (Test-Path (Join-Path $last 'executor_health.json')) -and (Test-Path (Join-Path $last 'prom_healthy.txt'))
if ($coreOk) { $coreEmoji = '✅' } else { $coreEmoji = '❌' }
$tldr = "p95=${p95Ms}ms, staleness=${stalenessS}s, core=$coreEmoji"
$summaryPath = Join-Path $last 'smoke-summary.md'
@"
# Smoke Summary

- version: $Version
- timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')
- host: $env:COMPUTERNAME
- exit_code: $exitPreview

**TL;DR**: $tldr

| Name | Size | SHA256(8) | Modified(UTC) |
|---|---:|:---:|---|
"@ | Out-File -Encoding utf8 -FilePath $summaryPath

$files | ForEach-Object {
  $sha = (Get-FileHash $_.FullName -Algorithm SHA256).Hash.Substring(0,8)
  $utc = $_.LastWriteTimeUtc.ToString('yyyy-MM-dd HH:mm:ssZ')
  "| $($_.Name) | $($_.Length) | $sha | $utc |" | Out-File -Append -Encoding utf8 -FilePath $summaryPath
}

Write-Host ">> Exit code discipline checks"
$requiredOk = (Test-Path (Join-Path $last "executor_health.json")) -and (Test-Path (Join-Path $last "prom_healthy.txt"))
if (-not $requiredOk) { Write-Error "Smoke evidence incomplete."; exit 2 }

# Minimal GO/NO-GO rules
try { $healthStatus = ((Get-Content (Join-Path $last "executor_health.json") | ConvertFrom-Json).status) } catch { $healthStatus = $null }
if ($healthStatus -ne 'ok' -and $healthStatus -ne 'healthy') { Write-Error "Executor health not OK (${healthStatus})."; exit 10 }

$promHealthy = try { Get-Content (Join-Path $last "prom_healthy.txt") -ErrorAction Stop } catch { '' }
if ($promHealthy -notmatch '200') { Write-Error "Prometheus health not 200."; exit 11 }

$hasSpark = Select-String -Path (Join-Path $last "executor_metrics.prom") -Pattern '^spark_' -Quiet -ErrorAction SilentlyContinue
if (-not $hasSpark) { Write-Error "No spark_ metrics found."; exit 12 }

Write-Host ">> Optional ZIP"
$zip = "$last.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $last "*") -DestinationPath $zip
Write-Host "ZIP_READY: $zip"

if ($Tag) {
  try {
    $tagName = "$TagPrefix-$Version-$(Get-Date -Format yyyyMMdd)"
    $tagFile = Join-Path $last 'GIT_TAG.txt'
    $tagName | Out-File -Encoding utf8 -FilePath $tagFile
    $gitSafe = Join-Path $root 'scripts/git-safe.cmd'
    if (Test-Path $gitSafe) { & $gitSafe rev-parse --short HEAD | Out-File -Append -Encoding utf8 -FilePath $tagFile }
  } catch {}
}

Write-Host "SMOKE EVIDENCE OK"
try {
  # Push smoke gauges only on success with shared secret and retry
  $payload = @{
    exitCode     = 0
    p95Ms        = $p95Ms
    stalenessSec = $stalenessS
    timestamp    = [int][double]::Parse((Get-Date -UFormat %s))
    lastEvidence = $last
  } | ConvertTo-Json -Depth 4
  $token = $env:SMOKE_TOKEN
  $ok = $false; $tries = 0; $max = 3
  while(-not $ok -and $tries -lt $max){
    try{
      Invoke-WebRequest -UseBasicParsing -Method POST -Uri "http://127.0.0.1:4001/util/smoke/metrics" -Headers @{ "X-Spark-Token" = $token } -ContentType "application/json" -Body $payload | Out-Null
      $ok = $true
    }catch{ Start-Sleep -Seconds 1; $tries++ }
  }
  if(-not $ok){ Write-Warning "Smoke metrics push failed after retries." }
} catch { Write-Warning "Smoke metrics push skipped: $($_.Exception.Message)" }

if ($env:GITHUB_OUTPUT) { "last_smoke_dir=$last" >> $env:GITHUB_OUTPUT }
# Artifact name output
$date=(Get-Date -Format "yyyyMMdd"); $ver="v1.11.4"
if ($env:GITHUB_OUTPUT) { "artifact_name=smoke-evidence-$ver-$date" >> $env:GITHUB_OUTPUT }
exit 0


