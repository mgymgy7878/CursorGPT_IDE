$ErrorActionPreference = 'SilentlyContinue'

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$EVID = "C:\dev\CursorGPT_IDE\evidence\build_$ts"
New-Item -ItemType Directory -Force -Path $EVID | Out-Null

function R([string]$u){ try { Invoke-RestMethod -Uri $u -TimeoutSec 5 } catch { $null } }

# Wait a little for server to warm up
Start-Sleep -Seconds 6

$ports = @(3004,3003)
$port = $null
$m1 = $null
foreach($p in $ports){ $m1 = R "http://127.0.0.1:$p/api/public/metrics"; if($m1){ $port = $p; break } }

if(-not $m1){
  'port: N/A'
  'msgs_total delta: N/A'
  'staleness s: N/A'
  'SMOKE: ATTENTION'
  @('port: N/A','msgs_total delta: N/A','staleness s: N/A','SMOKE: ATTENTION') | Out-File "$EVID\smoke.txt" -Encoding utf8
  "evidence: $EVID"
  exit 0
}

Start-Sleep -Seconds 4
$m2 = R "http://127.0.0.1:$port/api/public/metrics"

function Num($v, $d){ try{ $n=[double]$v; if([double]::IsNaN($n)){ return $d } else { return $n } }catch{ return $d } }

$c1 = $m1.counters?.spark_ws_btcturk_msgs_total
$c2 = $m2.counters?.spark_ws_btcturk_msgs_total
$s2 = $m2.gauges?.spark_ws_staleness_seconds

$delta = [int]( (Num $c2 0) - (Num $c1 0) )
$stale = [double]( Num $s2 999 )

$L1 = "port: $port"
$L2 = "msgs_total delta: $delta"
$L3 = "staleness s: $stale"
$L4 = if(($delta -ge 1) -and ($stale -lt 4)) { 'SMOKE: PASS' } else { 'SMOKE: ATTENTION' }

$L1; $L2; $L3; $L4
@($L1,$L2,$L3,$L4) | Out-File "$EVID\smoke.txt" -Encoding utf8
"evidence: $EVID"


