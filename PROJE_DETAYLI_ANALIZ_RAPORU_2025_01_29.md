# Spark Trading Platform — Detaylı Proje Analizi

**Tarih:** 29 Ocak 2025
**Versiyon:** 1.3.2-SNAPSHOT
**Durum:** Aktif Geliştirme
**Analiz Kapsamı:** Tam Kod Tabanı + Mimari + Entegrasyonlar + CI/CD

---

## 📋 İçindekiler

1. [Executive Summary](#executive-summary)
2. [Proje Yapısı ve Mimari](#proje-yapısı-ve-mimari)
3. [Teknoloji Stack](#teknoloji-stack)
4. [Uygulamalar ve Servisler](#uygulamalar-ve-servisler)
5. [Sayfalar ve Özellikler](#sayfalar-ve-özellikler)
6. [State Management ve Veri Akışı](#state-management-ve-veri-akışı)
7. [API Endpoints](#api-endpoints)
8. [Test Stratejisi](#test-stratejisi)
9. [UI/UX Standartları](#uiux-standartları)
10. [CI/CD ve Otomasyon](#cicd-ve-otomasyon)
11. [Monitoring ve Metrikler](#monitoring-ve-metrikler)
12. [Geliştirme Süreçleri](#geliştirme-süreçleri)
13. [Kritik Dosyalar ve Konfigürasyonlar](#kritik-dosyalar-ve-konfigürasyonlar)
14. [Bilinen Sorunlar ve İyileştirme Alanları](#bilinen-sorunlar-ve-iyileştirme-alanları)
15. [Sonuç ve Öneriler](#sonuç-ve-öneriler)

---

## Executive Summary

### Proje Özeti

**Spark Trading Platform**, AI destekli algoritmik trading ve strateji geliştirme için geliştirilmiş kapsamlı bir Next.js tabanlı web platformudur. Platform, gerçek zamanlı piyasa verileri, strateji backtesting, AI destekli strateji üretimi, risk yönetimi ve gözlemlenebilirlik özellikleri sunar.

### Temel Özellikler

- ✅ **Gerçek Zamanlı Piyasa Verileri:** Binance ve BTCTurk WebSocket entegrasyonu
- ✅ **Strateji Geliştirme:** AI destekli strateji üretimi ve Monaco Editor tabanlı kod editörü
- ✅ **Backtesting:** Strateji performans testi ve optimizasyon
- ✅ **Risk Yönetimi:** Guardrails ve canary deployment
- ✅ **Portföy Yönetimi:** Çoklu borsa ve varlık takibi
- ✅ **Gözlemlenebilirlik:** Prometheus metrikleri ve Grafana dashboard'ları
- ✅ **Erişilebilirlik:** WCAG 2.2 AA uyumlu UI
- ✅ **i18n:** Türkçe/İngilizce dil desteği

### Proje Durumu

- **Versiyon:** 1.3.2-SNAPSHOT
- **Package Manager:** pnpm 10.18.3
- **Node Versiyonu:** v20.10.0 (portable binary: `tools/node-v20.10.0-win-x64/node.exe`)
- **Geliştirme Ortamı:** Windows 10, PowerShell
- **CI/CD:** GitHub Actions (25+ workflow)
- **Test Coverage:** Jest (unit) + Playwright (E2E)

### Kod İstatistikleri

- **Toplam Dosya:** 6800+ dosya
- **TypeScript/JavaScript:** ~50,000+ satır
- **UI Bileşenleri:** 150+ custom component
- **Sayfa Sayısı:** 51+ sayfa
- **API Endpoints:** 100+ route handler
- **Dokümantasyon:** 15+ kapsamlı belge (~4,000+ satır)

---

## Proje Yapısı ve Mimari

### Monorepo Yapısı

Proje **pnpm workspace** monorepo yapısında organize edilmiştir:

```
CursorGPT_IDE/
├── apps/                    # Uygulamalar
│   ├── web-next/           # Ana Next.js frontend (port 3003)
│   │   ├── src/
│   │   │   ├── app/        # Next.js App Router (166 dosya)
│   │   │   ├── components/ # UI bileşenleri (214 dosya)
│   │   │   ├── hooks/      # Custom React hooks (19 dosya)
│   │   │   ├── lib/        # Yardımcı fonksiyonlar (83 dosya)
│   │   │   ├── stores/    # Zustand stores (4 dosya)
│   │   │   └── ...
│   │   ├── tests/e2e/      # Playwright E2E testleri (20 dosya)
│   │   └── ...
│   ├── web-next-v2/        # Yeni versiyon (geliştirme aşamasında)
│   └── desktop-electron/   # Electron desktop uygulaması
├── services/                # Backend servisler
│   ├── executor/           # Trading engine (port 4001)
│   │   ├── src/
│   │   │   ├── routes/     # API routes (backtest, guardrails, errorBudget)
│   │   │   ├── state/      # State management
│   │   │   └── types/      # Type definitions
│   │   └── dist/           # Compiled output
│   ├── streams/            # WebSocket streams servisi
│   ├── marketdata/         # Market data orchestrator
│   ├── analytics/          # Analytics servisi
│   └── ml-engine/          # ML engine servisi
├── packages/                # Paylaşılan paketler
│   ├── @spark/             # Spark-specific paketler
│   │   ├── types/          # TypeScript tip tanımları
│   │   ├── db/             # Veritabanı client
│   │   ├── auth/           # Authentication
│   │   ├── guardrails/     # Risk yönetimi
│   │   └── ...
│   └── ...                 # Diğer paylaşılan paketler (30+ paket)
├── docs/                    # Dokümantasyon
│   ├── UI_UX_PLAN.md       # UI/UX standartları
│   ├── ARCHITECTURE.md     # Mimari dokümantasyonu
│   └── ...
├── tests/                   # E2E testler (root level)
├── tools/                   # Yardımcı araçlar
│   ├── smoke/              # Smoke test scriptleri
│   └── ...
├── .github/workflows/       # CI/CD workflows (25+ workflow)
└── monitoring/              # Prometheus/Grafana configs
```

### Workspace Konfigürasyonu

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
```

### İki Ajanlı Mimari

Platform, iki ana AI ajanı üzerine kuruludur:

1. **AI-1 (Operasyon/Süpervizör):**
   - Orkestrasyon ve koordinasyon
   - Guardrails ve risk yönetimi
   - Canary deployment kontrolü
   - Metrik eşikleri ve alerting
   - Pause/Resume operasyonları

2. **AI-2 (Strateji-Üretici):**
   - Doğal dil → IR (Intermediate Representation) derleme
   - Backtest ve optimizasyon
   - Strateji açıklama ve düzeltme önerileri
   - Kod üretimi ve mutasyon

---

## Teknoloji Stack

### Frontend (apps/web-next)

**Framework & Runtime:**
- Next.js 14.2.13 (App Router, Standalone output)
- React 18.3.1
- Node.js v20.10.0 (portable binary)

**State Management:**
- Zustand 5.0.8 (with persist middleware for localStorage)
- SWR 2.3.6 (data fetching, caching)

**UI & Styling:**
- Tailwind CSS 3.4.18 (utility-first)
- shadcn/ui components
- Monaco Editor 4.7.0 (code editing)
- Recharts 3.2.1 + Lightweight Charts 5.0.9 (charting)
- Lucide React 0.548.0 (icons)

**Form & Validation:**
- React Hook Form 7.65.0
- Zod 3.23.8 (schema validation)

**Testing:**
- Jest 30.2.0 (unit tests)
- Playwright 1.56.1 (E2E tests)
- @axe-core/playwright 5.0.0 (a11y tests)

**i18n:**
- Custom i18n implementation (TR/EN)
- Type-safe translations (40+ keys)

### Backend (services/executor)

**Framework:**
- Fastify 4.28.0
- @fastify/cors 9.0.1

**Metrics & Monitoring:**
- prom-client 15.1.3
- Prometheus metrics export

**Validation:**
- Zod 3.23.8

**Runtime:**
- Node.js v20.10.0

### Development Tools

**TypeScript:**
- TypeScript 5.6.0 (strict mode)
- tsconfig.json with strict checks

**Linting & Formatting:**
- ESLint 9.37.0
- Prettier 3.3.0

**Build:**
- Next.js standalone output
- tsup (for packages)
- tsc (for type declarations)

### Infrastructure

**Package Manager:**
- pnpm 10.18.3

**Monitoring:**
- Prometheus (metrics collection)
- Grafana (dashboards)

**WebSocket:**
- ws 8.18.3 (native WebSocket)

**Deployment:**
- Docker Compose
- Nginx reverse proxy
- PM2 (process management)

---

## Uygulamalar ve Servisler

### 5.1 apps/web-next (Ana Frontend)

**Port:** 3003
**Framework:** Next.js 14 App Router
**Output:** Standalone
**Base URL:** `http://127.0.0.1:3003`

**Özellikler:**
- ✅ App Router ile sayfa yönetimi
- ✅ Error ve not-found sayfaları
- ✅ ChunkLoadError guard
- ✅ WebSocket entegrasyonu
- ✅ Real-time market data
- ✅ Strategy Lab (AI destekli)
- ✅ Backtesting arayüzü
- ✅ Portfolio yönetimi
- ✅ Guardrails ve risk yönetimi
- ✅ Observability dashboard
- ✅ WCAG 2.2 AA erişilebilirlik
- ✅ Density toggle (compact/comfortable)
- ✅ Theme toggle (dark/light)
- ✅ Dev mode banner

**Önemli Dosyalar:**
- `src/app/layout.tsx` - Root layout (providers, global components)
- `src/app/dashboard/page.tsx` - Ana dashboard sayfası
- `src/components/layout/AppFrame.tsx` - Ana layout wrapper
- `src/components/left-nav.tsx` - Sol sidebar navigasyon
- `src/components/status-bar.tsx` - Üst durum çubuğu
- `src/providers/MarketProvider.tsx` - WebSocket market data provider

### 5.2 services/executor (Trading Engine)

**Port:** 4001
**Framework:** Fastify
**Base URL:** `http://127.0.0.1:4001`

**API Routes:**
- `/backtest` - Backtest execution
- `/guardrails/evaluate` - Risk evaluation
- `/guardrails/approve` - Risk approval
- `/errorBudget` - Error budget tracking

**Özellikler:**
- ✅ Strategy execution engine
- ✅ Guardrails ve risk yönetimi
- ✅ Canary deployment
- ✅ Prometheus metrics export
- ✅ Error budget tracking

### 5.3 services/streams (WebSocket Streams)

**Port:** 4001 (shared with executor)
**Özellikler:**
- ✅ WebSocket stream aggregation
- ✅ Binance ve BTCTurk entegrasyonu
- ✅ Prometheus metrics (ws_msgs_total, staleness)

### 5.4 services/marketdata (Market Data Orchestrator)

**Özellikler:**
- ✅ Market data aggregation
- ✅ History data (Binance, BTCTurk)
- ✅ WebSocket stream management

### 5.5 services/analytics (Analytics Service)

**Özellikler:**
- ✅ Backtest engine
- ✅ Technical indicators (TA)
- ✅ Performance analysis

### 5.6 services/ml-engine (ML Engine)

**Özellikler:**
- ✅ ML signal fusion
- ✅ Model scoring
- ✅ Optimization algorithms

---

## Sayfalar ve Özellikler

### Ana Sayfalar

#### 1. Dashboard (`/dashboard`)
- **Amaç:** Ana kontrol paneli, "tek bakışta" görünüm
- **Özellikler:**
  - Canlı piyasa verileri (Market Overview)
  - Çalışan stratejiler tablosu
  - Portföy P&L kartı
  - Sistem sağlık şeridi
  - Risk limit bar
  - Hızlı aksiyonlar
  - Copilot dock (sağ panel)
- **Layout:** 3-kolon grid (sol: haberler/portföy, sağ: copilot/stratejiler/piyasa)
- **State:** Loading, Error, Empty, Success states

#### 2. Strategy Lab (`/strategy-lab`)
- **Amaç:** AI destekli strateji geliştirme laboratuvarı
- **Tabs:**
  - Generate Tab: AI ile strateji üretimi
  - Backtest Tab: Strateji backtesting
  - Optimize Tab: Parametre optimizasyonu
  - Deploy Tab: Strateji deployment
- **Özellikler:**
  - Monaco Editor ile kod düzenleme
  - AI Copilot entegrasyonu
  - Backtest sonuçları görselleştirme
  - Guardrails kontrolü

#### 3. Portfolio (`/portfolio`)
- **Amaç:** Portföy yönetimi ve takibi
- **Özellikler:**
  - Canlı P&L gösterimi
  - Pozisyon tablosu
  - Exchange durumu
  - Risk özeti

#### 4. Market (`/market`)
- **Amaç:** Canlı piyasa verileri ve grafikler
- **Özellikler:**
  - Market grid (çoklu sembol)
  - Lightweight Charts entegrasyonu
  - Trading view

#### 5. Strategies (`/strategies`)
- **Amaç:** Strateji listesi ve yönetimi
- **Özellikler:**
  - Strateji listesi
  - Durum badge'leri
  - CRUD operasyonları

#### 6. Alerts (`/alerts`)
- **Amaç:** Alert yönetimi
- **Özellikler:**
  - Alert listesi
  - Alert presets
  - Webhook yönetimi

#### 7. Audit (`/audit`)
- **Amaç:** Audit log görüntüleme
- **Özellikler:**
  - Audit log tablosu
  - Filtreleme
  - Export

#### 8. Guardrails (`/guardrails`)
- **Amaç:** Risk yönetimi ve guardrails
- **Özellikler:**
  - Guardrail evaluation
  - Risk skorları
  - Approval workflow

#### 9. Settings (`/settings`)
- **Amaç:** Kullanıcı ayarları
- **Özellikler:**
  - API key yönetimi
  - Tercihler
  - Secret input (güvenli)

#### 10. Observability (`/observability`)
- **Amaç:** Sistem gözlemlenebilirliği
- **Özellikler:**
  - Metrics dashboard
  - Health checks
  - Error budget tracking

### Diğer Sayfalar

- `/backtest` - Backtest sayfası (redirects to `/strategy-lab?tab=backtest`)
- `/technical-analysis` - Teknik analiz araçları
- `/running` - Çalışan stratejiler
- `/login` - Giriş sayfası (placeholder)

---

## State Management ve Veri Akışı

### Zustand Stores

1. **marketStore** (`src/stores/marketStore.ts`)
   - WebSocket market data
   - Symbol subscriptions
   - Price updates

2. **copilotStore** (`src/stores/copilotStore.ts`)
   - Copilot panel state
   - Mode (analysis/manage/strategy)
   - Open/close state

3. **strategyLabStore** (`src/stores/strategyLabStore.ts`)
   - Strategy Lab state
   - Tab management
   - Draft strategies

4. **Density Store** (`src/hooks/useDensity.ts`)
   - UI density preference (compact/comfortable)
   - Persisted to localStorage

### Veri Akışı

```
WebSocket (Binance/BTCTurk)
    ↓
MarketProvider (src/providers/MarketProvider.tsx)
    ↓
marketStore (Zustand)
    ↓
UI Components (useMarketStore hook)
    ↓
Metrics (Prometheus)
    ↓
Grafana Dashboard
```

### SWR Kullanımı

- `/api/public/engine-health` - Engine health check
- `/api/portfolio/overview` - Portfolio data
- `/api/strategies/active` - Active strategies
- `/api/public/metrics` - Metrics data

---

## API Endpoints

### Public API Routes (`/api/public/`)

- `GET /api/public/engine-health` - Engine health check
- `GET /api/public/metrics` - Prometheus metrics
- `GET /api/public/metrics2` - Enhanced metrics
- `GET /api/public/error-budget` - Error budget status
- `POST /api/public/canary/run` - Canary deployment
- `GET /api/public/btcturk/ticker` - BTCTurk ticker

### Strategy API Routes (`/api/strategies/`)

- `GET /api/strategies/list` - List strategies
- `GET /api/strategies/active` - Active strategies
- `GET /api/strategies/running` - Running strategies
- `POST /api/strategies/create` - Create strategy
- `DELETE /api/strategies/delete` - Delete strategy

### Portfolio API Routes (`/api/portfolio/`)

- `GET /api/portfolio` - Portfolio overview
- `GET /api/portfolio/overview` - Detailed overview
- `GET /api/portfolio/pnl` - P&L data
- `GET /api/portfolio/risk-summary` - Risk summary

### Strategy Lab API Routes (`/api/lab/`)

- `POST /api/lab/generate` - Generate strategy
- `POST /api/lab/backtest` - Run backtest
- `POST /api/lab/optimize` - Optimize parameters
- `POST /api/lab/publish` - Publish strategy

### Guardrails API Routes (`/api/guardrails/`)

- `POST /api/guardrails/evaluate` - Evaluate risk
- `POST /api/guardrails/approve` - Approve deployment
- `GET /api/guardrails/read` - Read guardrails

### Copilot API Routes (`/api/copilot/`)

- `POST /api/copilot/action` - Copilot action
- `POST /api/copilot/strategy/generate` - Generate strategy
- `POST /api/copilot/risk-advice` - Risk advice

### Alerts API Routes (`/api/alerts/`)

- `GET /api/alerts/list` - List alerts
- `POST /api/alerts/control` - Control alerts
- `POST /api/alerts/webhook` - Webhook management

---

## Test Stratejisi

### Unit Tests (Jest)

**Konum:** `apps/web-next/src/**/__tests__/`
**Framework:** Jest 30.2.0 + ts-jest
**Coverage:** Düşük (%20 hedef %70)

**Test Dosyaları:**
- Helper functions
- Utility functions
- Store tests

### E2E Tests (Playwright)

**Konum:** `apps/web-next/tests/e2e/`
**Framework:** Playwright 1.56.1
**Test Dosyaları:**
- `smoke.spec.ts` - Smoke tests
- `ws-badge.spec.ts` - WebSocket badge tests
- `dashboard.spec.ts` - Dashboard tests
- `css-loaded.spec.ts` - CSS loading tests
- `fold-dashboard.spec.ts` - Dashboard fold tests
- `a11y-dashboard.spec.ts` - Accessibility tests
- `home-redirect.spec.ts` - Redirect tests
- `csp.spec.ts` - CSP violation tests

**Playwright Config:**
- Base URL: `http://127.0.0.1:3003`
- Retries: 1
- Timeout: 30s
- WebServer: Auto-start production build
- Reporter: List + JUnit XML

### Accessibility Tests

**Framework:** @axe-core/playwright 5.0.0
**CI Workflow:** `.github/workflows/axe.yml`
**Standart:** WCAG 2.2 AA

### Smoke Tests

**Konum:** `tools/smoke/`
**Scripts:**
- `comprehensive-smoke.ps1` - Comprehensive smoke tests
- `backtest-redirect.mjs` - Backtest redirect test

---

## UI/UX Standartları

### Tasarım Prensipleri

1. **Sistem durumu görünür olmalı**
   - Loading → Success/Error states
   - İlk 3000ms içinde skeleton/placeholder

2. **Tek dil, tek terminoloji**
   - TR modda: Tüm menü ve sayfalar Türkçe
   - EN modda: Tamamı İngilizce
   - Karışık kullanım yasak

3. **Tek layout, çok sayfa**
   - Sol: Sidebar (260–280px, fix)
   - Üst: Status bar + sayfa başlığı
   - Orta: İçerik (iç scroll container)
   - Sağ: Copilot (320–380px), kapatılabilir

4. **Sayfa scroll yok, içerik scroll var**
   - `PageShell` yüksekliği: `100vh`
   - Tablolar, listeler kendi içinde scroll

5. **Erişilebilirlik first (WCAG 2.2 AA)**
   - Tüm interaktif elemanlar TAB ile erişilebilir
   - Kontrast oranı ≥4.5:1
   - Focus ring hiçbir zaman kaldırılmaz

### Bileşen Kuralları

**Butonlar:**
- Birincil: `btn-primary` (yüksek kontrast)
- İkincil: `btn-secondary` (neutral)
- Tehlikeli: `btn-danger` (kırmızı)

**Kartlar:**
- Minimum padding: 16px
- Border radius: 12px (lg)
- Shadow: Subtle

**Tablolar:**
- Striped rows (zebra)
- Hover states
- Responsive (mobile scroll)

**Form Elemanları:**
- Label + Input + Error message
- Validation states (error/success)
- Accessibility attributes

### Spacing ve Grid

- Temel spacing: 4px grid (4/8/12/16/24/32)
- Kart iç padding: minimum 16px
- Kartlar arası: minimum 12px
- 2 kolon layout: `grid-cols-1 lg:grid-cols-2`
- 3 kolon layout: `grid-cols-1 xl:grid-cols-3`

### Tipografi

- Başlık (sayfa): 24–28px, `font-semibold`
- Bölüm başlığı: 18–20px
- Gövde: 14–16px
- Sayısal alanlar: `.tabular-nums` veya `.font-mono`

### Density Toggle

- **Compact:** Yüksek yoğunluk, daha fazla içerik
- **Comfortable:** Daha fazla boşluk, kolay okuma
- Persisted to localStorage (`spark-density`)

---

## CI/CD ve Otomasyon

### GitHub Actions Workflows (25+)

**Ana Workflows:**

1. **pr-smoke.yml** - PR smoke tests
   - Dashboard smoke test
   - Health check
   - Port availability

2. **pr6-e2e.yml** - PR E2E tests
   - Playwright E2E tests
   - Production build test
   - Screenshot comparison

3. **axe.yml** - Accessibility tests
   - @axe-core/playwright
   - WCAG 2.2 AA compliance

4. **lighthouse.yml** - Performance tests
   - Lighthouse CI
   - Performance scores
   - Accessibility scores

5. **route-guard.yml** - Route guard validation
   - Route protection checks
   - Authentication guards

6. **guard-validate.yml** - Guard validation
   - Fork guard checks
   - Workflow validation

7. **csp-smoke.yml** - CSP violation tests
   - Content Security Policy checks
   - Console violation detection

8. **ui-smoke.yml** - UI smoke tests
   - UI component tests
   - Visual regression

9. **canary-smoke.yml** - Canary deployment tests
   - Canary run validation
   - Metrics comparison

10. **ci.yml** - Main CI pipeline
    - Type checking
    - Linting
    - Build validation

**Diğer Workflows:**
- `axe-a11y.yml` - Additional a11y tests
- `lhci-axe.yml` - Lighthouse + Axe combined
- `nightly-e2e-perf.yml` - Nightly performance tests
- `ops-cadence.yml` - Operations cadence
- `p0-chain.yml` - P0 feature chain
- `test-workflow.yml` - Test workflow
- `web-next-standalone.yml` - Standalone build test

### Smoke Test Scripts

**Konum:** `tools/smoke/`
**Scripts:**
- `comprehensive-smoke.ps1` - PowerShell smoke tests
- `backtest-redirect.mjs` - Backtest redirect validation

**Konum:** `.run/`
**Scripts:**
- `web_next_smoke_3003.ps1` - Web-next smoke test
- `run_web_smoke_3003.ps1` - Web smoke runner

---

## Monitoring ve Metrikler

### Prometheus Metrics

**Metrics Endpoints:**
- `/api/public/metrics` - Basic metrics
- `/api/public/metrics2` - Enhanced metrics
- `/api/public/metrics.prom` - Prometheus format

**Key Metrics:**
- `spark_ws_btcturk_msgs_total` - WebSocket message count
- `spark_ws_staleness_seconds` - WebSocket staleness
- Error budget metrics
- Health check metrics

### Grafana Dashboards

**Konum:** `monitoring/`
**Configs:**
- `grafana-dashboard.json` - Import ready dashboard
- Prometheus scrape configs

### Health Checks

**Endpoints:**
- `/api/public/engine-health` - Engine health
- `/api/health` - General health
- `/api/healthz` - Kubernetes health check

**Components:**
- `useEngineHealth` hook - Engine health monitoring
- `useUnifiedStatus` hook - Unified status tracking
- `SystemHealthStrip` component - Health display

---

## Geliştirme Süreçleri

### Yerel Geliştirme

**Web (web-next):**
```powershell
# Port temizliği
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Dev server başlat
cd apps/web-next
$env:PORT="3003"
$env:NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev
```

**Executor:**
```powershell
# Ayrı terminalde
$env:EXEC_PORT="4001"
$env:NODE_OPTIONS="--max-old-space-size=2048"
pnpm --filter executor dev
```

**Hızlı Başlatma:**
```powershell
# tools/quick-start.ps1
.\tools\quick-start.ps1
```

### Build ve Test

**Type Check:**
```bash
pnpm --filter web-next typecheck
```

**Build:**
```bash
pnpm --filter web-next build
```

**Test:**
```bash
# Unit tests
pnpm --filter web-next test

# E2E tests
pnpm --filter web-next test:e2e

# Smoke tests
pnpm --filter web-next smoke:ui
```

### Port Yönetimi

**Web-next:** Port 3003 (sabit)
**Executor:** Port 4001 (sabit)

**Port Kontrolü:**
```powershell
Get-NetTCPConnection -LocalPort 3003,4001
```

**Port Temizliği:**
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Environment Variables

**Web-next (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3003
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:4001
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_MOCK=1
```

**Executor:**
```env
EXEC_PORT=4001
NODE_OPTIONS=--max-old-space-size=2048
```

---

## Kritik Dosyalar ve Konfigürasyonlar

### Root Level

- `package.json` - Root package.json, workspace scripts
- `pnpm-workspace.yaml` - Workspace configuration
- `.cursorrules` - Cursor IDE rules (Türkçe)
- `README.md` - Ana dokümantasyon

### Web-next

**Konfigürasyon:**
- `apps/web-next/package.json` - Dependencies ve scripts
- `apps/web-next/tsconfig.json` - TypeScript config
- `apps/web-next/next.config.mjs` - Next.js config
- `apps/web-next/tailwind.config.ts` - Tailwind config
- `apps/web-next/playwright.config.ts` - Playwright config
- `apps/web-next/jest.config.js` - Jest config

**Önemli Dosyalar:**
- `apps/web-next/src/app/layout.tsx` - Root layout
- `apps/web-next/src/app/dashboard/page.tsx` - Dashboard
- `apps/web-next/src/components/layout/AppFrame.tsx` - Layout wrapper
- `apps/web-next/src/providers/MarketProvider.tsx` - WebSocket provider
- `apps/web-next/src/middleware.ts` - Next.js middleware (CSP, nonce)

### Executor

**Konfigürasyon:**
- `services/executor/package.json` - Dependencies
- `services/executor/tsconfig.json` - TypeScript config

**Önemli Dosyalar:**
- `services/executor/src/server.ts` - Fastify server
- `services/executor/src/routes/backtest.ts` - Backtest route
- `services/executor/src/routes/guardrails.ts` - Guardrails route

### Dokümantasyon

**Ana Dokümantasyon:**
- `docs/UI_UX_PLAN.md` - UI/UX standartları (TEK REFERANS)
- `docs/ARCHITECTURE.md` - Mimari dokümantasyonu
- `docs/DEV_MODE.md` - Dev mode dokümantasyonu
- `docs/GUARDRAILS.md` - Guardrails dokümantasyonu

---

## Bilinen Sorunlar ve İyileştirme Alanları

### Kritik Sorunlar

1. **Test Coverage Düşük**
   - Mevcut: ~%20
   - Hedef: %70+
   - Öncelik: Yüksek

2. **Database Layer Eksik**
   - Şu an: Memory-based storage
   - Gerekli: PostgreSQL + Prisma
   - Öncelik: Kritik

3. **Real Trade Execution Eksik**
   - Şu an: Mock execution
   - Gerekli: Gerçek exchange API entegrasyonu
   - Öncelik: Yüksek

4. **BIST Real-time Feed Eksik**
   - Şu an: Mock data
   - Gerekli: Gerçek BIST feed
   - Öncelik: Orta

### İyileştirme Alanları

1. **Backend API Entegrasyonu**
   - Bazı API routes mock
   - Gerçek executor entegrasyonu gerekli

2. **Error Handling**
   - Daha kapsamlı error boundaries
   - Kullanıcı dostu error mesajları

3. **Performance Optimization**
   - Code splitting iyileştirmeleri
   - Image optimization
   - Bundle size reduction

4. **Accessibility**
   - Bazı bileşenlerde eksik aria-label'lar
   - Keyboard navigation iyileştirmeleri

5. **Documentation**
   - API dokümantasyonu eksik
   - Component dokümantasyonu eksik
   - Developer guide eksik

---

## Sonuç ve Öneriler

### Güçlü Yönler

✅ **Solid Mimari:**
- Monorepo yapısı iyi organize edilmiş
- TypeScript strict mode aktif
- Modern tech stack

✅ **Kapsamlı UI:**
- 150+ custom component
- WCAG 2.2 AA uyumlu
- Responsive design
- Density toggle

✅ **Gelişmiş Özellikler:**
- Real-time WebSocket
- AI Copilot
- Guardrails ve risk yönetimi
- Prometheus metrics

✅ **CI/CD:**
- 25+ GitHub Actions workflow
- Otomatik testler
- Smoke tests
- Accessibility tests

### Öncelikli Öneriler

1. **Database Layer Kurulumu (Kritik)**
   - PostgreSQL + Prisma setup
   - Migration strategy
   - Data persistence

2. **Test Coverage Artırma (Yüksek)**
   - Unit test coverage %70+
   - E2E test coverage artırma
   - Integration tests

3. **Real Trade Execution (Yüksek)**
   - Exchange API entegrasyonu
   - Order placement
   - Risk checks

4. **Dokümantasyon İyileştirme (Orta)**
   - API dokümantasyonu (OpenAPI/Swagger)
   - Component dokümantasyonu (Storybook)
   - Developer guide

5. **Performance Optimization (Orta)**
   - Bundle size optimization
   - Code splitting
   - Image optimization

### Gelecek Planlar

- **v1.4.0:** Database layer + Real execution
- **v1.5.0:** BIST real-time feed
- **v1.6.0:** Advanced AI features
- **v2.0.0:** Multi-exchange support

---

## Ek Bilgiler

### Kaynaklar

- **UI/UX Standartları:** `docs/UI_UX_PLAN.md`
- **Mimari:** `docs/ARCHITECTURE.md`
- **Dev Mode:** `docs/DEV_MODE.md`
- **Guardrails:** `docs/GUARDRAILS.md`

### İletişim ve Destek

- **Repository:** GitHub (private)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana

---

**Rapor Sonu**

*Bu rapor, Spark Trading Platform'un mevcut durumunu kapsamlı bir şekilde analiz etmektedir. Güncel bilgiler için `docs/` dizinindeki dokümantasyonlara bakınız.*

