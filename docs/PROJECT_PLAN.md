# AI Destekli Trader UI - Master Plan

## Ürün Tanımı
**Gelişmiş AI Trader Uygulaması** - Cursor/Copilot tarzı chat panelli Pro UI

### Ana Bileşenler

#### Dashboard (Ana Sayfa)
- **Manager AI ChatDock**: Yönetici AI sohbet paneli (sağ kenar dock)
- **Canary Health, GuardrailStack, P&L/Exposure** özet kartları
- **Canlı akış mini panel** (Orders/Fills/Metrics SSE)
- **Strateji durumları** (aktif strateji, mod: grid/trend/scalp/stop)

#### Strategy Lab
- **Strategy AI ChatDock**: Cursor/Copilot benzeri chat + kod editörü (Monaco)
- **Parametre formu** + Backtest/Optimize başlatma
- **Sonuç tablosu** (PnL, Win%, Sharpe, MaxDD, Trades) + Equity grafiği
- **"Run → Proof"** kanıt/manifest üretimi

#### Control Center
- **4 panel grid** (Orders, Fills, Metrics, Evidence) + TRIP simülasyon

#### Portfolio
- **Gerçek zamanlı P&L**, risk ve pozisyonlar (5s refresh)
- **Leverage/limit'ler**

#### Analytics
- **Latency/Reject/Slippage** trendleri (15m/1h/4h/24h)

#### Settings
- **Feature flags**, RBAC, tema, kanıt indirme

### İletişim/UI Prensipleri
- Her sayfada tek H1, kartlar içinde veri ve aksiyonlar
- **Always-On**: executor yoksa degraded veya evidence modunda render (asla beyaz ekran yok)
- **ChatDock (sağ-dock)**:
  - Dashboard: "Yönetici AI" karar/öneri sohbeti
  - Strategy Lab: "Strateji AI" kod üretim & backtest/optimizasyon

## Dizin Yapısı (apps/web-next/)

```
app/
  (app)/
    dashboard/page.tsx
    control-center/page.tsx
    strategy-lab/page.tsx
    portfolio/page.tsx
    analytics/page.tsx
    settings/page.tsx
    dashboard/error.tsx
    dashboard/loading.tsx
  (auth)/
    login/page.tsx
  layout.tsx
  page.tsx        // redirect('/dashboard')

components/
  AppShellPro.tsx
  BuilderBanner.tsx
  ChatDock/
    ChatDock.tsx
    ChatInput.tsx
    ChatMessage.tsx
    useChatDock.ts
  cards/
    CanaryStatusCard.tsx
    GuardrailStack.tsx
    MetricsMini.tsx
    PortfolioSummary.tsx
    StrategyStatusCard.tsx
  lab/
    StrategyEditor.tsx      // Monaco
    ParameterForm.tsx
    ResultTable.tsx
    EquityChart.tsx

lib/
  fetchers.ts
  sse.ts
  ai/
    prompts/manager-ai.tr.txt
    prompts/strategy-ai.tr.txt

app/api/public/
  canary/status/route.ts
  portfolio/summary/route.ts
  lab/backtest/route.ts
  lab/optimize/route.ts
  events/{orders|fills|metrics}/route.ts
  auth/demo-login/route.ts
```

## ENV & Feature Flags (.env.local)
```
NEXT_PUBLIC_UI_BUILDER=true
NEXT_PUBLIC_DEMO_ENABLE_ACTIONS=false
NEXT_PUBLIC_DEV_BYPASS=true
EXEC_ORIGIN=http://127.0.0.1:4001
PORT=3003
```

## API Sözleşmesi (UI Proxy'leri)

### GET /api/public/canary/status
```json
{
  "ok": boolean,
  "source": "executor" | "runtime" | "evidence" | "none",
  "data": {
    "step": string,
    "fills": number,
    "target": number,
    "pnl": number,
    "ts": string
  }
}
```

### GET /api/public/portfolio/summary
```json
{
  "source": "executor" | "evidence",
  "totals": {
    "notional": number,
    "realized": number,
    "unrealized": number,
    "exposure": number,
    "leverage": number
  },
  "positions": [...]
}
```

### POST /api/public/lab/backtest
```json
{
  "ok": boolean,
  "metrics": {
    "sharpe": number,
    "pnl": number,
    "win": number,
    "maxdd": number,
    "trades": number
  },
  "equity": [{"ts": string, "eq": number}]
}
```

### POST /api/public/lab/optimize
```json
{
  "ok": boolean,
  "best": {
    "params": any,
    "metrics": any
  },
  "trials": number
}
```

### GET /api/public/events/{orders|fills|metrics}
SSE headers: no-cache, keep-alive, X-Accel-Buffering:no

## UI Always-On Kuralları
- AppShellPro asla fetch yapmaz; veri çeken her şey kartların içinde try/catch + timeout (1500ms) ile
- Her route'ta error.tsx ve loading.tsx
- Canary/Portfolio kartları src rozetleri gösterir: HEALTHY/DEGRADED
- Login tek rota: (auth)/login. Root / → /dashboard
- SSE client otomatik yeniden bağlanma (exponential backoff)

