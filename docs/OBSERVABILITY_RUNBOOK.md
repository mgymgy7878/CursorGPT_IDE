# Observability Runbook

## Ops → Observability

### Prometheus Reload
```bash
# Reload configuration
curl -XPOST http://localhost:9090/-/reload

# Check targets health
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[].health'
```

### Grafana Panel Import
1. Login to Grafana (http://localhost:3000)
2. Go to "+" → Import
3. Import these dashboards:
   - Backtest Core (ID: 1001)
   - Strategy Lab (ID: 1002) 
   - Executor Health (ID: 1003)

### Alarm Susturma (Silmeden)
```bash
# List active alerts
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state == "firing")'

# Silence specific alert
curl -XPOST http://localhost:9090/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{"matchers":[{"name":"alertname","value":"BacktestSlowRunner"}],"startsAt":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'","endsAt":"'$(date -u -d "+1 hour" +%Y-%m-%dT%H:%M:%S.000Z)'","comment":"Maintenance window"}'
```

### Common Triage Checklist
1. **Executor Down**: Check PM2 status, restart if needed
2. **Web-next 5xx**: Check Next.js logs, restart if needed  
3. **Backtest Slow**: Check system resources, scale if needed
4. **Risk Gate High**: Check market conditions, adjust thresholds
5. **Data Gaps**: Check marketdata service, restart if needed

### Metrics Endpoints
- Executor: http://127.0.0.1:4001/metrics
- Web-next: http://127.0.0.1:3003/api/metrics
- SSE Events: http://127.0.0.1:3003/api/events
- Risk Report: http://127.0.0.1:3003/api/fusion/risk.report.daily
