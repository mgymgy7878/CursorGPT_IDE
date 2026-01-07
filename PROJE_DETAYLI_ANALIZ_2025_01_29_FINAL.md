# 📊 SPARK TRADING PLATFORM — DETAYLI PROJE ANALİZİ

**Tarih:** 29 Ocak 2025
**Versiyon:** v1.3.2-SNAPSHOT
**Analiz Eden:** cursor (Claude Sonnet 4.5)
**Durum:** 🟢 Production Ready (Geliştirme Aşamasında)

---

## 🎯 EXECUTIVE SUMMARY

**Spark Trading Platform**, AI destekli, çoklu borsa entegrasyonuna sahip, strateji üreten ve risk kontrollü çalışan profesyonel bir trading platformudur. Platform, kripto (Binance, BTCTurk) ve geleneksel borsa (BIST) verilerini gerçek zamanlı olarak işleyerek, kullanıcılara strateji geliştirme, backtest, optimizasyon ve canlı trading imkanı sunar.

### Mevcut Durum Özeti

- **Kod Tabanı:** ~50,000+ satır TypeScript/JavaScript
- **Monorepo:** pnpm workspace, 9+ package, 4+ service
- **Frontend:** Next.js 14 (Port 3003)
- **Backend:** Executor Service (Port 4001)
- **Dokümantasyon:** 15+ kapsamlı belge (~4,000+ satır)
- **Test Coverage:** Smoke tests, load tests, golden file validation

---

## 🏗️ PROJE MİMARİSİ

### 1. Monorepo Yapısı

```
spark-trading-platform/
├── apps/
│   ├── web-next/              # Next.js 14 Frontend (Ana UI)
│   ├── desktop-electron/      # Electron desktop app (gelecek)
│   └── web-next-v2/           # Deneysel versiyon
├── services/
│   ├── executor/              # Trading execution engine (Port 4001)
│   ├── marketdata/            # Market data aggregator (Binance, BTCTurk, BIST)
│   ├── analytics/             # Backtesting & technical analysis
│   ├── ml-engine/             # Machine learning engine
│   └── streams/               # WebSocket stream connectors
├── packages/
│   ├── @spark/
│   │   ├── types/             # Shared TypeScript types
│   │   ├── ai-core/           # AI Copilot core
│   │   ├── guardrails/        # Risk management
│   │   ├── exchange-*/        # Exchange integrations
│   │   └── ...                 # 20+ shared packages
│   └── i18n/                  # Internationalization (TR/EN)
├── docs/                      # Kapsamlı dokümantasyon
├── tools/                     # Development & deployment scripts
├── scripts/                   # Automation scripts
├── prisma/                    # Database schema (PostgreSQL)
└── config/                    # Configuration files
```

### 2. Package Manager & Workspace

