param(
  [int]$Port = 3004,
  [switch]$TriggerWS,
  [int]$WarmupSeconds = 12
)

$ErrorActionPreference = 'SilentlyContinue'

$ROOT = 'C:\dev'
$UJSON = "http://127.0.0.1:$Port/api/public/metrics"
$UPROM = "http://127.0.0.1:$Port/api/public/metrics.prom"
$EVDIR = Join-Path $ROOT 'apps\\web-next\\evidence\\local\\oneshot'

# Trafik ısıtma (HTTP/JSON; opsiyonel WS)
$warmupMode = 'none'
for ($w=0; $w -lt $WarmupSeconds; $w++) {
  try { Invoke-WebRequest "http://127.0.0.1:$Port/" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null; $warmupMode = 'http' } catch {}
  try { Invoke-RestMethod $UJSON -TimeoutSec 2 -ErrorAction Stop | Out-Null; $warmupMode = 'http' } catch {}
  Start-Sleep -Seconds 1
}
if ($TriggerWS) {
  try {
    $wc = Get-Command wscat -ErrorAction SilentlyContinue
    if ($wc) {
      # Olası WS uç noktası; yoksa sessizce geç
      wscat -c "ws://127.0.0.1:$Port/ws" -x 'ping' 2>$null 1>$null
      if ($LASTEXITCODE -eq 0 -and $warmupMode -eq 'http') { $warmupMode = 'both' }
      elseif ($LASTEXITCODE -eq 0 -and $warmupMode -eq 'none') { $warmupMode = 'ws' }
    }
  } catch {}
}

if ($TriggerWS) {
  try { Start-Process "http://127.0.0.1:$Port/dashboard" | Out-Null } catch {}
  Start-Sleep -Seconds 8
}

# Hazır olana kadar bekle (maks 45 sn)
$ready = $false
$readyVia = ''
for ($i=0; $i -lt 45; $i++) {
  try {
    $res = Invoke-WebRequest $UPROM -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($res.StatusCode -eq 200) { $ready = $true; $readyVia = 'prom'; break }
    if ($res.StatusCode -eq 404) { throw [System.Net.WebException]::new('prom-404') }
  } catch {
    try {
      $rj = Invoke-WebRequest $UJSON -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
      if ($rj.StatusCode -eq 200) { $ready = $true; $readyVia = 'json'; break }
    } catch {}
  }
  Start-Sleep -Seconds 1
}
if (-not $ready) { Write-Output 'HATA: metrics readiness 45 sn içinde gelmedi'; exit 2 }

function R { param([string]$Url) try { Invoke-RestMethod -Uri $Url -TimeoutSec 5 } catch { $null } }

$pass = $false
for ($try=1; $try -le 3 -and -not $pass; $try++) {
  if ($try -eq 1) {
    $rv = if ([string]::IsNullOrEmpty($readyVia)) { 'unknown' } else { $readyVia }
    Write-Output ("ready_via: {0}" -f $rv)
  }
  $m1 = R $UJSON; Start-Sleep -Seconds 4; $m2 = R $UJSON
  $d = 0
  if ($m1 -and $m2 -and $m1.counters -and $m2.counters) {
    $d = [int]$m2.counters.spark_ws_btcturk_msgs_total - [int]$m1.counters.spark_ws_btcturk_msgs_total
  }
  if ($d -lt 0) { $d = 0 }
  $s = 999.0
  if ($m2 -and $m2.gauges -and $m2.gauges.spark_ws_staleness_seconds -ne $null) { $s = [double]$m2.gauges.spark_ws_staleness_seconds }
  Write-Output ("try #$try | port: $Port")
  Write-Output ("msgs_total delta: $d")
  Write-Output ("staleness s: $s")
  if (($d -ge 1) -or ($s -lt 5)) { Write-Output 'SMOKE: PASS'; $pass = $true } else { Write-Output 'SMOKE: ATTENTION' }
  if (-not $pass) { Start-Sleep -Seconds 3 }
}

New-Item -ItemType Directory -Force -Path $EVDIR | Out-Null
try {
  $hdr = (Invoke-WebRequest $UJSON -TimeoutSec 5 -UseBasicParsing).Headers
  $ver = Get-Content (Join-Path $ROOT 'apps\\web-next\\package.json') | Out-String
  ("`n=== HEADERS ({0}) ===`n{1}`n=== WEB-NEXT PKG ===`n{2}" -f $Port, ($hdr | Out-String), $ver) |
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

# Warmup bilgisini logla
try { ("warmup: {0}" -f $warmupMode) | Out-File (Join-Path $EVDIR 'warmup.txt') -Encoding utf8 } catch {}

exit 0


