# Live Data Layer Architecture — UI'dan Bağımsız Canlı Veri Katmanı

## Problem: UI Refactor'lar Canlılığı Kırmasın

**Hedef:** "Her şey canlı/anlık" ama UI değişiklikleri veri akışını bozmasın.

**Çözüm:** Veri düzlemi (Data Plane) ile görünüm düzlemini (View Plane) ayır.

---

## Mimari Prensipler

### 1. Veri Düzlemi vs Görünüm Düzlemi

**Data Plane (Canlı Veri):**
- WS/SSE/polling, reconnect, throttle, staleness, seq/heartbeat, cache
- UI'dan tamamen bağımsız
- Transport protokolü değişse bile aynı interface

**View Plane (UI):**
- Sadece "store'dan state okur", render eder
- WS/SSE parsing yapmaz
- UI değişirse sadece "okuyan yüz" değişir; veri hattı aynı kalır

---

## 2. Taşıma Protokolü: Tek Tip Zarf (Envelope) + Versioning

### Standart Envelope Format

```typescript
interface LiveEvent {
  v: number;              // Version (geriye uyum için)
  event: string;          // price_tick | candle_update | orderbook | copilot_token | job_progress | ...
  channel: string;        // binance:BTCUSDT:1m | copilot:chat | backtest:job_123
  seq: number;            // Monoton artan sequence (out-of-order tespiti)
  ts: number;             // Timestamp (ms)
  ok: boolean;            // Success/failure semantik
  errorCode?: string;     // TOKEN_EXPIRED | STALENESS_WARNING | ...
  data: any;              // Event-specific payload
}
```

### Versioning (Geriye Uyum)

- `v: 1` → P1.2 baseline
- UI revize olur, event formatı değişirse `v: 2` eklenir
- Client hem `v: 1` hem `v: 2` destekler (graceful degradation)

### Sequence + Timestamp

- `seq`: Out-of-order ve drop tespiti
- `ts`: Staleness hesaplama
- UI: `seq` gap varsa "veri kaybı" uyarısı

---

## 3. Transport Seçimi: Doğru Yere Doğru Araç

### Market Data (Fiyatlar, Orderbook, Trades, Candle Update)

**WebSocket (Önerilen):**
- Yüksek frekans, düşük gecikme
- Tek WS bağlantısı, kanal bazlı subscribe/unsubscribe
- Throttling: fiyat tick (100-250ms), candle update (1s), orderbook (250-500ms)

**UI Tarafı:**
- `usePrice(symbol)` → WS'den otomatik subscribe
- `useCandles(symbol, timeframe)` → WS'den otomatik subscribe
- Reconnect/backoff/heartbeat LiveClient'ta

### Copilot Chat (Streaming Token + Tool Events)

**SSE (Mevcut):**
- Zaten çalışıyor, bırakabiliriz
- Envelope formatına uyumlu hale getir
- İstersen tek WS kanalına birleşebilir (şart değil)

### Backtest/Optimizer Job Progress

**Polling + SSE (Mevcut):**
- Şu an polling + SSE ile güzel
- Live Layer içine taşı (UI bilmesin)
- `useJob(jobId)` → otomatik progress tracking

---

## 4. Backend: Normalizer + PubSub + Gateway

### Mimari Akış

```
MarketData Connector (Binance/BTCTurk/BIST)
    ↓
Normalizer (Tek event formatına çevir)
    ↓
PubSub (Redis Streams/PubSub)
    ↓
WS Gateway (web-next node runtime veya ayrı service)
    ↓
UI: wss://.../live (tek bağlantı)
```

### Normalizer

**Görev:**
- Tüm borsaları tek "event" formatına çevirir
- Symbol mapping (BTCUSDT → BTC/USDT)
- Timestamp normalization
- Error handling (borsa down → `ok: false, errorCode: DATA_UNAVAILABLE`)

**Dosya:**
- `packages/ai-core/src/live/normalizer/MarketDataNormalizer.ts`

### PubSub (Redis)

**P1.2'de Redis gelirse:**
- Redis Streams: `copilot:live:market:binance:BTCUSDT:1m`
- Redis PubSub: `copilot:live:copilot:chat`
- Redis Streams: `copilot:live:job:backtest_123`

**Avantaj:**
- Horizontal scale (birden fazla gateway instance)
- Persistence (streams ile)
- Replay (streams ile)

**Dosya:**
- `packages/ai-core/src/live/pubsub/RedisPubSub.ts`