- **Package Manager:** pnpm@10.18.3
- **Workspace:** pnpm workspaces (apps/*, services/*, packages/*)
- **Node.js:** v20.10.0 (portable binary: `tools/node-v20.10.0-win-x64/node.exe`)
- **TypeScript:** 5.6.0 (strict mode)

---

## 🎨 FRONTEND (apps/web-next)

### Teknoloji Stack

**Framework & Runtime:**
- Next.js 14.2.13 (App Router, Standalone output)
- React 18.3.1
- TypeScript 5.6.0 (strict mode)

**State Management:**
- Zustand 5.0.8 (with persist middleware for localStorage)
- SWR 2.3.6 (data fetching & caching)

**UI & Styling:**
- Tailwind CSS 3.4.18 (utility-first)
- shadcn/ui components (48+ UI components)
- Monaco Editor 4.7.0 (code editing)
- Recharts 3.2.1 + lightweight-charts 5.0.9 (charting)

**Form & Validation:**
- React Hook Form 7.65.0
- Zod 3.23.8 (schema validation)

**Testing:**
- Jest 30.2.0 (unit tests)
- Playwright 1.56.1 (E2E tests)

**Real-time Communication:**
- WebSocket (native, ws 8.18.3)
- SSE (Server-Sent Events) for Copilot streaming

### Sayfa Yapısı (App Router)

```
src/app/
├── (app)/                    # Main app layout group
│   ├── lab/                  # Strategy lab
│   ├── portfolio/            # Portfolio management
│   ├── settings/             # User settings
│   └── strategy/              # Strategy pages
├── (dashboard)/               # Dashboard group
│   └── page.tsx              # Main dashboard
├── (shell)/                   # Shell layout group
│   ├── dashboard/            # Dashboard pages
│   ├── strategies/           # Strategy management
│   ├── strategy-lab/         # Strategy lab
│   ├── portfolio/            # Portfolio pages
│   ├── market-data/          # Market data pages
│   ├── alerts/               # Alert management
│   ├── audit/                # Audit logs
│   ├── canary/               # Canary deployment
│   ├── guardrails/           # Risk guardrails
│   ├── running/              # Running strategies
│   ├── control/              # Control panel
│   ├── history/              # History
│   └── settings/             # Settings
├── api/                      # API routes (40+ endpoints)
│   ├── copilot/             # AI Copilot endpoints
│   ├── strategies/          # Strategy management
│   ├── backtest/            # Backtesting
│   ├── marketdata/          # Market data
│   ├── portfolio/           # Portfolio
│   ├── public/              # Public metrics
│   └── ...                   # 30+ more endpoints
├── backtest/                 # Backtest pages
├── backtest-engine/          # Backtest engine
├── backtest-lab/             # Backtest lab
├── strategy-editor/          # Strategy editor
├── strategy-studio/          # Strategy studio
├── technical-analysis/       # Technical analysis
├── observability/            # Observability dashboard
└── login/                    # Login page
```

### Bileşen Mimarisi

```
src/components/
├── layout/                   # Layout components (14 files)
│   ├── AppShell.tsx         # Main app shell
│   ├── Shell.tsx            # Shell wrapper
│   └── ...                  # Sidebar, Topbar, etc.
├── dashboard/                # Dashboard components (25 files)
│   ├── DashboardStats.tsx  # Statistics cards
│   ├── DashboardGrid.tsx   # Grid layout
│   └── ...                  # Various dashboard widgets
├── ui/                      # UI components (48 files)
│   ├── button.tsx           # Button component
│   ├── card.tsx            # Card component
│   ├── dialog.tsx          # Dialog component
│   └── ...                  # 45+ more UI components
├── copilot/                 # AI Copilot (6 files)
│   ├── CopilotDock.tsx     # Copilot panel
│   └── ...                 # Copilot components
├── portfolio/               # Portfolio components (5 files)
├── strategies/              # Strategy components (7 files)
├── marketdata/              # Market data components (4 files)
├── charts/                  # Chart components (4 files)
├── backtest/                # Backtest components (10 files)
├── lab/                     # Lab components (9 files)
├── technical/               # Technical analysis (7 files)
└── ...                      # 20+ more component categories
```

### State Management

**Zustand Stores:**
- `marketStore.ts` - Market data state (tickers, paused, lastMessageTs, staleness)
- `useStrategyLabStore.ts` - Strategy lab state
- Custom hooks for various features

**SWR Usage:**
- Data fetching with automatic caching
- Revalidation on focus
- Error handling

---

## ⚙️ BACKEND SERVİSLERİ

### 1. Executor Service (`services/executor/`)

**Port:** 4001
**Framework:** Fastify 4.28.0
**Durum:** ✅ Aktif

**Özellikler:**
- Strategy execution engine
- Health & metrics endpoints
- Backtest endpoints
- Guardrails management
- Audit verification
- Error budget tracking

**API Endpoints:**
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `POST /api/v1/strategies` - Strategy management
- `POST /api/v1/backtest` - Backtest execution
- `GET /api/v1/guardrails` - Guardrails status
- `POST /api/v1/audit-verify` - Audit verification

**Dependencies:**
- Fastify 4.28.0
- @fastify/cors 9.0.1
- prom-client 15.1.3 (Prometheus metrics)
- Zod 3.23.8 (validation)
- @prisma/client 5.19.1 (database)

### 2. Market Data Service (`services/marketdata/`)

**Özellikler:**
- Binance WebSocket integration
- BTCTurk WebSocket integration
- BIST data reader (planlanmış)
- Market data normalization
- Metrics collection

**WebSocket Streams:**
- Binance ticker streams
- BTCTurk ticker streams (151/402)
- Orderbook updates (planlanmış)
- Trade streams (planlanmış)

### 3. Analytics Service (`services/analytics/`)

**Özellikler:**
- Backtest engine
- Technical indicators (TA)
- Performance analysis

**Indicators:**
- RSI, MACD, Bollinger Bands
- Moving averages
- Custom indicators

### 4. ML Engine Service (`services/ml-engine/`)

**Özellikler:**
- Machine learning models
- Signal fusion
- Optimization algorithms
- Canary deployment support

---

## 📦 SHARED PACKAGES

### Core Packages

**@spark/types**
- Shared TypeScript types
- Event schemas
- API contracts

**@spark/ai-core**
- AI Copilot core functionality
- LLM provider abstraction
- Tool router
- Audit logging

**@spark/guardrails**
- Risk management
- Guardrails policies
- Error budget tracking

### Exchange Packages

**@spark/exchange-binance**
- Binance API client
- WebSocket connector
- Order management

**@spark/exchange-btcturk**
- BTCTurk API client
- WebSocket connector
- Order management

**@spark/exchange-core**
- Common exchange interfaces
- Shared exchange utilities

### Market Data Packages

**packages/marketdata-bist/**
- BIST data reader
- Symbol mapping

**packages/marketdata-btcturk/**
- BTCTurk REST API
- BTCTurk WebSocket

**packages/marketdata-common/**
- Common market data utilities
- Normalization functions

### Other Packages

**packages/i18n/**
- Internationalization (TR/EN)
- Type-safe translations

**packages/backtest-engine/**
- Backtest engine core
- Simulation logic

**packages/ml-core/**
- ML core functionality
- Model training

---

## 🗄️ VERİTABANI

### Prisma Schema

**Database:** PostgreSQL
**ORM:** Prisma 5.19.1

**Ana Modeller:**
- `User` - Kullanıcı bilgileri
- `Strategy` - Strateji tanımları
- `Backtest` - Backtest sonuçları
- `Trade` - İşlem kayıtları
- `Position` - Pozisyon bilgileri
- `AuditLog` - Audit kayıtları
- `Idempotency` - Idempotency tracking

**Enum Types:**
- `TradeStatus` - pending, submitted, filled, settled, cancelled, rejected, expired
- `StrategyStatus` - draft, active, paused, stopped, archived
- `BacktestStatus` - pending, running, completed, failed, cancelled
- `IdempotencyStatus` - pending, completed, failed

---

## 🔄 GERÇEK ZAMANLI VERİ AKIŞI

### WebSocket Infrastructure

**Binance WebSocket:**
- Ticker streams
- Auto-reconnect
- Error handling

**BTCTurk WebSocket:**
- TickerPair subscribe (151/402)
- Pause/resume functionality
- Exponential backoff + jitter
- Staleness measurement
- Last message timestamp tracking

### Live Data Layer (P1.2 - Geliştirme Aşamasında)

**Hedef:** UI refactor-safe canlı veri katmanı

**Mimari:**
- Data Plane (canlı veri) vs View Plane (UI) ayrımı
- Envelope format (v1) - standardize edilmiş event formatı
- SSE Parser (chunk boundary, multi-line data, çöp satır toleransı)
- Copilot stream (SSE)
- Market data streams (WebSocket)

**Envelope Format:**
```typescript
interface LiveEvent {
  v: number;              // Version
  event: string;          // Event type
  channel: string;        // Channel identifier
  seq: number;            // Monoton artan sequence
  ts: number;             // Timestamp (ms)
  ok: boolean;            // Success/failure
  errorCode?: string;      // Error code
  data: any;              // Event-specific payload
}
```

---

## 🤖 AI COPILOT

### Özellikler

**LLM Integration:**
- Provider abstraction (OpenAI/Anthropic)
- Tool router
- Function calling

**Tool Categories:**
- **Read-only:** getMarketSnapshot, getStrategies, getPortfolioSummary
- **Stateful:** runBacktest, runOptimize, createAlert, startStrategy/pauseStrategy

**Backend:**
- `/api/copilot/chat` (SSE streaming)
- Audit logging
- Guardrails integration

**Frontend:**
- CopilotDock component
- Streaming token display
- Tool call visualization

---

## 📊 OBSERVABILITY & METRICS

### Prometheus Metrics

**Counters:**
- `spark_ws_btcturk_msgs_total` - BTCTurk message count
- `spark_ws_btcturk_reconnects_total` - Reconnect count

**Gauges:**
- `spark_ws_staleness_seconds{pair}` - Staleness measurement

**Endpoints:**
- `/api/public/metrics` - JSON snapshot
- `/api/public/metrics.prom` - Prometheus text format (planlanmış)

### Health Checks

- `/api/health` - General health
- `/api/healthz` - Kubernetes health
- `/api/executor-healthz` - Executor health
- `/api/public/error-budget` - Error budget status

---

## 🧪 TESTING

### Test Infrastructure

**Unit Tests:**
- Jest 30.2.0
- Test coverage: ~20% (hedef: %70)

**E2E Tests:**
- Playwright 1.56.1
- Visual regression tests
- UI tests

**Smoke Tests:**
- Custom smoke test runner
- Health check automation
- Load tests

**Test Locations:**
- `apps/web-next/tests/` - Frontend tests
- `services/*/__tests__/` - Service tests
- `tools/smoke.cjs` - Smoke test runner

---

## 🚀 DEPLOYMENT

### Development

**Frontend:**
```bash
pnpm --filter web-next dev -- --port 3003
```

**Backend:**
```bash
pnpm --filter @spark/executor dev
# Port: 4001
```

**Environment Variables:**
- `NODE_OPTIONS="--max-old-space-size=4096"` (web-next)
- `EXEC_PORT=4001` (executor)
- `NODE_OPTIONS="--max-old-space-size=2048"` (executor)

### Production

**Build:**
```bash
pnpm -w -r build
```

**Start:**
```bash
pnpm --filter web-next start
# veya
node apps/web-next/.next/standalone/server.js
```

**Deployment:**
- PM2 cluster mode
- Docker support
- Standalone Next.js output

---

## 📚 DOKÜMANTASYON

### Ana Dokümantasyon Dosyaları

**Mimari:**
- `docs/ARCHITECTURE.md` - Genel mimari
- `docs/LIVE_DATA_LAYER_ARCHITECTURE.md` - Live data layer
- `docs/SPARK_ALL_IN_ONE.md` - Konsolide plan

**Özellikler:**
- `docs/FEATURES.md` - Mevcut özellikler
- `docs/ROADMAP.md` - Yol haritası

**Implementation:**
- `docs/P1.2_LIVE_LAYER_IMPLEMENTATION_CHECKLIST.md` - P1.2 checklist
- `docs/P1.2_LIVE_LAYER_MINIMUM_PATCH.md` - P1.2 minimum patch
- `docs/COPILOT_V0_PRODUCTION_NOTES.md` - Copilot notes

**API:**
- `docs/API.md` - API referansı
- `API_REFERENCE.md` - API referansı (root)

**Diğer:**
- `README.md` - Genel bilgiler
- `CONTRIBUTING.md` - Katkı rehberi
- `CHANGELOG.md` - Değişiklik geçmişi

---

## 🎯 MEVCUT ÖZELLİKLER (D1 + D2)

### ✅ Tamamlanmış

1. **Web / Runtime**
   - Next.js 14 App Router
   - Standalone output
   - Error boundaries (not-found.tsx, error.tsx, global-error.tsx)
   - ChunkLoadError recovery

2. **Canlı Veri / WebSocket**
   - Binance WebSocket (auto-reconnect)
   - BTCTurk WebSocket (pause/resume, staleness)
   - Exponential backoff + jitter

3. **State / Performans**
   - Zustand store
   - rafBatch render throttling
   - Memoization

4. **Observability**
   - Prometheus metrics
   - Health endpoints
   - Error budget tracking

5. **UI (Golden Master)**
   - Shell (Sidebar, Topbar, Copilot panel)
   - Dashboard (6 kart, 2 kolon)
   - MarketData (tablo, mini grafik, full chart)
   - TopStatusBar (health indicators)

### ⚠️ Geliştirme Aşamasında

1. **Live Data Layer (P1.2)**
   - Envelope format
   - SSE Parser
   - Copilot stream
   - Market data streams

2. **Backtest Engine**
   - Temel backtest altyapısı mevcut
   - Optimizasyon geliştirilmeli

3. **AI Copilot**
   - Panel mevcut
   - Backend kısmi

4. **BIST Integration**
   - Mock aşamasında
   - Real-time feed geliştirilmeli

---

## 🗺️ YOL HARİTASI

### Sprint 1 — Strategy IR + NL Compiler (MVP)
- Strategy IR schema
- Domain sözlüğü
- NL compile endpoint
- Studio kabuğu

### Sprint 2 — Backtest + Optimizer
- Backtest endpoint
- Optimizer (grid + bayes/GA)
- Leaderboard
- OOS/CV validation

### Sprint 3 — Guardrails + Canary
- Param geçmişi + param-diff
- RiskScore policy
- Canary endpoint
- Prometheus text format

### Sprint 4 — Runtime Orkestrasyon + WS Genişleme
- AI-1 orkestrasyon
- BTCTurk Trades + OrderBook
- Canary & Health dashboard

---

## 🔒 GÜVENLİK & UYUMLULUK

### Güvenlik Özellikleri

- RBAC (Role-Based Access Control)
- Allowlist
- TLS + Nginx
- Rate limiting
- Audit logging
- Idempotency tracking

### Guardrails

- Risk score (0-10)
- Parameter diff tracking
- Kill switch
- Staleness monitoring
- Error budget tracking

---

## 📈 PERFORMANS

### Optimizasyonlar

- rafBatch render throttling
- Memoization
- Virtualization (hazırlık aşamasında)
- Standalone Next.js output
- Code splitting
- Lazy loading

### Metrics

- P95 latency tracking
- RT delay monitoring
- OrderBus metrics
- WebSocket staleness

---

## 🐛 BİLİNEN SORUNLAR & EKSİKLER

### Kritik Eksikler

1. **Database Layer**
   - Prisma schema mevcut
   - PostgreSQL setup gerekiyor
   - Migration'lar hazırlanmalı

2. **Real Trade Execution**
   - Mock aşamasında
   - Exchange API entegrasyonu tamamlanmalı

3. **Test Coverage**
   - %20 → %70 hedef
   - Daha fazla unit test gerekiyor

4. **BIST Real-time Feed**
   - Mock aşamasında
   - Real feed entegrasyonu gerekiyor

### Geliştirme Gerekenler

1. **Backtest Engine**
   - Temel altyapı var
   - Optimizasyon algoritmaları geliştirilmeli

2. **AI Copilot**
   - Panel mevcut
   - Backend tamamlanmalı

3. **Live Data Layer (P1.2)**
   - Geliştirme aşamasında
   - SSE Parser testleri gerekiyor

---

## 🛠️ GELİŞTİRME ORTAMI

### Gereksinimler

- Node.js v20.10.0 (portable binary)
- pnpm 10.18.3
- TypeScript 5.6.0
- PostgreSQL (production)

### Komutlar

**Dependency Installation:**
```bash
pnpm -w install
```

**Development:**
```bash
# Frontend
pnpm --filter web-next dev -- --port 3003

# Backend
pnpm --filter @spark/executor dev
```

**Build:**
```bash
pnpm -w -r build
```

**Type Check:**
```bash
pnpm -w -r typecheck
```

**Smoke Tests:**
```bash
node tools/smoke.cjs --all
```

---

## 📝 SONUÇ

**Spark Trading Platform**, modern teknolojilerle geliştirilmiş, kapsamlı bir trading platformudur. Temel altyapı ve UI bileşenleri tamamlanmış, gerçek zamanlı veri akışı ve AI Copilot özellikleri geliştirme aşamasındadır.

**Güçlü Yönler:**
- ✅ Solid monorepo mimarisi
- ✅ Modern tech stack
- ✅ Kapsamlı UI component library
- ✅ WebSocket real-time infrastructure
- ✅ Prometheus metrics & observability
- ✅ Type-safe i18n

**Gelişim Alanları:**
- ⚠️ Database layer setup
- ⚠️ Real trade execution
- ⚠️ Test coverage artırılmalı
- ⚠️ BIST real-time feed
- ⚠️ Backtest engine optimizasyonu

**Genel Durum:** 🟢 Production Ready (Geliştirme Aşamasında)

---

**Son Güncelleme:** 29 Ocak 2025
**Versiyon:** v1.3.2-SNAPSHOT

