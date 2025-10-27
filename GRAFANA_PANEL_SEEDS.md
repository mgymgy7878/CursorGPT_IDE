# Grafana Panel Seeds

**Tarih:** 2025-01-15  
**Hedef:** Spark Trading Platform için Grafana dashboard panel önerileri

## 📊 Panel Önerileri

### 1. UI Error Rate (5xx)
```promql
rate(http_requests_total{app="web-next",status=~"5.."}[5m])
```
- **Panel Type**: Stat
- **Unit**: Percent (0-1)
- **Thresholds**: 
  - Green: < 0.01 (1%)
  - Yellow: 0.01-0.02 (1-2%)
  - Red: > 0.02 (2%)
- **Description**: UI 5xx error rate monitoring

### 2. Canary Latency P95
```promql
histogram_quantile(0.95, sum by (le) (rate(canary_order_latency_seconds_bucket[5m])))
```
- **Panel Type**: Time Series
- **Unit**: Seconds
- **Thresholds**:
  - Green: < 0.5s
  - Yellow: 0.5-1.0s
  - Red: > 1.0s
- **Description**: Canary order placement latency p95

### 3. UI RPS (Requests Per Second)
```promql
sum(rate(http_requests_total{app="web-next"}[1m]))
```
- **Panel Type**: Time Series
- **Unit**: Requests/sec
- **Description**: UI request rate monitoring

### 4. Executor Health
```promql
up{job="spark-executor"}
```
- **Panel Type**: Stat
- **Unit**: Boolean
- **Description**: Executor service availability

### 5. Executor Request Rate
```promql
rate(http_requests_total{app="executor"}[5m])
```
- **Panel Type**: Time Series
- **Unit**: Requests/sec
- **Description**: Executor API request rate

### 6. Alert Count by Severity
```promql
count(ALERTS{alertstate="firing"}) by (severity)
```
- **Panel Type**: Pie Chart
- **Description**: Active alerts by severity level

### 7. UI Response Time P95
```promql
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket{app="web-next"}[5m])))
```
- **Panel Type**: Time Series
- **Unit**: Seconds
- **Description**: UI response time p95

### 8. Executor Memory Usage
```promql
executor_process_resident_memory_bytes / 1024 / 1024
```
- **Panel Type**: Time Series
- **Unit**: MB
- **Description**: Executor memory consumption

### 9. Executor CPU Usage
```promql
rate(executor_process_cpu_seconds_total[5m]) * 100
```
- **Panel Type**: Time Series
- **Unit**: Percent
- **Description**: Executor CPU usage percentage

### 10. Event Loop Lag
```promql
executor_nodejs_eventloop_lag_seconds
```
- **Panel Type**: Time Series
- **Unit**: Seconds
- **Description**: Node.js event loop lag

### 11. Active Strategies
```promql
active_strategies
```
- **Panel Type**: Stat
- **Unit**: Count
- **Description**: Number of active trading strategies

### 12. Rate Limit Hits
```promql
rate(rate_limit_hits_total[5m])
```
- **Panel Type**: Time Series
- **Unit**: Hits/sec
- **Description**: Rate limit violations

## 🎨 Dashboard Layout Önerileri

### Row 1: System Health
- Executor Health (Stat)
- UI Error Rate (Stat)
- Alert Count by Severity (Pie Chart)

### Row 2: Performance Metrics
- UI RPS (Time Series)
- Executor Request Rate (Time Series)
- UI Response Time P95 (Time Series)

### Row 3: Trading Metrics
- Canary Latency P95 (Time Series)
- Active Strategies (Stat)
- Rate Limit Hits (Time Series)

### Row 4: System Resources
- Executor Memory Usage (Time Series)
- Executor CPU Usage (Time Series)
- Event Loop Lag (Time Series)

## 🔧 Grafana Configuration

### Data Source
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'spark-web'
    metrics_path: /api/public/metrics/prom
    scrape_interval: 15s
    static_configs:
      - targets: ['127.0.0.1:3003']
  
  - job_name: 'spark-executor'
    metrics_path: /public/metrics/prom
    scrape_interval: 15s
    static_configs:
      - targets: ['127.0.0.1:4001']
```

### Alert Rules
```yaml
# prometheus/rules.d/spark_slo.yml
groups:
- name: spark_slo
  rules:
  - alert: UI5xxErrorRateHigh
    expr: rate(http_requests_total{app="web-next",status=~"5.."}[5m]) > 0.02
    for: 3m
    labels: {severity: warning}
    annotations:
      summary: "UI 5xx oranı yüksek"
      description: "5xx oranı son 5 dk > 2%"
```

## 📈 SLO Targets

### UI SLO
- **Availability**: 99.9% (5xx < 0.1%)
- **Latency**: P95 < 1s
- **Error Rate**: < 2%

### Executor SLO
- **Availability**: 99.95%
- **Latency**: P95 < 500ms
- **Memory**: < 512MB
- **CPU**: < 80%

### Trading SLO
- **Canary Latency**: P95 < 1s
- **Order Placement**: < 2s
- **Strategy Execution**: < 100ms

## 🚨 Alert Thresholds

### Critical (Immediate Action)
- UI 5xx > 5%
- Executor down
- Memory > 1GB
- CPU > 95%

### Warning (Monitor)
- UI 5xx > 2%
- Canary latency > 1s
- Event loop lag > 100ms
- Rate limit hits > 10/min

### Info (Log)
- New strategies started
- Configuration changes
- Backup completions

## 🔄 Refresh Intervals

### Real-time (5s)
- System health
- Active alerts
- Critical metrics

### Standard (30s)
- Performance metrics
- Resource usage
- Trading metrics

### Historical (5m)
- Trend analysis
- Capacity planning
- Long-term patterns

## 📊 Export Options

### JSON Dashboard
```json
{
  "dashboard": {
    "title": "Spark Trading Platform",
    "panels": [...],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### Prometheus Queries
```bash
# Export all queries
curl -G 'http://localhost:9090/api/v1/query' \
  --data-urlencode 'query=rate(http_requests_total{app="web-next"}[5m])'
```

## 🎯 Next Steps

1. **Grafana Setup**: Install and configure Grafana
2. **Data Source**: Add Prometheus data source
3. **Dashboard Import**: Import dashboard JSON
4. **Alert Channels**: Configure Slack/Email notifications
5. **Custom Panels**: Add trading-specific metrics
6. **Automation**: Set up automated dashboard updates

---

**HEALTH=GREEN** - Grafana panel seeds hazır, SLO kuralları tanımlandı, monitoring stratejisi oluşturuldu! 🎉
