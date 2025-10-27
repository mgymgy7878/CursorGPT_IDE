# Cardinality & Performance Guidelines

## Label Diet (Koruyucu)

### Allowed Labels
- `symbol` - Trading pair (BTCUSDT, ETHUSDT, etc.)
- `tf` - Timeframe (1m, 5m, 1h, 1d)
- `status` - Status (success, error, timeout)
- `component` - Component (executor, web-next, marketdata)
- `severity` - Alert severity (warning, critical)

### Forbidden Labels
- `user/id` - User-specific identifiers
- `requestId` - Request-specific identifiers
- `sessionId` - Session-specific identifiers
- `userId` - User-specific identifiers
- `strategyId` - Strategy-specific identifiers

### Dynamic Label Rules
- Max 5 labels per metric
- No high-cardinality labels
- Use aggregation instead of labels for high-cardinality data

## Histogram Guidelines

### Bucket Configuration
```yaml
# bt_runtime_ms_bucket - 11-12 buckets max
buckets: [100, 300, 1000, 3000, 10000, 30000, 60000, 120000, 300000, 600000, 1200000]

# le label only - no additional labels
histogram_quantile(0.95, sum by (le) (rate(bt_runtime_ms_bucket[5m])))
```

### Label Minimization
- Use `le` label only for histograms
- Avoid additional labels on histogram metrics
- Aggregate before storing

## Scrape Configuration

### Intervals
```yaml
# 15s interval is sufficient
scrape_interval: 15s
evaluation_interval: 15s

# Scrape timeout < 10s
scrape_timeout: 8s
```

### Target Limits
- Max 1000 targets per Prometheus instance
- Max 10000 samples per scrape
- Max 1GB memory per target

## Cold-Start Silence

### Deploy Quiet Window
```yaml
# 5-10 minute quiet window after deploy
inhibit_rules:
  - source_matchers: ['alertname="BacktestSlowRunner"']
    target_matchers: ['alertname="BacktestSlowRunner"']
    equal: ['instance']
    # Inhibit for 10 minutes after deploy
```

### Deployment Process
1. Deploy new version
2. Wait 5-10 minutes (quiet window)
3. Check metrics are flowing
4. Remove silence rules
5. Monitor for 30 minutes

## Performance Monitoring

### Cardinality Checks
```bash
# Check label cardinality
curl -s http://localhost:9090/api/v1/label/__name__/values | jq '.data | length'

# Check series count
curl -s http://localhost:9090/api/v1/query \
  --data-urlencode 'query=count({__name__=~".+"})'
```

### Memory Usage
```bash
# Check Prometheus memory
curl -s http://localhost:9090/api/v1/status/tsdb | jq '.data.seriesCountByMetricName'

# Check target memory
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, memory: .memory}'
```

## Alert Thresholds

### Performance Thresholds
- P95 latency: < 30s (backtest)
- Error rate: < 1% (all services)
- Memory usage: < 80% (all services)
- CPU usage: < 70% (all services)

### Cardinality Thresholds
- Max labels per metric: 5
- Max series per target: 1000
- Max samples per scrape: 10000
- Max memory per target: 1GB
