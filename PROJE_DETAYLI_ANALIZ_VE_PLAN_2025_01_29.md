# 📊 SPARK TRADING PLATFORM — DETAYLI PROJE ANALİZİ VE PLAN

**Tarih:** 29 Ocak 2025
**Versiyon:** v1.3.2-SNAPSHOT
**Analiz Eden:** cursor (Claude 4.1 Opus)
**Durum:** ✅ Production Ready — Development Aktif

---

## 🎯 EXECUTIVE SUMMARY

### Proje Özeti
**Spark Trading Platform**, AI destekli, çoklu borsa entegrasyonlu (Binance, BTCTurk, BIST), strateji üreten ve risk kontrollü çalışan bir trading platformudur. Platform, gerçek zamanlı veri akışı, makine öğrenimi tabanlı tahminler, backtest motorları ve canary deployment ile donatılmıştır.

### Anlık Durum
- **Kod Tabanı:** ~464 TypeScript/TSX dosyası (apps/web-next/src)
- **Component Sayısı:** ~188 React bileşeni
- **Monorepo:** pnpm workspace, 9+ package, 4+ service
- **Versiyon:** v1.3.2-SNAPSHOT
- **Build Durumu:** ✅ Başarılı
- **Test Coverage:** 🟡 Geliştirilmeli

### Kritik Metrikler
- **Frontend:** Next.js 14.2.13 (App Router, Standalone mode)
- **Backend:** Fastify 4.28.0 (Executor service, Port 4001)
- **State Management:** Zustand 5.0.8 + SWR 2.3.6
- **UI Framework:** Tailwind CSS 3.4.18
- **Charts:** Recharts 3.2.1 + lightweight-charts 5.0.9
- **Test:** Jest 30.2.0 + Playwright 1.56.1

---

## 🏗️ PROJE YAPISI VE MİMARİ

### 1. Monorepo Yapısı

```
CursorGPT_IDE/
├── apps/
│   ├── web-next/              # Next.js 14 Ana UI (Port 3003)
│   └── web-next-v2/           # Yeni UI versiyonu (geliştirme aşaması)
│   └── desktop-electron/      # Electron desktop uygulaması
├── services/
│   ├── executor/              # Strategy execution engine (Port 4001)
│   ├── marketdata/            # Market data aggregation (Binance, BTCTurk, BIST)
│   ├── analytics/             # Backtesting & technical analysis
│   ├── ml-engine/             # Machine learning engine
│   └── streams/               # WebSocket stream connectors
├── packages/
│   ├── @spark/
│   │   ├── types/             # Shared TypeScript types
│   │   ├── common/            # Common utilities
│   │   ├── db/                # Database client
│   │   ├── guardrails/        # Risk guardrails
│   │   └── ...                # Diğer paylaşılan paketler
│   ├── marketdata-common/     # Market data utilities
│   ├── marketdata-bist/       # BIST integration
│   ├── marketdata-btcturk/    # BTCTurk integration
│   └── i18n/                  # Internationalization (TR/EN)
├── docs/                      # Kapsamlı dokümantasyon
├── tools/                     # Otomasyon ve yardımcı scriptler
├── scripts/                   # PowerShell/bash scriptleri
└── prisma/                    # Database schema
```

### 2. Teknoloji Stack

#### Frontend (apps/web-next)
```typescript
Framework:     Next.js 14.2.13 (App Router, Standalone mode)
UI Library:    React 18.3.1
Language:      TypeScript 5.6.0 (strict mode)
State:         Zustand 5.0.8 + SWR 2.3.6
Styling:       Tailwind CSS 3.4.18
Charts:        Recharts 3.2.1 + lightweight-charts 5.0.9
Code Editor:   Monaco Editor 4.7.0
Forms:         React Hook Form 7.65.0 + Zod 3.23.8
Testing:       Jest 30.2.0 + Playwright 1.56.1
i18n:          Custom (TR/EN, 40+ keys)
```

