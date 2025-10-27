# Day-1 Gözetim Checklist

## 24 Saatlik İzleme (v1.1-canary)

### Her 5 Dakika
- [ ] `/dashboard` görüntü al (P95 kartı görünür mü?)
- [ ] `/api/executor/metrics/p95` JSON yanıtı kontrol et
- [ ] P95 değeri < 1000ms hedefinde mi?

### Her Saat
- [ ] PromQL çıktı ekran görüntüsü:
  - P95: `histogram_quantile(0.95, sum by (le) (rate(spark_place_ack_duration_seconds_bucket[5m])))`
  - Örnek sayısı: `spark_place_ack_duration_seconds_count`
  - Toplam: `spark_place_ack_duration_seconds_sum`

### Günlük
- [ ] `pnpm ci:verify` (günün başı/sonu)
- [ ] Kanıt klasörü güncelle:
  - `smoke.txt` - smoke test çıktısı
  - `metrics.prom` - Prometheus metrics dump
  - `dashboard.png` - dashboard ekran görüntüsü
  - `ci.txt` - CI verify çıktısı

## Alarm Eşikleri
- **Warning**: P95 > 1200ms (10 dakika)
- **Critical**: P95 > 2000ms (5 dakika)
- **Executor Down**: 1 dakika

## Kapanış Raporu Şablonu

```
Özet: "P95 hedef <1000ms; gözlenen ~<X>ms; hata oranı <%Y"

Kanıt: 4 artefakt + commit/tag

Karar: "v1.1 Canary → Stable / İzleme sürsün / Müdahale gerekiyor"
```

## v1.2 Hazırlık
- [ ] BTCTurk Spot REST entegrasyonu
- [ ] BIST Feed normalizasyonu
- [ ] Gerçek Place→ACK ölçümü (paper → live)
- [ ] Kill-switch ve guardrails
