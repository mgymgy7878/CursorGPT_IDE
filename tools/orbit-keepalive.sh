#!/usr/bin/env bash
# Orbit KeepAlive - 10 dakikada bir war-room tek satırı üretir

set -euo pipefail

PROM=${PROMETHEUS_URL:-http://localhost:9090}
STAGE=${STAGE:-"canary"}

ts() { date -Is; }

# Prometheus query helper
q() {
  curl -sG "$PROM/api/v1/query" \
    --data-urlencode "query=$1" \
    | jq -r '.data.result[0].value[1] // "NaN"'
}

# 8 Golden Signals PromQL
p95='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="api"}[5m]))*1000'
err='rate(http_requests_total{status=~"5..",job="api"}[5m])/rate(http_requests_total{job="api"}[5m])*100'
ws='histogram_quantile(0.95, rate(ws_staleness_seconds_bucket[5m]))'
risk='rate(risk_blocks_total[5m])'
idem='rate(idempotency_conflict_total[5m])/rate(http_requests_total{job="api"}[5m])*100'
csp='rate(csp_violations_total[5m])'
evl='histogram_quantile(0.95, rate(event_loop_lag_ms_bucket[5m]))'
gc='avg_over_time(gc_pause_ms[5m])'

# Query all signals
P95=$(q "$p95")
ERR=$(q "$err")
WS=$(q "$ws")
RISK=$(q "$risk")
IDEM=$(q "$idem")
CSP=$(q "$csp")
EVL=$(q "$evl")
GC=$(q "$gc")

# Generate war-room line
echo "$(ts) | stage=${STAGE} | p95=${P95}ms 5xx=${ERR}% ws=${WS}s idem=${IDEM}% risk=${RISK}/min csp=${CSP}/min evloop=${EVL}ms gc=${GC}ms | karar=" \
  | tee -a evidence/warroom.log

# Count red thresholds
RED=0
awk -v p95="$P95" -v err="$ERR" -v ws="$WS" -v evl="$EVL" -v risk="$RISK" '
BEGIN {
  r=0
  if (p95 > 400) r++
  if (err > 3) r++
  if (ws > 120) r++
  if (evl > 50) r++
  if (risk > 0.5) r++
  print r
}' | read RED

# Alert if 3+ red
if [ "$RED" -ge 3 ]; then
  echo "$(ts) | ALERT | three-red-threshold-hit | count=$RED" | tee -a evidence/warroom.log
fi

