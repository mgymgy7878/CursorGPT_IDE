# METRICS & CANARY

## Sayaçlar (Counters)

| Metrik | Açıklama |
|--------|----------|
| `spark_ws_btcturk_msgs_total` | Toplam alınan WS mesaj sayısı |
| `spark_ws_btcturk_reconnects_total` | WS reconnect sayısı |
| `spark_ws_btcturk_trades_total` (Plan) | Toplam trade mesajı |
| `spark_ws_btcturk_orderbook_updates_total` (Plan) | OrderBook güncelleme sayısı |

## Göstergeler (Gauges)

| Metrik | Açıklama |
|--------|----------|
| `spark_ws_staleness_seconds{pair}` | Son mesajdan bu yana geçen süre |
| `backtest_p95_ms` (Plan) | Backtest P95 latency |
| `optimizer_trials_active` (Plan) | Aktif optimizasyon deneme sayısı |

---

## D2 SMOKE Test (PowerShell)

```powershell
$ports=3003,3004
function R($p){
  $u="http://127.0.0.1:$p/api/public/metrics"
  try{ Invoke-RestMethod $u -TimeoutSec 5 }catch{ $null }
}

$port=$null
$m1=$null
foreach($p in $ports){
  $m1=R $p
  if($m1){ $port=$p; break }
}

if(-not $m1){ "endpoint down"; exit 1 }

Start-Sleep 4
$m2=R $port

$delta=($m2.counters.spark_ws_btcturk_msgs_total - $m1.counters.spark_ws_btcturk_msgs_total)
$stale=[double]$m2.gauges.spark_ws_staleness_seconds

"port: $port"
"msgs_total delta: $delta"
"staleness s: $stale"

if(($delta -ge 1) -and ($stale -lt 4)){
  "SMOKE: PASS"
} else {
  "SMOKE: ATTENTION"
}
```

---

## Canary PASS Eşikleri (Hedef)

| Metrik | Eşik |
|--------|------|
| `staleness_seconds` | < 3 |
| `ws_error_rate` | < 1% |
| `p95_ms` | < 800 |
| `Δmsgs_total` | ≥ 1 |

---

## Prometheus Entegrasyonu (Plan)

1. `/api/public/metrics.prom` endpoint'i text format döner
2. Prometheus scrape config:
   ```yaml
   - job_name: 'spark-trading'
     static_configs:
       - targets: ['localhost:3003']
     metrics_path: '/api/public/metrics.prom'
   ```
3. Grafana dashboard'ları için preset JSON export

---

## Alert Rules (Plan)

```yaml
groups:
  - name: spark-trading
    rules:
      - alert: HighStaleness
        expr: spark_ws_staleness_seconds > 5
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "WS staleness too high"

      - alert: WSDisconnected
        expr: increase(spark_ws_btcturk_reconnects_total[5m]) > 3
        labels:
          severity: critical
        annotations:
          summary: "Too many WS reconnects"
```
