# Monitoring

Bu klasör, Spark Trading Platform için SRE monitoring konfigürasyonlarını içerir.

## 📁 Dizin Yapısı

```
monitoring/
├── prometheus/
│   └── slo_burn_alerts.yaml    # Multi-window burn rate alerts (DRY-RUN)
└── grafana/
    └── error_budget_panel.json # Error Budget dashboard panel (template)
```

## 🔥 Prometheus SLO Burn Alerts

**Dosya:** `prometheus/slo_burn_alerts.yaml`

### Alarm Kuralları
1. **SLOBurnFast** (Critical)
   - Pencere: 5 dakika
   - Burn rate: >14.4x
   - Etki: ~2% budget/1h tüketimi
   - Severity: `page`

2. **SLOBurnMedium** (Warning)
   - Pencere: 30 dakika
   - Burn rate: >6x
   - Etki: ~5% budget/6h tüketimi
   - Severity: `warn`

3. **SLOBurnSlow** (Info)
   - Pencere: 6 saat
   - Burn rate: >3x
   - Etki: ~10% budget/1d tüketimi
   - Severity: `info`

### Konfigürasyon
```yaml
# Prometheus config'e ekle:
rule_files:
  - 'monitoring/prometheus/slo_burn_alerts.yaml'
```

### Environment Variables
```bash
# Executor service için
PROM_URL=http://prometheus:9090
SLO_WINDOW=5m
SLO_ALLOWED_ERROR_RATE=0.001  # 99.9% SLO için
```

### Test
```bash
# Alert kurallarını kontrol et
curl http://prometheus:9090/api/v1/rules

# Belirli bir kuralı test et
curl 'http://prometheus:9090/api/v1/query?query=SLOBurnFast'
```

## 📊 Grafana Error Budget Panel

**Dosya:** `grafana/error_budget_panel.json`

### Özellikler
- **Metric:** Error Budget Remaining %
- **Query:** Prometheus (rate-based)
- **Thresholds:** 
  - 🔴 <30% (Critical)
  - 🟡 30-60% (Warning)
  - 🟢 ≥60% (Healthy)
- **Alert:** <30% için critical alert

### Import
1. Grafana → Dashboards → Import
2. JSON'u yapıştır veya dosyayı yükle
3. Datasource: Prometheus seç
4. Import tıkla

### Dashboard Link
Dashboard oluştuktan sonra IC_STICKY_LABELS.txt'ye ekle:
```
Error Budget Dashboard: http://grafana/d/error-budget
```

## 🎯 Production Checklist

- [ ] Prometheus server kurulu
- [ ] `http_requests_total` metric toplama aktif
- [ ] Alert Manager konfigüre edilmiş
- [ ] Grafana dashboard import edilmiş
- [ ] Runbook URL'leri güncellendi
- [ ] Alert routing rules test edildi
- [ ] Slack/PagerDuty notification test edildi

## 📖 Referanslar

1. **Google SRE Workbook - Alerting on SLOs**
   https://sre.google/workbook/alerting-on-slos/

2. **Prometheus Alerting Rules**
   https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/

3. **Grafana Panel JSON**
   https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/create-dashboard/

4. **Multi-Window Multi-Burn-Rate**
   https://sre.google/workbook/alerting-on-slos/#6-multiwindow-multi-burn-rate-alerts

## 🚀 Hızlı Başlangıç

### 1. Prometheus Setup
```bash
# Docker ile
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus:/etc/prometheus \
  prom/prometheus
```

### 2. Executor ENV
```bash
export PROM_URL=http://localhost:9090
export SLO_ALLOWED_ERROR_RATE=0.001  # 99.9% SLO
```

### 3. Test
```bash
# Executor endpoint
curl http://localhost:4001/error-budget/summary

# Web-Next proxy
curl http://localhost:3003/api/public/error-budget

# Smoke test
powershell -File .\scripts\smoke_error_budget.ps1
```

### 4. Dashboard
```
http://localhost:3003/dashboard
→ "EB 70.0%" badge görünmeli
```

---

**Status:** DRY-RUN TEMPLATE  
**Production Ready:** Konfigürasyon güncellemesi gerekli

