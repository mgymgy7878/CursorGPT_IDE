# FEATURES — Mevcut Yetenekler ve Planlanan Geliştirmeler

## 1) Mevcut (Özet)
- Monorepo (pnpm), Next.js UI (web-next), servis tabanlı yapı
- Canary / evidence yaklaşımı ve sağlık kontrolleri
- /api/public/metrics (JSON) altyapısı + smoke/audit şablonları (varsa)
- İki ajanlı hedef mimari temelleri:
  - AI-1 Operasyon/Süpervizör: orkestrasyon, guardrails, canary, pause/resume
  - AI-2 Strateji-Üretici: NL→IR, backtest, optimize, açıklama/hata düzeltme

## 2) Kısa Liste Açık Eksikler
- NL→IR derleyici (domain sözlüğü + şema doğrulama)
- Backtest/optimizer (grid + bayes/GA), leaderboard
- Guardrails genişletme (param-diff geçmişi, riskScore policy)
- Canary runner'ın parametreli hale gelmesi (PASS eşiği UI'dan yönetim)
- Prometheus metin endpoint + Grafana panoları
- WS ek kanallar: Trades (422), OrderBook (431/432) + sayaçlar
- Studio UI: NL girişi → IR editörü → explain → backtest/optimize → canary → deploy

## 3) Dokümantasyon Haritası
- ROADMAP: `docs/ROADMAP.md`
- Metrics/Canary: `docs/METRICS_CANARY.md`
- UI/UX: `docs/UI_UX_PLAN.md`
