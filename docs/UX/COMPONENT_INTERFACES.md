# Component Interfaces & TypeScript Contracts

**Amaç:** Spark Trading UI bileşenleri için TypeScript arayüzleri ve veri sözleşmeleri  
**Kullanım:** Bu dosya `types/` dizininde gerçek type definition'lara dönüştürülecek

---

## 🎨 Core UI Components

### StatusPill

```typescript
/**
 * Durum göstergesi (Env, Feed, Broker vb.)
 * WCAG 2.1 AA kontrast gereksinimlerini karşılar
 */
export type StatusType = 'ok' | 'warn' | 'error' | 'offline' | 'unknown';

export interface StatusPillProps {
  /** Görünen etiket (örn: "Env", "Feed") */
  label: string;
  
  /** Durumun değeri (örn: "Mock", "Healthy") */
  value: string;
  
  /** Renk ve görsel durum */
  status: StatusType;
  
  /** Screen reader için ek açıklama (opsiyonel) */
  srHint?: string;
  
  /** Test için data-testid override */
  testId?: string;
}

// Kullanım örneği:
// <StatusPill label="Env" value="Mock" status="unknown" srHint="Ortam: Deneme modu" />
```

---

### MetricCard

```typescript
/**
 * Dashboard için metrik kartı
 * Canlı veri göstergesi, trend ok, aksiyon butonları destekler
 */
export interface MetricCardProps {
  /** Kart başlığı */
  title: string;
  
  /** Ana değer (sayı veya string) */
  value: string | number;
  
  /** Alt başlık veya açıklama */
  subtitle?: string;
  
  /** Sol üst ikonu */
  icon?: React.ReactNode;
  
  /** Trend bilgisi (pozitif/negatif yön) */
  trend?: {
    value: number;  // Yüzde değeri (örn: 2.5)
    label: string;  // Açıklama (örn: "24 saat")
  };
  
  /** Canlı veri göstergesi (yeşil pulse dot) */
  isLive?: boolean;
  
  /** Kart alt kısmındaki aksiyon alanı */
  actions?: React.ReactNode;
  
  /** Loading skeleton göster */
  isLoading?: boolean;
  
  /** Error durumu */
  error?: string;
}

// Kullanım örneği:
// <MetricCard
//   title="Toplam PnL"
//   value="+1.247,50 $"
//   subtitle="24 saat P&L"
//   trend={{ value: 2.5, label: "önceki gün" }}
//   isLive
// />
```

---

### StrategyCard

```typescript
/**
 * Strateji grid view için kart
 * Tag'ler, performans, son çalıştırma tarihi ve aksiyon butonları
 */
export interface StrategyCardProps {
  /** Unique ID */
  id: string;
  
  /** Strateji adı */
  name: string;
  
  /** Tag'ler (kripto, bist, hisse, scalping, grid vb.) */
  tags: StrategyTag[];
  
  /** Performans yüzdesi */
  perfPct: number;
  
  /** Son çalıştırma tarihi (ISO 8601 veya formatted) */
  lastRunDate: string;
  
  /** Düzenle callback */
  onEdit: (id: string) => void;
  
  /** Çalıştır callback */
  onRun: (id: string) => void;
  
  /** Disabled durumu */
  disabled?: boolean;
  
  /** Açıklama metni (hover tooltip) */
  description?: string;
}

export type StrategyTag = 
  | 'kripto' 
  | 'bist' 
  | 'hisse' 
  | 'scalping' 
  | 'grid' 
  | 'spot' 
  | 'swing';

// Kullanım örneği:
// <StrategyCard
//   id="btc-ema-1"
//   name="BTC EMA Crossover"
//   tags={['kripto', 'scalping']}
//   perfPct={12.5}
//   lastRunDate="2025-10-25"
//   onEdit={(id) => router.push(`/strategies/${id}/edit`)}
//   onRun={(id) => startStrategy(id)}
// />
```

---

### RunningStrategyTable

```typescript
/**
 * Çalışan stratejiler için tablo
 * Durum, PnL, işlemler, aksiyonlar (duraklat/devam/durdur)
 */
export interface RunningStrategy {
  /** Unique ID */
  id: string;
  
  /** Strateji adı */
  name: string;
  
  /** Çalışma durumu */
  status: StrategyStatus;
  
  /** Kar/Zarar (USD) */
  pnlUSD: number;
  
  /** Toplam işlem sayısı */
  trades: number;
  
  /** Sermaye (USD) */
  capitalUSD: number;
  
  /** Başlangıç zamanı (formatted veya ISO) */
  startedAt: string;
  
  /** Son güncelleme timestamp (staleness kontrolü için) */
  lastUpdateMs?: number;
}

export type StrategyStatus = 'running' | 'paused' | 'stopped';

export interface RunningStrategyTableProps {
  /** Stratejiler listesi */
  strategies: RunningStrategy[];
  
  /** Duraklat/Devam toggle */
  onTogglePause: (id: string) => void;
  
  /** Durdur */
  onStop: (id: string) => void;
  
  /** Loading durumu */
  isLoading?: boolean;
  
  /** WebSocket bağlantı durumu */
  wsConnected?: boolean;
}

// Kullanım örneği:
// <RunningStrategyTable
//   strategies={runningStrategies}
//   onTogglePause={(id) => api.pauseStrategy(id)}
//   onStop={(id) => api.stopStrategy(id)}
//   wsConnected={wsStatus === 'connected'}
// />
```

