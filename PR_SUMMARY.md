# 🚀 Sprint Tamamlama: Strategy + Observability (GÜN 0-5)

## Özet

Bu PR 5 günlük sprint'in tüm özelliklerini içerir: Strategy Generator, Backtest SSE, Guardrails, Marketdata + Observability.

## 📋 Değişiklikler

### Commit 1 - Strategy + Backtest (SSE)
- **3-adımlı Strategy Wizard** + risk tabanlı AI öneriler
- **Mock API**: `/api/copilot/strategy/*` endpoints
- **SSE progress streaming** + canlı progress bar + metrik gösterimi
- SafeReferenceLine TypeScript fix (recharts v3 compatibility)
- CodeEditor wizard entegrasyonu

### Commit 2 - Guardrails + Metrics
- **Executor**: `/guardrails` GET/POST (in-memory state)
- **Prometheus**: `guardrails_kill_switch_state`, `backtest_job_duration_seconds`
- **UI**: Guardrails Panel + observability cards
- Max exposure % validation (0-100)

### Commit 3 - Marketdata + Health
- **BTCTurk RO ws client**: `ws_staleness_seconds`, `ticks_total`
- **MarketsHealthWidget**: yeşil/amber/kırmızı eşikleri (<2s/2-10s/>10s)
- Basit Prometheus parser
- Observability sayfası

## 🧪 Test Adımları

### Servisleri Başlat
```bash
# Terminal 1 - Marketdata
pnpm --filter services/marketdata dev

# Terminal 2 - Executor  
pnpm --filter @spark/executor dev

# Terminal 3 - Web
pnpm --filter web-next dev
```

### Metrikleri Kontrol Et
```bash
# Marketdata
curl http://127.0.0.1:5001/metrics | findstr "ws_staleness_seconds\|ticks_total"

# Executor
curl http://127.0.0.1:4001/metrics | findstr "guardrails_kill_switch_state\|backtest_job_duration"
```

### UI Akışları
1. `/observability` → P95 & WS staleness & Kill Switch kartları görünür
2. `/guardrails` → Kill Switch toggle; metrik 0/1 değişir
3. `/strategy-studio` → Wizard → Generate → CodeEditor dolar → Run Backtest → SSE ilerleme

## ✅ Kabul Kriterleri

- ✅ 30 sn'de `ticks_total{source="BTCTURK"}` en az +10 artış (PASS)
- ✅ Focus'ta `ws_staleness_seconds < 2s`, background'da >2s (PASS)
- ✅ `guardrails_kill_switch_state` toggle ile 0↔1 (PASS)
- ✅ UI kartları klavye ile erişilebilir ve AA kontrastında (PASS)
- ✅ 0 TypeScript error; build PASS (PASS)

## 🧯 Rollback Planı

1. **UI flag**: `NEXT_PUBLIC_MARKETS_HEALTH=0` → health widget gizle
2. **Server**: `startBTCTurk()` çağrısını yorum satırı yap → WS durur
3. **Guardrails**: panel kapatılsa bile backend varsayılan "off/0%" kalır

## 📊 Ekran Görüntüleri

- Strategy Studio → Generate Strategy wizard
- Backtest → SSE progress bar
- Guardrails → Kill Switch toggle
- Observability → 3 metrik kartı
- Markets Health → BTCTURK dot

## 🔜 Sonraki Adımlar

- BTCTurk reconnect/backoff + jitter (dayanıklılık)
- Symbol filter + rate-limit (verimlilik)
- Report JSON export (backtest çıktısı → shareable)
- Guardrails policy.json (in-memory → dosya/kv)

## Etiketler

`feature`, `observability`, `strategy`, `guardrails`, `marketdata`

---

**Test eden**: Bot
**Reviewer**: @mgymgy7878
**Merge method**: Squash and merge (3 commit mesajı korunur)

