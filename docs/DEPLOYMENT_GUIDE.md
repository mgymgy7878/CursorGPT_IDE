# Deployment Guide

## Canary Evidence Adımı

### Pre-deployment Checklist

#### 1. Metrics Contract Doğrulama
```bash
# Metrik sözleşmesini test et
./scripts/test-metrics-contract.sh

# Beklenen çıktı:
# ✅ HTTP metrikleri: method, route, status
# ✅ AI metrikleri: model, status
# ✅ Exchange metrikleri: exchange
# ✅ Canary test: 200 OK
```

#### 2. Executor Health Check
```bash
# Executor'ı production modunda başlat
METRICS_DISABLED=0 node services/executor/dist/index.cjs

# Health endpoint kontrolü
curl http://localhost:4001/ops/health
# Beklenen: {"status":"ok","t":timestamp}
```

#### 3. Canary Evidence Collection
```bash
# Canary dry-run test
curl -X POST http://localhost:4001/api/canary/run \
  -H "Content-Type: application/json" \
  -d '{"dry": true}'

# Beklenen: {"ok":true,"dryRun":true,"echo":{"dry":true},"ts":timestamp}
```

#### 4. Metrics Endpoint Verification
```bash
# Metrikleri indir ve kontrol et
curl http://localhost:4001/metrics > metrics.txt

# HTTP metrik sözleşmesi kontrolü
grep "http_request_duration_ms" metrics.txt | head -5
# Beklenen: method=, route=, status= label'ları içermeli
```

### Production Deployment

#### Environment Variables
```bash
# .env dosyası
METRICS_DISABLED=0          # Production'da metrikler aktif
TRADING_MODE=paper          # paper | live
DRY_RUN=true               # true | false
KILL_SWITCH=false          # true | false
```

#### Build Process
```bash
# 1. Build
pnpm --filter executor build

# 2. Test
./scripts/test-metrics-contract.sh

# 3. Deploy
METRICS_DISABLED=0 node services/executor/dist/index.cjs
```

#### Post-deployment Verification
```bash
# 1. Health check
curl http://localhost:4001/ops/health

# 2. Canary test
curl -X POST http://localhost:4001/api/canary/run \
  -H "Content-Type: application/json" \
  -d '{"dry": true}'

# 3. Metrics scrape test
curl http://localhost:4001/metrics | grep "spark_"

# 4. Prometheus scrape test (eğer Prometheus kuruluysa)
curl http://prometheus:9090/api/v1/targets | grep "executor"
```

### Monitoring Setup

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Spark Trading Platform",
    "panels": [
      {
        "title": "HTTP Request Duration P95",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_request_duration_ms_count[1m])"
          }
        ]
      }
    ]
  }
}
```

#### Alert Rules
```yaml
groups:
- name: spark.trading
  rules:
  - alert: HighHTTPLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "HTTP P95 latency is high"
      
  - alert: CriticalHTTPLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m])) > 2500
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "HTTP P95 latency is critical"
```

### Troubleshooting

#### Route Label Hatası
```bash
# Acil çözüm
METRICS_DISABLED=1 node services/executor/dist/index.cjs

# Detaylı çözüm için:
# docs/METRICS_TROUBLESHOOTING.md dosyasını kontrol edin
```

#### Metrics Contract Violation
```bash
# CI test çalıştır
./scripts/test-metrics-contract.sh

# Hata varsa, metrik tanımlarını kontrol et:
grep -r "labelNames" services/executor/src/**/metrics*.ts
```

#### Prometheus Scrape Issues
```bash
# Executor'ın metrics endpoint'ini kontrol et
curl http://localhost:4001/metrics | head -20

# Prometheus target'ını kontrol et
curl http://prometheus:9090/api/v1/targets | grep "executor"
```

### Rollback Plan

#### Acil Rollback
```bash
# 1. Executor'ı durdur
pkill -f "node.*executor"

# 2. NOOP modda başlat
METRICS_DISABLED=1 node services/executor/dist/index.cjs

# 3. Health check
curl http://localhost:4001/ops/health
```

#### Full Rollback
```bash
# 1. Önceki versiyonu deploy et
git checkout previous-stable-tag
pnpm --filter executor build
METRICS_DISABLED=0 node services/executor/dist/index.cjs

# 2. Verify
curl http://localhost:4001/ops/health
```

### Contact
Deployment sorunları için:
- Metrics Contract ekibi: @metrics-team
- DevOps ekibi: @devops-team
- Acil durumlar: #spark-alerts
