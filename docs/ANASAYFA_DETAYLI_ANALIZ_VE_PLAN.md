# Spark Trading Platform — Anasayfa Detaylı Analiz ve Entegrasyon Planı

**Versiyon:** v3.0
**Tarih:** 2025-01-20
**Durum:** 🟢 Aktif Geliştirme
**Kapsam:** Tüm Sayfalar, Özellikler ve Anasayfa Entegrasyonu

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mevcut Sayfa ve Özellik Envanteri](#mevcut-sayfa-ve-özellik-envanteri)
3. [Anasayfa Mevcut Durum Analizi](#anasayfa-mevcut-durum-analizi)
4. [Entegrasyon Gereksinimleri](#entegrasyon-gereksinimleri)
5. [Anasayfa Yerleşim Planı](#anasayfa-yerleşim-planı)
6. [Widget ve Bileşen Kataloğu](#widget-ve-bileşen-kataloğu)
7. [API Endpoint Haritası](#api-endpoint-haritası)
8. [State Yönetimi ve Store'lar](#state-yönetimi-ve-storelar)
9. [Uygulama Yol Haritası](#uygulama-yol-haritası)
10. [Teknik Detaylar ve Mimari](#teknik-detaylar-ve-mimari)

---

## 1. Proje Genel Bakış

### 1.1. Teknoloji Stack

- **Framework:** Next.js 14 (App Router)
- **Dil:** TypeScript (strict mode)
- **State Management:** Zustand (marketStore, copilotStore, strategyLabStore)
- **Styling:** Tailwind CSS + CSS Variables
- **UI Components:** Custom component library (shadcn/ui tabanlı)
- **Data Fetching:** SWR, fetch API, WebSocket
- **Testing:** Playwright (E2E), Jest (unit)
- **Package Manager:** pnpm (workspace monorepo)

### 1.2. Mimari Yapı

```
apps/web-next/
├── src/
│   ├── app/                    # Next.js App Router sayfaları
│   ├── components/             # React bileşenleri
│   ├── lib/                     # Utility fonksiyonları
│   ├── hooks/                   # Custom React hooks
│   ├── stores/                  # Zustand store'ları
│   ├── types/                   # TypeScript type tanımları
│   └── api/                     # API route handlers
```

### 1.3. Tasarım Prensipleri

- **Dark Theme:** Siyah (#000) arka plan, koyu gri kartlar (#0F0F0F)
- **WCAG 2.2 Uyumlu:** Target Size ≥24px, Focus Not Obscured, Live Regions
- **Responsive:** Container queries, clamp(), fluid typography
- **Zero-Scroll Layout:** Tek ekran, iç scroll yok
- **Information Density:** Yüksek bilgi/alan oranı (Material Design dense)

---

## 2. Mevcut Sayfa ve Özellik Envanteri

### 2.1. Ana Sayfalar (Routes)

| Route | Sayfa Adı | Durum | Özellikler |
|-------|-----------|-------|------------|
| `/dashboard` | Anasayfa | ✅ Aktif | Stratejiler, Portföy, Piyasa, Haberler |
| `/piyasa` | Piyasa Verileri | ✅ Aktif | MarketGrid, OrderBook, Time&Sales, Depth Chart |
| `/strategies` | Stratejilerim | ✅ Aktif | Strateji listesi, oluşturma, düzenleme, silme |
| `/running` | Çalışan Stratejiler | ✅ Aktif | Aktif stratejiler, durdurma/başlatma |
| `/portfolio` | Portföy | ✅ Aktif | Pozisyonlar, P&L, borsa durumu |
| `/strategy-lab` | Strateji Lab | ✅ Aktif | Generate, Backtest, Optimize, Deploy |
| `/backtest` | Backtest | 🔄 Redirect | `/strategy-lab?tab=backtest`'e yönlendirir |
| `/technical-analysis` | Teknik Analiz | ✅ Aktif | Teknik göstergeler, grafikler |
| `/alerts` | Uyarılar | ✅ Aktif | Alert yönetimi, geçmiş, test |
| `/observability` | Gözlemlenebilirlik | ✅ Aktif | Sistem sağlığı, metrikler |
| `/audit` | Denetim | ✅ Aktif | Audit logları, filtreleme |
| `/guardrails` | Koruma Doğrulama | ✅ Aktif | Risk guardrails |
| `/settings` | Ayarlar | ✅ Aktif | API keys, genel ayarlar |
| `/reports/verify` | Rapor Doğrulama | ✅ Aktif | Rapor imzalama (admin) |

### 2.2. Özellik Kategorileri

#### 📊 Piyasa Verileri
- **MarketGrid:** Sembol listesi, fiyat, değişim, sparkline
- **OrderBookLadder:** Derinlik tablosu, zoom presets
- **TimeAndSales:** İşlem akışı, delta merge
- **DepthChart:** Derinlik grafiği
- **MarketMiniGrid:** Kompakt piyasa kartları (dashboard için)

#### 🤖 Strateji Yönetimi
- **StrategyList:** Strateji listesi, filtreleme, arama
- **StrategyDetailPanel:** Detay görünümü, düzenleme
- **StrategyControls:** Başlat/durdur/pause
- **CreateStrategyModal:** Yeni strateji oluşturma
- **RunningStrategies:** Aktif stratejiler görünümü

#### 💼 Portföy
- **PortfolioTable:** Pozisyon tablosu
- **OptimisticPositionsTable:** Optimistic UI updates
- **AllocationDonut:** Varlık dağılımı grafiği
- **SummaryCards:** Özet kartlar (bakiye, P&L, risk)

#### 🧪 Strateji Lab
- **GenerateTab:** AI strateji üretimi
- **BacktestTab:** Backtest çalıştırma ve sonuçlar
- **OptimizeTab:** Parametre optimizasyonu
- **DeployTab:** Strateji deploy etme

#### 🔔 Uyarılar
- **AlertsControl:** Alert yönetimi widget'ı
- **AlertPresets:** Hazır alert şablonları
- **Alert History:** Trigger geçmişi

#### 📈 Teknik Analiz
- **TechnicalOverview:** Teknik göstergeler özeti
- **Chart Components:** Grafik bileşenleri
- **Indicator Panels:** RSI, MACD, Bollinger Bands vb.

#### 🔍 Observability
- **ObservabilityCards:** Sistem metrikleri kartları
- **Health Widgets:** Servis sağlık göstergeleri
- **Metrics Display:** Prometheus metrikleri

#### 🤝 Copilot
- **CopilotDock:** Sağ panel chat interface
- **UnifiedFeed:** Chat + execution feed
- **Composer:** Komut girişi
- **QuickPrompt:** Hızlı komutlar

---

## 3. Anasayfa Mevcut Durum Analizi

### 3.1. Mevcut Layout (Holy Grail 3-Kolon)

```
┌─────────────────────────────────────────────────────────────┐
│ StatusBar (Sticky) - P95, Gecikme, EB, API/WS/Executor     │
├──────────┬──────────────────────────────┬──────────────────┤
│          │                              │                  │
│ LeftNav  │   Dashboard Center           │  CopilotDock     │
│          │   ┌──────────┬──────────┐   │                  │
│ - Home   │   │Strategies│Portfolio │   │  Chat Feed       │
│ - Market │   │  Card    │   Card   │   │  + Executions    │
│ - Lab    │   ├──────────┼──────────┤   │                  │
│ - ...    │   │  Market  │   News   │   │  Composer        │
│          │   │ MiniGrid │ Compact  │   │  + Quick Cmds    │
│          │   └──────────┴──────────┘   │                  │
│          │                              │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

### 3.2. Mevcut Kartlar

#### ✅ StrategiesCard (Sol Üst - 6/12)
- **Durum:** ✅ Aktif
- **İçerik:**
  - Üst şerit: Aktif sayı, Toplam Getiri, Bugünkü Getiri, Açık Pozisyon
  - Mini-liste: İlk 5 strateji (Ad, P&L, Sharpe, WinRate, Durum, Aksiyon)
  - Sparkline: 30g P&L trendi
  - Son çalıştırma ve gecikme bilgisi
- **API:** `/api/strategies/active?limit=5`
- **Tip:** `StrategyRow[]`

#### ✅ PortfolioCard (Sağ Üst - 6/12)
- **Durum:** ✅ Aktif
- **İçerik:**
  - Toggle: 1D · 1W · 1M · 1Y
  - Equity sparkline
  - Metrikler: Bugünkü P&L, Max DD (30g), Vol (30g), Varlık sayısı
  - Top 5 Varlık mikro-liste
- **API:** `/api/portfolio/overview?window=1D|1W|1M|1Y`
- **Tip:** `PortfolioOverview`

#### ✅ MarketMiniGrid (Sol Alt - 6/12)
- **Durum:** ✅ Aktif
- **İçerik:**
  - 2×3 grid (xl: 3×2) piyasa kartları
  - Sembol, fiyat, değişim %, sparkline
  - Görünürlük tabanlı subscription
- **Data Source:** `marketStore` (WebSocket)

#### ✅ LiveNewsCompact (Sağ Alt - 6/12)
- **Durum:** ✅ Aktif
- **İçerik:**
  - Canlı haber akışı (CoinDesk, CryptoNews, KAP)
  - Okunmamış sayaç
  - Başlık, kaynak, zaman damgası
- **API:** Mock (gelecekte `/api/news/live`)

### 3.3. Mevcut Eksikler ve İyileştirme Fırsatları

#### 🔴 Kritik Eksikler
1. **Sistem Sağlık Widget'ı Yok**
   - SmokeCard, CanaryCard, AlarmCard dashboard'da görünmüyor
   - SystemHealthDot, MarketsHealthWidget kullanılmıyor

2. **Backtest Sonuçları Entegrasyonu Yok**
   - Strategy Lab'deki backtest sonuçları dashboard'a yansımıyor
   - Son başarılı backtest'ler gösterilmiyor

3. **Alert Özeti Yok**
   - Aktif alert sayısı StatusBar'da var ama detay yok
   - Kritik alert'ler dashboard'da gösterilmiyor

4. **Risk Metrikleri Eksik**
   - Guardrails durumu görünmüyor
   - Risk raporu entegrasyonu yok

5. **Piyasa Özeti Eksik**
   - Piyasa genel durumu (health, volume, volatility) yok
   - Top movers listesi yok

#### 🟡 Orta Öncelikli İyileştirmeler
1. **Session Analysis**
   - Günlük trading özeti yok
   - Performans karşılaştırması yok

2. **Drafts Badge/List**
   - Strateji taslakları gösterilmiyor
   - Hızlı erişim yok

3. **Insights Lazy**
   - AI önerileri/yorumları yok
   - Trend analizi yok

4. **Quick Actions**
   - Hızlı işlem butonları eksik
   - Favori semboller için hızlı erişim yok

#### 🟢 Düşük Öncelikli İyileştirmeler
1. **Evidence Button**
   - Snapshot export butonu eksik
   - Kanıt toplama aracı yok

2. **Copilot Summary Card**
   - Copilot özeti yok
   - Son komutlar özeti yok

---

## 4. Entegrasyon Gereksinimleri

### 4.1. Widget Entegrasyon Öncelikleri

#### P0 (Kritik - Hemen)
1. **SystemHealthWidget** → Dashboard'a ekle
   - SmokeCard, CanaryCard, AlarmCard
   - Sistem sağlık durumu görünürlüğü

2. **MarketsHealthWidget** → Dashboard'a ekle
   - Piyasa bağlantı durumu
   - Veri kalitesi metrikleri

3. **RiskGuardrailsWidget** → Dashboard'a ekle
   - Guardrails durumu
   - Risk uyarıları

4. **AlarmsWidget** → Dashboard'a ekle
   - Aktif alarm sayısı
   - Kritik alarmlar listesi

#### P1 (Yüksek - 1 Hafta)
1. **ActiveStrategiesWidget** → Dashboard'a ekle
   - Detaylı strateji performansı
   - Strateji karşılaştırması

2. **Backtest Results Summary** → Dashboard'a ekle
   - Son backtest sonuçları
   - Performans özeti

3. **SessionAnalysis** → Dashboard'a ekle
   - Günlük trading özeti
   - Karşılaştırmalı metrikler

4. **OrdersQuickActions** → Dashboard'a ekle
   - Hızlı emir butonları
   - Favori semboller

#### P2 (Orta - 2 Hafta)
1. **DraftsList** → Dashboard'a ekle
   - Strateji taslakları
   - Hızlı erişim

2. **InsightsLazy** → Dashboard'a ekle
   - AI önerileri
   - Trend analizi

3. **CopilotSummaryCard** → Dashboard'a ekle
   - Copilot özeti
   - Son komutlar

4. **SmokeHistoryCard** → Dashboard'a ekle
   - Smoke test geçmişi
   - Trend grafiği

### 4.2. API Entegrasyonları

#### Mevcut API'ler (Kullanılıyor)
- ✅ `/api/strategies/active` → StrategiesCard
- ✅ `/api/portfolio/overview` → PortfolioCard
- ✅ `/api/alerts/list` → AlertsPage
- ✅ `/api/public/metrics` → StatusBar

#### Gerekli Yeni API'ler
- 🔴 `/api/dashboard/summary` → Dashboard özet metrikleri
- 🔴 `/api/system/health` → Sistem sağlık durumu
- 🔴 `/api/backtest/recent` → Son backtest sonuçları
- 🔴 `/api/guardrails/status` → Guardrails durumu
- 🟡 `/api/dashboard/insights` → AI önerileri
- 🟡 `/api/news/live` → Canlı haberler (gerçek API)

---

## 5. Anasayfa Yerleşim Planı

### 5.1. Önerilen Yeni Layout (2×3 Grid)

```
┌─────────────────────────────────────────────────────────────┐
│ StatusBar (Sticky) - P95, Gecikme, EB, API/WS/Executor   │
├──────────┬──────────────────────────────┬──────────────────┤
│          │                              │                  │
│ LeftNav  │   Dashboard Center           │  CopilotDock     │
│          │   ┌──────────┬──────────┐   │                  │
│ - Home   │   │Strategies│Portfolio │   │  Chat Feed       │
│ - Market │   │  Card    │   Card   │   │  + Executions    │
│ - Lab    │   ├──────────┼──────────┤   │                  │
│ - ...    │   │  System  │  Markets │   │  Composer        │
│          │   │  Health  │  Health  │   │  + Quick Cmds    │
│          │   ├──────────┼──────────┤   │                  │
│          │   │  Alerts  │  Risk    │   │                  │
│          │   │  Widget  │Guardrails│   │                  │
│          │   └──────────┴──────────┘   │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

### 5.2. Detaylı Grid Yerleşimi (12 Kolon)

#### Satır 1: Stratejiler ve Portföy (Mevcut)
- **StrategiesCard** (col: 1-6, row: 1)
- **PortfolioCard** (col: 7-12, row: 1)

#### Satır 2: Sistem ve Piyasa Sağlığı (YENİ)
- **SystemHealthCard** (col: 1-6, row: 2)
  - SmokeCard, CanaryCard, AlarmCard içerir
  - Sistem sağlık durumu
- **MarketsHealthCard** (col: 7-12, row: 2)
  - Piyasa bağlantı durumu
  - Veri kalitesi metrikleri

#### Satır 3: Uyarılar ve Risk (YENİ)
- **AlertsSummaryCard** (col: 1-6, row: 3)
  - Aktif alert sayısı
  - Kritik alertler listesi
- **RiskGuardrailsCard** (col: 7-12, row: 3)
  - Guardrails durumu
  - Risk uyarıları

#### Alternatif: 2×2 Layout (Mevcut + Ekstra Kartlar)

```
┌──────────┬──────────┐
│Strategies│Portfolio │
├──────────┼──────────┤
│  Market  │   News   │
├──────────┼──────────┤
│  System  │  Markets │
│  Health  │  Health  │
├──────────┼──────────┤
│  Alerts  │   Risk   │
└──────────┴──────────┘
```

**Not:** 2×2 layout için scroll gerekir (zero-scroll prensibine aykırı). 2×3 layout önerilir.

### 5.3. Responsive Breakpoints

- **Desktop (≥1280px):** 2×3 grid, tüm kartlar görünür
- **Tablet (768-1279px):** 2×2 grid, alt satır scroll ile
- **Mobile (<768px):** 1 kolon, dikey stack

---

## 6. Widget ve Bileşen Kataloğu

### 6.1. Mevcut Dashboard Widget'ları

| Widget | Dosya | Durum | Kullanım |
|--------|-------|-------|----------|
| **ActiveStrategiesWidget** | `components/dashboard/ActiveStrategiesWidget.tsx` | ✅ Hazır | Strateji listesi |
| **AlarmCard** | `components/dashboard/AlarmCard.tsx` | ✅ Hazır | Alarm özeti |
| **AlarmsWidget** | `components/dashboard/AlarmsWidget.tsx` | ✅ Hazır | Alarm listesi |
| **CanaryCard** | `components/dashboard/CanaryCard.tsx` | ✅ Hazır | Canary test sonucu |
| **CanaryWidget** | `components/dashboard/CanaryWidget.tsx` | ✅ Hazır | Canary test widget'ı |
| **CopilotSummaryCard** | `components/dashboard/CopilotSummaryCard.tsx` | ✅ Hazır | Copilot özeti |
| **DraftsBadge** | `components/dashboard/DraftsBadge.tsx` | ✅ Hazır | Taslak rozeti |
| **DraftsList** | `components/dashboard/DraftsList.tsx` | ✅ Hazır | Taslak listesi |
| **EvidenceButton** | `components/dashboard/EvidenceButton.tsx` | ✅ Hazır | Snapshot export |
| **ExportSnapshotButton** | `components/dashboard/ExportSnapshotButton.tsx` | ✅ Hazır | Snapshot export |
| **InsightsLazy** | `components/dashboard/InsightsLazy.tsx` | ✅ Hazır | AI önerileri |
| **MarketsHealthWidget** | `components/dashboard/MarketsHealthWidget.tsx` | ✅ Hazır | Piyasa sağlığı |
| **MarketsWidget** | `components/dashboard/MarketsWidget.tsx` | ✅ Hazır | Piyasa widget'ı |
| **OrdersQuickActions** | `components/dashboard/OrdersQuickActions.tsx` | ✅ Hazır | Hızlı işlemler |
| **RiskGuardrailsWidget** | `components/dashboard/RiskGuardrailsWidget.tsx` | ✅ Hazır | Risk guardrails |
| **SessionAnalysis** | `components/dashboard/SessionAnalysis.tsx` | ✅ Hazır | Oturum analizi |
| **SmokeCard** | `components/dashboard/SmokeCard.tsx` | ✅ Hazır | Smoke test kartı |
| **SmokeHistoryCard** | `components/dashboard/SmokeHistoryCard.tsx` | ✅ Hazır | Smoke geçmişi |
| **StrategyControls** | `components/dashboard/StrategyControls.tsx` | ✅ Hazır | Strateji kontrolleri |
| **SummaryStrip** | `components/dashboard/SummaryStrip.tsx` | ✅ Hazır | Özet şerit |
| **SystemHealthDot** | `components/dashboard/SystemHealthDot.tsx` | ✅ Hazır | Sistem sağlık noktası |

### 6.2. Yeni Oluşturulacak Widget'lar

#### SystemHealthCard (YENİ)
```typescript
// components/home/compact/SystemHealthCard.tsx
- SmokeCard entegrasyonu
- CanaryCard entegrasyonu
- AlarmCard entegrasyonu
- Sistem sağlık durumu özeti
```

#### MarketsHealthCard (YENİ)
```typescript
// components/home/compact/MarketsHealthCard.tsx
- MarketsHealthWidget entegrasyonu
- Piyasa bağlantı durumu
- Veri kalitesi metrikleri
```

#### AlertsSummaryCard (YENİ)
```typescript
// components/home/compact/AlertsSummaryCard.tsx
- AlarmsWidget entegrasyonu
- Aktif alert sayısı
- Kritik alertler listesi
```

#### RiskGuardrailsCard (YENİ)
```typescript
// components/home/compact/RiskGuardrailsCard.tsx
- RiskGuardrailsWidget entegrasyonu
- Guardrails durumu
- Risk uyarıları
```

---

## 7. API Endpoint Haritası

### 7.1. Dashboard API'leri

#### Mevcut
- ✅ `GET /api/strategies/active?limit=5` → `StrategyRow[]`
- ✅ `GET /api/portfolio/overview?window=1D|1W|1M|1Y` → `PortfolioOverview`

#### Gerekli Yeni API'ler

**GET /api/dashboard/summary**
```typescript
Response: {
  errorBudget: number;
  api: ServiceStatus;
  ws: ServiceStatus;
  executor: ServiceStatus;
  balance: number;
  pnl24h: number;
  runningStrategies: number;
  activeAlerts: number;
}
```

**GET /api/system/health**
```typescript
Response: {
  smoke: { status: 'pass' | 'fail' | 'unknown'; lastRun: number };
  canary: { status: 'pass' | 'fail' | 'unknown'; lastRun: number };
  alarms: { critical: number; warning: number; total: number };
}
```

**GET /api/markets/health**
```typescript
Response: {
  binance: { connected: boolean; latency: number; dataQuality: number };
  btcturk: { connected: boolean; latency: number; dataQuality: number };
  overall: { status: 'healthy' | 'degraded' | 'down' };
}
```

**GET /api/guardrails/status**
```typescript
Response: {
  active: number;
  breached: number;
  status: 'ok' | 'warn' | 'critical';
  recentBreaches: Array<{ id: string; type: string; timestamp: number }>;
}
```

**GET /api/alerts/summary**
```typescript
Response: {
  total: number;
  active: number;
  critical: number;
  recent: Array<{ id: string; symbol: string; type: string; timestamp: number }>;
}
```

**GET /api/backtest/recent?limit=5**
```typescript
Response: Array<{
  id: string;
  strategyName: string;
  sharpe: number;
  winRate: number;
  pnl: number;
  completedAt: number;
}>
```

### 7.2. Diğer API'ler

#### Piyasa
- ✅ `GET /api/marketdata/candles` → Mum verileri
- ✅ `GET /api/marketdata/stream` → SSE stream
- ✅ `GET /api/market/btcturk/ticker` → BTCTurk ticker

#### Stratejiler
- ✅ `GET /api/strategies/list` → Strateji listesi
- ✅ `POST /api/strategies/create` → Strateji oluştur
- ✅ `POST /api/strategies/delete` → Strateji sil
- ✅ `POST /api/strategy/control` → Strateji kontrolü

#### Portföy
- ✅ `GET /api/portfolio` → Portföy detayları
- ✅ `GET /api/portfolio/pnl` → P&L detayları

#### Uyarılar
- ✅ `GET /api/alerts/list` → Alert listesi
- ✅ `POST /api/alerts/enable` → Alert aktif et
- ✅ `POST /api/alerts/disable` → Alert pasif et
- ✅ `POST /api/alerts/delete` → Alert sil
- ✅ `GET /api/alerts/history` → Alert geçmişi

#### Backtest
- ✅ `POST /api/backtest/run` → Backtest çalıştır
- ✅ `GET /api/backtest/portfolio` → Portföy backtest
- ✅ `POST /api/backtest/walkforward` → Walk-forward backtest

#### Strateji Lab
- ✅ `POST /api/lab/generate` → AI strateji üret
- ✅ `POST /api/lab/backtest` → Lab backtest
- ✅ `POST /api/lab/optimize` → Optimize et
- ✅ `POST /api/lab/publish` → Yayınla

#### Copilot
- ✅ `POST /api/copilot/action` → Copilot aksiyonu
- ✅ `POST /api/copilot/strategy/generate` → Strateji üret
- ✅ `POST /api/copilot/strategy/draft` → Taslak oluştur

#### Guardrails
- ✅ `GET /api/guardrails/read` → Guardrails oku
- ✅ `POST /api/guardrails/evaluate` → Değerlendir
- ✅ `POST /api/guardrails/approve` → Onayla

#### Observability
- ✅ `GET /api/public/metrics` → Prometheus metrikleri
- ✅ `GET /api/public/metrics2` → Metrikler v2
- ✅ `GET /api/public/engine-health` → Engine sağlığı
- ✅ `GET /api/public/error-budget` → Error budget

---

## 8. State Yönetimi ve Store'lar

### 8.1. Mevcut Store'lar

#### marketStore (`stores/marketStore.ts`)
```typescript
{
  tickers: Record<string, Ticker>;
  status: Health;
  lastUpdate?: number;
  wsReconnectTotal: number;
  paused: boolean;
  setTicker: (t: Ticker) => void;
  markStatus: (s: Health) => void;
  staleness: (symbol?: string) => Staleness;
}
```

#### copilotStore (`stores/copilotStore.ts`)
```typescript
{
  open: boolean;
  mode: CopilotMode;
  openWith: (mode: CopilotMode) => void;
  toggle: () => void;
  close: () => void;
}
```

#### strategyLabStore (`stores/strategyLabStore.ts`)
```typescript
{
  activeTab: 'generate' | 'backtest' | 'optimize' | 'deploy';
  setActiveTab: (tab: string) => void;
  // ... diğer state'ler
}
```

### 8.2. Önerilen Yeni Store'lar

#### dashboardStore (YENİ)
```typescript
// stores/dashboardStore.ts
{
  systemHealth: SystemHealth;
  marketsHealth: MarketsHealth;
  alertsSummary: AlertsSummary;
  riskGuardrails: RiskGuardrails;
  refreshAll: () => Promise<void>;
}
```

---

## 9. Uygulama Yol Haritası

### Faz 1: Kritik Widget Entegrasyonu (P0) - 1 Hafta

#### Gün 1-2: SystemHealthCard
- [ ] `SystemHealthCard.tsx` oluştur
- [ ] SmokeCard, CanaryCard, AlarmCard entegre et
- [ ] `/api/system/health` endpoint'i oluştur
- [ ] Dashboard'a ekle (row: 2, col: 1-6)
- [ ] E2E testleri yaz

#### Gün 3-4: MarketsHealthCard
- [ ] `MarketsHealthCard.tsx` oluştur
- [ ] MarketsHealthWidget entegre et
- [ ] `/api/markets/health` endpoint'i oluştur
- [ ] Dashboard'a ekle (row: 2, col: 7-12)
- [ ] E2E testleri yaz

#### Gün 5: AlertsSummaryCard
- [ ] `AlertsSummaryCard.tsx` oluştur
- [ ] AlarmsWidget entegre et
- [ ] `/api/alerts/summary` endpoint'i oluştur
- [ ] Dashboard'a ekle (row: 3, col: 1-6)
- [ ] E2E testleri yaz

#### Gün 6-7: RiskGuardrailsCard
- [ ] `RiskGuardrailsCard.tsx` oluştur
- [ ] RiskGuardrailsWidget entegre et
- [ ] `/api/guardrails/status` endpoint'i oluştur
- [ ] Dashboard'a ekle (row: 3, col: 7-12)
- [ ] E2E testleri yaz

### Faz 2: Yüksek Öncelikli Widget'lar (P1) - 1 Hafta

#### Gün 8-9: Backtest Results Summary
- [ ] Backtest sonuçları widget'ı oluştur
- [ ] `/api/backtest/recent` endpoint'i oluştur
- [ ] Dashboard'a ekle (opsiyonel: expandable card)
- [ ] E2E testleri yaz

#### Gün 10-11: SessionAnalysis
- [ ] SessionAnalysis widget'ını dashboard'a entegre et
- [ ] Günlük trading özeti görünümü
- [ ] E2E testleri yaz

#### Gün 12-14: OrdersQuickActions
- [ ] OrdersQuickActions widget'ını dashboard'a entegre et
- [ ] Hızlı emir butonları
- [ ] Favori semboller entegrasyonu
- [ ] E2E testleri yaz

### Faz 3: Orta Öncelikli Widget'lar (P2) - 2 Hafta

#### Hafta 3: DraftsList ve InsightsLazy
- [ ] DraftsList widget'ını dashboard'a entegre et
- [ ] InsightsLazy widget'ını dashboard'a entegre et
- [ ] `/api/dashboard/insights` endpoint'i oluştur
- [ ] E2E testleri yaz

#### Hafta 4: CopilotSummaryCard ve SmokeHistoryCard
- [ ] CopilotSummaryCard widget'ını dashboard'a entegre et
- [ ] SmokeHistoryCard widget'ını dashboard'a entegre et
- [ ] E2E testleri yaz

### Faz 4: İyileştirmeler ve Optimizasyon - Sürekli

- [ ] Performans optimizasyonu (lazy loading, memoization)
- [ ] Erişilebilirlik iyileştirmeleri (WCAG 2.2)
- [ ] Responsive tasarım iyileştirmeleri
- [ ] Kullanıcı geri bildirimleri ve iterasyon

---

## 10. Teknik Detaylar ve Mimari

### 10.1. Widget Oluşturma Şablonu

```typescript
// components/home/compact/ExampleCard.tsx
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ExampleCard({ className }: { className?: string }) {
  const { data, isLoading, error } = useSWR('/api/example/summary', fetcher, {
    refreshInterval: 5000, // 5 saniyede bir yenile
    revalidateOnFocus: true,
  });

  return (
    <Card data-size="m" className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="py-2 px-4 flex-none flex items-center justify-between border-b border-[#262626]">
        <h3 className="text-sm font-semibold text-white">Örnek Kart</h3>
        <Link
          href="/example"
          className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--warn)] focus-visible:outline-offset-2 rounded min-h-[24px] min-w-[24px]"
          rel="next"
          aria-label="Tümünü gör — Örnek Kart"
        >
          Tümünü gör
          <ChevronRight className="size-3" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="py-2 px-4 flex-1 min-h-0">
        {isLoading ? (
          <div className="text-xs text-[var(--fg-muted)] py-4 text-center">Yükleniyor...</div>
        ) : error ? (
          <div className="text-xs text-[var(--err)] py-4 text-center">Hata: {error.message}</div>
        ) : (
          // İçerik buraya
          <div>...</div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 10.2. API Route Şablonu

```typescript
// app/api/example/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // TODO: Gerçek veri kaynağına bağlan (DB/WS)
  // Şimdilik mock data döndür
  const mockData = {
    // ...
  };

  return NextResponse.json(mockData, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
```

### 10.3. CSS Grid Yerleşimi

```css
/* globals.css */
.card--example {
  grid-column: span 6;
  grid-row: 3; /* Satır numarası */
}
```

### 10.4. E2E Test Şablonu

```typescript
// tests/e2e/dashboard-widgets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard Widget Entegrasyonu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('ExampleCard görünür ve veri yükleniyor', async ({ page }) => {
    const card = page.locator('.card--example');
    await expect(card).toBeVisible();

    // API çağrısını kontrol et
    const response = await page.waitForResponse('/api/example/summary');
    expect(response.ok()).toBeTruthy();
  });
});
```

---

## 11. Özet ve Sonraki Adımlar

### 11.1. Hemen Yapılacaklar (Bu Hafta)

1. ✅ **SystemHealthCard** oluştur ve entegre et
2. ✅ **MarketsHealthCard** oluştur ve entegre et
3. ✅ **AlertsSummaryCard** oluştur ve entegre et
4. ✅ **RiskGuardrailsCard** oluştur ve entegre et
5. ✅ **API endpoint'leri** oluştur (`/api/system/health`, `/api/markets/health`, vb.)
6. ✅ **E2E testleri** yaz

### 11.2. Orta Vadeli Hedefler (1-2 Hafta)

1. Backtest sonuçları entegrasyonu
2. SessionAnalysis entegrasyonu
3. OrdersQuickActions entegrasyonu
4. DraftsList ve InsightsLazy entegrasyonu

### 11.3. Uzun Vadeli Hedefler (1 Ay+)

1. Performans optimizasyonu
2. Kullanıcı geri bildirimleri ve iterasyon
3. Yeni özellikler ve widget'lar
4. Erişilebilirlik iyileştirmeleri

---

## 12. Referanslar ve Kaynaklar

- [Material Design Dashboard Patterns](https://m2.material.io/design/layout/responsive-layout-grid.html)
- [Nielsen Norman Group Dashboard Design](https://www.nngroup.com/articles/dashboard-design/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Son Güncelleme:** 2025-01-20
**Versiyon:** 3.0
**Durum:** 🟢 Aktif Geliştirme

