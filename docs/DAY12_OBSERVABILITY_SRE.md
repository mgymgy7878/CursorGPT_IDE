# DAY-12 Observability++ & SRE Pack - Operations Guide

## Overview

DAY-12 Observability++ & SRE Pack, production-grade observability, SLO monitoring, güvenli deployment stratejileri ve PII-safe logging sağlayan kapsamlı bir sistemdir. Red/black deployment, synthetic probes, error budget monitoring ve extended readiness checks ile sistem güvenilirliğini artırır.

## Components

### 1. Red/Black Deployment (Blue/Green)
- **Dual Deployments**: Blue ve green deployment'ları
- **Service Selector Flip**: Zero-downtime geçiş
- **Rollback Capability**: Hızlı geri alma
- **Health Validation**: Deployment sonrası sağlık kontrolü

### 2. SLO & Error Budget Monitoring
- **API Error Rate**: 5% fast burn, 2% slow burn
- **Latency Targets**: P95 < 100ms
- **WebSocket Availability**: >99.9% uptime
- **Burn Rate Alerts**: Prometheus kuralları

### 3. Synthetic Probes
- **CronJob**: Dakikalık otomatik testler
- **Health Chain**: Health → Risk → Shadow → Report
- **Failure Detection**: Probe başarısızlığı alarmları
- **Local Testing**: Windows script desteği

### 4. Extended Readiness
- **Dependency Checks**: WebSocket, metrics, exchange-info
- **Health Validation**: Tüm bağımlılıkların durumu
- **Graceful Degradation**: Kısmi başarısızlık yönetimi
- **Status Reporting**: Detaylı durum bilgisi

### 5. Request-ID & Logging
- **X-Request-Id**: Her request için unique ID
- **Sampled Access Logs**: %10 örnekleme
- **PII Redaction**: Hassas veri koruması
- **Structured Logging**: JSON format

### 6. Grafana Observability++
- **Error Budget Dashboard**: SLO monitoring
- **Latency Analysis**: P95, P99 tracking
- **Tenant Metrics**: Per-organization monitoring
- **Synthetic Results**: Probe başarı oranları

## Environment Variables

```bash
# ---- OBSERVABILITY ----
LOG_SAMPLING_PCT=10                  # %10 access log örnekleme
PII_REDACT_KEYS=apiKey,secret,Authorization,X-Api-Key
TRACE_ENABLED=false

# ---- READINESS ----
READY_WS_MAX_AGE_MS=15000            # son pong süresi
READY_METRICS_MIN_CALLS=1            # spark_private_calls_total >= 1

# ---- RED/BLACK ----
ACTIVE_COLOR=blue                    # blue | green (ops flip script bunu değiştirir)
```

## Red/Black Deployment Operations

### Deployment Strategy
```bash
# 1. Deploy blue version
kubectl apply -f ops/k8s/executor-bluegreen.yaml

# 2. Verify blue deployment
kubectl rollout status deploy/spark-executor-blue

# 3. Deploy green version (parallel)
kubectl set image deploy/spark-executor-green executor=YOUR_REGISTRY/spark-executor:v0.3.4-green

# 4. Verify green deployment
kubectl rollout status deploy/spark-executor-green

# 5. Flip traffic to green
.\runtime\day12_flip_color.cmd green

# 6. Verify service health
curl -s http://127.0.0.1:4001/api/public/health
```

### Rollback Procedure
```bash
# Emergency rollback to blue
.\runtime\day12_flip_color.cmd blue

# Verify rollback
kubectl get endpoints spark-executor-svc
curl -s http://127.0.0.1:4001/api/public/health
```

### Deployment Validation
```bash
# Check active color
kubectl get svc spark-executor-svc -o jsonpath="{.spec.selector.color}"

# Check endpoints
kubectl get endpoints spark-executor-svc

# Health check
curl -s -o NUL -w "%{http_code}\n" http://127.0.0.1:4001/api/public/health
```

## Synthetic Probes

### CronJob Operations
```bash
# Apply synthetic probes
kubectl apply -f ops/k8s/cron-synthetic.yaml

# Check cronjob status
kubectl get cronjob spark-synthetic

# View recent jobs
kubectl get jobs -l app=spark-synthetic

# Check job logs
kubectl logs job/spark-synthetic-<timestamp>
```

### Local Testing
```bash
# Run synthetic probes locally
.\runtime\day12_probe_once.cmd

# Expected output:
# public=200
# private=200
# ready=200
# metrics=200
# shadow=200
# report=200
```

### Probe Metrics
```bash
# Check probe metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep synth

# Expected metrics:
# spark_synth_public_health_total
# spark_synth_private_health_total
# spark_synth_shadow_order_total
# spark_synth_fail_total
```

## SLO & Error Budget Monitoring