#### Backend Services
```typescript
Executor:      Fastify 4.28.0 + TypeScript + ESM
MarketData:    Node.js + WebSocket clients
Analytics:     Backtest engine + Technical indicators
ML Engine:     Machine learning models (v2 ML Signal Fusion)
Metrics:       prom-client 15.1.3 (Prometheus-ready)
```

#### Infrastructure
```yaml
Package Manager: pnpm@10.18.3
Build Tool:      Next.js standalone + tsc
CI/CD:           GitHub Actions (12+ workflows)
Database:        PostgreSQL + Prisma (planned)
Monitoring:      Custom metrics endpoint (/api/public/metrics)
```

### 3. Mimari Desenler

#### Veri Akışı
```
WebSocket Streams (Binance/BTCTurk)
    ↓
MarketProvider (React Context)
    ↓
Zustand Store (marketStore.ts)
    ↓
UI Components (rafBatch throttling)
    ↓
Metrics → /api/public/metrics
```

#### State Management Stratejisi
- **Zustand:** Global state (market data, paused state, staleness)
- **SWR:** Server state caching ve revalidation
- **LocalStorage:** Persistence (dev mode için, backend entegrasyonu hazır)
- **React Context:** Theme, RightRail, MarketProvider

#### Server-Side Rendering
- **App Router:** Next.js 14 App Router kullanımı
- **Standalone Mode:** Production için optimize edilmiş build
- **Dynamic Imports:** Code splitting ve lazy loading
- **Error Boundaries:** Graceful error handling

---

## 📱 UYGULAMALAR VE SERVİSLER

### 1. Web-Next (Ana UI)

**Konum:** `apps/web-next/`
**Port:** 3003
**Durum:** ✅ Production Ready

#### Sayfa Yapısı
```
src/app/
├── (shell)/                    # Shell layout group
│   ├── dashboard/              # Ana dashboard
│   ├── market-data/            # Piyasa verileri (tablo + grafik)
│   ├── portfolio/              # Portföy yönetimi
│   ├── strategies/             # Strateji listesi
│   ├── strategy-lab/           # Strateji laboratuvarı
│   ├── running/                # Çalışan stratejiler
│   ├── alerts/                 # Alarmlar
│   ├── audit/                  # Audit logları
│   ├── canary/                 # Canary testleri
│   ├── guardrails/             # Risk guardrails
│   └── settings/               # Ayarlar
├── api/                        # Next.js API routes
│   ├── portfolio/              # Portföy API
│   ├── strategies/             # Strateji CRUD
│   ├── marketdata/             # Market data proxy
│   ├── backtest/               # Backtest API
│   ├── guardrails/             # Guardrails API
│   ├── copilot/                # AI Copilot API
│   └── public/
│       └── metrics/            # Metrics endpoint
└── providers/
    └── MarketProvider.tsx      # WebSocket provider
```

#### Bileşen Yapısı
```
src/components/
├── layout/
│   ├── AppFrame.tsx            # Ana layout wrapper
│   ├── Sidebar.tsx             # Sol sidebar (collapsed/expanded)
│   └── RightRailContext.tsx    # Sağ rail (Copilot paneli)
├── dashboard/                  # Dashboard widget'ları
├── market-data/                # Market data bileşenleri
├── portfolio/                  # Portföy bileşenleri
├── strategies/                 # Strateji bileşenleri
├── copilot/                    # AI Copilot bileşenleri
├── ui/                         # Temel UI bileşenleri (shadcn/ui)
├── nav/                        # Navigasyon bileşenleri
└── toast/                      # Toast notification sistemi
```

#### API Routes (Özet)
- `/api/portfolio` - Portföy bilgileri
- `/api/strategies/*` - Strateji CRUD işlemleri
- `/api/marketdata/*` - Market data proxy
- `/api/backtest/*` - Backtest çalıştırma
- `/api/guardrails/*` - Risk guardrails
- `/api/copilot/*` - AI Copilot entegrasyonu
- `/api/public/metrics` - Prometheus metrics (JSON)
- `/api/public/metrics.prom` - Prometheus text format

### 2. Executor Service

**Konum:** `services/executor/`
**Port:** 4001
**Durum:** ✅ Çalışıyor

