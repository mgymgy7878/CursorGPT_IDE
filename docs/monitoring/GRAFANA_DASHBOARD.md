# Spark Monitoring — Portfolio Dashboard

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 📊 GENEL BAKIŞ

Spark Trading Platform portfolio işlemlerini izlemek için Grafana dashboard ve Prometheus alert kuralları.

### Bileşenler
- **Prometheus**: Metrics toplama ve alert evaluation (Port 9090)
- **Grafana**: Dashboard ve görselleştirme (Port 3005)
- **Executor**: Metrics kaynağı (Port 4001/metrics)

---

## 🚀 HIZLI BAŞLATMA

### Adım 1: Docker Compose ile Başlat

```powershell
# Prometheus ve Grafana'yı başlat
cd C:\dev\CursorGPT_IDE
docker compose up -d prometheus grafana

# Durumu kontrol et
docker compose ps
```

### Adım 2: Executor'ı Başlat

```powershell
# Executor metrics source'u başlat
.\basla.ps1
```

### Adım 3: Grafana'ya Eriş

- **URL**: http://localhost:3005
- **Kullanıcı**: admin
- **Şifre**: admin (ilk girişte değiştir)

### Adım 4: Dashboard'u Aç

1. Grafana'ya giriş yap
2. Sol menüden "Dashboards" → "Browse"
3. "Spark" folder'ı aç
4. "Spark • Portfolio Performance" dashboard'unu seç

---

## 📈 DASHBOARD PANELLERİ

### Panel 1: Portfolio Refresh Latency (p50/p95)
**Metrik**: `spark_portfolio_refresh_latency_ms`  
**Açıklama**: Portfolio verilerini çekme süresi  
**Hedef**: p95 < 1500ms  
**Alert**: p95 > 1500ms (5 dakika boyunca)

**PromQL**:
```promql
# p95
histogram_quantile(0.95, sum by (le, exchange) (rate(spark_portfolio_refresh_latency_ms_bucket[5m])))

# p50
histogram_quantile(0.50, sum by (le, exchange) (rate(spark_portfolio_refresh_latency_ms_bucket[5m])))
```

---

### Panel 2: Exchange API Error Rate
**Metrik**: `spark_exchange_api_error_total`  
**Açıklama**: Exchange API hata oranı (saniyede)  
**Hedef**: < 0.01 error/s  
**Alert**: > 0.05 error/s (3 dakika boyunca)

**PromQL**:
```promql
sum by (exchange, error_type) (rate(spark_exchange_api_error_total[5m]))
```

**Error Type'lar**:
- `timeout`: API zaman aşımı
- `unauthorized`: API key hatası
- `rate_limit`: Rate limit aşımı
- `unknown`: Diğer hatalar

---

### Panel 3: Total Portfolio Value (USD)
**Metrik**: `spark_portfolio_total_value_usd`  
**Açıklama**: Exchange'lere göre toplam portföy değeri  
**Hedef**: Stabil, beklenmedik düşüş yok  
**Alert**: 5 dakikada %10'dan fazla düşüş

**PromQL**:
```promql
spark_portfolio_total_value_usd
```

---

### Panel 4: Data Staleness
**Metrik**: `spark_portfolio_last_update_timestamp`  
**Açıklama**: Son güncelleme'den beri geçen süre  
**Hedef**: < 60 saniye  
**Alert**: > 300 saniye (5 dakika)

**PromQL**:
```promql
time() - spark_portfolio_last_update_timestamp
```

---

### Panel 5: Asset Count
**Metrik**: `spark_portfolio_asset_count`  
**Açıklama**: Exchange'de bulunan varlık sayısı  
**Hedef**: > 0  
**Alert**: 0 asset (5 dakika boyunca - muhtemelen API key sorunu)

**PromQL**:
```promql
spark_portfolio_asset_count
```

---

## 🚨 PROMETHEUS ALERT KURALLARI

### Alert 1: PortfolioRefreshLatencyHighP95
```yaml
Severity: warning
Threshold: p95 > 1500ms
Duration: 5 minutes
Action: Exchange API durumunu ve network bağlantısını kontrol et
```

