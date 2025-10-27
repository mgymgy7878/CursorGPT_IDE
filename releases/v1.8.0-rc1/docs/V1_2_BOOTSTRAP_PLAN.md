# v1.2 Bootstrap Plan - BTCTurk Spot + BIST Reader

## Hedefler (2 hafta)

### BTCTurk Spot Entegrasyonu
- REST+WS client iskeleti (auth, rate-limit, keepalive, clock-drift düzeltmesi)
- Sembol eşleme (unified @spark/symbols), lot/minNotional guard
- Rate-limit/circuit breaker @spark/guardrails ile

### BIST Reader
- Feed adaptörü, latency & gap metrikleri
- Canary + health panelleri (feed_up, ws_reconnects_total, event_to_db_ms p95)

## Deliverable'lar

### Paketler
- `@spark/exchange-btcturk`: BTCTurk REST+WS client
- `@spark/market-bist`: BIST reader + parser

### Servis
- `services/marketdata`: Feed orchestrator + health endpoints
  - `/feeds/health`
  - `/feeds/canary`

### Metrikler
- `feed_events_total{source}`
- `ws_reconnects_total{source}`
- `feed_latency_ms{source}`
- `event_to_db_ms` histogram

### Canary
- `/canary/feeds?dry=true` (BTCTurk/BIST reachability + schema probe)

### Runbook
- `docs/FEEDS_RUNBOOK.md`

## Acceptance Criteria

- BTCTurk WS 24h stabil, reconnect < 3 deneme ortalaması, clock drift < 200ms
- BIST feed p95 < 1.5s; gap tespiti alarmı aktif
- `/metrics` sözleşmesi ihlalsiz; CI contract PASS

## Teknik Detaylar

- Tek metrik modülü, sabit labelNames, @metrics alias
- Rate-limit/circuit breaker @spark/guardrails ile
- No emoji in scripts (PowerShell uyumu)

## Smoke Test

- `GET /feeds/canary?dry=true` → `{ok:true}`
- `/metrics` → feed_* metrikleri görünüyor

## Regression Matrix

- Executor `/metrics` sözleşmesi ihlalsiz
- Canary ve health endpoint'leri 200 OK
- WS reconnect ve latency sayaçları artıyor

## Cursor Komutu (Bootstrap)

```bash
# PATCH PLAN (v1.2 bootstrap)
# 1) packages/@spark/exchange-btcturk: REST+WS client iskeleti
# 2) packages/@spark/market-bist: reader iskeleti + placeholder parser
# 3) services/marketdata: feed orchestrator + health endpoints
# 4) metrics: feed_* aileleri
# 5) CI: feeds-smoke, metrics-contract extend
# 6) Docs: FEEDS_RUNBOOK.md + DEPLOYMENT_GUIDE.md
```

## Sonuç

Release kapanışı yapılabilir (evidence PR'a iliştir, tag'i işaretle).
v1.2 giriş biletleri hazır; Cursor komutu tek seferde bootstrap eder.
Metrik katmanı artık "tekrar edilemez" sınıfında; bundan sonrası feed'ler ve guardrails.