### WS Gateway

**Tek Endpoint:**
- `wss://.../live` (veya `/api/live/ws`)

**Protokol:**
```typescript
// Client → Server (subscribe)
{ type: 'subscribe', channels: ['binance:BTCUSDT:1m', 'copilot:chat'] }

// Server → Client (events)
{ v: 1, event: 'price_tick', channel: 'binance:BTCUSDT:1m', seq: 123, ... }

// Client → Server (unsubscribe)
{ type: 'unsubscribe', channels: ['binance:BTCUSDT:1m'] }
```

**Dosya:**
- `apps/web-next/src/app/api/live/ws/route.ts` (veya ayrı service)

---

## 5. Client: LiveClient + Store (Zustand) + Selectors

### LiveClient

**Görev:**
- WS/SSE bağlantı yönetimi
- Reconnect: exponential backoff + jitter
- Heartbeat: bağlantı var mı anlaşılır
- Throttling: frame budget korunur
- Backpressure: UI render patlamasın

**Event Contract Runtime Doğrulama (P1.2 Kritik):**
- Gateway çıkışında: LiveEvent için Zod schema
- Client girişinde: En azından `v`, `event`, `channel`, `seq`, `ts` doğrulama
- Hatalı event → `INTERNAL_ERROR` + drop (sistemi deviremez)

**Dosya:**
- `packages/live-core/src/client/LiveClient.ts`

### Store (Zustand)