### Alert 2: ExchangeApiErrorRateHigh
```yaml
Severity: critical
Threshold: > 0.05 errors/second
Duration: 3 minutes
Action: API credentials, rate limits ve exchange status kontrol et
```

### Alert 3: PortfolioDataStale
```yaml
Severity: warning
Threshold: > 300 seconds (5 minutes)
Duration: 2 minutes
Action: Executor service health ve API connectivity kontrol et
```

### Alert 4: PortfolioValueDropAnomaly
```yaml
Severity: warning
Threshold: 5 dakikada %10'dan fazla düşüş
Duration: 1 minute
Action: Fiyat verisi doğruluğunu kontrol et, market olaylarını incele
```

### Alert 5: PortfolioNoAssets
```yaml
Severity: warning
Threshold: Asset count < 1
Duration: 5 minutes
Action: API key izinlerini ve hesap durumunu kontrol et
```

---

## ✅ SMOKE TEST (Doğrulama)

### Test 1: Prometheus Health

```powershell
# Prometheus ayakta mı?
curl http://localhost:9090/-/healthy

# Beklenen: Prometheus is Healthy.
```

### Test 2: Executor Metrics

```powershell
# Metrics endpoint'i çalışıyor mu?
curl http://localhost:4001/metrics | Select-String "spark_portfolio"

# Beklenen:
# spark_portfolio_refresh_latency_ms_bucket{...
# spark_portfolio_total_value_usd{...
# spark_portfolio_asset_count{...
```

### Test 3: Prometheus Targets

```powershell
# Tarayıcıda aç:
# http://localhost:9090/targets

# Beklenen: "executor" target'ı UP durumunda
```

### Test 4: Grafana Login

```powershell
# Grafana login sayfası açılıyor mu?
curl http://localhost:3005/login

# Tarayıcıda aç: http://localhost:3005
# Login: admin / admin
```

### Test 5: Dashboard Görünürlük

```powershell
# Tarayıcıda:
# http://localhost:3005/dashboards
# "Spark" folder → "Spark • Portfolio Performance"

# Beklenen: 5 panel görünüyor, veri akışı var
```

---

## 🔧 YAPILANDIRMA DOSYALARI

### Prometheus Datasource
**Dosya**: `monitoring/grafana/provisioning/datasources/prometheus.yaml`

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

### Dashboard Provisioning
**Dosya**: `monitoring/grafana/provisioning/dashboards/dashboards.yaml`

```yaml
apiVersion: 1
providers:
  - name: spark-dashboards
    folder: Spark
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

### Alert Rules
**Dosya**: `prometheus/alerts/spark-portfolio.rules.yml`

5 adet alert rule tanımlı (yukarıda detaylandırıldı)

---

## 🐛 SORUN GİDERME

### Prometheus Metrics Görünmüyor

```powershell
# 1. Executor çalışıyor mu?
curl http://localhost:4001/health

# 2. Metrics endpoint erişilebilir mi?
curl http://localhost:4001/metrics

# 3. Prometheus executor'a erişebiliyor mu?
# Tarayıcıda: http://localhost:9090/targets
# "executor" target'ı UP mu?

# 4. Docker network kontrolü
docker network inspect cursorgpt_ide_spark-network
```

### Grafana Dashboard Yüklenmiyor

```powershell
# 1. Grafana provisioning volume mount kontrolü
docker compose exec grafana ls -la /etc/grafana/provisioning/dashboards

# 2. Dashboard JSON syntax kontrolü
# monitoring/grafana/provisioning/dashboards/spark-portfolio.json

# 3. Grafana loglarını kontrol et
docker compose logs grafana | Select-String -Pattern "dashboard"

# 4. Grafana'yı yeniden başlat
docker compose restart grafana
```

### Alert'ler Çalışmıyor

```powershell
# 1. Prometheus alert rules yüklendi mi?
# Tarayıcıda: http://localhost:9090/rules
# "spark-portfolio" rule group görünmeli

