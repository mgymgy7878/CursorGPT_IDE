$ErrorActionPreference = 'SilentlyContinue'

$WORK = 'C:\dev'
$APP = Join-Path $WORK 'apps\web-next'
$PORT = 3004
$UJSON = "http://127.0.0.1:$PORT/api/public/metrics"
$UPROM = "http://127.0.0.1:$PORT/api/public/metrics.prom"
$EVDIR = Join-Path $WORK 'apps\web-next\evidence\local\oneshot'

function Kill-Port {
  param([int]$P)
  try {
    $lines = netstat -ano | findstr ":$P"
    foreach ($ln in $lines) {
      $pid = ($ln -split "\s+")[-1]
      if ($pid -match '^\d+$') { try { taskkill /PID $pid /F | Out-Null } catch {} }
    }
  } catch {}
}

# Temizle ve prod'u 3004'te başlat
Kill-Port 3003
Kill-Port 3004

if (-not (Test-Path (Join-Path $APP '.next'))) {
  Start-Process -FilePath 'powershell' -ArgumentList @('-NoProfile','-Command',"cd `"$APP`"; pnpm build") -WindowStyle Hidden -Wait | Out-Null
}

Start-Process -FilePath 'powershell' -ArgumentList @('-NoProfile','-Command',"cd `"$APP`"; npx --yes next start -p $PORT -H 127.0.0.1") -WindowStyle Minimized | Out-Null

# Hazır olana kadar bekle (maks 60 sn)
$ready = $false
for ($i=0; $i -lt 60; $i++) {
  try {
    $res = Invoke-WebRequest $UPROM -TimeoutSec 2 -UseBasicParsing
    if ($res.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
  Start-Sleep -Seconds 1
}
if (-not $ready) { Write-Output 'HATA: Dev 3004 hazır değil'; exit 2 }

# SMOKE ölçümü
function Get-RestSafe { param([string]$Url) try { Invoke-RestMethod -Uri $Url -TimeoutSec 5 } catch { $null } }
$m1 = Get-RestSafe $UJSON; Start-Sleep 4; $m2 = Get-RestSafe $UJSON
$delta = 0
if ($m1 -and $m2 -and $m1.counters -and $m2.counters -and $m1.counters.spark_ws_btcturk_msgs_total -ne $null -and $m2.counters.spark_ws_btcturk_msgs_total -ne $null) {
  $delta = [int]$m2.counters.spark_ws_btcturk_msgs_total - [int]$m1.counters.spark_ws_btcturk_msgs_total
}
$stale = 999.0
if ($m2 -and $m2.gauges -and $m2.gauges.spark_ws_staleness_seconds -ne $null) {
  $stale = [double]$m2.gauges.spark_ws_staleness_seconds
}
Write-Output ("port: {0}" -f $PORT)
Write-Output ("msgs_total delta: {0}" -f $delta)
Write-Output ("staleness s: {0}" -f $stale)
if (($delta -ge 1) -and ($stale -lt 4)) { Write-Output 'SMOKE: PASS' } else { Write-Output 'SMOKE: ATTENTION' }

# Kanıt dosyaları
New-Item -ItemType Directory -Force -Path $EVDIR | Out-Null
try {
  $hdr = (Invoke-WebRequest $UJSON -TimeoutSec 5 -UseBasicParsing).Headers
  $ver = Get-Content (Join-Path $WORK 'apps\web-next\package.json') | Out-String
  ("`n=== HEADERS ({0}) ===`n{1}`n=== WEB-NEXT PKG ===`n{2}" -f $PORT, ($hdr | Out-String), $ver) |
    Out-File (Join-Path $EVDIR 'metrics_headers_and_version.txt') -Encoding utf8
} catch {
  ("metrics headers alınamadı: {0}" -f $_.Exception.Message) |
    Out-File (Join-Path $EVDIR 'metrics_headers_and_version.txt') -Encoding utf8
}

try {
  $promHead = (Invoke-WebRequest $UPROM -TimeoutSec 5 -UseBasicParsing).Content -split "`n" | Select-Object -First 12
  $promHead | Out-File (Join-Path $EVDIR 'metrics_prom_head.txt') -Encoding utf8
  $promHead | ForEach-Object { Write-Output $_ }
} catch {}

exit 0