#### Özellikler
- Strategy execution engine
- Backtest dry-run
- Health/metrics endpoints
- Guardrails evaluation
- Error budget tracking
- Canary deployment support

#### Routes
- `GET /health` - Health check
- `GET /api/public/metrics` - Metrics (JSON)
- `POST /api/backtest` - Backtest çalıştırma
- `POST /api/guardrails/evaluate` - Guardrails değerlendirme
- `GET /api/errorBudget` - Error budget durumu

### 3. MarketData Service

**Konum:** `services/marketdata/`
**Durum:** ✅ Aktif

#### Özellikler
- Binance WebSocket integration
- BTCTurk WebSocket integration (TickerPair 151/402)
- BIST feed (geliştirme aşaması)
- Historical data (candles)
- Metrics ve monitoring

### 4. Analytics Service

**Konum:** `services/analytics/`
**Durum:** ✅ Aktif

#### Özellikler
- Backtest engine
- Technical indicators (TA.js)
- Strategy optimization
- Walk-forward analysis

### 5. ML Engine Service

**Konum:** `services/ml-engine/`
**Durum:** ✅ ML Signal Fusion v2

#### Özellikler
- ML Signal Fusion (v2)
- Model scoring
- Optimization
- Canary deployment

---

## 🔄 STATE MANAGEMENT VE VERİ AKIŞI

### 1. Zustand Stores

#### marketStore.ts
```typescript
// WebSocket ticker verileri
// Pause/resume state
// Staleness tracking
// Auto-reconnect logic
```

#### useStrategyLabStore.ts
```typescript
// Strategy Lab state
// Draft strategies
// Backtest results
```

### 2. WebSocket Provider

**MarketProvider.tsx:**
- WebSocket bağlantı yönetimi
- Auto-reconnect mekanizması
- Exponential backoff
- Staleness detection

### 3. Veri Akışı Detayları

```
1. WebSocket Streams
   ↓
2. MarketProvider (Context)
   - subscribe/unsubscribe
   - connection management
   ↓
3. Zustand Store (marketStore)
   - tickers: Record<string, Ticker>
   - paused: boolean
   - lastMessageTs: number
   - staleness(): number
   ↓
4. UI Components
   - rafBatch ile render throttling
   - Memoization
   - Virtualization (hazırlık aşaması)
```

---

## 🧪 TEST STRATEJİSİ

### Mevcut Test Altyapısı

#### Unit Tests
- **Framework:** Jest 30.2.0
- **Coverage:** 🟡 Geliştirilmeli
- **Konum:** `apps/web-next/src/**/*.test.ts`

#### E2E Tests
- **Framework:** Playwright 1.56.1
- **Test Dosyaları:** `apps/web-next/tests/e2e/`
- **UI Tests:** `apps/web-next/tests/ui/`
- **Visual Regression:** `apps/web-next/tests/visual/`

#### Smoke Tests
- **Web Smoke:** `tools/web-next-smoke.cmd`
- **CSS Smoke:** `tools/css-smoke-test.mjs`
- **Health Checks:** `/api/public/smoke`

### Test Kapsamı

✅ **Test Edilen:**
- Dashboard render
- Market data stream
- WebSocket reconnection
- Error boundaries
- Navigation

🟡 **Geliştirilmeli:**
- Unit test coverage
- Integration tests
- API endpoint tests
- Strategy Lab tests
- Backtest engine tests

---

## 🎨 UI/UX STANDARTLARI

### 1. Design System

#### Renk Paleti
- **Dark Theme:** Primary (modern gradient)
- **Scrollbar:** Dark, thin (rgba(255,255,255,0.12))
- **Background:** Radial gradient

#### Typography
- Modern, readable fonts
- Responsive sizing

#### Layout
- **Shell Layout:** Sidebar + Main Content + Right Rail
- **Responsive:** Mobile-first approach
- **Grid System:** Tailwind CSS grid

### 2. Component Standartları

#### Bileşen Yapısı
- Functional components (React hooks)
- TypeScript strict mode
- Props validation (Zod schemas)
- Error boundaries

