# Operational Rhythm

## Günlük Checklist (5 dk)

### Prometheus Health
```bash
# Check targets UP
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# Check rule eval errors
curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.health != "ok")'

# Check bt_runs_total trend (last 24h)
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=sum(increase(bt_runs_total[24h]))'
```

### Alert Management
```bash
# Check BacktestSlowRunner silence
curl -s http://localhost:9090/api/v1/silences | jq '.data[] | select(.matchers[].value == "BacktestSlowRunner")'

# Check active alerts
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state == "firing")'
```

## Haftalık Checklist (30 dk)

### SLO Report
```bash
# P95 runtime weekly average
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=avg_over_time(bt_runtime_ms_p95_5m[7d])'

# Error budget consumption
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=sum(rate(http_requests_total{code=~"5.."}[7d]))'
```

### Alarm Hygiene
```bash
# Untriggered rules (last 7 days)
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=absent_over_time(bt_runs_total[7d])'

# Noisy rules (firing > 10 times/day)
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=sum(rate(ALERTS{alertstate="firing"}[1d])) > 10'
```

### Root Cause Analysis
```bash
# Market data gaps analysis
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=sum(increase(marketdata_gaps_total[7d]))'

# Data source notes
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=marketdata_source_status'
```

## Monthly Review (2h)

### Performance Analysis
- P95 latency trends
- Error rate patterns
- Resource utilization
- Alert noise reduction

### Capacity Planning
- Growth projections
- Resource scaling
- Alert threshold tuning
- Dashboard optimization

### Documentation Updates
- Runbook improvements
- Alert runbook updates
- Dashboard enhancements
- Process refinements
