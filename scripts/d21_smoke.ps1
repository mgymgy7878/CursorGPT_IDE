=3003,3004
function R(){ =" http://127.0.0.1:/api/public/metrics\; try{ Invoke-RestMethod -TimeoutSec 5 }catch{ } }
=;=; foreach( in ){ =R ; if(){ =; break } }
if(-not ){ \port: N/A\; \msgs_total delta: 0\; \staleness s: N/A\; \SMOKE: ATTENTION\; exit 1 }
Start-Sleep 4; =R 
if(-not ){ \port: \; \msgs_total delta: 0\; \staleness s: N/A\; \SMOKE: ATTENTION\; exit 1 }
=(.counters.spark_ws_btcturk_msgs_total-.counters.spark_ws_btcturk_msgs_total)
=[double].gauges.spark_ws_staleness_seconds
\port: \
\msgs_total delta: \
\staleness s: \
if(( -ge 1) -and ( -lt 4)){ \SMOKE: PASS\ } else { \SMOKE: ATTENTION\ }
