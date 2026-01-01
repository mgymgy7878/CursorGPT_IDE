# ROADMAP — 4 Sprint Planı (2 Ajanlı Sistem)

## Sprint 1 — Strategy IR + NL Compiler (MVP)

- [ ] `strategy.ir.schema.ts` (zod)
- [ ] Domain sözlüğü (indikator aliasları, eşanlamlılar)
- [ ] `POST /api/strategy/nl-compile` → `{ strategyIR, explain[] }`
- [ ] Studio kabuğu: NL input → IR editörü → explain paneli

## Sprint 2 — Backtest + Optimizer

- [ ] `POST /api/strategy/backtest`
- [ ] `POST /api/strategy/optimize` (grid + bayes/GA)
- [ ] Leaderboard + "best candidate"
- [ ] OOS/CV + erken durdurma

## Sprint 3 — Guardrails + Canary

- [ ] Param geçmişi + param-diff
- [ ] RiskScore policy (0–10)
- [ ] `POST /api/strategy/canary`:
  - PASS eşikleri: staleness<3s, ws_error_rate<1%, p95<800ms, Δmsgs_total≥1
- [ ] `POST /api/strategy/deploy` yalnızca PASS sonrası
- [ ] `/api/public/metrics.prom` (Prom text format) + panolar

## Sprint 4 — Runtime Orkestrasyon + WS Genişleme

- [ ] AI-1 orkestrasyon kuralları (Pause/Resume, staleness badge)
- [ ] BTCTurk Trades(422) + OrderBook(431/432)
- [ ] Yeni sayaçlar:
  - `spark_ws_btcturk_trades_total`
  - `spark_ws_btcturk_orderbook_updates_total`
- [ ] Canary & Health dashboard + audit kayıtları

---

## Definition of Done (DoD)

1. NL→IR→Backtest→Optimize→Canary→Deploy zinciri UI'dan < 1 dk akmalı
2. PASS olmadan deploy yok
3. Canary eşikleri UI'dan yönetilebilir
4. Metrikler JSON ve Prom text formatında erişilebilir
5. En az 5 örnek stratejide PASS + canlı akış doğrulaması

---

## Riskler / Önlemler

| Risk | Önlem |
|------|-------|
| NL yanlış anlama | Domain sözlüğü + örnek bankası + şema doğrulama |
| Overfitting | OOS/CV + canary throttle |
| Veri kaynağı stabilitesi | Auto-reconnect + backoff + circuit breaker |
| UI yükü | rafBatch, memoization, virtualization |