### Prometheus Rules
```bash
# Apply SLO rules
kubectl apply -f ops/prometheus/rules/day12_slo_burn.yml

# Check rules
kubectl get prometheusrules -n monitoring

# Test alert rules
kubectl port-forward svc/prometheus 9090:9090
```

### Key SLO Targets
- **API Error Rate**: <1% (target), <5% (fast burn), <2% (slow burn)
- **Latency P95**: <100ms
- **WebSocket Availability**: >99.9%
- **Ready Endpoint**: 100% availability

### Alert Validation
```bash
# Simulate high error rate (using chaos middleware)
.\runtime\day9_chaos_http.cmd on

# Wait for alert (1h for fast burn)
timeout /t 3600 >NUL

# Check alerts
kubectl get prometheusalerts -n monitoring

# Disable chaos
.\runtime\day9_chaos_http.cmd off
```

## Extended Readiness

### Readiness Endpoint
```bash
# Check extended readiness
curl -s http://127.0.0.1:4001/api/public/ready

# Expected response:
{
  "ok": true,
  "okPublic": true,
  "okMetrics": true,
  "calls": 42,
  "okWS": true,
  "ageMs": 5000,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Readiness Validation
```bash
# Test readiness endpoint
curl -s -o NUL -w "%{http_code}\n" http://127.0.0.1:4001/api/public/ready

# Expected: 200 (ready) or 503 (not ready)

# Check readiness metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep ready
```

## Request-ID & Logging

### Request Tracking
```bash
# Test request ID propagation
curl -H "X-Request-Id: test-123" http://127.0.0.1:4001/api/public/health

# Check response headers
curl -I -H "X-Request-Id: test-123" http://127.0.0.1:4001/api/public/health

# Expected: X-Request-Id: test-123
```

### PII Redaction
```bash
# Test PII redaction
curl -X POST http://127.0.0.1:4001/api/private/order \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test" \
  -H "X-Api-Key: test-key" \
  -d '{"apiKey":"secret123","secret":"password","symbol":"BTCUSDT"}'

# Check logs for redacted values
# Expected: "apiKey":"***REDACTED***", "secret":"***REDACTED***"
```

### Log Sampling
```bash
# Check log sampling (10% by default)
# Multiple requests should show ~10% in logs

for i in {1..100}; do
  curl -s http://127.0.0.1:4001/api/public/health >NUL
done

# Check access logs for sampled entries
# Expected: ~10 log entries with [ACCESS] prefix
```

## Grafana Observability++

### Dashboard Import
```bash
# Import dashboard
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @ops/grafana/dashboards/observability_plus.json
```

### Key Panels

#### Error Budget Panel
- **API Error Rate**: Real-time error rate monitoring
- **Burn Rate**: Fast/slow burn rate tracking
- **SLO Status**: Error budget remaining

#### Latency Panel
- **P95 Latency**: 95th percentile response time
- **P99 Latency**: 99th percentile response time
- **Latency Distribution**: Histogram view

#### Synthetic Probes Panel
- **Probe Success Rate**: Synthetic test results
- **Probe Failures**: Failure count and trends
- **Endpoint Health**: Individual endpoint status

#### Tenant Metrics Panel
- **Request Volume**: Per-tenant request rates
- **Error Rates**: Per-tenant error rates
- **Rate Limiting**: Per-tenant rate limit hits

## Monitoring & Alerting

### Critical Alerts
1. **APIErrorBudgetBurnFast**: >5% error rate for 1h
2. **APIErrorBudgetBurnSlow**: >2% error rate for 6h
3. **SyntheticProbeFailing**: Probe failures for 10m
4. **ReadyEndpointFailing**: Ready endpoint failures
5. **WSPongStale**: WebSocket stale for 5m

### Warning Alerts
1. **HighLatencyP95**: P95 > 100ms for 5m
2. **TenantRateLimitExceeded**: High rate limiting
3. **OutboundConcurrencyHigh**: Concurrency > 50

### Alert Response
```bash
# Check active alerts
kubectl get prometheusalerts -n monitoring

# Acknowledge alert
kubectl patch prometheusalert alert-name -p '{"metadata":{"annotations":{"acknowledged":"true"}}}'

# Resolve alert
kubectl patch prometheusalert alert-name -p '{"metadata":{"annotations":{"resolved":"true"}}}'
```

## Troubleshooting

### Red/Black Issues

#### Deployment Failures
```bash
# Check deployment status
kubectl describe deploy spark-executor-blue
kubectl describe deploy spark-executor-green

# Check pod logs
kubectl logs -l app=spark-executor,color=blue
kubectl logs -l app=spark-executor,color=green

# Check service endpoints
kubectl get endpoints spark-executor-svc
```

#### Traffic Flip Issues
```bash
# Check service selector
kubectl get svc spark-executor-svc -o yaml

