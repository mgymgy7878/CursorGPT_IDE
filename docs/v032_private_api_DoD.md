# v0.3.2 Private API - Definition of Done (DoD)

## Sprint Hedefleri (5-6 gün)

### 1. Auth & İmza Sistemi
- [ ] HMAC-SHA256 implementasyonu
- [ ] Timestamp drift kontrolü (±2s tolerans)
- [ ] RecvWindow desteği
- [ ] Nonce/idempotency kontrolü
- [ ] Clock sync uyarısı (drift > 2s)

### 2. Read-only Endpoint'ler
- [ ] `/api/private/health` → `{ ok: true, exchange: "binance" }`
- [ ] `/api/private/account` → bakiye objesi
- [ ] `/api/private/openOrders` → `[]` | `[...]`
- [ ] `/api/private/trades` → execution history

### 3. Adapter Katmanı
- [ ] `@spark/exchange-private/binance` paketi
- [ ] Rate-limit + retry mekanizması
- [ ] Clock-skew düzeltmesi
- [ ] Error handling (429, 401, 403)

### 4. Proxy & UI
- [ ] Next.js rewrites konfigürasyonu
- [ ] Control panel → "Private API status" rozeti
- [ ] Error state gösterimi
- [ ] Loading state'leri

### 5. Smoke Test & Kanıtlar
- [ ] Tek komutla çalışan test script'i
- [ ] HTTP 200 + örnek response body
- [ ] Metrics sayacı doğrulaması
- [ ] CI/CD entegrasyonu

## Kabul Kriterleri (DoD)

### ✅ Teknik Kriterler
- [ ] 3 endpoint 200 OK dönüyor
- [ ] İmza hatası yok (HMAC validation PASS)
- [ ] 429'da otomatik backoff çalışıyor
- [ ] `gitleaks` / `structure guard` PASS
- [ ] Prometheus metrikleri aktif:
  - `spark_private_calls_total{status}`
  - `spark_private_latency_ms_bucket`
  - `spark_private_errors_total{type}`

### ✅ Güvenlik Kriterler
- [ ] Kill-switch env: `LIVE_ENABLED=false` (varsayılan)
- [ ] Key scope: testnet anahtarları, read-only
- [ ] Clock sync: ±2s tolerans
- [ ] Drift > 2s ⇒ auto-NTP uyarısı (metric + log)

### ✅ Operasyonel Kriterler
- [ ] Smoke test script'i çalışıyor
- [ ] UI'de status rozeti görünüyor
- [ ] Error handling test edildi
- [ ] Rate limiting test edildi

## Risk Guard'lar

### Kill-switch
```bash
# .env.local
LIVE_ENABLED=false  # varsayılan
EXCHANGE_MODE=binance
TRADE_MODE=paper
BINANCE_API_KEY=...  # testnet
BINANCE_API_SECRET=...  # testnet
```

### Key Scope
- Sadece testnet API key'leri
- Read-only ilk iterasyon
- Production key'ler asla kullanılmaz

### Clock Sync
- ±2s tolerans
- Drift > 2s ⇒ auto-NTP uyarısı
- Metric: `spark_clock_drift_seconds`

## Test Senaryoları

### Smoke Test
```bash
# Test script'i
curl -X GET "http://localhost:3003/api/private/health" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Key: $API_KEY"

# Beklenen response
{
  "ok": true,
  "exchange": "binance",
  "timestamp": "2025-08-12T10:00:00Z"
}
```

### Error Handling
- [ ] Invalid signature → 401
- [ ] Expired timestamp → 401
- [ ] Rate limit → 429 + retry
- [ ] Network error → 500 + retry

### Metrics Validation
```bash
# Prometheus query
spark_private_calls_total{status="success"}
spark_private_latency_ms_bucket{le="100"}
spark_private_errors_total{type="auth"}
```

## Sonraki Adımlar

### Testnet Order Flow (3 gün)
- [ ] `/api/private/order` (create/cancel)
- [ ] `TRADE_MODE=paper|live_testnet` toggle
- [ ] Maker/taker fee muhasebesi
- [ ] Kabul: 20 sipariş/10 iptal "no P0"
- [ ] `spark_order_rejects_total=0`

### Risk & Observability (4+1 gün)
- [ ] Max exposure/drawdown limitleri
- [ ] Circuit-breaker implementasyonu
- [ ] One-click kill switch
- [ ] Alerting: 500/429 oranı, latency p95
- [ ] "Go/No-Go" kapısı checklist'i

## Canary Protokolü (48 saat)

### Nominal
- Tek sembolde çok küçük tutar
- Sadece market order
- `LIVE_ENABLED=true` (manuel)

### Başarı Kriteri
- P0/P1 = 0
- MTTR < 15 dk
- Hata bütçesi içinde

### Çıkış
- 7 gün soak test
- Review
- Kademeli ramp-up

## Zaman Çizgisi

- **T0…T+6g**: Private API (read-only) ✅
- **T+7…T+9g**: Testnet order flow ✅
- **T+10…T+14g**: Risk + observability ✅
- **T+15…T+16g**: Buffer/Dry-run
- **T+17…T+18g**: Canary (48s) → 3 Eyl 2025 başlangıç
- **T+19…T+25g**: 7g soak → Go/No-Go → ramp-up 