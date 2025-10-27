# Spark Trading UI Yeniden Kurulum Planı

**Kaynak:** Ekim 2025 öncesi production ekran görüntüleri (18 adet)  
**Durum:** Complete UI Blueprint  
**Hedef:** 1 günde %90 görsel eşlik, 3 günde production-ready

---

## 📐 Mimari Özet

### Sayfa Yapısı (Next.js App Router)

```
app/
  (dashboard)/
    page.tsx                 # Anasayfa (/)
    layout.tsx               # Shared layout (sidebar, header)
  
  strategy-lab/
    page.tsx                 # AI Strategy Generation
  
  strategies/
    page.tsx                 # Stratejilerim (Grid View)
  
  running/
    page.tsx                 # Çalışan Stratejiler (Table View)
  
  portfolio/
    page.tsx                 # Portföy & Pozisyonlar
  
  settings/
    page.tsx                 # Ayarlar (API Keys)
  
  api/
    vitals/route.ts          # RUM endpoint (opsiyonel)
    mock/
      running/route.ts       # Mock data for running strategies
      portfolio/route.ts     # Mock data for portfolio
      strategies/route.ts    # Mock data for strategies list
      market/route.ts        # Mock data for market data (BTC, ETH)
```

**Not:** `(dashboard)` bir **route group**tür; URL'de görünmez. "/dashboard" 404 vermesi normaldir.

---

## 🎨 Design System

### Tema Token'ları (`globals.css`)

```css
:root {
  /* Dark Theme (default) */
  --bg-page: #0b0c0f;
  --bg-card: #121317;
  --bg-card-hover: #1a1b21;
  --border: #1f2330;
  --border-hover: #2a2e3f;
  
  --text-strong: #e8ecf1;
  --text-base: #c4cad3;
  --text-muted: #a6b0bf;
  --text-disabled: #6b7280;
  
  /* Accent Colors */
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --success: #10b981;
  --success-hover: #059669;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --warning: #f59e0b;
  --warning-hover: #d97706;
  --info: #3b82f6;
  
  /* Specific UI */
  --sidebar-bg: #0f1015;
  --sidebar-active: #1e2028;
  --pill-bg: #1f2937;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-page: #ffffff;
    --bg-card: #f7f8fa;
    --bg-card-hover: #f1f3f5;
    --border: #e5e7eb;
    --border-hover: #d1d5db;
    
    --text-strong: #0f172a;
    --text-base: #1e293b;
    --text-muted: #475569;
    --text-disabled: #94a3b8;
    
    --sidebar-bg: #f9fafb;
    --sidebar-active: #f3f4f6;
    --pill-bg: #f3f4f6;
    
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
}

/* Utility Classes */
.tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 🧩 Core Components

### 1. StatusPills

**Dosya:** `components/StatusPills.tsx`

```tsx
export type StatusType = 'ok' | 'warn' | 'error' | 'offline' | 'unknown';

export interface StatusPillProps {
  label: string;
  value: string;
  status: StatusType;
  srHint?: string;  // Screen reader açıklaması
}

