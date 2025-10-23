## FEATURES — Mevcut Özellikler

### Web/Runtime
- Next.js 14 App Router, `output: "standalone"`; error/not-found sayfaları; ChunkLoadError guard.

### Canlı Veri / WS
- Binance wrapper (auto-reconnect)
- BTCTurk WS: 151/402 TickerPair; pause/resume; exponential backoff+jitter; `lastMessageTs`, staleness ölçümü.

### Durum Yönetimi
- Zustand store (tickers, paused, lastMessageTs, staleness) + `rafBatch`.

### Gözlemlenebilirlik
- Sayaçlar: `spark_ws_btcturk_msgs_total`, `spark_ws_btcturk_reconnects_total`
- Gauge: `spark_ws_staleness_seconds`
- `/api/public/metrics` JSON; Prom format uç için alt yapı.

### Yapı/İşletim
- `.env.example`; Jest placeholder; D1 audit PASS.