#### State Management
- Local state: `useState`
- Shared state: Zustand
- Server state: SWR

### 3. Accessibility

- Semantic HTML
- Keyboard navigation (hazırlık aşaması)
- ARIA labels (geliştirilmeli)

---

## 🚀 CI/CD VE OTOMASYON

### GitHub Actions Workflows

**Mevcut Workflows:** 12+ aktif workflow

#### Ana Workflows
- Build & Test
- Type Check
- Lint
- Deploy (production)
- Smoke Tests

### Build Pipeline

```yaml
1. Install dependencies (pnpm -w install)
2. Type check (pnpm -r typecheck)
3. Lint (pnpm -r lint)
4. Build (pnpm -r build)
5. Test (pnpm -r test)
6. Smoke tests
7. Deploy (conditional)
```

### Quality Gates

- ✅ TypeScript strict mode
- ✅ ESLint (max-warnings=0)
- ✅ Build success
- 🟡 Test coverage threshold (geliştirilmeli)

---

## 📊 MONİTORİNG VE METRİKLER

### Metrics Endpoint

**URL:** `/api/public/metrics`
**Format:** JSON (Prometheus text format da destekleniyor)

#### Metrikler
- `spark_ws_btcturk_msgs_total` - WebSocket mesaj sayısı
- `spark_ws_btcturk_reconnects_total` - Yeniden bağlantı sayısı
- `spark_ws_staleness_seconds{pair}` - Staleness (saniye)
- `spark_executor_*` - Executor metrikleri

### Observability

- **Health Checks:** `/api/health`, `/api/healthz`
- **Metrics:** `/api/public/metrics`
- **Prometheus:** `/api/public/metrics.prom` (text format)
- **Smoke Tests:** `/api/public/smoke`

### Dashboard

- **TopStatusBar:** Health indicators (API, WS, Executor, DEV)
- **Metrics Display:** P95, RT Delay, OrderBus
- **Staleness Badge:** Real-time staleness tracking

---

## 🔒 GÜVENLİK VE UYUMLULUK

### Mevcut Güvenlik Özellikleri

- ✅ CSP (Content Security Policy) middleware
- ✅ Error boundaries
- ✅ Input validation (Zod schemas)
- ✅ Type safety (TypeScript strict)
- 🟡 Authentication/Authorization (geliştirilmeli)
- 🟡 Rate limiting (geliştirilmeli)
- 🟡 Audit logging (temel seviye)

### Guardrails

- Risk score policy (0-10)
- Parameter diff detection
- Kill switch support
- Canary deployment gates

---

## 📚 DOKÜMANTASYON

### Mevcut Dokümantasyon

**Konum:** `docs/`

#### Ana Dokümantasyon
- `README.md` - Proje genel bakış
- `ARCHITECTURE.md` - Mimari açıklamalar
- `FEATURES.md` - Özellik listesi
- `ROADMAP.md` - Yol haritası
- `API.md` - API dokümantasyonu
- `UI_UX_PLAN.md` - UI/UX planı
- `METRICS_CANARY.md` - Metrics ve canary
- `PROJE_ANALIZ_PROTOKOLU.md` - Analiz protokolü

#### Özel Dokümantasyon
- `docs/backtest/` - Backtest dokümantasyonu
- `docs/monitoring/` - Monitoring setup
- `docs/operations/` - Operasyonel rehberler
- `docs/testing/` - Test dokümantasyonu

---

## 🔍 KRİTİK DOSYALAR VE KONFİGÜRASYONLAR

### Root Konfigürasyonlar

```typescript
package.json              // Root package, scripts
pnpm-workspace.yaml       // Workspace konfigürasyonu
tsconfig.json            // TypeScript config
```

### Web-Next Konfigürasyonları

```typescript
apps/web-next/
├── next.config.mjs       // Next.js konfigürasyonu
├── tsconfig.json         // TypeScript config
├── tailwind.config.ts    // Tailwind CSS config
├── postcss.config.mjs    // PostCSS config
├── eslint.config.js      // ESLint config
├── playwright.config.ts  // Playwright config
└── jest.config.js        // Jest config
```