export function StatusPill({ label, value, status, srHint }: StatusPillProps) {
  const colors = {
    ok: 'bg-green-500/10 text-green-400 border-green-500/20',
    warn: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    offline: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    unknown: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border ${colors[status]}`}
      role="status"
      aria-live="polite"
      data-testid={`pill-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-xs font-medium">
        {label}: {value}
      </span>
      {srHint && <span className="sr-only">{srHint}</span>}
    </div>
  );
}
```

**Kullanım:**
```tsx
<StatusPill label="Env" value="Mock" status="unknown" />
<StatusPill label="Feed" value="Healthy" status="ok" srHint="Veri akışı normal çalışıyor" />
<StatusPill label="Broker" value="Offline" status="error" />
```

---

### 2. MetricCard

**Dosya:** `components/MetricCard.tsx`

```tsx
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  isLive?: boolean;  // Canlı veri göstergesi
  actions?: React.ReactNode;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  isLive,
  actions,
}: MetricCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:border-border-hover transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-text-muted">{icon}</div>}
          <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        </div>
        {isLive && (
          <span
            className="flex items-center gap-1 text-xs text-green-400"
            aria-label="Canlı veri"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Canlı
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-3xl font-bold text-text-strong tabular">{value}</p>
        
        {subtitle && (
          <p className="text-sm text-text-muted">{subtitle}</p>
        )}

        {trend && (
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-medium tabular ${
                trend.value >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-text-muted">{trend.label}</span>
          </div>
        )}
      </div>

      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
```

---

### 3. StrategyCard

**Dosya:** `components/StrategyCard.tsx`

```tsx
export interface StrategyCardProps {
  id: string;
  name: string;
  tags: string[];
  perfPct: number;
  lastRunDate: string;
  onEdit: () => void;
  onRun: () => void;
}

const TAG_COLORS = {
  kripto: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  bist: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hisse: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  scalping: 'bg-green-500/10 text-green-400 border-green-500/20',
  grid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  spot: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  swing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export function StrategyCard({
  name,
  tags,
  perfPct,
  lastRunDate,
  onEdit,
  onRun,
}: StrategyCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:border-border-hover hover:bg-card-hover transition-all">
      <h3 className="text-lg font-semibold text-text-strong mb-3">{name}</h3>

      <div className="flex gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2 py-1 rounded border ${
              TAG_COLORS[tag as keyof typeof TAG_COLORS] || 'bg-gray-500/10 text-gray-400'
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Performans</span>
          <span
            className={`text-sm font-semibold tabular ${
              perfPct >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {perfPct >= 0 ? '+' : ''}{perfPct.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Son çalıştırma</span>
          <span className="text-sm text-text-base">{lastRunDate}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm font-medium text-text-base bg-bg-card-hover border border-border rounded-md hover:bg-bg-card transition-colors"
          data-testid="btn-edit"
        >
          Düzenle
        </button>
        <button
          onClick={onRun}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-success hover:bg-success-hover rounded-md transition-colors"
          data-testid="btn-run"
        >
          Çalıştır
        </button>
      </div>
    </div>
  );
}
```

---

### 4. RunningStrategyTable

**Dosya:** `components/RunningStrategyTable.tsx`

```tsx
export interface RunningStrategy {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  pnlUSD: number;
  trades: number;
  capitalUSD: number;
  startedAt: string;  // ISO string or formatted time
}

export interface RunningStrategyTableProps {
  strategies: RunningStrategy[];
  onTogglePause: (id: string) => void;
  onStop: (id: string) => void;
}

const STATUS_CONFIG = {
  running: { dot: 'bg-green-500', label: 'Çalışıyor', action: 'Duraklat' },
  paused: { dot: 'bg-orange-500', label: 'Duraklatıldı', action: 'Devam' },
  stopped: { dot: 'bg-red-500', label: 'Durduruldu', action: null },
};

export function RunningStrategyTable({
  strategies,
  onTogglePause,
  onStop,
}: RunningStrategyTableProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden" data-testid="table-running">
      <table className="w-full">
        <thead className="bg-bg-card-hover border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Durum
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Strateji
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              PnL
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              İşlem
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Sermaye
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">
              Başlangıç
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">
              Aksiyonlar
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {strategies.map((strategy) => {
            const config = STATUS_CONFIG[strategy.status];
            return (
              <tr key={strategy.id} className="hover:bg-bg-card-hover transition-colors" data-testid={`row-${strategy.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dot}`} aria-hidden="true" />
                    <span className="text-sm text-text-base">{config.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-text-strong">
                  {strategy.name}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-sm font-semibold tabular ${
                      strategy.pnlUSD >= 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {strategy.pnlUSD >= 0 ? '+' : ''}
                    {strategy.pnlUSD.toFixed(2)} $
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-base tabular">
                  {strategy.trades}
                </td>
                <td className="px-4 py-3 text-right text-sm text-text-base tabular">
                  {strategy.capitalUSD.toFixed(0)} $
                </td>
                <td className="px-4 py-3 text-sm text-text-base">
                  {strategy.startedAt}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {config.action && strategy.status !== 'stopped' && (
                      <button
                        onClick={() => onTogglePause(strategy.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                          strategy.status === 'paused'
                            ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                            : 'bg-bg-card-hover text-text-base border-border hover:bg-bg-card'
                        }`}
                      >
                        {strategy.status === 'paused' ? '▶ Devam' : 'II Duraklat'}
                      </button>
                    )}
                    <button
                      onClick={() => onStop(strategy.id)}
                      className="px-3 py-1.5 text-xs font-medium text-danger bg-danger/10 border border-danger/20 rounded hover:bg-danger/20 transition-colors"
                      disabled={strategy.status === 'stopped'}
                    >
                      ■ Durdur
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 📄 Sayfa Şablonları

### Anasayfa (`app/(dashboard)/page.tsx`)

```tsx
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPills';

export default async function HomePage() {
  // Fetch from /api/mock/home or real endpoint
  const data = await fetch('http://localhost:3003/api/mock/home').then(r => r.json());

  return (
    <div className="space-y-6">
      {/* Status Pills */}
      <div className="flex items-center gap-3">
        <StatusPill label="Env" value="Mock" status="unknown" />
        <StatusPill label="Feed" value="Healthy" status="ok" />
        <StatusPill label="Broker" value="Offline" status="error" />
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* AI Copilot Card */}
        <MetricCard
          title="AI Copilot - Piyasa Analizi"
          value=""
          subtitle="Piyasa durumunu analiz et, fırsat öner, strateji seç..."
          actions={
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover">
                Analiz Et
              </button>
              <button className="w-full px-4 py-2 bg-bg-card-hover text-text-base rounded-md hover:bg-bg-card border border-border">
                Strategy Lab →
              </button>
            </div>
          }
        />

        {/* Running Strategies Card */}
        <MetricCard
          title="Çalışan Stratejiler"
          value=""
          isLive
          actions={
            <div className="space-y-2">
              {data.runningStrategies.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-sm text-text-base">{s.name}</span>
                  <span className={`text-sm font-semibold tabular ${s.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {s.pnl >= 0 ? '+' : ''}{s.pnl} $
                  </span>
                </div>
              ))}
            </div>
          }
        />

        {/* Market Data Card */}
        <MetricCard
          title="Piyasa Verileri"
          value=""
          isLive
          actions={
            <div className="space-y-3">
              {data.marketData.map((m: any) => (
                <div key={m.symbol}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-strong">{m.symbol}</span>
                    <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded">
                      {'<2s'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-text-strong tabular">{m.price} $</span>
                    <span className="text-sm font-medium text-success">
                      ▲ +{m.changePct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
}
```

---

## 🔌 Mock API Schemas

### `/api/mock/home/route.ts`

```ts
export async function GET() {
  return Response.json({
    runningStrategies: [
      { name: 'BTC EMA Cross', pnl: 125.50 },
      { name: 'ETH Grid', pnl: 89.20 },
      { name: 'SOL Momentum', pnl: -15.30 },
    ],
    marketData: [
      { symbol: 'BTCUSDT', price: '42,031.04', changePct: 2.77 },
      { symbol: 'ETHUSDT', price: '2,199.44', changePct: 1.52 },
    ],
  });
}
```

### `/api/mock/running/route.ts`

```ts
export async function GET() {
  return Response.json({
    strategies: [
      {
        id: '1',
        name: 'BTC EMA Cross',
        status: 'running',
        pnlUSD: 125.50,
        trades: 12,
        capitalUSD: 1000,
        startedAt: '10:30',
      },
      {
        id: '2',
        name: 'ETH Grid',
        status: 'running',
        pnlUSD: 89.20,
        trades: 45,
        capitalUSD: 2000,
        startedAt: '09:15',
      },
      {
        id: '3',
        name: 'SOL Momentum',
        status: 'paused',
        pnlUSD: -15.30,
        trades: 8,
        capitalUSD: 500,
        startedAt: '08:00',
      },
      {
        id: '4',
        name: 'BIST30 Swing',
        status: 'stopped',
        pnlUSD: 245.70,
        trades: 23,
        capitalUSD: 5000,
        startedAt: '2025-10-24',
      },
      {
        id: '5',
        name: 'ADA Scalper',
        status: 'running',
        pnlUSD: 34.10,
        trades: 67,
        capitalUSD: 800,
        startedAt: '11:45',
      },
    ],
  });
}
```

### `/api/mock/portfolio/route.ts`

```ts
export async function GET() {
  return Response.json({
    exchange: {
      name: 'Binance',
      online: true,
      lastSyncSec: 120,
      rateLimit: '1200/1200',
    },
    totals: {
      pnl24hUSD: 1247.50,
      totalUSD: 12847.50,
      freeUSD: 8500.00,
      lockedUSD: 4347.50,
    },
    positions: [
      {
        symbol: 'BTCUSDT',
        qty: 0.25,
        avgPrice: 42500.00,
        currentPrice: 43000.00,
        pnlUSD: 125.50,
        pnlPct: 2.1,
      },
    ],
  });
}
```

### `/api/mock/strategies/route.ts`

```ts
export async function GET() {
  return Response.json({
    strategies: [
      {
        id: '1',
        name: 'BTC EMA Crossover',
        tags: ['kripto', 'scalping'],
        perfPct: 12.5,
        lastRunDate: '2025-10-25',
      },
      {
        id: '2',
        name: 'ETH Grid Bot',
        tags: ['kripto', 'grid'],
        perfPct: 8.3,
        lastRunDate: '2025-10-24',
      },
      {
        id: '3',
        name: 'BIST30 Momentum',
        tags: ['bist', 'swing'],
        perfPct: 15.2,
        lastRunDate: '2025-10-23',
      },
      {
        id: '4',
        name: 'Tesla Spot',
        tags: ['hisse', 'spot'],
        perfPct: -2.1,
        lastRunDate: '2025-10-22',
      },
      {
        id: '5',
        name: 'SOL Scalper',
        tags: ['kripto', 'scalping'],
        perfPct: 6.7,
        lastRunDate: '2025-10-21',
      },
    ],
  });
}
```

---

## ✅ 1 Günlük Geri Dönüş Planı

### Sabah (4 saat)

1. **Klasör iskeleti** (15 dk)
   ```bash
   mkdir -p app/{portfolio,strategies,running,strategy-lab,settings,api/mock/{home,running,portfolio,strategies,market}}
   mkdir -p components/{ui,layout}
   ```

2. **Design tokens** (30 dk)
   - `app/globals.css` içine yukarıdaki CSS token'larını ekle
   - Tailwind config'e dark mode ekle: `darkMode: ['class']`

3. **Core bileşenler** (2 saat)
   - `StatusPill.tsx`
   - `MetricCard.tsx`
   - `StrategyCard.tsx`
   - `RunningStrategyTable.tsx`

4. **Layout** (1 saat)
   - `app/layout.tsx`: Sidebar + Header
   - `Sidebar.tsx`: Navigation menüsü
   - `ThemeToggle.tsx`: Light/Dark switch

### Öğleden Sonra (4 saat)

5. **Mock API'ler** (1 saat)
   - `/api/mock/*/route.ts` dosyalarını yukarıdaki şemalarla oluştur

6. **Sayfa şablonları** (2.5 saat)
   - Anasayfa (`/`)
   - Portföy (`/portfolio`)
   - Stratejilerim (`/strategies`)
   - Çalışan Stratejiler (`/running`)
   - Settings (`/settings`)
   - Strategy Lab (`/strategy-lab`)

7. **Test ve doğrulama** (30 dk)
   ```bash
   pnpm --filter web-next dev -- --port 3003
   # Her sayfayı tara, ekran görüntüleriyle karşılaştır
   ```

---

## 🎯 Başarı Kriterleri

**%90 Görsel Eşlik:**
- [ ] 6 sayfa çalışıyor ve rotalanıyor
- [ ] Dark/Light tema toggle edilebiliyor
- [ ] Status pills doğru renklerde
- [ ] Tablo ve kartlar ekran görüntüleriyle eşleşiyor
- [ ] Türkçe metinler yerinde

**Production-Ready (3 gün):**
- [ ] Mock API → Gerçek API entegrasyonu
- [ ] WebSocket canlı veri akışı
- [ ] Form validasyonları (Settings)
- [ ] Loading states & skeletons
- [ ] Error boundaries
- [ ] Axe + Lighthouse geçiyor (≥0.90)

---

## 🔄 Sonraki Adımlar

1. **Real-time WebSocket**: Portfolio ve running strategies canlı güncelleme
2. **Form Management**: React Hook Form + Zod validation (Settings sayfası)
3. **Chart Library**: Recharts ile PnL grafikleri (Strategy Lab)
4. **State Management**: Zustand/Redux Toolkit ile global state
5. **Authentication**: NextAuth.js entegrasyonu
6. **E2E Tests**: Playwright ile kritik akışlar

---

**Maintainer:** Spark Trading Team  
**Son güncelleme:** 2025-10-27  
**Kaynak:** Production UI Screenshots (Ekim 2025)