# Manual flip
kubectl patch svc spark-executor-svc -p '{"spec":{"selector":{"color":"green"}}}'

# Verify endpoints
kubectl get endpoints spark-executor-svc
```

### Synthetic Probe Issues

#### CronJob Failures
```bash
# Check cronjob status
kubectl describe cronjob spark-synthetic

# Check job logs
kubectl logs job/spark-synthetic-<timestamp>

# Manual job execution
kubectl create job --from=cronjob/spark-synthetic manual-probe
```

#### Probe Failures
```bash
# Test individual endpoints
curl -s http://127.0.0.1:4001/api/public/health
curl -s http://127.0.0.1:4001/api/private/health
curl -s http://127.0.0.1:4001/api/public/ready

# Check probe metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep synth
```

### SLO Issues

#### High Error Rates
```bash
# Check error metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep error

# Check recent errors
kubectl logs -l app=spark-executor --tail=100 | grep ERROR

# Check tenant rejections
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep reject
```

#### Latency Issues
```bash
# Check latency metrics
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep duration

# Check resource usage
kubectl top pods -l app=spark-executor

# Check outbound concurrency
curl -s http://127.0.0.1:4001/api/public/metrics/prom | grep outbound
```

## Emergency Procedures

### Critical Alert Response
```bash
# 1. Acknowledge alert
kubectl patch prometheusalert alert-name -p '{"metadata":{"annotations":{"acknowledged":"true"}}}'

# 2. Check service health
curl -s http://127.0.0.1:4001/api/public/health

# 3. Check synthetic probes
.\runtime\day12_probe_once.cmd

# 4. Rollback if necessary
.\runtime\day12_flip_color.cmd blue

# 5. Investigate root cause
kubectl logs -l app=spark-executor --tail=100
```

### Service Degradation
```bash
# 1. Check readiness endpoint
curl -s http://127.0.0.1:4001/api/public/ready

# 2. Check individual components
curl -s http://127.0.0.1:4001/api/public/health
curl -s http://127.0.0.1:4001/api/public/metrics/prom

# 3. Check WebSocket status
curl -s http://127.0.0.1:4001/api/private/websocket/status

# 4. Restart if necessary
kubectl rollout restart deploy/spark-executor-blue
kubectl rollout restart deploy/spark-executor-green
```

### Complete Service Failure
```bash
# 1. Emergency rollback
.\runtime\day12_flip_color.cmd blue

# 2. Scale down problematic deployment
kubectl scale deploy spark-executor-green --replicas=0

# 3. Check blue deployment health
kubectl get pods -l app=spark-executor,color=blue

# 4. Restart blue deployment if needed
kubectl rollout restart deploy/spark-executor-blue
```

## Best Practices

### Deployment Strategy
1. **Always Deploy to Inactive Color**: Blue → Green → Blue
2. **Health Validation**: Verify deployment before traffic flip
3. **Gradual Rollout**: Consider canary deployment for major changes
4. **Rollback Plan**: Always have rollback procedure ready

### Monitoring Strategy
1. **SLO-First Approach**: Define clear SLO targets
2. **Error Budget Management**: Track and manage error budgets
3. **Proactive Monitoring**: Use synthetic probes for early detection
4. **Alert Fatigue Prevention**: Tune alert thresholds carefully

### Logging Strategy
1. **Structured Logging**: Use JSON format for machine readability
2. **PII Protection**: Always redact sensitive information
3. **Sampling Strategy**: Balance detail with performance
4. **Request Tracing**: Use request IDs for correlation

### Incident Response
1. **Alert Acknowledgment**: Always acknowledge alerts
2. **Root Cause Analysis**: Document incidents and learnings
3. **Post-Incident Review**: Conduct blameless post-mortems
4. **Process Improvement**: Update procedures based on learnings

## Monitoring Checklist

### Daily Checks
- [ ] Red/black deployment status
- [ ] Synthetic probe success rates
- [ ] SLO error budget status
- [ ] Latency P95 values
- [ ] Active alerts review

### Weekly Reviews
- [ ] Error budget consumption analysis
- [ ] Synthetic probe failure patterns
- [ ] Deployment success rates
- [ ] Alert effectiveness review
- [ ] SLO target adjustments

### Monthly Assessments
- [ ] SLO target review and adjustment
- [ ] Synthetic probe coverage analysis
- [ ] Deployment strategy optimization
- [ ] Monitoring tool effectiveness
- [ ] Incident response process review

---

**Bu operasyon kılavuzu, DAY-12 Observability++ & SRE Pack'in etkili kullanımı için gerekli tüm bilgileri içerir. Tüm operasyonlar production-safe olarak tasarlanmıştır.** 