**Görev:**
- Event'leri store'a yazar
- Selectors ile UI'a expose eder
- Throttled updates (UI her event'i render etmez)

**Dosya:**
- `packages/ai-core/src/live/store/liveStore.ts`

### Selectors (React Hooks)

**UI Component'ları:**
```typescript
// UI sadece hook kullanır, WS/SSE parsing yapmaz
const price = usePrice('BTCUSDT');
const candles = useCandles('BTCUSDT', '1h');
const copilotStream = useCopilotStream();
const job = useJob('backtest_123');
```

**Dosya:**
- `packages/ai-core/src/live/hooks/usePrice.ts`
- `packages/ai-core/src/live/hooks/useCandles.ts`
- `packages/ai-core/src/live/hooks/useCopilotStream.ts`
- `packages/ai-core/src/live/hooks/useJob.ts`

---

## 6. Kritik Detaylar (Gerçek "Anlık" Hissi)

### Reconnection

**Exponential Backoff + Jitter:**
```typescript
const delays = [1000, 2000, 4000, 8000, 16000]; // max 16s
const jitter = Math.random() * 1000; // ±1s
const delay = delays[attempt] + jitter;
```

### Heartbeat

**Server → Client:**
```typescript
{ v: 1, event: 'heartbeat', channel: 'system', seq: 0, ts: Date.now(), ok: true, data: {} }
```

**Client:**
- Son heartbeat'ten 10s geçtiyse → "reconnecting" state
- 30s geçtiyse → "degraded" state

### Throttling

**Frame Budget Koruma:**
- Fiyat tick: 100-250ms (UI her tick'i render etmez)
- Grafik candle update: 1s (smooth animation)
- Orderbook: 250-500ms (derinlik sınırlı)

**Store Throttle:**
```typescript
// Store update throttled (UI render patlamasın)
const throttledUpdate = throttle((data) => {
  store.setState({ price: data });
}, 100); // 100ms throttle
```

### Backpressure

**P1.2 Kritik: "Drop Oldest + Warn Event" Kuralı**

**Canlı sistemlerde en büyük düşman "render fırtınası".**

```typescript
// packages/live-core/src/backpressure/QueueManager.ts

interface QueueConfig {
  maxSize: number;        // 100-200 event/channel
  dropOldest: boolean;    // true
  emitWarnEvent: boolean; // true
}

class QueueManager {
  private queues = new Map<string, LiveEvent[]>();

  add(channel: string, event: LiveEvent): void {
    const queue = this.queues.get(channel) || [];

    if (queue.length >= this.config.maxSize) {
      // Drop oldest
      queue.shift();
      // Emit backpressure_drop event
      this.emitBackpressureDrop(channel, event.seq);
    }

    queue.push(event);
    this.queues.set(channel, queue);
  }

  private emitBackpressureDrop(channel: string, droppedSeq: number): void {
    // Emit: { event: 'backpressure_drop', channel, data: { droppedSeq } }
  }
}
```

**Store Güncellemelerini Batch'le:**
- 100ms throttle veya `requestAnimationFrame`
- UI her event'i render etmez

### Staleness Badge

**"Canlı" İddiası Ancak Staleness Görünürse Güvenilir:**
```typescript
const staleness = Date.now() - lastEvent.ts;
if (staleness > 5000) {
  // Amber uyarı: "Data stale (5s)"
}
```

---

## 7. Degrade Mode (Güvenli Fallback)

**Tek Bir Yerde Degrade Mode:**

### WS Yoksa
- REST snapshot + düşük frekans polling (5-10s)
- UI: "Live mode unavailable, using polling"

### Data Stale İse
- Amber uyarı + son bilinen değer
- UI: "Data stale (X seconds), showing last known value"

**Dosya:**
- `packages/ai-core/src/live/client/DegradeMode.ts`

---

## 8. Spark'a Özel Entegrasyon: StatusBar

**Mevcut Hedef:** StatusBar: AU/WS/Crash

**Yeni Eklemeler:**
- **WS:** `connected | reconnecting | degraded`
- **Market Staleness:** `ok | warn | stale`
- **Copilot Stream:** `active | idle | error`

**UX:**
- "Anlık" iddiasını somut kanıta bağlar
- Kullanıcı "canlı mı?" sorusunu StatusBar'dan anlar

**Dosya:**
- `apps/web-next/src/components/StatusBar.tsx` → Live status indicators

---

## 9. P1.2'ye Bağlayan Net Yol

### Adım 1: ConfirmationTokenStore → Redis/DB (Zaten Plan)

### Adım 2: Aynı Redis Üstünden Live PubSub Aç

**Redis Streams:**
```typescript
// Market data
XADD copilot:live:market:binance:BTCUSDT:1m * event price_tick data {...}

// Copilot chat
XADD copilot:live:copilot:chat * event copilot_token data {...}

// Job progress
XADD copilot:live:job:backtest_123 * event job_progress data {...}
```

### Adım 3: WS Gateway Ekle (Tek Bağlantı)

**Endpoint:**
- `wss://.../live` (veya `/api/live/ws`)

**Protokol:**
- Subscribe/unsubscribe mesajları
- Event streaming (envelope format)

### Adım 4: Client LiveClient + Store Katmanını Oluştur

**LiveClient:**
- WS bağlantı yönetimi
- Reconnect/backoff/heartbeat
- Throttling/backpressure

**Store:**
- Zustand store
- Event'leri store'a yazar
- Selectors ile UI'a expose

### Adım 5: UI Component'ları "Data Hook"lara Geçir (Refactor Safe)

**Önce:**
```typescript
// CopilotDock.tsx - SSE parsing yapıyor
fetch('/api/copilot/chat', ...).then(async (response) => {
  const reader = response.body?.getReader();
  // ... SSE parsing
});
```

**Sonra:**
```typescript
// CopilotDock.tsx - sadece hook kullanır
const copilotStream = useCopilotStream();
// ... render copilotStream.messages
```

---

## 10. Paket Sınırı: "Core" + "React" İkiye Böl

**Neden?** Yarın Electron/Node worker/CLI ile canlı veriyi tüketmek istersen React bağımlılığı taşımak zorunda kalmazsın. UI refactor'lara direnç artar.

### @spark/live-core (React YOK)

**Bağımlılıklar:**
- `zod` (runtime validation)
- `ws` veya native `WebSocket` (WS client)
- `events` (EventEmitter pattern)

**İçerik:**
- LiveEvent types, envelope versioning
- Normalizer (MarketDataNormalizer)
- WS/SSE client (LiveClient)
- Backpressure, staleness, reconnect logic
- DegradeMode

**Dosya Yapısı:**
```
packages/live-core/src/
├── envelope/
│   ├── LiveEvent.ts            # Envelope format + Zod schema
│   └── versioning.ts           # Version handling
├── client/
│   ├── LiveClient.ts           # WS/SSE bağlantı yönetimi (React yok)
│   ├── DegradeMode.ts          # Fallback logic
│   └── types.ts                # LiveEvent, LiveChannel, etc.
├── normalizer/
│   ├── MarketDataNormalizer.ts # Borsa → tek format
│   └── types.ts
├── pubsub/
│   ├── RedisPubSub.ts          # Redis Streams/PubSub
│   └── types.ts
├── staleness/
│   ├── computeStaleness.ts     # Tek yerde staleness hesaplama
│   └── policies.ts             # Market tick/candle/job/cpstream eşikleri
└── backpressure/
    ├── QueueManager.ts         # Max queue size, drop oldest
    └── types.ts
```

### @spark/live-react (React VAR)

**Bağımlılıklar:**
- `@spark/live-core` (core logic)
- `zustand` (store)
- `react` (hooks)

**İçerik:**
- Zustand store (liveStore)
- React hooks (usePrice, useCandles, useCopilotStream, useJob)
- Store selectors

**Dosya Yapısı:**
```
packages/live-react/src/
├── store/
│   ├── liveStore.ts            # Zustand store
│   └── selectors.ts            # Store selectors
└── hooks/
    ├── usePrice.ts             # usePrice(symbol)
    ├── useCandles.ts           # useCandles(symbol, timeframe)
    ├── useCopilotStream.ts     # useCopilotStream()
    └── useJob.ts               # useJob(jobId)
```

### Backend (web-next)

```
apps/web-next/src/app/api/live/
├── ws/route.ts                 # WS Gateway endpoint
├── channels/                   # Channel-specific handlers
│   ├── market.ts               # Market data channels
│   ├── copilot.ts              # Copilot channels
│   └── jobs.ts                 # Job progress channels
└── auth/
    ├── channelAllowlist.ts     # Kullanıcı/rol bazlı allowlist
    └── rateLimit.ts            # Rate limit / max channel count
```

---

## 11. Migration Stratejisi

### Phase 1: Envelope Standardization (P1.2)

**Mevcut SSE'yi envelope formatına uyumlu hale getir:**
- `apps/web-next/src/app/api/copilot/chat/route.ts` → envelope format
- `apps/web-next/src/components/copilot/CopilotDock.tsx` → envelope parser

### Phase 2: LiveClient + Store (P1.2)

**LiveClient oluştur:**
- WS bağlantı yönetimi
- Reconnect/backoff/heartbeat
- Store integration

**Store oluştur:**
- Zustand store
- Event'leri store'a yazar

### Phase 3: Market Data Integration (P1.3)

**Market data connector:**
- Binance/BTCTurk/BIST connectors
- Normalizer
- Redis PubSub

**WS Gateway:**
- Tek endpoint
- Channel subscribe/unsubscribe

### Phase 4: UI Migration (P1.3)

**UI component'ları hook'lara geçir:**
- `CopilotDock.tsx` → `useCopilotStream()`
- Market data components → `usePrice()`, `useCandles()`
- Job components → `useJob()`

---

## 12. Performans ve Stabilite

### UI Her Event'i Render Etmez

**Store Update + Throttled Selectors:**
```typescript
// Store'da event gelir
store.setState({ price: data });

// Selector throttled (100ms)
const price = usePrice('BTCUSDT'); // 100ms throttle
```

### Frame Budget Korunur

**Throttling:**
- Fiyat tick: 100-250ms
- Candle update: 1s
- Orderbook: 250-500ms

### Backpressure

**Max Queue Size:**
- Store'da max 100 event
- Queue dolduysa → drop oldest, emit warning

---

## 13. Örnek Kullanım

### UI Component (Önce)

```typescript
// CopilotDock.tsx - SSE parsing yapıyor
const [messages, setMessages] = useState([]);
fetch('/api/copilot/chat', ...).then(async (response) => {
  const reader = response.body?.getReader();
  while (true) {
    const { done, value } = await reader.read();
    // ... SSE parsing
    setMessages(prev => [...prev, message]);
  }
});
```

### UI Component (Sonra)

```typescript
// CopilotDock.tsx - sadece hook kullanır
const copilotStream = useCopilotStream();
const messages = copilotStream.messages; // Store'dan okur
// ... render messages
```

**Avantaj:**
- UI refactor → veri hattı bozulmaz
- Reconnect/backoff/heartbeat → LiveClient'ta
- Throttling/backpressure → Store'da
- UI sadece render eder

---

## 14. P1.2 "Done" Kriteri

**P1.2 bitti diyebilmen için şu 5 şey tamam olmalı:**

1. ✅ **LiveClient + store + hooks çalışıyor (en az Copilot stream)**
   - `@spark/live-core` paketi oluşturuldu
   - `@spark/live-react` paketi oluşturuldu
   - `useCopilotStream()` hook'u çalışıyor
   - Mevcut SSE LiveClient içine alındı

2. ✅ **UI'da hiçbir yerde "raw SSE/WS parsing" kalmıyor (yasak)**
   - `CopilotDock.tsx` → sadece `useCopilotStream()` kullanıyor
   - Grep kontrolü: `fetch.*SSE|EventSource|WebSocket` → UI'da yok

3. ✅ **StatusBar canlılık gösteriyor: WS / Copilot / Staleness**
   - WS: `connected | reconnecting | degraded`
   - Copilot: `active | idle | error`
   - Staleness: `ok | warn | stale`

4. ✅ **Degrade mode çalışıyor: bağlantı gidince UI "son bilinen değer + amber"**
   - SSE bağlantı kesilince → degrade mode
   - UI: "Live mode unavailable, showing last known value"
   - Amber uyarı gösteriliyor

5. ✅ **Smoke test'e 2 kontrol ekli:**
   - "UI parsing yok" (grep kuralı: `fetch.*SSE|EventSource|WebSocket` → UI'da yok)
   - "backpressure_drop event üretebiliyor mu" (sentetik flood ile test)

---

## 15. P1.2 Checklist

### Paket Oluşturma
- [ ] `packages/live-core/package.json` (React yok)
- [ ] `packages/live-react/package.json` (React var, live-core bağımlı)

### Envelope + Validation
- [ ] `packages/live-core/src/envelope/LiveEvent.ts` (envelope format + Zod schema)
- [ ] `packages/live-core/src/envelope/versioning.ts` (version handling)
- [ ] Gateway çıkışında: LiveEvent Zod validation
- [ ] Client girişinde: En azından `v`, `event`, `channel`, `seq`, `ts` doğrulama

### LiveClient (Core)
- [ ] `packages/live-core/src/client/LiveClient.ts` (WS/SSE bağlantı yönetimi)
- [ ] `packages/live-core/src/client/DegradeMode.ts` (fallback logic)
- [ ] SSE adapter (mevcut SSE'yi LiveClient içine al)
- [ ] Reconnect: exponential backoff + jitter
- [ ] Heartbeat: bağlantı durumu kontrolü

### Staleness (Core)
- [ ] `packages/live-core/src/staleness/computeStaleness.ts` (tek yerde hesaplama)
- [ ] `packages/live-core/src/staleness/policies.ts` (market tick/candle/job/cpstream eşikleri)

### Backpressure (Core)
- [ ] `packages/live-core/src/backpressure/QueueManager.ts` (max queue size, drop oldest)
- [ ] Backpressure drop event emit

### Store + Hooks (React)
- [ ] `packages/live-react/src/store/liveStore.ts` (Zustand store)
- [ ] `packages/live-react/src/store/selectors.ts` (store selectors)
- [ ] `packages/live-react/src/hooks/useCopilotStream.ts` (hook)
- [ ] Store güncellemelerini batch'le (100ms veya rAF)

### Copilot Migration
- [ ] `apps/web-next/src/app/api/copilot/chat/route.ts` → envelope format
- [ ] `apps/web-next/src/components/copilot/CopilotDock.tsx` → sadece `useCopilotStream()` kullan
- [ ] Raw SSE parsing kaldır (yasak)

### StatusBar Integration
- [ ] `apps/web-next/src/components/StatusBar.tsx` → Live status indicators
- [ ] WS: `connected | reconnecting | degraded`
- [ ] Copilot: `active | idle | error`
- [ ] Staleness: `ok | warn | stale`

### Güvenlik (P1.2 Kritik)
- [ ] `apps/web-next/src/app/api/live/auth/channelAllowlist.ts` (kullanıcı/rol bazlı allowlist)
- [ ] `apps/web-next/src/app/api/live/auth/rateLimit.ts` (rate limit / max channel count)
- [ ] Subscribe mesajına server-side doğrulama

### Smoke Test
- [ ] "UI parsing yok" kontrolü (grep: `fetch.*SSE|EventSource|WebSocket` → UI'da yok)
- [ ] "backpressure_drop event üretebiliyor mu" (sentetik flood ile test)

---

## Sonuç

**"Her şey canlı" hedefi mümkün; ama bunu UI'ın içine değil, platform katmanına koyarsak ileride yaptığımız düzenlemeler "olumsuz etkilemez".**

**Bu mimariyle:**
- UI sadece bir "ekran"
- Veri ise ayrı bir "sinir sistemi"
- UI refactor → veri hattı bozulmaz
- Worst-case → degrade mode'a düşer

