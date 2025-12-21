# FEATURES — Mevcut Özellikler (D1 + D2)

## 1) Web / Runtime

- Next.js 14 App Router
- `output: "standalone"`
- `not-found.tsx`, `error.tsx`, `global-error.tsx`
- ChunkLoadError toparlama (Error Boundary + guard yaklaşımı)
- SSR/CSR uyumlu, "deferred localStorage" yaklaşımı

## 2) Canlı Veri / WebSocket

### Binance WS
- WebSocket wrapper (auto-reconnect)
- Ticker stream

### BTCTurk WS
- TickerPair subscribe (151/402)
- pause/resume
- exponential backoff + jitter
- lastMessageTs + staleness ölçümü
- UI'da PauseToggle

## 3) State / Performans

- Zustand store: tickers, paused, lastMessageTs, staleness()
- rafBatch ile render throttling
- Memoization + virtualization hazırlığı

## 4) Observability (Temel)

### Counters
- `spark_ws_btcturk_msgs_total`
- `spark_ws_btcturk_reconnects_total`

### Gauges
- `spark_ws_staleness_seconds{pair}`

### Endpoint
- `/api/public/metrics` JSON snapshot / degrade

## 5) Operasyon / DX

- `.env.example` (BTCTurk/WS/Executor)
- Jest placeholder fix (test altyapısı çalışır)
- D1 audit PASS
- Smoke runner şablonları

## 6) UI (Golden Master çekirdeği)

### Shell
- Sol Sidebar (collapsed/expanded, icon-only mode)
- Sağ Rail (Copilot paneli, modern SparkAvatar)
- Handle'lar (pill form, centered)

### Dashboard
- 6 kart, 2 kolon düzen
- 1366x768 "scroll yok" hedefi
- Radial gradient background

### MarketData
- Tablo: Symbol, Name, Mini Grafik, Price, Change, Volume, RSI, Signal
- Sparkline (trend-aware coloring)
- Full chart route (query param ile)
- "Tam Ekran" / "Mini Grafik" toggle

### TopStatusBar
- Health indicators (API, WS, Executor, DEV)
- Metrics: P95, RT Delay, OrderBus
- Conditional CTA rendering (Dashboard'da minimal)

## 7) Planlanan (Backlog)

- BTCTurk Trades (422) + OrderBook (431/432)
- AI-1/AI-2 iki ajanlı mimari
- Canary deployment pipeline
- Prometheus text format export
