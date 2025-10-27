# PLAN GİRDİSİ — v1.2

Bu sürüm, bağımsız (standalone) AI Trading uygulaması için çekirdek mimari, kapsam, sprint ve MVP planını tanımlar. v1.1’in üzerine aşağıdaki başlıklarla güncellenmiştir.

---

## 0) Net Hedef ve Kısıtlar
- Hedef: Tüm piyasalardan (kripto, BIST vadeli/pay, FX, emtia) veri toplayıp normalize eden; AI destekli strateji üreten; backtest + optimizasyon yapan; rejime göre strateji seçip emir icra eden; rapor/tahmin üreten bağımsız AI Trading uygulaması.
- Non‑Goals: Kapalı kutu platformlara doğrudan entegrasyon (örn. Matriks IQ), kapsam dışı kozmetik UI.
- Opsiyonel Gelecek: Generic Webhook/REST Adapter ile harici platform köprüsü (talebe bağlı).

## 1) Sistem Haritası (Katmanlar)
- Data Layer
  - Connectors: Binance, OKX, Bybit, (BIST lisanslı sağlayıcılar), FX/emtia, Haber/Sentiment
  - Normalizer: Candle/Tick/News/OrderBook tek şemaya dönüşüm (timestamp, symbol, exchange, TF standardı)
- Strategy Layer
  - StrategyAI: Girdi → DSL + TypeScript strateji modülü üretimi
  - BacktestEngine + Optimizer: Grid/Random/Bayes; walk‑forward/out‑of‑sample destekleri
- Execution Layer
  - BrokerAdapters: Bybit/OKX/Binance (REST/WS)
  - Paper Engine: Simülasyon
  - Generic Webhook/REST Adapter (opsiyonel)
  - RiskManager: SL/TP/Trailing, pozisyon boyutu, kaldıraç sınırları
- SupervisorAgent (Ajan)
  - Rejim tespiti (trend/mean/side/volatilite), uygun stratejiyi seç/başlat/durdur
  - Portföy tahsisi, çoklu sembol görev yönetimi
- Reporting
  - Periyot bazlı özetler; uyarı/alert; yön olasılığı

## 2) Sözleşmeler (TypeScript Arayüzleri)
- Kaynak: `packages/shared/src/core-types.ts` (tek doğruluk noktası; `@spark/shared` üzerinden re-export)
- Başlıca tipler: `Exchange`, `Timeframe`, `Candle`, `MarketSpec`, `StrategyParams`, `Signal`, `StrategyContext`, `StrategyModule`, `Order`, `BrokerAdapter`, `ExecutionResult`

## 3) Stratejiler ve DSL
- DSL: `packages/strategy-dsl/src/dsl.ts` — örnek TrendFollower konfigürasyonu
- Strateji örnekleri: `packages/strategies/src/trendFollower.ts`, `packages/strategies/src/gridBot.ts`

## 4) Backtest & Optimizer
- Motor: `packages/backtester/src/engine.ts` — `runBacktest`, `optimize`
- Kıstaslar: Net PnL (ileride Sharpe/MaxDD/PF ile kombine)

## 5) Rejim Tespiti & Strateji Seçici
- `packages/agents/src/regime.ts` — vol/slope tabanlı rejim; `chooseStrategy`

## 6) Bağlayıcılar
- BrokerAdapters: Binance/OKX/Bybit (REST/WS)
- WebhookAdapter (opsiyonel): `packages/connectors/src/webhook.ts`

## 7) API Uçları (Next.js app router)
- `apps/web-next/app/api/strategy/{generate,backtest,optimize}/route.ts`
- `apps/web-next/app/api/execute/{start,stop}/route.ts`

## 8) Router Konsolidasyonu (hedef: app router)
- Sıra: Sprint‑1 (health/metrics/kök UI) → Sprint‑2 (strategy, logs/sse) → Sprint‑3 (broker/supervisor)
- Kriter: Her taşımada Typecheck/Build + Smoke + Prom scrape yeşil
- Rollback: Her sprint başında git tag

## 9) Güvenlik Notları
- `apps/web-next/middleware.ts`: Edge Runtime uyumu için `jsonwebtoken` yerine `jose` önerilir veya doğrulama route handler’a taşınır
- Dev: `x-dev-role` ile bypass; Prod: cookie + Bearer; aud/iss/clockTolerance ayarı

## 10) Observability
- Prometheus endpoint: `/api/metrics/prom`
- Grafana dashboard: `ops/grafana/dashboards/spark-core.json` (uptime, delay EMA, publish/skip ratio, broker latency)
- Alertmanager kuralları (opsiyonel): `ops/prometheus/alerts.yml`

## 11) Cleanup (Güvenli)
- Yalnızca plan ve doğrulama adımlarına göre; otomatik silme yok
- Hedef klasörler: `components/components`, `contexts/contexts`, `docs/docs`, `lib/lib`, `__tests__/__tests__`, `apps/web-next/apps/web-next`
- Dry‑run script: `scripts/clean/dry-run-cleanup.(sh|ps1)` — rapor üretir, silmez

## 12) 7 Günlük MVP Planı
- Gün 1–2: Core types, StrategyModule (TrendFollower, GridBot), BacktestEngine (basit), Rejim tespiti
- Gün 3: Optimizer + parametre uzayı; örnek veriyle uçtan uca (local candles)
- Gün 4: BrokerAdapters + Paper Engine + (ops) WebhookAdapter iskeleti
- Gün 5: API uçları (generate/backtest/optimize/execute) + minimal UI tetikleyiciler
- Gün 6: SupervisorAgent akışı (seç, başlat, durdur, risk kuralları)
- Gün 7: Rapor & tahmin çıktıları + smoke testler + dokümantasyon

## 13) Riskler ve Test
- Veri uyumu: Normalizer zorunlu; TZ/precision/ölçüm birimleri tekilleştirme
- Overfitting: Walk‑forward/out‑of‑sample; rolling pencereler
- Emir güvenliği: Önce paper; rate‑limit, retry/backoff, idempotency key
- Testler: Typecheck/Build; unit (engine/regime); E2E smoke (health/metrics/home, SSE)

## 14) Başarı Kriterleri
- `npm --prefix apps/web-next run dev` hatasız; `tsc --noEmit` temiz
- `/api/strategy/backtest` ve `/api/logs/sse` çalışır; Grafana panelleri veri gösterir
- Router göç adımlarında smoke ve prom scrape sürekli yeşil 