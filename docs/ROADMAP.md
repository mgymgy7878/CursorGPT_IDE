# ROADMAP — 4 Sprint Planı

## Sprint 1 — Strategy IR + NL Compiler (MVP)
- `strategy.ir.schema.ts` (zod), domain sözlüğü
- `POST /api/strategy/nl-compile` → `{ strategyIR, explain[] }`
- Studio: NL input → IR editörü → explain paneli

## Sprint 2 — Backtest + Optimizer
- `POST /api/strategy/backtest`, `POST /api/strategy/optimize`
- Metrikler: PnL, Sharpe, MaxDD, WinRate; grid + bayes; leaderboard
- OOS/CV ve erken durdurma

## Sprint 3 — Guardrails + Canary
- paramDiff geçmişi, riskScore policy
- `POST /api/strategy/canary` (PASS eşiği: staleness<3s, ws_error_rate<1%, p95<800ms, Δmsgs_total≥1)
- `POST /api/strategy/deploy` (yalnızca PASS sonrası)
- Prometheus metin endpoint (`/api/public/metrics.prom`) + panolar

## Sprint 4 — Runtime Orkestrasyon + WS Genişleme
- AI-1 entegrasyonu; Pause/Resume kuralları, staleness badge
- BTCTurk Trades(422) + OrderBook(431/432), sayaçlar
- Canary & Health dashboard, audit kayıtları

## Definition of Done (DoD)
- NL→IR→Backtest→Optimize→Canary→Deploy zinciri < 1 dk akmalı
- PASS olmadan deploy yok
- Canary PASS metrikleri UI'dan değiştirilebilir
- WS: ticker+trades+orderbook; pause/resume görünür etkiler
- Metrikler `/api/public/metrics` (JSON) ve `.prom` formatından erişilebilir