---

### ThemeToggle

```typescript
/**
 * Light/Dark tema toggle'ı
 * Sidebar altında veya header'da gösterilir
 */
export interface ThemeToggleProps {
  /** Şu anki tema */
  currentTheme: 'light' | 'dark';
  
  /** Tema değiştirme callback */
  onThemeChange: (theme: 'light' | 'dark') => void;
  
  /** Dropdown veya switch modu */
  variant?: 'dropdown' | 'switch';
  
  /** Label göster/gizle */
  showLabel?: boolean;
}

// Kullanım örneği:
// <ThemeToggle
//   currentTheme="dark"
//   onThemeChange={(theme) => setTheme(theme)}
//   variant="dropdown"
//   showLabel
// />
```

---

## 📡 API Response Schemas

### Home Dashboard Data

```typescript
/**
 * Anasayfa için toplam veri
 * GET /api/mock/home veya /api/dashboard
 */
export interface HomeDashboardResponse {
  runningStrategies: {
    name: string;
    pnl: number;
    status: StrategyStatus;
  }[];
  
  marketData: {
    symbol: string;
    price: string;
    changePct: number;
    lastUpdateSec: number;
  }[];
  
  systemStatus: {
    env: string;
    feed: StatusType;
    broker: StatusType;
  };
}
```

---

### Running Strategies Data

```typescript
/**
 * Çalışan stratejiler listesi
 * GET /api/mock/running veya /api/strategies/running
 */
export interface RunningStrategiesResponse {
  strategies: RunningStrategy[];
  
  /** Toplam istatistikler */
  summary?: {
    totalPnlUSD: number;
    activeCount: number;
    pausedCount: number;
    stoppedCount: number;
  };
}
```

---

### Portfolio Data

```typescript
/**
 * Portföy özeti ve pozisyonlar
 * GET /api/mock/portfolio veya /api/portfolio
 */
export interface PortfolioResponse {
  exchange: {
    name: string;
    online: boolean;
    lastSyncSec: number;
    rateLimit: string;  // örn: "1200/1200"
  };
  
  totals: {
    pnl24hUSD: number;
    totalUSD: number;
    freeUSD: number;
    lockedUSD: number;
  };
  
  positions: Position[];
}

export interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  pnlUSD: number;
  pnlPct: number;
  
  /** Pozisyon yönü */
  side?: 'long' | 'short';
  
  /** Leverage (futures için) */
  leverage?: number;
}
```

---

### Strategies List Data

```typescript
/**
 * Tüm stratejiler (grid view için)
 * GET /api/mock/strategies veya /api/strategies
 */
export interface StrategiesListResponse {
  strategies: StrategyCardData[];
  
  /** Toplam sayı (pagination için) */
  total: number;
  
  /** Filtre seçenekleri */
  filters?: {
    markets: string[];
    types: string[];
  };
}

export interface StrategyCardData {
  id: string;
  name: string;
  tags: StrategyTag[];
  perfPct: number;
  lastRunDate: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

### Settings API Keys

```typescript
/**
 * API anahtarları yönetimi
 * GET/POST /api/settings/keys
 */
export interface ApiKeysResponse {
  binance?: {
    apiKey: string;  // Masked: "BIN...XYZ"
    hasSecret: boolean;
    isValid: boolean;
    lastTestedAt?: string;
  };
  
  openai?: {
    apiKey: string;  // Masked: "sk-...ABC"
    hasSecret: boolean;
    isValid: boolean;
  };
}

export interface ApiKeysSaveRequest {
  provider: 'binance' | 'openai';
  apiKey: string;
  secretKey?: string;  // Binance için gerekli
}

export interface ApiKeysTestRequest {
  provider: 'binance' | 'openai';
}

export interface ApiKeysTestResponse {
  success: boolean;
  message: string;
  details?: {
    rateLimits?: string;
    accountType?: string;
    permissions?: string[];
  };
}
```

---

### Strategy Lab AI Request

```typescript
/**
 * AI strategy generation
 * POST /api/strategy-lab/generate
 */
export interface StrategyGenerateRequest {
  model: 'gpt-4' | 'gpt-3.5-turbo';
  prompt: string;
  
  /** Backtest parametreleri */
  backtestConfig?: {
    symbol: string;
    interval: string;
    startDate: string;
    endDate: string;
  };
}

export interface StrategyGenerateResponse {
  success: boolean;
  strategyCode?: string;  // Python/Pine Script
  backtestResult?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  error?: string;
}
```

---

## 🔄 WebSocket Message Types

### Real-time Portfolio Updates

```typescript
/**
 * WebSocket mesajları (ws://localhost:4001/portfolio)
 */
export type PortfolioWSMessage = 
  | { type: 'position_update'; data: Position }
  | { type: 'pnl_update'; data: { totalPnl: number; change: number } }
  | { type: 'connection_status'; data: { connected: boolean; exchange: string } };
