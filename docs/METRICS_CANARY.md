## METRICS & CANARY
### Prometheus
- Text exposition format `Content-Type: text/plain; version=0.0.4` (stabil) — scraper uyumluluğu için gereklidir.
- Sayaçlar: `spark_ws_btcturk_msgs_total`, `spark_ws_btcturk_reconnects_total` (plan: trades/orderbook)
- Gauge: `spark_ws_staleness_seconds{pair}`

### D2 SMOKE (PowerShell)
```powershell
$ports=3003,3004
function R($p){ $u="http://127.0.0.1:$p/api/public/metrics"; try{ Invoke-RestMethod $u -TimeoutSec 5 }catch{ $null } }
$port=$null;$m1=$null; foreach($p in $ports){ $m1=R $p; if($m1){ $port=$p; break } }
if(-not $m1){ "endpoint down"; exit 1 }
Start-Sleep 4; $m2=R $port
$delta=($m2.counters.spark_ws_btcturk_msgs_total-$m1.counters.spark_ws_btcturk_msgs_total)
$stale=[double]$m2.gauges.spark_ws_staleness_seconds
"port: $port`nmsgs_total delta: $delta`nstaleness s: $stale"
if(($delta -ge 1) -and ($stale -lt 4)){ "SMOKE: PASS" } else { "SMOKE: ATTENTION" }
```
