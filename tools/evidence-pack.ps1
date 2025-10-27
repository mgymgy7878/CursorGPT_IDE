Param(
  [string]$WebBase = "http://127.0.0.1:4001",
  [string]$OutDir = "evidence\\local\\ai_generate"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# 1) Alerts snapshot
$alertsSnap = Join-Path $OutDir 'alerts_snapshot.yml'
$alertFiles = Get-ChildItem -Path "ops/alerts/ai_generate*.yml" -ErrorAction SilentlyContinue
if ($alertFiles -and $alertFiles.Count -gt 0) {
  $acc = New-Object System.Collections.Generic.List[string]
  foreach ($f in $alertFiles) {
    $acc.Add("### $($f.Name)")
    try {
      $acc.Add((Get-Content -Raw -Path $f.FullName))
    } catch {
      $acc.Add("_error reading: $($f.FullName)_")
    }
    $acc.Add("")
  }
  $acc | Set-Content -Encoding UTF8 -Path $alertsSnap
  Write-Host "[OK] Wrote alerts snapshot → $alertsSnap"
} else {
  Write-Host "[WARN] No alert files matched ops/alerts/ai_generate*.yml" -ForegroundColor Yellow
}

# 2) Metrics snapshot (optional convenient proof)
try {
  $metricsText = Invoke-RestMethod -Uri "$WebBase/api/public/metrics/prom" -TimeoutSec 5
  $metricsOut = Join-Path $OutDir ("metrics_" + (Get-Date -Format yyyyMMdd_HHmmss) + ".txt")
  $metricsText | Out-File -Encoding UTF8 -FilePath $metricsOut
  Write-Host "[OK] Wrote metrics snapshot → $metricsOut"
} catch {
  Write-Host "[WARN] metrics fetch failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3) Build ZIP from available evidence
$zipDest = Join-Path $OutDir 'canary_dryrun_report.zip'
if (Test-Path $zipDest) { Remove-Item $zipDest -Force }

$files = @()
foreach ($p in @(
  (Join-Path $OutDir '30m_metrics.jsonl'),
  (Join-Path $OutDir 'alerts_snapshot.yml'),
  (Join-Path $OutDir 'canary_dryrun_log.txt')
)) {
  if (Test-Path $p) { $files += $p }
}

# include metrics_*.txt if any
$metricsMany = Get-ChildItem -ErrorAction SilentlyContinue -Path (Join-Path $OutDir 'metrics_*.txt')
if ($metricsMany) { $files += ($metricsMany | Select-Object -ExpandProperty FullName) }

if (Test-Path 'logs/smoke-all.log') { $files += 'logs/smoke-all.log' }

if ($files.Count -gt 0) {
  try {
    Compress-Archive -Path $files -DestinationPath $zipDest -Force
    Write-Host "[OK] Evidence ZIP => $zipDest" -ForegroundColor Green
  } catch {
    Write-Host "[ERR] ZIP failed: $($_.Exception.Message)" -ForegroundColor Red
  }
} else {
  Write-Host "[INFO] No evidence files found to zip yet" -ForegroundColor Yellow
}