### Executor Konfigürasyonları

```typescript
services/executor/
├── tsconfig.json         // TypeScript config
└── package.json          // Executor dependencies
```

---

## ⚠️ BİLİNEN SORUNLAR VE İYİLEŞTİRME ALANLARI

### Kritik (P0)

1. **Test Coverage** 🟡
   - Unit test coverage düşük
   - Integration testleri eksik
   - **Öneri:** Test coverage threshold belirleme ve artırma

2. **Authentication/Authorization** 🟡
   - Kullanıcı kimlik doğrulama eksik
   - Role-based access control (RBAC) temel seviye
   - **Öneri:** JWT tabanlı auth sistemi

3. **Database Layer** 🟡
   - PostgreSQL + Prisma entegrasyonu planlanmış
   - Şu anda mock data kullanılıyor
   - **Öneri:** Database migration stratejisi

### Yüksek Öncelik (P1)

4. **BIST Real-time Feed** 🟡
   - BIST feed entegrasyonu geliştirme aşamasında
   - **Öneri:** BIST WebSocket entegrasyonu tamamlama

5. **Advanced AI Features** 🟡
   - AI-1/AI-2 iki ajanlı mimari planlanmış
   - NL→IR compiler eksik
   - **Öneri:** Strategy IR + NL Compiler implementasyonu

6. **Backtest Engine** 🟡
   - Temel backtest mevcut
   - Optimizer geliştirme aşamasında
   - **Öneri:** Advanced backtest features

### Orta Öncelik (P2)

7. **Rate Limiting** 🟡
   - API rate limiting eksik
   - **Öneri:** Rate limiting middleware

8. **Audit Logging** 🟡
   - Temel audit log mevcut
   - **Öneri:** Comprehensive audit trail

9. **Performance Optimization** 🟡
   - Virtualization hazırlık aşamasında
   - **Öneri:** Large dataset virtualization

10. **Accessibility** 🟡
    - Keyboard navigation eksik
    - **Öneri:** ARIA labels ve keyboard support

---

## 🎯 GELECEK PLAN VE YOL HARİTASI

### Sprint 1: Strategy IR + NL Compiler (MVP)

**Hedef:** Doğal dilden strateji üretimi

- [ ] `strategy.ir.schema.ts` (Zod)
- [ ] Domain sözlüğü (indikator aliasları, eşanlamlılar)
- [ ] `POST /api/strategy/nl-compile` → `{ strategyIR, explain[] }`
- [ ] Studio kabuğu: NL input → IR editörü → explain paneli

**Süre:** 2-3 hafta

### Sprint 2: Backtest + Optimizer

**Hedef:** Gelişmiş backtest ve optimizasyon

- [ ] `POST /api/strategy/backtest` (geliştirme)
- [ ] `POST /api/strategy/optimize` (grid + bayes/GA)
- [ ] Leaderboard + "best candidate"
- [ ] OOS/CV + erken durdurma

**Süre:** 3-4 hafta

### Sprint 3: Guardrails + Canary

**Hedef:** Production-ready guardrails

- [ ] Param geçmişi + param-diff
- [ ] RiskScore policy (0–10) (mevcut, geliştirme)
- [ ] `POST /api/strategy/canary` (PASS eşikleri)
- [ ] `POST /api/strategy/deploy` (yalnızca PASS sonrası)
- [ ] `/api/public/metrics.prom` (Prom text format) + panolar

**Süre:** 2-3 hafta

### Sprint 4: Runtime Orkestrasyon + WS Genişleme

**Hedef:** AI-1 orkestrasyon ve WebSocket genişletme

- [ ] AI-1 orkestrasyon kuralları (Pause/Resume, staleness badge)
- [ ] BTCTurk Trades(422) + OrderBook(431/432)
- [ ] Yeni sayaçlar:
  - `spark_ws_btcturk_trades_total`
  - `spark_ws_btcturk_orderbook_updates_total`
- [ ] Canary & Health dashboard + audit kayıtları

**Süre:** 2-3 hafta

