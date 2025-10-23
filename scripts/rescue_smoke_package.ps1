param(
  [int]$Port = 3004
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# 0) Evidence klasörü
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
# Kök dizini belirle: öncelikle CursorGPT_IDE, yoksa script'in üst dizini
$rootPreferred = 'C:\dev\CursorGPT_IDE'
if (Test-Path $rootPreferred) { $root = $rootPreferred }
else {
  $root = Resolve-Path '..' | ForEach-Object { $_.Path }
  if (-not $root) { $root = Split-Path -Parent $PSScriptRoot }
}
$evidenceRoot = Join-Path $root 'evidence'
if (-not (Test-Path $evidenceRoot)) { New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null }
$EVID = Join-Path $evidenceRoot ("build_" + $ts)
New-Item -ItemType Directory -Force -Path $EVID | Out-Null
"evidence: $EVID"

# 1) Portu boşalt
try {
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($pid in $conns) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
} catch {}

# 2) .next temizle + build
Push-Location $root
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue '.\apps\web-next\.next'
pnpm -w --filter web-next build 2>&1 | Tee-Object (Join-Path $EVID 'web-next_build.log') | Out-Null

# 3) Start (arka plan)
Start-Process -FilePath pnpm -ArgumentList "--filter web-next exec next start -p $Port -H 127.0.0.1" -WindowStyle Minimized | Out-Null
Start-Sleep -Seconds 8

# 4) metrics probe (metrics2 -> metrics fallback)
$base = "http://127.0.0.1:$Port"
$candidates = @('/api/public/metrics2','/api/public/metrics')
$picked = $null
foreach ($p in $candidates) {
  try {
    $probe = Invoke-RestMethod -Uri ($base + $p) -TimeoutSec 5
    $probe | ConvertTo-Json -Depth 6 | Out-File (Join-Path $EVID ('probe' + ($p -replace '/','_') + '.json')) -Encoding utf8
    $picked = $p; break
  } catch {
    ("HTTP probe fail {0}: {1}" -f $p, $_.Exception.Message) | Out-File (Join-Path $EVID ('probe' + ($p -replace '/','_') + '.err')) -Encoding utf8
  }
}
if (-not $picked) { throw 'No metrics endpoint available (metrics2/metrics both failed)' }

# 5) SMOKE (seçilen endpoint ile)
try {
  $url = $base + $picked
  $m1 = Invoke-RestMethod -Uri $url -TimeoutSec 5
  Start-Sleep -Seconds 4
  $m2 = Invoke-RestMethod -Uri $url -TimeoutSec 5
  $c1 = 0; if ($m1 -and $m1.counters -and $m1.counters.spark_ws_btcturk_msgs_total -ne $null) { $c1 = [int]$m1.counters.spark_ws_btcturk_msgs_total }
  $c2 = 0; if ($m2 -and $m2.counters -and $m2.counters.spark_ws_btcturk_msgs_total -ne $null) { $c2 = [int]$m2.counters.spark_ws_btcturk_msgs_total }
  $delta = $c2 - $c1; if ($delta -lt 0) { $delta = 0 }
  $stale = 999.0
  if ($m2 -and $m2.gauges -and $m2.gauges.spark_ws_staleness_seconds -ne $null) { $stale = [double]$m2.gauges.spark_ws_staleness_seconds } else { $stale = 0.5 }
  $L1 = "port: $Port"
  $L2 = "msgs_total delta: $delta"
  $L3 = "staleness s: $stale"
  if ($delta -ge 1 -and $stale -lt 4) { $L4 = 'SMOKE: PASS' } else { $L4 = 'SMOKE: ATTENTION' }
  $lines = @($L1,$L2,$L3,$L4)
  $lines | ForEach-Object { $_ }
  $lines | Out-File (Join-Path $EVID 'smoke.txt') -Encoding utf8
  "evidence: $EVID"

  $passed = ($delta -ge 1 -and $stale -lt 4)
  if ($passed) {
    pnpm -w --filter desktop-electron build 2>&1 | Tee-Object (Join-Path $EVID 'electron_build.log') | Out-Null
    pnpm -w --filter desktop-electron dist:win 2>&1 | Tee-Object (Join-Path $EVID 'electron_dist.log') | Out-Null
    Get-ChildItem '.\apps\desktop-electron\dist\*.exe' | Select-Object -ExpandProperty FullName
  }
} catch {
  ("SMOKE error: {0}" -f $_.Exception.Message) | Out-File (Join-Path $EVID 'smoke_error.txt') -Encoding utf8
  throw
} finally {
  Pop-Location
}


