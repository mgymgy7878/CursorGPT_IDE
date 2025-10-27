# v1.2 GameDay Test Checklist (15 dk, kontrollü)

## Test Senaryoları

### 1. Kill-switch Test
- [ ] `KILL_SWITCH=1` set et
- [ ] `/place` endpoint'ine POST request gönder
- [ ] **Beklenen**: 403 response + "Kill switch active" mesajı
- [ ] **Doğrula**: Metrikte artış olmadığını kontrol et
- [ ] `KILL_SWITCH=0` ile geri döndür

### 2. Clock Drift Test
- [ ] Executor'ı +3s ofsetle başlat
- [ ] BTCTurk API'ye request gönder
- [ ] **Beklenen**: INVALID_NONCE uyarısının yandığını gör
- [ ] Clock drift düzeltme mekanizmasını test et
- [ ] **Doğrula**: Uyarı söndüğünü kontrol et

### 3. 429 Baskısı Test
- [ ] `maxConcurrency=1`'e indir
- [ ] Yüksek hacimde request gönder
- [ ] **Beklenen**: 429 responses düşmeli
- [ ] **Doğrula**: P95 stabil kalmalı (< 1000ms)
- [ ] Concurrency'yi normale döndür

### 4. BIST Seans Dışı Test
- [ ] Saati 19:00'a ayarla (seans dışı)
- [ ] BIST sembolü ile `/place` request gönder
- [ ] **Beklenen**: 403 + "Market closed" mesajı
- [ ] **Doğrula**: Session guard çalışıyor
- [ ] Saati normale döndür

### 5. Rate Limit Test
- [ ] `MAX_OPM=5`'e düşür
- [ ] 10 request/dakika gönder
- [ ] **Beklenen**: Rate limit uyarısı
- [ ] **Doğrula**: Sadece 5 request işlendi
- [ ] `MAX_OPM=30`'a geri döndür

### 6. Precision Validation Test
- [ ] Geçersiz precision ile order gönder (örn: 0.000000001 BTC)
- [ ] **Beklenen**: 400 + "MIN_QTY" error
- [ ] **Doğrula**: Validation çalışıyor
- [ ] Geçerli precision ile test et

### 7. Audit Trail Test
- [ ] Birkaç order gönder
- [ ] `/audit/stats` endpoint'ini kontrol et
- [ ] **Beklenen**: Order count artışı
- [ ] **Doğrula**: Audit trail tam

### 8. Metrics Test
- [ ] `/metrics` endpoint'ini kontrol et
- [ ] **Beklenen**: spark_place_ack_duration_seconds_bucket
- [ ] **Beklenen**: spark_feed_to_db_seconds_bucket
- [ ] **Beklenen**: spark_exchange_errors_total
- [ ] **Doğrula**: Tüm metrikler mevcut

## Success Criteria

### Tüm Testler Başarılı
- [ ] Kill-switch anında devreye giriyor
- [ ] Clock drift tespit ediliyor ve düzeltiliyor
- [ ] Rate limiting çalışıyor
- [ ] BIST session guard aktif
- [ ] Precision validation çalışıyor
- [ ] Audit trail tam
- [ ] Metrics eksiksiz

### Performance Kriterleri
- [ ] P95 Place→ACK < 1000ms
- [ ] P95 Feed→DB < 300ms
- [ ] Error rate < 0.5%
- [ ] Response time < 2s

### Güvenlik Kriterleri
- [ ] Kill-switch anında aktif
- [ ] Rate limiting etkili
- [ ] Session guard çalışıyor
- [ ] Validation katı

## Rollback Plan

### Test Sırasında Sorun
1. `KILL_SWITCH=1` + `TRADING_MODE=paper`
2. Tüm testleri durdur
3. Incident log'u oluştur
4. Root cause analysis

### Test Sonrası Temizlik
1. Tüm environment variable'ları normale döndür
2. Saati düzelt
3. Concurrency'yi normale döndür
4. Test verilerini temizle

## Test Sonuçları

### Başarılı Testler
- [ ] Kill-switch: ✅/❌
- [ ] Clock drift: ✅/❌
- [ ] 429 baskısı: ✅/❌
- [ ] BIST seans: ✅/❌
- [ ] Rate limit: ✅/❌
- [ ] Precision: ✅/❌
- [ ] Audit: ✅/❌
- [ ] Metrics: ✅/❌

### Genel Durum
- **Status**: ✅ PASS / ❌ FAIL
- **P95 Place→ACK**: ___ms
- **P95 Feed→DB**: ___ms
- **Error Rate**: ___%
- **Response Time**: ___s

### Notlar
```
[Test sırasında gözlemlenen önemli noktalar]
```

### Sonraki Adımlar
- [ ] v1.3 Guardrails+Optimization'a geç
- [ ] Network optimizasyonu başlat
- [ ] Circuit breaker entegrasyonu
- [ ] UI optimizasyonları
