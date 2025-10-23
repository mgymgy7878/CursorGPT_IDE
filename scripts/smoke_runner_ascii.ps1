$ErrorActionPreference = 'SilentlyContinue'

$ports = 3003,3004
function Read-Metrics($p){
  $u = "http://127.0.0.1:$p/api/public/metrics"
  try{
    $obj = Invoke-RestMethod -Uri $u -TimeoutSec 5
    if($obj -and $obj.counters -and $obj.gauges){ return @{ data=$obj } }
    $txt = Invoke-WebRequest -Uri $u -TimeoutSec 5 | Select-Object -Expand Content
    $msgs  = [double](([regex]::Match($txt,'spark_ws_btcturk_msgs_total\s+([0-9\.]+)')).Groups[1].Value)
    $stale = [double](([regex]::Match($txt,'spark_ws_staleness_seconds(?:\{.*?\})?\s+([0-9\.]+)')).Groups[1].Value)
    if($msgs -or $stale){ return @{ data=@{ counters=@{ spark_ws_btcturk_msgs_total=$msgs }; gauges=@{ spark_ws_staleness_seconds=$stale } } } }
  }catch{ return $null }
  return $null
}
$port=$null; $m1=$null
foreach($p in $ports){ $m1 = Read-Metrics $p; if($m1){ $port=$p; break } }
if(-not $m1){ "port: N/A"; "msgs_total delta: 0"; "staleness s: N/A"; "SMOKE: ATTENTION (endpoint down @3003/3004)"; exit 1 }

Start-Sleep -Seconds 4
$m2 = Read-Metrics $port
if(-not $m2){ "port: $port"; "msgs_total delta: 0"; "staleness s: N/A"; "SMOKE: ATTENTION (2nd read failed @$port)"; exit 1 }

$mt1 = [double]$m1.data.counters.spark_ws_btcturk_msgs_total
$mt2 = [double]$m2.data.counters.spark_ws_btcturk_msgs_total
$stale = [double]$m2.data.gauges.spark_ws_staleness_seconds
$delta = ($mt2 - $mt1)

"port: $port"
"msgs_total delta: $delta"
"staleness s: $stale"
if(($delta -ge 1) -and ($stale -lt 4)){ "SMOKE: PASS" } else { "SMOKE: ATTENTION (flow/staleness)" }