# 2. Alert evaluation kontrolü
# Tarayıcıda: http://localhost:9090/alerts

# 3. Prometheus config reload
curl -X POST http://localhost:9090/-/reload

# 4. Alert rule syntax kontrolü
# prometheus/alerts/spark-portfolio.rules.yml
```

### Metrics Güncel Değil

```powershell
# 1. Portfolio API çağrısı yap (metrics'i tetikler)
curl http://localhost:4001/api/portfolio

# 2. Executor loglarını kontrol et
Receive-Job -Name spark-executor -Keep | Select-String "Portfolio"

# 3. API key'leri kontrol et
cd services\executor
cat .env
```

---

## 📊 PROMETHEUS QUERY ÖRNEKLERİ

### Latency Analysis

```promql
# Average latency per exchange
avg by (exchange) (spark_portfolio_refresh_latency_ms_sum / spark_portfolio_refresh_latency_ms_count)

# Max latency in last hour
max_over_time(spark_portfolio_refresh_latency_ms_sum[1h])

# Latency trend (5m rate)
rate(spark_portfolio_refresh_latency_ms_sum[5m])
```

### Error Analysis

```promql
# Total errors per exchange
sum by (exchange) (spark_exchange_api_error_total)

# Error rate per error type
rate(spark_exchange_api_error_total[5m])

# Error percentage
(sum(rate(spark_exchange_api_error_total[5m])) / sum(rate(spark_portfolio_refresh_latency_ms_count[5m]))) * 100
```

### Portfolio Value Analysis

```promql
# Total portfolio value across all exchanges
sum(spark_portfolio_total_value_usd)

# Portfolio value change (5m)
delta(spark_portfolio_total_value_usd[5m])

# Portfolio value percentage change
(spark_portfolio_total_value_usd - spark_portfolio_total_value_usd offset 5m) / spark_portfolio_total_value_usd offset 5m * 100
```

---

## 🔗 HIZLI KISAYOLLAR

### URL'ler
- **Grafana**: http://localhost:3005
- **Prometheus**: http://localhost:9090
- **Prometheus Targets**: http://localhost:9090/targets
- **Prometheus Rules**: http://localhost:9090/rules
- **Prometheus Alerts**: http://localhost:9090/alerts
- **Executor Metrics**: http://localhost:4001/metrics
- **Executor Health**: http://localhost:4001/health

### Komutlar

```powershell
# Başlat
docker compose up -d prometheus grafana
.\basla.ps1

# Durdur
docker compose down
.\durdur.ps1

# Logları görüntüle
docker compose logs -f prometheus
docker compose logs -f grafana

# Container durumu
docker compose ps

# Metrics test
curl http://localhost:4001/metrics | Select-String "spark_portfolio"

# Prometheus reload (config değişikliği sonrası)
curl -X POST http://localhost:9090/-/reload
```

---

## 📚 EK KAYNAKLAR

### Dokümantasyon
- Prometheus Query Language: https://prometheus.io/docs/prometheus/latest/querying/basics/
- Grafana Provisioning: https://grafana.com/docs/grafana/latest/administration/provisioning/
- Alert Rules: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/

### Proje Dökümanları
- `PORTFOLIO_ENTEGRASYON_REHBERI.md` - Portfolio entegrasyon detayları
- `SONRAKI_SPRINT_PLANI.md` - Roadmap ve gelecek özellikler
- `HIZLI_BASLANGIC_REHBERI.md` - Genel başlangıç rehberi

---

## 🎯 SONRAKİ ADIMLAR

1. **Alertmanager Entegrasyonu** (Opsiyonel)
   - Slack/Email bildirimleri
   - Alert grouping ve deduplication

2. **Additional Dashboards**
   - BTCTurk Spot Reader metrics
   - System resource usage
   - Business metrics (trade volume, P/L)

3. **Long-term Storage**
   - Prometheus retention policy ayarlama
   - Metrics backup stratejisi

4. **Advanced Alerting**
   - Machine learning based anomaly detection
   - Predictive alerts

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**Grafana Dashboard & Prometheus Alerts hazır! 📊**

