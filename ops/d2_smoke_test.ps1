$ports=3003,3004;
function GetMetrics($p) {
  $u="http://127.0.0.1:$p/api/public/metrics2";
  try {
    Invoke-RestMethod $u -TimeoutSec 5
  } catch {
    $null
  }
};

$port=$null;
$m1=$null;
foreach($p in $ports) {
  $m1=GetMetrics $p;
  if($m1) {
    $port=$p;
    break
  }
};

if(-not $m1) {
  "endpoint down"
  exit 1
};

Start-Sleep 4;
$m2=GetMetrics $port;

$delta=($m2.counters.spark_ws_btcturk_msgs_total-$m1.counters.spark_ws_btcturk_msgs_total);
$stale=[double]$m2.gauges.spark_ws_staleness_seconds;

$result = "port: $port`nmsgs_total delta: $delta`nstaleness s: $stale";

if(($delta -ge 1) -and ($stale -lt 4)) {
  $result += "`nSMOKE: PASS"
} else {
  $result += "`nSMOKE: ATTENTION"
};

$result | Tee-Object evidence/d2_smoke.txt;
$result
