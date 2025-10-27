## Exchange Integration Spec (0→1)

### Kapsam (İlk Etap)

- Binance.com: Spot + Futures (USDT/coin-margined)
- Binance TR: Spot
- BTCTurk: Kripto Spot
- BIST: Hisse (EQUITY) + VİOP (futures) — broker-agnostic (FIX/REST/WS)

Not: BIST canlı veri/işlem lisans ve kurum entegrasyonu gerektirir; adapter katmanı hazır, anahtarlar ile aktive edilir.

### Mimari ve Klasörler

```
packages/
  exchange-core/                 # ortak tipler + adapter interface + symbol/precision utils
  exchange-adapters/
    binance/                     # REST + WS, spot & futures
    binance-tr/                  # REST + WS, spot
    btcturk/                     # REST + WS, spot (mevcut)
    btcturk-hisse/               # WS/mock veri; trade hazır iskelet
    bist/                        # broker-agnostic: FIX/REST/WS köprüleri
apps/
  executor/                      # emir yöneticisi (routing, risk, throttle)
  web-next/
    lib/api/                     # edge/api route proxy’leri
    stores/                      # Zustand store’ları (market/portfolio/health)
    app/
      dashboard/                 # Bir bakışta + Copilot
      markets/                   # Piyasa görünümü (çoklu borsa)
      strategies/                # Stratejilerim
      lab/                       # Strateji Lab (AI editor/sim)
      portfolio/                 # Portföy yönetimi
      settings/                  # Ayarlar
      bist/                      # BIST (BTCTurk Hisse) sayfası
```

### Adapter Interface (Özet)

```ts
export type Side = "buy" | "sell";
export type MarketType = "spot" | "futures" | "equity";
export interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  ts: number;
}

export interface ExchangeAdapter {
  id: "binance" | "binance-tr" | "btcturk" | "btcturk-hisse" | "bist";
  markets: MarketType[];
  // Data
  streamTicker(symbol: string, cb: (t: Ticker) => void): () => void; // WS öncelik, polling fallback
  // Trading
  placeOrder(p: {
    symbol: string;
    side: Side;
    qty: number;
    price?: number;
    type: "limit" | "market";
  }): Promise<{ id: string }>;
  cancelOrder(id: string, symbol: string): Promise<void>;
  fetchOpenOrders(symbol?: string): Promise<any[]>;
  fetchPositions?(): Promise<any[]>; // futures için
}
```

### ENV / Secrets

```ini
# Genel
NEXT_PUBLIC_MARKET_DEFAULT=BTCTRY
NEXT_PUBLIC_WS_ENABLED=true
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3003/api/ws/btcturk

# Binance.com
BINANCE_API_KEY=...
BINANCE_API_SECRET=...

# Binance TR
BINANCE_TR_API_KEY=...
BINANCE_TR_API_SECRET=...

# BTCTurk
BTCTURK_API_KEY=...
BTCTURK_API_SECRET=...

# BTCTurk Hisse (BIST veri köprüsü)
BTCTURK_HISSE_API_KEY=...
BTCTURK_HISSE_API_SECRET=...
BTCTURK_HISSE_WS_URL=ws://127.0.0.1:3003/api/ws/btcturk-hisse
NEXT_PUBLIC_BTCTURK_HISSE_WS_URL=ws://127.0.0.1:3003/api/ws/btcturk-hisse
NEXT_PUBLIC_EQUITY_DEFAULT=ISCTR.E

# BIST (broker’a göre)
BIST_BROKER=FIX|REST
BIST_ENDPOINT=...
BIST_USERNAME=...
BIST_PASSWORD=...
BIST_CLIENT_ID=...
```

### Özelleşmiş Konular

- Sembol normalizasyonu: BNB/USDT vs BNBUSDT, BTCTRY, BIST’te ISCTR.E; `exchange-core/symbol.ts`.
- Precision & minQty: her adapter filters’tan okuyup yuvarlama uygular.
- Rate-limit & retry/backoff: executor içinde merkezî throttling.
- Feature-flag: adapter bazlı aç/kapat (settings + .env).

### UI Rotaları

- /dashboard — mini-health, PnL, pozisyonlar, stratejiler, son işlemler, AI Copilot
- /markets — çoklu borsa/çift; top-of-book, spread, derinlik (yakında)
- /strategies — Stratejilerim
- /lab — Strateji Lab (AI destekli editor/sim)
- /portfolio — Portföy yönetimi
- /settings — Ayarlar, feature-flags
- /bist — Borsa İstanbul (BTCTurk Hisse) veri kartı

### Sıradaki Entegrasyon Sırası

1. Binance.com Spot (veri + temel emirler)
2. Binance Futures (positions, margin, funding)
3. Binance TR Spot
4. BIST broker köprüsü (canlı veri/işlem için kurum anahtarları)

### Kabul Ölçütleri (ilk faz)

- Adapter’lar `exchange-core` sözleşmesine uyuyor.
- WS aktifken polling tamamen susuyor (`feedMode: "ws"`).
- Dashboard, Markets, Strategies, Lab, Portfolio, Settings rotaları açılıyor (iskelet + canlı veri).
- Emir akışı: place→ack < 1s (mock/WS’de), hata durumunda rollback/fallback.