### Kısa Vadeli İyileştirmeler (1-2 Ay)

1. **Test Coverage Artırma**
   - Unit test coverage %80+
   - Integration test suite
   - E2E test coverage

2. **Database Entegrasyonu**
   - PostgreSQL + Prisma setup
   - Migration stratejisi
   - Data persistence

3. **Authentication System**
   - JWT tabanlı auth
   - Role-based access control
   - Session management

4. **Performance Optimization**
   - Large dataset virtualization
   - Code splitting optimizasyonu
   - Bundle size optimization

### Orta Vadeli Hedefler (3-6 Ay)

1. **AI-1/AI-2 İki Ajanlı Mimari**
   - AI-1: Operasyon/Süpervizör
   - AI-2: Strateji-Üretici
   - NL→IR compiler
   - Strategy explainability

2. **Multi-Exchange Support**
   - BIST real-time feed
   - FX/Parite entegrasyonu
   - Emtia entegrasyonu

3. **Advanced Features**
   - Paper trading
   - Strategy marketplace
   - Social features (sharing, ratings)

4. **Mobile App**
   - React Native mobile app
   - Push notifications
   - Mobile-optimized UI

---

## 📋 SONUÇ VE ÖNERİLER

### Güçlü Yönler

1. ✅ **Modern Tech Stack:** Next.js 14, TypeScript strict, Tailwind CSS
2. ✅ **Monorepo Yapısı:** pnpm workspace ile organize
3. ✅ **Real-time Data:** WebSocket entegrasyonu çalışıyor
4. ✅ **Comprehensive Docs:** Kapsamlı dokümantasyon
5. ✅ **CI/CD Pipeline:** 12+ aktif workflow
6. ✅ **Production Ready:** Temel özellikler çalışıyor

### İyileştirme Alanları

1. 🟡 **Test Coverage:** Unit ve integration testleri artırılmalı
2. 🟡 **Database Layer:** PostgreSQL + Prisma entegrasyonu tamamlanmalı
3. 🟡 **Authentication:** JWT tabanlı auth sistemi eklenmeli
4. 🟡 **AI Features:** NL→IR compiler ve AI-1/AI-2 mimari geliştirilmeli
5. 🟡 **Performance:** Virtualization ve optimization iyileştirilmeli

### Öneriler

#### Kısa Vadeli (1-2 Ay)
1. Test coverage artırma (hedef: %80+)
2. Database entegrasyonu (PostgreSQL + Prisma)
3. Authentication sistemi (JWT)
4. Rate limiting ve güvenlik iyileştirmeleri

#### Orta Vadeli (3-6 Ay)
1. AI-1/AI-2 iki ajanlı mimari implementasyonu
2. BIST real-time feed tamamlama
3. Advanced backtest ve optimizer features
4. Mobile app geliştirme

#### Uzun Vadeli (6-12 Ay)
1. Multi-exchange support genişletme
2. Strategy marketplace
3. Social features
4. Advanced AI/ML capabilities

---

## 📎 EKLER

### Önemli Linkler

- **GitHub:** [Repository URL]
- **Documentation:** `docs/`
- **API Docs:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Roadmap:** `docs/ROADMAP.md`
- **UI/UX Plan:** `docs/UI_UX_PLAN.md`

### Komutlar Referansı

```bash
# Development
pnpm --filter web-next dev              # Web UI (Port 3003)
pnpm --filter @spark/executor dev       # Executor (Port 4001)

# Build
pnpm -r build                           # Tüm paketleri build et
pnpm --filter web-next build            # Sadece web-next build

# Test
pnpm -r test                            # Tüm testleri çalıştır
pnpm --filter web-next test:e2e         # E2E testler

# Type Check
pnpm -r typecheck                       # Tüm type check

# Smoke Tests
pnpm smoke:web                          # Web smoke test
pnpm smoke:css                          # CSS smoke test
```

---

**Rapor Oluşturulma Tarihi:** 29 Ocak 2025
**Rapor Versiyonu:** 1.0
**Sonraki Güncelleme:** 15 Şubat 2025 (planlanmış)

