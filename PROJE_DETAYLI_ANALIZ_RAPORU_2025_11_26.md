# 📊 Spark Trading Platform - Detaylı Proje Analiz Raporu

**Tarih:** 26 Kasım 2025
**Versiyon:** v1.3.2-SNAPSHOT
**Analiz Eden:** cursor (Claude Sonnet 4.5)
**Durum:** ✅ Aktif Geliştirme

---

## 🎯 EXECUTIVE SUMMARY

Spark Trading Platform, yapay zeka destekli, çoklu borsa entegrasyonlu, risk kontrollü bir trading platformudur. Proje **pnpm workspace monorepo** yapısında, **Next.js 14** tabanlı modern bir mimariye sahiptir.

### Anlık Durum
- **Frontend:** ✅ Çalışır (Port 3003 - web-next, Port 3004 - web-next-v2)
- **Backend:** ✅ Executor Service (Port 4001)
- **WebSocket:** ✅ Aktif (ws://127.0.0.1:4001)
- **TypeScript:** ✅ Hata yok (typecheck başarılı)
- **Linter:** ✅ Hata yok
- **Test Coverage:** 🟡 27 E2E test, 8 unit test mevcut

---

## 🏗️ PROJE MİMARİSİ

### 1. Monorepo Yapısı

```
spark-trading-platform/
├── apps/
│   ├── web-next/          # Ana Next.js uygulaması (Port 3003)
│   ├── web-next-v2/       # V2 Next.js uygulaması (Port 3004)
│   └── desktop-electron/  # Electron desktop uygulaması
├── services/
│   ├── executor/          # Trading engine (Port 4001)
│   ├── marketdata/        # Market data aggregation
│   ├── analytics/         # Backtesting & technical analysis
│   └── streams/           # WebSocket streams
└── packages/
    ├── i18n/              # Internationalization
    ├── marketdata-bist/   # BIST integration
    ├── marketdata-btcturk/# BTCTurk integration
    └── [20+ package]      # Shared packages
```

### 2. Teknoloji Stack

#### Frontend (apps/web-next)
```yaml
Framework: Next.js 14.2.13
  - App Router (React Server Components)
  - Standalone mode desteği
  - TypeScript strict mode

UI Library: React 18.3.1
  - Server Components
  - Client Components ('use client')
  - React Strict Mode aktif

State Management:
  - Zustand 5.0.8 (client state)
  - SWR 2.3.6 (server state, caching)
  - localStorage persist (development)

Styling:
  - Tailwind CSS 3.4.18
  - shadcn/ui components
  - Custom CSS variables (theme.css)
  - PostCSS 8

Charts & Visualization:
  - Recharts 3.2.1 (React charts)
  - lightweight-charts 5.0.9 (TradingView kalitesi)
  - Custom sparkline components

Code Editor:
  - Monaco Editor 4.7.0 (VS Code editor)

Forms & Validation:
  - React Hook Form 7.65.0
  - Zod 3.23.8 (schema validation)

Icons:
  - lucide-react 0.548.0

Testing:
  - Jest 30.2.0 (unit tests)
  - Playwright 1.56.1 (E2E tests)
  - @axe-core/playwright 5.0.0 (accessibility)

i18n:
  - Custom implementation (TR/EN)
  - 40+ translation keys
```

#### Backend Services
```yaml
Executor Service (@spark/executor):
  - Fastify 4.28.0 (HTTP server)
  - Prometheus metrics (prom-client 15.1.3)
  - CORS support (@fastify/cors 9.0.1)
  - Zod validation
  - Port: 4001

Marketdata Service:
  - Binance, BTCTurk, BIST integration
  - WebSocket streams
  - Historical data

Analytics Service:
  - Backtesting engine
  - Technical indicators (TA)
  - Vitest testing
```

### 3. Package Manager
- **pnpm 10.18.3** (workspace monorepo)
- **Lockfile:** pnpm-lock.yaml (lockfileVersion 9.0)
- **Overrides:** next@14.2.13, react@18.3.1, react-dom@18.3.1

---

## 📋 MEVCUT ÖZELLİKLER

### 1. Sayfa Yapısı (apps/web-next/src/app)

#### Ana Sayfalar
- **`/dashboard`** - Ana dashboard (kompakt grid düzeni)
- **`/portfolio`** - Portföy yönetimi ve pozisyonlar
- **`/strategies`** - Strateji listesi ve yönetimi
- **`/running`** - Çalışan stratejiler
- **`/strategy-lab`** - Strateji laboratuvarı (Generate, Backtest, Optimize, Deploy)
- **`/backtest`** - Backtest sonuçları
- **`/market`** - Piyasa verileri ve grafikler
- **`/technical-analysis`** - Teknik analiz araçları
- **`/settings`** - Ayarlar
- **`/alerts`** - Uyarı yönetimi
- **`/audit`** - Denetim logları
- **`/guardrails`** - Risk guardrails
- **`/observability`** - Sistem gözlemlenebilirliği

#### API Routes (101 endpoint)
- **Portfolio API:** `/api/portfolio`, `/api/portfolio/overview`, `/api/portfolio/pnl`
- **Strategies API:** `/api/strategies/*` (list, create, delete, active, running)
- **Backtest API:** `/api/backtest/*` (run, portfolio, walkforward)
- **Market API:** `/api/market/*` (btcturk, bist)
- **Copilot API:** `/api/copilot/*` (action, strategy/generate, strategy/draft)
- **ML API:** `/api/ml/*` (health, score, version, test/determinism)
- **Guardrails API:** `/api/guardrails/*` (read, evaluate, approve)
- **Public API:** `/api/public/*` (metrics, canary, smoke, health)
- **Tools API:** `/api/tools/*` (metrics, status, kill-switch, risk-report)

### 2. UI Bileşenleri (185+ component)

#### Layout Components
- `AppFrame` - Ana uygulama çerçevesi
- `AppShell` - Responsive shell layout
- `Shell` - Sayfa shell'i
- `SidebarNav` - Yan menü navigasyonu
- `StatusBar` - Durum çubuğu
- `Topbar` - Üst çubuk

#### Dashboard Components
- `ActiveStrategiesWidget` - Aktif stratejiler
- `AlarmsWidget` - Alarmlar
- `CanaryWidget` - Canary test sonuçları
- `CopilotSummaryCard` - Copilot özeti
- `DraftsList` - Taslak stratejiler
- `MarketsWidget` - Piyasa widget'ları
- `RiskGuardrailsWidget` - Risk guardrails
- `SessionAnalysis` - Oturum analizi
- `SmokeCard` - Smoke test sonuçları
- `SummaryStrip` - Özet şerit

#### Market Components
- `ChartTrading` - Trading grafikleri
- `DepthChart` - Derinlik grafiği
- `MarketCard` - Piyasa kartı
- `MarketGrid` - Piyasa grid'i
- `MarketMiniGrid` - Mini piyasa grid'i
- `MarketStrip` - Piyasa şeridi
- `OrderBookLadder` - Emir defteri
- `TimeAndSales` - Zaman ve satışlar

#### Portfolio Components
- `AllocationDonut` - Dağılım donut grafiği
- `OptimisticPositionsTable` - Optimistik pozisyon tablosu
- `PortfolioTable` - Portföy tablosu
- `SummaryCards` - Özet kartlar

#### Strategy Components
- `CreateStrategyModal` - Strateji oluşturma modalı
- `StrategyControls` - Strateji kontrolleri
- `StrategyDetailPanel` - Strateji detay paneli
- `StrategyList` - Strateji listesi

#### Copilot Components
- `CopilotDock` - Copilot dock (sol panel)
- `CopilotDockRight` - Copilot dock (sağ panel)
- `CopilotPanel` - Copilot panel
- `CopilotSidebar` - Copilot yan çubuk
- `QuickPrompt` - Hızlı prompt

#### Backtest Components
- `CorrelationHeatmap` - Korelasyon ısı haritası
- `EquityCurveChart` - Equity eğrisi grafiği
- `MetricsCards` - Metrik kartları
- `MetricsTable` - Metrik tablosu
- `ReportModal` - Rapor modalı

#### Technical Analysis Components
- `TechnicalOverview` - Teknik analiz özeti
- Custom chart components

### 3. State Management

#### Zustand Stores
- `copilotStore` - Copilot durumu (open, mode, toggle)
- Diğer store'lar (stores/ dizininde)

#### SWR Hooks
- Server state için SWR kullanımı
- Caching ve revalidation

### 4. WebSocket Entegrasyonu
- WebSocket bağlantısı: `ws://127.0.0.1:4001`
- Market data subscription
- Real-time updates
- WS badge component (bağlantı durumu)

### 5. Internationalization (i18n)
- **Diller:** TR (Türkçe), EN (İngilizce)
- **Lokasyon:** `apps/web-next/messages/tr/`, `apps/web-next/messages/en/`
- **40+ translation key**
- Custom i18n implementation

### 6. Testing Infrastructure

#### E2E Tests (Playwright)
- `dashboard.spec.ts` - Dashboard smoke test
- `csp.spec.ts` - CSP violation test
- `ws-badge.spec.ts` - WebSocket badge test
- `a11y-dashboard.spec.ts` - Accessibility test
- `home-redirect.spec.ts` - Redirect test
- `fold-dashboard.spec.ts` - Dashboard fold test
- **Toplam:** 27 E2E test dosyası

#### Unit Tests (Jest)
- `format.test.ts` - Format utilities
- `health.test.ts` - Health checks
- `fusion.test.ts` - ML fusion
- **Toplam:** 8 unit test dosyası

---

## 🔍 BAĞIMLILIK ANALİZİ

### Ana Bağımlılıklar

#### Production Dependencies
```yaml
Core:
  - next: 14.2.13 (sabit versiyon)
  - react: 18.3.1 (sabit versiyon)
  - react-dom: 18.3.1 (sabit versiyon)

State & Data:
  - zustand: 5.0.8
  - swr: 2.3.6
  - zod: 3.23.8

UI & Styling:
  - tailwindcss: 3.4.18
  - lucide-react: 0.548.0
  - recharts: 3.2.1
  - lightweight-charts: 5.0.9

Forms:
  - react-hook-form: 7.65.0

Editor:
  - @monaco-editor/react: 4.7.0

WebSocket:
  - ws: 8.18.3
  - @types/ws: 8.18.1
```

#### Development Dependencies
```yaml
TypeScript:
  - typescript: 5.6.0 (root), 5.0.0 (web-next)

Testing:
  - jest: 30.2.0
  - @playwright/test: 1.56.1
  - @axe-core/playwright: 5.0.0

Linting:
  - eslint: 9.37.0
  - @typescript-eslint/eslint-plugin: 8.46.1
  - @typescript-eslint/parser: 8.46.1
  - eslint-config-next: 15.5.5

Build Tools:
  - tsx: 4.19.2
  - cross-env: 10.1.0
```

### Bağımlılık Sorunları

#### ✅ Güçlü Yönler
1. **Versiyon Sabitleme:** next, react, react-dom sabit versiyonlarda (override ile)
2. **Güncel Paketler:** Tüm paketler güncel versiyonlarda
3. **Tip Güvenliği:** TypeScript strict mode aktif
4. **Lockfile:** pnpm-lock.yaml mevcut ve güncel

#### ⚠️ Dikkat Edilmesi Gerekenler
1. **Next.js 14.2.13:** Next.js 15 çıktı, güncelleme planlanmalı
2. **React 18.3.1:** React 19 beta mevcut, güncelleme değerlendirilmeli
3. **ESLint Config:** eslint-config-next 15.5.5 (Next.js 15 için) ama Next.js 14 kullanılıyor - uyumsuzluk riski
4. **TypeScript Versiyonları:** Root'ta 5.6.0, web-next'te 5.0.0 - tutarsızlık

---

## 🐛 TESPİT EDİLEN HATALAR VE SORUNLAR

### 1. TypeScript Hataları
- ✅ **Durum:** Typecheck başarılı (hata yok)
- ✅ **Strict Mode:** Aktif ve çalışıyor

### 2. Linter Hataları
- ✅ **Durum:** Linter hatası yok
- ✅ **ESLint:** Yapılandırılmış ve çalışıyor

### 3. TODO/FIXME İşaretleri

#### Yüksek Öncelikli
1. **CopilotDock.tsx (Line 22):** SSE/WS entegrasyonu eksik
   ```typescript
   // TODO: SSE/WS entegrasyonu
   ```
   - **Etki:** Copilot execution feed'i çalışmıyor
   - **Öncelik:** Yüksek

2. **MarketGrid.tsx (Lines 77-80):** Eksik market data alanları
   ```typescript
   volume24h: null, // TODO: Market store'a volume ekle
   liquidity: null, // TODO: Likidite skoru hesapla
   oi: null, // TODO: Vadeli için OI
   funding: null, // TODO: Perp için funding
   ```
   - **Etki:** Market grid'de eksik bilgiler
   - **Öncelik:** Orta

3. **usePageMarketContext.ts (Lines 38, 42):** API entegrasyonu eksik
   ```typescript
   // TODO: Portföy API'sinden sembol listesi
   // TODO: Strateji API'sinden sembol listesi
   ```
   - **Etki:** Context'te eksik sembol listesi
   - **Öncelik:** Orta

#### Düşük Öncelikli
4. **StrategiesCard.tsx (Line 67):** API çağrısı eksik
5. **MarketMiniGrid.tsx (Line 95):** Volume eksik
6. **i18n.ts (Line 431):** Context güncellemesi eksik

### 4. Mimari Sorunlar

#### İki Next.js Uygulaması
- **web-next** (Port 3003) - Ana uygulama
- **web-next-v2** (Port 3004) - V2 uygulama (geliştirme aşamasında)
- **Sorun:** İki ayrı uygulama yönetimi karmaşık
- **Öneri:** V2 tamamlandığında web-next'i kaldır veya birleştir

#### Package Versiyon Tutarsızlıkları
- TypeScript: Root 5.6.0, web-next 5.0.0
- ESLint config: Next.js 15 için ama Next.js 14 kullanılıyor

### 5. Test Coverage
- **E2E Tests:** 27 test mevcut ✅
- **Unit Tests:** 8 test mevcut 🟡
- **Coverage:** Bilinmiyor (coverage raporu yok)
- **Öneri:** Jest coverage raporu ekle

### 6. Dokümantasyon
- ✅ **README.md:** Mevcut ve güncel
- ✅ **Docs/:** Kapsamlı dokümantasyon
- ⚠️ **API Docs:** Eksik (OpenAPI/Swagger yok)
- ⚠️ **Component Docs:** Eksik (Storybook yok)

---

## 🎨 ARAYÜZ RAPORU

### 1. Tasarım Sistemi

#### Renk Paleti
- **Dark Theme:** Ana tema (custom CSS variables)
- **Accent Colors:** Emerald (pozitif), Red (negatif), Yellow (uyarı)
- **Neutral Colors:** Gray scale (neutral-400, neutral-800, vb.)

#### Typography
- **Font:** Sistem fontları (sans-serif)
- **Sizes:** Tailwind default scale
- **Weights:** Regular, Medium, Semibold, Bold

#### Spacing
- **Tailwind:** Utility-first spacing
- **Consistent:** Tailwind scale kullanımı

### 2. Bileşen Kütüphanesi

#### shadcn/ui Components
- `Card`, `Button`, `Input`, `Dialog`, `Dropdown`, `Navigation Menu`
- **Lokasyon:** `apps/web-next/src/components/ui/`
- **24+ UI component**

#### Custom Components
- **185+ custom component**
- **Modüler yapı:** Her feature için ayrı klasör
- **Reusable:** Ortak bileşenler `common/` klasöründe

### 3. Responsive Design
- **Mobile First:** Tailwind breakpoints
- **Grid System:** CSS Grid ve Flexbox
- **Breakpoints:** sm, md, lg, xl, 2xl

### 4. Accessibility (a11y)
- ✅ **Playwright a11y test:** Mevcut
- ✅ **@axe-core:** Entegre
- ✅ **ARIA labels:** Kullanılıyor
- ⚠️ **WCAG Compliance:** Tam doğrulanmamış

### 5. UI/UX İyileştirme Önerileri

#### Yüksek Öncelikli
1. **Loading States:** Daha fazla skeleton loader
2. **Error States:** Daha iyi error mesajları
3. **Empty States:** Boş durumlar için placeholder'lar
4. **Animations:** Framer Motion entegrasyonu (v2'de başlanmış)

#### Orta Öncelikli
5. **Dark/Light Theme Toggle:** Tam tema desteği
6. **Keyboard Navigation:** Daha iyi klavye desteği
7. **Focus Management:** Daha iyi focus yönetimi

#### Düşük Öncelikli
8. **Micro-interactions:** Hover, click animasyonları
9. **Toast Notifications:** Daha zengin toast'lar
10. **Tooltips:** Daha fazla tooltip

---

## 📈 GELİŞTİRME PLANI

### Faz 1: Kritik Düzeltmeler (1-2 Hafta)

#### 1.1 TODO'ları Tamamla
- [ ] CopilotDock SSE/WS entegrasyonu
- [ ] MarketGrid volume, liquidity, OI, funding alanları
- [ ] usePageMarketContext API entegrasyonu
- [ ] StrategiesCard API çağrısı

#### 1.2 Versiyon Tutarlılığı
- [ ] TypeScript versiyonlarını senkronize et (5.6.0)
- [ ] ESLint config'i Next.js 14'e uyarla
- [ ] Tüm paket versiyonlarını gözden geçir

#### 1.3 Test Coverage
- [ ] Jest coverage raporu ekle
- [ ] Unit test coverage'ı %70+ yap
- [ ] E2E test coverage'ı artır

### Faz 2: Özellik Geliştirme (2-4 Hafta)

#### 2.1 API Entegrasyonları
- [ ] Portföy API'sinden sembol listesi
- [ ] Strateji API'sinden sembol listesi
- [ ] Market store'a volume ekle
- [ ] Likidite skoru hesaplama

#### 2.2 UI İyileştirmeleri
- [ ] Loading states (skeleton loaders)
- [ ] Error states (daha iyi mesajlar)
- [ ] Empty states (placeholder'lar)
- [ ] Framer Motion animasyonları

#### 2.3 Accessibility
- [ ] WCAG 2.2 AA compliance
- [ ] Keyboard navigation iyileştirmeleri
- [ ] Focus management
- [ ] Screen reader optimizasyonu

### Faz 3: Mimari İyileştirmeler (4-6 Hafta)

#### 3.1 Next.js Güncelleme
- [ ] Next.js 15'e geçiş planı
- [ ] React 19 beta değerlendirmesi
- [ ] Breaking changes analizi
- [ ] Migration planı

#### 3.2 V2 Entegrasyonu
- [ ] web-next-v2 özelliklerini web-next'e taşı
- [ ] V2'yi production'a hazırla
- [ ] web-next'i kaldır veya birleştir

#### 3.3 Dokümantasyon
- [ ] API dokümantasyonu (OpenAPI/Swagger)
- [ ] Component dokümantasyonu (Storybook)
- [ ] Developer guide
- [ ] Architecture decision records (ADR)

### Faz 4: Performans ve Optimizasyon (6-8 Hafta)

#### 4.1 Performance
- [ ] Bundle size analizi
- [ ] Code splitting iyileştirmeleri
- [ ] Image optimization
- [ ] Lazy loading

#### 4.2 Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Web Vitals)
- [ ] Analytics entegrasyonu
- [ ] User feedback sistemi

#### 4.3 Security
- [ ] Security audit
- [ ] CSP policy iyileştirmeleri
- [ ] Dependency vulnerability scan
- [ ] Penetration testing

---

## 🎯 ARAYÜZ GELİŞTİRME PLANI

### Hafta 1-2: Temel İyileştirmeler

#### Loading States
- [ ] Dashboard skeleton loader
- [ ] Table skeleton loader
- [ ] Chart skeleton loader
- [ ] Card skeleton loader

#### Error States
- [ ] Global error boundary iyileştirmesi
- [ ] API error mesajları
- [ ] Network error handling
- [ ] Retry mekanizması

#### Empty States
- [ ] Boş portföy placeholder
- [ ] Boş strateji listesi placeholder
- [ ] Boş market data placeholder
- [ ] Boş sonuç placeholder'ları

### Hafta 3-4: Animasyonlar ve Etkileşimler

#### Framer Motion Entegrasyonu
- [ ] Page transitions
- [ ] Component animations
- [ ] List animations
- [ ] Modal animations

#### Micro-interactions
- [ ] Button hover effects
- [ ] Card hover effects
- [ ] Input focus effects
- [ ] Toast animations

### Hafta 5-6: Tema ve Erişilebilirlik

#### Theme System
- [ ] Light theme implementasyonu
- [ ] Theme toggle component
- [ ] System theme detection
- [ ] Theme persistence

#### Accessibility
- [ ] WCAG 2.2 AA audit
- [ ] Keyboard navigation
- [ ] Screen reader optimizasyonu
- [ ] Focus indicators

### Hafta 7-8: Gelişmiş Özellikler

#### Advanced UI
- [ ] Command palette iyileştirmeleri
- [ ] Keyboard shortcuts
- [ ] Drag & drop
- [ ] Context menus

#### Data Visualization
- [ ] Daha zengin grafikler
- [ ] Interactive charts
- [ ] Data export
- [ ] Print-friendly views

---

## 📊 METRİKLER VE KPI'LAR

### Mevcut Metrikler
- **Kod Satırı:** ~50,000+ satır
- **Component Sayısı:** 185+
- **API Endpoint:** 101
- **Test Sayısı:** 35 (27 E2E + 8 Unit)
- **Sayfa Sayısı:** 15+

### Hedef Metrikler
- **Test Coverage:** %80+
- **TypeScript Coverage:** %100
- **Lighthouse Score:** 90+
- **WCAG Compliance:** AA
- **Bundle Size:** < 500KB (gzipped)

---

## 🔧 TEKNİK DEBT

### Yüksek Öncelikli
1. **CopilotDock SSE/WS entegrasyonu**
2. **Market data alanları (volume, liquidity, OI, funding)**
3. **API entegrasyonları (portfolio, strategy symbol lists)**
4. **Versiyon tutarsızlıkları (TypeScript, ESLint)**

### Orta Öncelikli
5. **Test coverage artırma**
6. **Dokümantasyon eksiklikleri**
7. **V2 entegrasyonu**
8. **Next.js 15 migration planı**

### Düşük Öncelikli
9. **Code splitting iyileştirmeleri**
10. **Bundle size optimizasyonu**
11. **Storybook entegrasyonu**
12. **OpenAPI dokümantasyonu**

---

## 📝 SONUÇ VE ÖNERİLER

### Güçlü Yönler
1. ✅ **Modern Stack:** Next.js 14, React 18, TypeScript
2. ✅ **İyi Mimari:** Monorepo, microservices
3. ✅ **Kapsamlı Özellikler:** 15+ sayfa, 101 API endpoint
4. ✅ **Test Altyapısı:** E2E ve unit testler mevcut
5. ✅ **Type Safety:** TypeScript strict mode

### İyileştirme Alanları
1. ⚠️ **TODO'lar:** 17 TODO/FIXME işareti
2. ⚠️ **Test Coverage:** Unit test coverage düşük
3. ⚠️ **Dokümantasyon:** API ve component docs eksik
4. ⚠️ **Versiyon Tutarlılığı:** Bazı paketlerde tutarsızlık
5. ⚠️ **V2 Durumu:** İki Next.js uygulaması yönetimi

### Öncelikli Aksiyonlar
1. **Hemen:** CopilotDock SSE/WS entegrasyonu
2. **Bu Hafta:** Market data alanları ve API entegrasyonları
3. **Bu Ay:** Versiyon tutarlılığı ve test coverage
4. **Bu Çeyrek:** V2 entegrasyonu ve Next.js 15 migration

---

## 📚 REFERANSLAR

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

---

**Rapor Oluşturulma Tarihi:** 26 Kasım 2025
**Son Güncelleme:** 26 Kasım 2025
**Versiyon:** 1.0
