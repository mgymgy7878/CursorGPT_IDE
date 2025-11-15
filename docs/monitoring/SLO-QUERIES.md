# Spark TA Module v1.0.0 - SLO Tracking Queries

## Service Level Objectives (SLOs)

### 1. SSE Availability ≥ 99.5% (7 days)

**Target:** Stream endpoint uptime 99.5% or higher over 7 days

**Prometheus Query:**
```promql
# Availability percentage
sum(up{job="web-next"}) / count(up{job="web-next"}) * 100

# 7-day average
avg_over_time((sum(up{job="web-next"}) / count(up{job="web-next"}))[7d:1m]) * 100
```

**Alert Rule:**
```yaml
- alert: SSEAvailabilityLow
  expr: avg_over_time((sum(up{job="web-next"}) / count(up{job="web-next"}))[7d:1m]) < 0.995
  for: 5m
  labels: {severity: page}
  annotations:
    summary: "SSE availability below 99.5% (7d average)"
```

---

### 2. Alert Evaluation Latency P95 ≤ 2 seconds

**Target:** 95% of alert evaluations complete in 2 seconds or less

**Note:** Currently tracked via scheduler tick duration in logs. Future enhancement: add histogram metric.

**Future Prometheus Query:**
```promql
# P95 latency (requires histogram)
histogram_quantile(0.95, 
  rate(alert_eval_duration_seconds_bucket[5m])
)
```

**Workaround (current):**
```bash
# Parse logs for scheduler tick duration
docker logs executor-1 | grep "pollOnce" | grep "duration" | awk '{print $NF}' | sort -n | tail -5
```

---

### 3. Notification Success Rate ≥ 98% (5 minutes)

**Target:** 98% of notifications delivered successfully

**Prometheus Query:**
```promql
# Success rate percentage
sum(rate(notifications_sent_total[5m])) / 
(sum(rate(notifications_sent_total[5m])) + sum(rate(notifications_failed_total[5m]))) * 100

# By channel
sum(rate(notifications_sent_total[5m])) by (channel) / 
(sum(rate(notifications_sent_total[5m])) by (channel) + sum(rate(notifications_failed_total[5m])) by (channel)) * 100
```

**Alert Rule:**
```yaml
- alert: NotificationSuccessRateLow
  expr: |
    sum(rate(notifications_sent_total[5m])) / 
    (sum(rate(notifications_sent_total[5m])) + sum(rate(notifications_failed_total[5m]))) < 0.98
  for: 10m
  labels: {severity: warn}
  annotations:
    summary: "Notification success rate below 98%"
```

---

## Additional Key Metrics

### Alert Trigger Rate
```promql
# Triggers per minute (by type)
sum(rate(alerts_triggered_total[5m])) by (type) * 60

# Total triggers per minute
sum(rate(alerts_triggered_total[5m])) * 60
```

### Cooldown Efficiency
```promql
# Suppression rate due to cooldown
rate(alerts_suppressed_total{reason="cooldown"}[5m]) * 60

# Cooldown effectiveness (suppressed vs triggered)
sum(rate(alerts_suppressed_total{reason="cooldown"}[5m])) / 
sum(rate(alerts_triggered_total[5m]))
```

### Leader Election Health
```promql
# Leader changes (should be rare)
increase(leader_elected_total[1h])

# Average leadership duration
leader_held_seconds / leader_elected_total
```

### SSE Stream Health
```promql
# Current connections
streams_connected

# Message throughput
rate(streams_messages_total[5m]) * 60

# Error rate
rate(streams_errors_total[5m]) * 60
```

### Cache Hit Rate
```promql
# Tool cache effectiveness
sum(rate(copilot_action_total{result="cache_hit"}[5m])) / 
sum(rate(copilot_action_total[5m])) * 100
```

---

## Grafana Dashboard Queries

### Panel: "Alert Lifecycle Overview"
```promql
# Active alerts (gauge)
alerts_active

# Creation rate (line)
rate(alerts_created_total[5m]) * 60

# Trigger rate (line)
rate(alerts_triggered_total[5m]) * 60

# Suppression rate (line)
rate(alerts_suppressed_total[5m]) * 60
```

### Panel: "Notification Delivery Status"
```promql
# Sent (by channel)
sum(rate(notifications_sent_total[5m])) by (channel) * 60

# Failed (by channel + reason)
sum(rate(notifications_failed_total[5m])) by (channel,reason) * 60

# Success rate (gauge)
sum(rate(notifications_sent_total[5m])) / 
(sum(rate(notifications_sent_total[5m])) + sum(rate(notifications_failed_total[5m]))) * 100
```

### Panel: "Leader Election Status"
```promql
# Total elections (stat)
leader_elected_total

# Leadership duration (stat)
leader_held_seconds

# Time as leader (graph)
rate(leader_held_seconds[5m]) * 60
```

### Panel: "SSE Performance"
```promql
# Active streams (gauge)
streams_connected

# Message rate (line)
rate(streams_messages_total[5m]) * 60

# Error rate (line)
rate(streams_errors_total[5m]) * 60
```

---

## SLO Compliance Dashboard

Create a dedicated "SLO Compliance" dashboard with:

1. **Availability Card:** Green/Yellow/Red based on 99.5% threshold
2. **Latency Card:** P95 alert eval time (when histogram added)
3. **Success Rate Card:** Notification delivery percentage
4. **Trend Graph:** 7-day rolling window for each SLO

**Import:** Use the main dashboard JSON, then add custom SLO panel.

---

## Monitoring Best Practices

1. **Set up alerts for all SLO violations** (Prometheus alertmanager)
2. **Review metrics weekly** to identify trends
3. **Adjust thresholds** based on actual usage patterns
4. **Add histograms** for latency tracking (PATCH-6)
5. **Export dashboards** regularly as backup

---

## Troubleshooting Queries

### "Why are alerts not triggering?"
```promql
# Check active alerts
alerts_active

# Check scheduler running
increase(leader_elected_total[10m])

# Check evaluation errors
sum(rate(alerts_errors_total[5m])) by (type)
```

### "Why are notifications failing?"
```promql
# Failure breakdown
sum(rate(notifications_failed_total[5m])) by (channel,reason) * 60

# Suppression reasons
sum(rate(notifications_suppressed_total[5m])) by (channel,reason) * 60
```

### "Is SSE streaming working?"
```promql
# Current connections
streams_connected

# Recent messages
increase(streams_messages_total[1m])

# Error spike?
rate(streams_errors_total[5m])
```

---

## Production Metrics Export

For external monitoring tools (Datadog, New Relic, etc.), export via:

```bash
# Prometheus format
curl http://localhost:4001/metrics

# JSON format (custom endpoint - future)
curl http://localhost:4001/api/metrics/json
```

---

**Last Updated:** 2025-10-11  
**Version:** v1.0.0  
**Maintainer:** Spark Platform Team