## Chat Paneli (Cursor/Copilot tarzı)

### Bileşen: components/ChatDock/*
**Özellikler:**
- Sağ dock, Cmd/Ctrl+K ile aç/kapa
- Mesaj türleri: user | ai | tool | event

### Dashboard Chat (Manager AI)
- "Piyasa özeti", "Bugünkü plan", "Aktif stratejiyi değiştir", "Risk limitini güncelle", "Neden pozisyonu kapattın?" gibi komutlar
- Tool-call stub'ları: applyStrategy(symbol,strategy,params), setRiskLimits({dailyMaxLoss, perTradeRisk}), pauseTrading(), resumeTrading()

### Strategy Lab Chat (Strategy AI)
- "Yeni strateji üret" → Pine/Python şablon üretimi
- "Backtest/Optimize çalıştır" → ilgili API çağrıları
- "Performans raporu" → tablo + grafik embed (streamed)

### Mesaj Şeması (UI state)
```typescript
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  meta?: {
    page: 'dashboard' | 'strategy-lab';
    tool?: string;
    ts?: string;
  };
};
```

## Dashboard Bileşenleştirme

### CanaryStatusCard
- fetch('/api/public/canary/status',{cache:'no-store'}), 5s interval
- badge: HEALTHY/DEGRADED · src:<source>

### PortfolioSummary
- totals + mini sparkline (placeholder)

### MetricsMini
- SSE bağlan, son 30sn latency/reject/slippage

### StrategyStatusCard
- aktif strateji, mod (grid/trend/scalp/stop), sonar: son sinyal

## Strateji Lab İş Akışı

### StrategyEditor (Monaco)
- dil seçici pine | python

### ParameterForm
- symbol, timeframe, tarih aralığı, indikatör parametreleri

### Backtest/Optimize
- POST; sonuçları ResultTable + EquityChart ile göster

### ChatDock komutları
- form/çalıştırma butonlarını tetikler
- "Save → Proof": evidence/ui/…/manifest.json üretim çağrısı (stub)

## Test & Kabul Kriterleri

- `/dashboard` 200 OK, grid-cols-12 bulunur, ChatDock(kind="manager") DOM'da
- `/strategy-lab` 200 OK, Monaco editör render, ChatDock(kind="strategy") DOM'da
- Canary API yok → kart DEGRADED · src:evidence ile render (beyaz ekran yok)
- Portfolio summary executor varken source:'executor'
- SSE endpoint'leri header'ları doğru, client yeniden bağlanıyor
- Login tek rota, / → /dashboard redirect
- Tüm public API'ler no-store, kartlar timeout 1500ms ile korunuyor

## Komutlar (scripts)

```bash
pnpm dev:web → port 3003
pnpm dev:exec → port 4001
scripts/ui-smoke.cmd → health, canary, dashboard, lab doğrulama
```

## Geliştirme Adımları

### Adım 1: Dashboard + Manager ChatDock
- AppShellPro, BuilderBanner entegre; root fetch yok
- CanaryStatusCard, PortfolioSummary, StrategyStatusCard kartlarını ekle, 5s/10s refresh
- ChatDock(kind="manager") ekle; mock LLM handler ile şu komutları çalıştır:
  - "Stratejiyi grid'e al", "Trend moduna geç", "İşlemleri durdur/başlat", "Saatlik özet ver"
- API yoksa evidence/degraded modda düzgün render et

**Kabul**: /dashboard açılır, chat paneli çalışır, kartlar skeleton→veri/uyarı gösterir

### Adım 2: Strategy Lab + Strategy ChatDock
- Monaco editor kur, dil seçici (pine/python)
- ChatDock(kind="strategy"): "EURUSD 15m RSI+MACD stratejisi yaz, backtest et, optimize et" komut zincirini mock API'lerle uçtan uca işle
- ResultTable ve EquityChart ile sonuçları göster

**Kabul**: Kullanıcı doğal dille strateji ister → kod üretilir → backtest/optimize API çağrısı → tablo + grafik

## Stil & Kullanılabilirlik
- Tailwind token'ları, 12 kolon grid, sticky top bar, aktif nav highlight
- Kart sınıfları: .card, .card-header, .card-body, chip/badge varyantları
- Erişilebilirlik: tek H1, landmark'lar, focus ring, tuş kısayolları

## Hata ve Yükleme Sınırları
- Her route'ta error.tsx (kırmızı DEG bandı) + loading.tsx (skeleton)
- Kart içi try/catch + timeout(1500ms)
- SSE client: backoff ile reconnect

## Dokümantasyon Güncellemeleri
- PROJECT_PLAN.md → bu arayüz tanımını "UI V2" başlığıyla ekle
- ROADMAP_v2.1.md → Sprint "G: ChatDock + Strategy Editor", "H: Lab E2E backtest/optimize", "I: Strategy→Live Bridge"
- PROJECT_REPORT.md → "HEALTH=GREEN", "UI Always-On" assertion'ları 