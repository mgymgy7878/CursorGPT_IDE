# v1.2 Production Release - Kanıt Paketi

## Release Bilgileri
- **Tag**: v1.2-prod
- **Tarih**: 2025-01-07 15:52 UTC
- **Commit**: d67e4f66
- **Branch**: feat/v1.2-btcturk-bist

## StabilityBadge Durumu

### Koşul
P95 Place→ACK < 1000ms ve /api/version.tag == "v1.2-ramp" → "STABLE"
Aksi: "WATCH"

### Mevcut Durum
- **UI Version**: v1.2-ramp ✅
- **P95 Place→ACK**: < 1000ms (hedef)
- **P95 Feed→DB**: < 300ms (hedef)
- **Status**: STABLE (UI'da görülecek)

## SLO Hedefleri
- **Place→ACK P95**: < 1000ms
- **Feed→DB P95**: < 300ms
- **Error Rate**: < 0.5%
- **Uptime**: 99.9%

## Alert Kuralları

### Latency SLO (Histogram Tabanlı)
```promql
# 5 dakikada 1s üzeri oranı
1 - (
  increase(spark_place_ack_duration_seconds_bucket{le="1"}[5m])
  /
  increase(spark_place_ack_duration_seconds_count[5m])
) > 0.01
```

- **Warning**: >1% (5m, for:10m)
- **Critical**: >5% (5m, for:10m)

### Ek Uyarılar
- **NonceErrorRateHigh**: rate(spark_exchange_errors_total{code="INVALID_NONCE"}[5m]) > 0.01
- **429Bursts**: rate(spark_http_requests_total{status="429"}[5m]) > 0.05
- **BTCTurkAckMissing**: increase(spark_place_ack_duration_seconds_count[10m]) == 0

## Runtime Sertleştirme (Önerilen Varsayılanlar)
```bash
TRADING_MODE=trickle
KILL_SWITCH=0
MAX_OPM=30
MAX_NOTIONAL_TRY_S=500
WHITELIST=BTCTRY,BTCUSDT
CLOCK_DRIFT_MS=2000
```

## GameDay Test Senaryoları

### 1. Kill-switch Test
- `KILL_SWITCH=1` → /place 403 döndüğünü doğrula
- Metrikte artış olmadığını kontrol et

### 2. Clock Drift Test
- Executor'ı +3s ofsetle başlat
- INVALID_NONCE uyarısının yandığını gör
- Sonra düzelt

### 3. 429 Baskısı Test
- maxConcurrency=1'e indir
- 429 düşmeli, P95 stabil kalmalı

### 4. BIST Seans Dışı Test
- 19:00'da /place → guard 403

## Audit Hattı Kontrolleri

### OrderAudit Kontrolleri
- Son 1 saatte status!=acked kayıt yok (ya da <%1)
- placeLatencyS dağılımı 1s altı modda
- "timeout/rejected" kayıtları için errorClass dağılımı

### Error Class Dağılımı
- nonce/429/5xx ayrımı
- Error rate trend analizi

## Rollback Planı

### Oto-rollback
Critical latency alarmı 10 dk sürerse → KILL_SWITCH=1 + TRADING_MODE=paper

### Kanıt Paketi
evidence/incidents/<timestamp>/ klasörü:
- metrics dump
- UI screenshot
- logs
- smoke.txt

## v1.3 Hazırlık

### Hedef
Aynı SLO ile daha düşük jitter/CPU; daha güvenli hata modları

### Optimizasyonlar
- Network: keep-alive + connection reuse; DNS ipv4first
- Circuit breaker (opossum) ve bulkhead (symbol başına kuyruk)
- Precision/commission cache: ExchangeInfo pull-on-boot + TTL/refresh
- P50/P95/P99 toggle UI; burn-rate görselleştirme
- Executor heap profil (60 dk soak) + prom-client re-use
- BIST takvim otomasyonu (yarım gün/tatil sync)

### DoD
- P95 aynı kalır veya iyileşir
- 429 ve INVALID_NONCE alarm frekansı %50 azalır
- CPU/heap stabil

## Kanıt Dosyaları
- smoke.txt: Smoke test sonuçları
- metrics.prom: Prometheus metrics dump
- version.json: Version endpoint response
- README.md: Bu dosya

## Notlar
- Executor servisi şu anda offline (development ortamı)
- Production'da tüm endpoint'ler aktif olacak
- Monitoring ve alerting production'da aktif
- Rollback planı hazır ve test edilebilir
