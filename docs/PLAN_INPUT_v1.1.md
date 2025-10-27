# PLAN GİRDİSİ — v1.1

Aşağıdaki içerik, projede her iterasyonda başvurulacak referans plandır.

---

PLAN ÖZETİ:
Mevcut Next.js 14 + TS projesini küçük adımlarla çekirdek paketlere ayırıp (shared/engine/backtester/agents/connectors/ui), Frontend’i apps/web-next olarak konumlandırıyoruz. Backtest akışını tek kaynaktan tipler ile sadeleştiriyor, /api/strategy/backtest ve /api/logs/sse ile gerçek zamanlı ilerleme akışını devreye alıyoruz. BacktestChart ilk render optimizasyonu (yapıldı) üzerine büyük veri seti (10k+ bar) için decimation + kademeli hydrasyon ekliyoruz. Kısa vadede LLM adaptörü “dummy”, ama arayüz ve API sözleşmesi üretim kalitesinde.

KAPSAM:

Monorepo yapılandırması (npm workspaces): apps/web-next + packages/*

packages/shared: tipler, eventler, logger (tek doğruluk kaynağı)

packages/engine: IStrategy, StrategyContext, Risk Guards, Registry

packages/backtester: bar replayer, metrikler, Trade/BacktestResult

packages/agents: AI Manager FSM + LLMClient arayüzü (dummy provider)

packages/connectors: ExchangeAdapter + Binance placeholder

packages/ui: design tokens (CSS vars) + temel primitifler

Next API rotaları: /api/strategy/{generate,compile,lint,backtest,optimize}, /api/market-data, /api/portfolio, /api/supervisor/{toggle,stats,config}, /api/logs/sse

BacktestChart performans: decimate→draw→idle’da hydrate, ilk render’da setData+setMarkers+fitContent (zaten yapıldı), temiz cleanup (zaten yapıldı)

ÖNCELİKLER:

Tek tip modeli packages/shared’e taşımak (UI, API, servis aynı tipleri kullansın).

/api/strategy/backtest + /api/logs/sse çalışan MVP (bar fixture ile).

BacktestChart büyük veri performansı: decimation (≈5k puan) + kademeli hydrasyon.

Zustand slice’ları (strategy/backtest/portfolio/ui) ve typed istek/yanıt sözleşmesi.

Güvenlik: env anahtarları sadece server; istemciye sızma yok.

BAŞARI KRİTERLERİ:

npm run dev -w apps/web-next hatasız başlar; tsc --noEmit temiz.

POST /api/strategy/backtest → { success: true, data: BacktestResult } (1k ve 10k bar)

/api/logs/sse 1 sn’de bir heartbeat ve backtest progress event’leri yayınlar.

BacktestChart ilk yüklemede fiyat + equity + marker’lar görünür; boş kare yok.

10k bar’da ilk çizim < 250ms main thread block, progressive hydrate ile tam veri.

Unmount sonrası ResizeObserver/interval leak yok (Performance tab’da sızıntı yok).

RİSKLER/BAĞIMLILIKLAR:

lightweight-charts sürüm farkları (v5 API) → guard’lar.

SSR sınırları, CPU ağır backtest’in API worker’lara ihtiyacı → ileride worker_threads.

Overfitting: optimize fonksiyonu out‑of‑sample/Walk‑Forward gerektirir (gelecek sprint).

Zaman dilimi/DST uyumsuzluğu → bar normalizasyonu (gelecek sprint).

BUGÜNÜN HEDEFİ:

Monorepo çatısı + packages/* minimal içerik + apps/web-next’e geçiş.

/api/strategy/backtest (stub bars) ve /api/logs/sse (heartbeat) çalışır.

BacktestChart’a decimation + idle hydrate muhafazakar ekleme.

Zustand store’larda typed akış (request→loading→result→error).

ÖNCELİKLİ YAPILACAKLAR (atomik)
Monorepo & Paketler

Kök package.json: workspaces = ["apps/*","packages/*"], tsconfig.base.json.

packages/shared: types.ts (Bar, Tick, Order, Position, PortfolioSnapshot, BacktestParams, BacktestResult, Trade, Metrics), events.ts, logger.ts, index.ts.

packages/engine: strategy.ts (IStrategy, StrategyContext, StrategyMeta), risk.ts (CircuitBreaker, MaxDrawdownGuard), registry.ts, execution.ts, index.ts.

packages/backtester: backtest.ts (runBacktest), result.ts, index.ts.

packages/agents: llm.ts (LLMClient interface + dummy), prompts.ts (TR), aiManager.ts (FSM), index.ts.

packages/connectors: adapter.ts (ExchangeAdapter), binance.ts placeholder, index.ts.

packages/ui: styles/tokens.css, styles/primitives.css (+ README).

Next App Taşıma & Bağlama

Mevcut Next projesini apps/web-next altına taşı.

Global stil: packages/ui token/primitives import et.

@/* alias’ı korunur ama paylaşılan tipler @spark/shared (ör.) üzerinden gelsin.

API Rotaları (MVP)

POST /api/strategy/backtest: BacktestParams al, fixture bar üret, runBacktest çağır, { success, data } döndür.

GET /api/portfolio: sabit PortfolioSnapshot döndür (stub).

GET /api/market-data: placeholder (param doğrulama + boş dizi).

POST /api/supervisor/toggle + GET /api/supervisor/{stats,config}: FSM’den okuma/yazma.

GET /api/logs/sse: SSE stream (heartbeat + dummy progress).

BacktestChart Performans

Eğer points > 10000 → decimate (ör. her n’inci bar veya VWAP downsample) ile ~5k noktayı anında çiz.

requestIdleCallback (yoksa setTimeout) ile tam veri hydrate + setVisibleRange ertele.

İlk mount’ta mevcut fix’ler kalır (setData, setMarkers, fitContent).

Unmount’ta chart/remove + observer disconnect + ref null zorunlu (zaten var).

Zustand & UI Akışı

stores/useBacktestStore.ts: params, status, result, error; selector’lar.

components/PerformanceCards.tsx: PnL, MDD, WinRate, Sharpe (BacktestResult’tan).

Hata/başarı banner’ları; loading skeleton.

Doğrulama Komutları:

npx tsc -p tsconfig.json --noEmit

npm run build -w apps/web-next

curl -X POST http://localhost:3000/api/strategy/backtest -d '{...}' (örnek payload)

Chrome Performance: ilk render süresi, unmount leak kontrolü.

Son notlar
İlk etapta dummy sağlayıcılarla akışı uçtan uca çalıştır; gerçek borsa/veri adaptörlerini ikinci sprintte bağla.

10k+ bar hedefinde ~250ms blok makul; daha agresif hedef istiyorsan progressive line series update’i iki adımda yapalım.

Overfitting’e karşı out‑of‑sample ve walk‑forward’ı optimization rotasına ekleyelim (v1.2). 