```

---

### Real-time Strategy Updates

```typescript
/**
 * WebSocket mesajları (ws://localhost:4001/strategies)
 */
export type StrategyWSMessage = 
  | { type: 'status_change'; data: { id: string; status: StrategyStatus } }
  | { type: 'pnl_update'; data: { id: string; pnl: number; trades: number } }
  | { type: 'error'; data: { id: string; message: string } };
```

---

## 🛡️ Error Handling

### Standard Error Response

```typescript
/**
 * Tüm API endpoint'leri için standart hata formatı
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;  // örn: "INVALID_API_KEY", "RATE_LIMIT"
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

// Başarılı response için:
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Generic API response:
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## 🎯 Form Validation Schemas

### API Keys Form (Zod)

```typescript
import { z } from 'zod';

export const BinanceApiKeySchema = z.object({
  apiKey: z.string()
    .min(64, 'Binance API Key 64 karakter olmalıdır')
    .regex(/^[A-Za-z0-9]+$/, 'Sadece alfanumerik karakterler'),
  
  secretKey: z.string()
    .min(64, 'Secret Key 64 karakter olmalıdır')
    .regex(/^[A-Za-z0-9]+$/, 'Sadece alfanumerik karakterler'),
});

export const OpenAIApiKeySchema = z.object({
  apiKey: z.string()
    .startsWith('sk-', 'OpenAI API Key "sk-" ile başlamalıdır')
    .min(40, 'API Key çok kısa'),
});

export type BinanceApiKeyInput = z.infer<typeof BinanceApiKeySchema>;
export type OpenAIApiKeyInput = z.infer<typeof OpenAIApiKeySchema>;
```

---

### Strategy Lab Prompt Form

```typescript
import { z } from 'zod';

export const StrategyPromptSchema = z.object({
  model: z.enum(['gpt-4', 'gpt-3.5-turbo']),
  
  prompt: z.string()
    .min(20, 'Prompt en az 20 karakter olmalıdır')
    .max(2000, 'Prompt maksimum 2000 karakter olabilir'),
  
  symbol: z.string()
    .regex(/^[A-Z]+USDT$/, 'Geçerli bir sembol giriniz (örn: BTCUSDT)'),
  
  interval: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type StrategyPromptInput = z.infer<typeof StrategyPromptSchema>;
```

---

## 🧪 Test Utilities

### Mock Data Generators

```typescript
/**
 * Test için mock veri üreticileri
 */
export const mockRunningStrategy = (overrides?: Partial<RunningStrategy>): RunningStrategy => ({
  id: `strategy-${Math.random()}`,
  name: 'Mock Strategy',
  status: 'running',
  pnlUSD: 125.50,
  trades: 12,
  capitalUSD: 1000,
  startedAt: '10:30',
  lastUpdateMs: Date.now(),
  ...overrides,
});

export const mockPosition = (overrides?: Partial<Position>): Position => ({
  symbol: 'BTCUSDT',
  qty: 0.25,
  avgPrice: 42500,
  currentPrice: 43000,
  pnlUSD: 125,
  pnlPct: 2.1,
  side: 'long',
  ...overrides,
});
```

---

## 📝 Usage Examples

### Fetching Running Strategies

```typescript
// Server Component (Next.js 14)
async function RunningStrategiesPage() {
  const data: RunningStrategiesResponse = await fetch(
    'http://localhost:3003/api/running'
  ).then(r => r.json());

  return (
    <RunningStrategyTable
      strategies={data.strategies}
      onTogglePause={async (id) => {
        'use server';
        await pauseStrategy(id);
      }}
      onStop={async (id) => {
        'use server';
        await stopStrategy(id);
      }}
    />
  );
}
```

---

### Client-side WebSocket

```typescript
'use client';

import { useEffect, useState } from 'react';

function usePortfolioStream() {
  const [data, setData] = useState<PortfolioResponse | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:4001/portfolio');
    
    ws.onmessage = (event) => {
      const msg: PortfolioWSMessage = JSON.parse(event.data);
      
      if (msg.type === 'position_update') {
        setData(prev => ({
          ...prev!,
          positions: prev!.positions.map(p => 
            p.symbol === msg.data.symbol ? msg.data : p
          ),
        }));
      }
    };

    return () => ws.close();
  }, []);

  return data;
}
```

---

## 🚀 Implementation Priority

1. **Öncelik 1 (Kritik):**
   - `RunningStrategy`, `Position`, `StrategyCardData`
   - `StatusPillProps`, `MetricCardProps`

2. **Öncelik 2 (Önemli):**
   - `ApiKeysResponse`, `PortfolioResponse`
   - Form validation schemas (Zod)

3. **Öncelik 3 (Nice-to-have):**
   - WebSocket message types
   - Test utilities
   - Strategy Lab AI schemas

---

**Maintainer:** Spark Trading Team  
**Son güncelleme:** 2025-10-27  
**İlgili Dosyalar:** `UI_RECONSTRUCTION_PLAN.md`, `CI_USAGE.md`

