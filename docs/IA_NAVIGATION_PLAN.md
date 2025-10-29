# Spark Trading Platform — Information Architecture (IA) Plan v1.0

## 📋 Mevcut Durum Analizi

### Tespit Edilen Sorunlar

1. **Çift Sidebar Yapısı** ❌
   - Sol primary nav: Dashboard, Market Data, Strategy Lab, Backtest, Portfolio, Alerts
   - Sol secondary nav: Dashboard, Strategy Lab, Audit, Portfolio, Settings
   - Kullanıcı kafası karışıyor, gezinti iki kat uzun

2. **Karma Dil (TR/EN)** ❌
   - "Guard Validate", "Commands", "API", "WS", "Engine" → English
   - "Ara...", "Strateji Oluştur", "Veri Akışı" → Turkish
   - "Çalışmıyor", "Çevrimdışı", "Henüz veri yok" → Turkish

3. **Copilot Dock Eksik** ❌
   - Ekran görüntüsünde sağ-alt köşede yok
   - ⌘K Commands butonu üstte ama küçük

4. **Status Bar Dağınık** ⚠️
   - API/WS/Engine göstergeleri sol üstte
   - EB% badge içerikte (başlıkta)
   - Tutarlı bir status bar yok

5. **Strategy Lab Belirsiz** ⚠️
   - Tek sayfa mı, çoklu sayfa mı belli değil
   - Backtest ayrı menü itemı
   - Yaşam döngüsü akışı net değil

---

## 🎯 Hedef Information Architecture

### PRIMARY Pages (Ana Navigasyon)

```
┌─ Sol Sidebar (72px collapsed / 240px expanded) ─┐
│                                                   │
│  1. 🏠 Anasayfa          /dashboard              │
│  2. 🧪 Strateji Lab      /strategy-lab           │
│  3. 📋 Stratejilerim     /strategies             │
│  4. 🏃 Çalışan           /running                │
│  5. ⚙️  Ayarlar           /settings               │
│                                                   │
└───────────────────────────────────────────────────┘
```

### SECONDARY Pages (Opsiyonel, Ayarlarda aç/kapa)

```
6. 📊 Piyasa Verisi       /market-data
7. 🔔 Uyarılar            /alerts
8. 📝 Denetim Logu        /audit
9. 👁️  Gözlemlenebilirlik  /observability
```

### Sayfa Detayları

#### 1. Anasayfa (/dashboard)

```
┌─ Üst Status Bar ──────────────────────────────┐
│ API ● WS ● Engine ● EB 0.0% | Ortam: Deneme   │
└────────────────────────────────────────────────┘

┌─ Ana Grid ─────────────────────────────────────┐
│ [Metrikler]                                    │
│ - P95 Gecikme: 58 ms (Hedef: 1200 ms)        │
│ - Güncellik: 0 ms (Eşik: 30 sn)              │
│                                                 │
│ [Canlı Piyasa Kartları]                        │
│ - BTCUSDT, ETHUSDT                             │
│                                                 │
│ [Son Aktiviteler]                              │
│ - Son 5 işlem/alarm/backtest                  │
└─────────────────────────────────────────────────┘
```

#### 2. Strateji Lab (/strategy-lab)

```
┌─ Sekmeler ─────────────────────────────────────┐
│ [Üret (AI)] [Backtest] [Optimizasyon] [Dağıt] │
└─────────────────────────────────────────────────┘

TAB 1: Üret (AI)
- Prompt girişi: "10 günlük MA'yı 20 günlük MA yukarı kestiğinde al"
- İndikatör seçimi: MA(10), MA(20), RSI(14)
- Kural önizleme: if (ma10 > ma20) buy()
- Kod önizleme: Monaco Editor
- [Backtest'e Geç] butonu

TAB 2: Backtest
- Dataset: BTC/USDT, 2024-01-01 → 2024-10-29
- Parametreler: Komisyon, başlangıç sermaye
- [Çalıştır] → SSE progress bar
- Equity curve (Recharts/Lightweight)
- Metrikler: Sharpe, Max DD, Win Rate

TAB 3: Optimizasyon
- Yöntem: Grid Search / Bayesian
- Param aralıkları: ma_period=[5-50], rsi_period=[10-20]
- [Optimizasyon Başlat]
- Leaderboard: En iyi 10 parametre seti
- [Best Params → Dağıt]

TAB 4: Dağıt
- Strateji adı: "MA Crossover v1"
- Risk limitleri: Max pozisyon, günlük zarar limiti
- Lot boyutu: 0.01
- [Canary (Dry-run)] → 24 saat test
- [Canlıya Al] → Production
```

#### 3. Stratejilerim (/strategies)

```
┌─ Filtreler ─────────────────────────────────────┐
│ [Tümü] [Aktif] [Durdurulmuş] [Taslak]          │
│ Sırala: [En Yeni] [En İyi Performans]          │
└──────────────────────────────────────────────────┘

┌─ Strateji Kartları ─────────────────────────────┐
│ MA Crossover v1                                 │
│ Sharpe: 1.8 | P&L: +12.5% | Durum: ✅ Aktif   │
│ [Düzenle] [Durdur] [Sil] [Kopyala]            │
├──────────────────────────────────────────────────┤
│ RSI Oversold v2                                 │
│ Sharpe: 1.2 | P&L: +8.3% | Durum: ⏸️ Duraklatıldı │
└──────────────────────────────────────────────────┘
```

#### 4. Çalışan Stratejiler (/running)

```
┌─ Özet Metrikler ────────────────────────────────┐
│ Toplam P&L: +$1,234 | Bugün: +$56            │
│ Aktif Pozisyonlar: 3 | Açık Emirler: 2        │
└──────────────────────────────────────────────────┘

┌─ Strateji Listesi (Real-time) ─────────────────┐
│ MA Crossover v1    | BTC/USDT | +$45 | ✅     │
│ [Durdur] [Parametreleri Gör] [Log]            │
├──────────────────────────────────────────────────┤
│ RSI Oversold v2    | ETH/USDT | +$12 | ✅     │
└──────────────────────────────────────────────────┘

┌─ Son 15 dk Olayları ────────────────────────────┐
│ 13:25 | MA Crossover | BUY 0.01 BTC @ 67,450  │
│ 13:20 | RSI Oversold | SELL 0.1 ETH @ 3,250   │
└──────────────────────────────────────────────────┘
```

#### 5. Ayarlar (/settings)

```
┌─ Ayarlar Kategorileri ──────────────────────────┐
│ [Borsa API Anahtarları]                        │
│ - Binance: ********** [Düzenle]               │
│ - BTCTurk: ********** [Düzenle]               │
│                                                 │
│ [Risk Guardrails]                              │
│ - Max pozisyon boyutu: $10,000                 │
│ - Günlük zarar limiti: $500                    │
│ - Kill Switch: 🟢 Aktif                         │
│                                                 │
│ [Tema & Dil]                                    │
│ - Tema: [Koyu] [Açık]                          │
│ - Dil: [🇹🇷 Türkçe] [🇬🇧 English]             │
│                                                 │
│ [Opsiyonel Sayfalar]                           │
│ ☑️ Piyasa Verisi                                │
│ ☑️ Uyarılar                                     │
│ ☐ Denetim Logu                                 │
│ ☐ Gözlemlenebilirlik                           │
└──────────────────────────────────────────────────┘
```

---

## 🎨 Layout Yapısı

### Tek Sidebar + Top Status Bar + Right Copilot Dock

```
┌───────────────────────────────────────────────────────┐
│ [Logo] API●WS●Engine | EB 0.0% | Ortam | [Ara] [⌘K] │ ← Top Status Bar
├────────┬──────────────────────────────────────────────┤
│        │                                              │
│  🏠    │         MAIN CONTENT AREA                   │
│  🧪    │                                              │
│  📋    │                                              │
│  🏃    │                                              │
│  ⚙️     │                                              │
│        │                                              │
│ Sidebar│                                              │
│ 72/240 │                                              │
│   px   │                                              │
│        │                                   [💬] ← Copilot │
└────────┴──────────────────────────────────────────────┘
          ↑                                    ↑
      Single Nav                    Floating Dock (bottom-right)
```

### Component Hierarchy

```typescript
<AppShell>
  <TopStatusBar>
    <ServiceIndicators /> // API • WS • Engine
    <ErrorBudget />
    <Environment />
    <SearchInput />
    <CommandButton /> // ⌘K
  </TopStatusBar>

  <div className="flex">
    <Sidebar collapsed={isCollapsed}>
      <NavItem href="/dashboard" icon={<Home />}>Anasayfa</NavItem>
      <NavItem href="/strategy-lab" icon={<Lab />}>Strateji Lab</NavItem>
      <NavItem href="/strategies" icon={<List />}>Stratejilerim</NavItem>
      <NavItem href="/running" icon={<Play />}>Çalışan</NavItem>
      <NavItem href="/settings" icon={<Settings />}>Ayarlar</NavItem>
    </Sidebar>

    <main className="flex-1">
      {children}
    </main>
  </div>

  <CopilotDock
    position="bottom-right"
    hotkey="Ctrl+K"
    modes={['analysis', 'manage', 'strategy']}
  />
</AppShell>
```

---

## 🌐 i18n Yapısı

### Dosya Organizasyonu

```
apps/web-next/
├── messages/
│   ├── tr/
│   │   ├── common.json       # Genel terimler
│   │   ├── dashboard.json    # Dashboard sayfası
│   │   ├── strategyLab.json  # Strateji Lab
│   │   ├── strategies.json   # Stratejilerim
│   │   ├── running.json      # Çalışan stratejiler
│   │   └── settings.json     # Ayarlar
│   └── en/
│       ├── common.json
│       ├── dashboard.json
│       ├── strategyLab.json
│       ├── strategies.json
│       ├── running.json
│       └── settings.json
└── src/
    ├── i18n/
    │   ├── config.ts         # defaultLocale = 'tr'
    │   └── useTranslation.ts # Hook
    └── lib/
        └── i18n.ts           # Server-side helper
```

### messages/tr/common.json

```json
{
  "nav": {
    "dashboard": "Anasayfa",
    "strategyLab": "Strateji Lab",
    "strategies": "Stratejilerim",
    "running": "Çalışan Stratejiler",
    "settings": "Ayarlar",
    "marketData": "Piyasa Verisi",
    "alerts": "Uyarılar",
    "audit": "Denetim Logu",
    "observability": "Gözlemlenebilirlik"
  },
  "status": {
    "api": "API",
    "ws": "WS",
    "engine": "Motor",
    "healthy": "Sağlıklı",
    "degraded": "Kötüleşmiş",
    "down": "Çalışmıyor",
    "errorBudget": "Hata Bütçesi",
    "environment": "Ortam",
    "test": "Deneme",
    "production": "Canlı"
  },
  "actions": {
    "create": "Oluştur",
    "edit": "Düzenle",
    "delete": "Sil",
    "save": "Kaydet",
    "cancel": "İptal",
    "search": "Ara",
    "filter": "Filtrele",
    "sort": "Sırala",
    "commands": "Komutlar"
  },
  "empty": {
    "noData": "Henüz veri yok",
    "createFirst": "İlk {item} oluşturun",
    "noResults": "Sonuç bulunamadı"
  }
}
```

### messages/en/common.json

```json
{
  "nav": {
    "dashboard": "Home",
    "strategyLab": "Strategy Lab",
    "strategies": "My Strategies",
    "running": "Running",
    "settings": "Settings",
    "marketData": "Market Data",
    "alerts": "Alerts",
    "audit": "Audit Log",
    "observability": "Observability"
  },
  "status": {
    "api": "API",
    "ws": "WS",
    "engine": "Engine",
    "healthy": "Healthy",
    "degraded": "Degraded",
    "down": "Down",
    "errorBudget": "Error Budget",
    "environment": "Environment",
    "test": "Test",
    "production": "Production"
  },
  "actions": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "commands": "Commands"
  },
  "empty": {
    "noData": "No data yet",
    "createFirst": "Create your first {item}",
    "noResults": "No results found"
  }
}
```

---

## 🎮 Copilot Dock Specification

### Pozisyon ve Davranış

```typescript
interface CopilotDockProps {
  position: "bottom-right" | "bottom-left";
  hotkey: string; // 'Ctrl+K' | 'Cmd+K'
  defaultMode: "analysis" | "manage" | "strategy";
  collapsed?: boolean;
}

// States:
// 1. Collapsed: 56x56px floating button (💬 icon)
// 2. Mini: 320x480px preview card
// 3. Expanded: 480px wide drawer (right side, full height)
```

### Modlar

#### 1. Analysis Mode (Piyasa Analizi)

```
┌─ Piyasa Analizi ─────────────────┐
│ BTC/USDT Özet                    │
│ - Fiyat: $67,450 (+2.3%)        │
│ - RSI(14): 68 (Aşırı Alım?)    │
│ - MA(20) üstünde                 │
│                                   │
│ [Detaylı Analiz İste]           │
│ [Strateji Öner]                  │
└───────────────────────────────────┘
```

#### 2. Manage Mode (Yönetim)

```
┌─ Sistem Yönetimi ────────────────┐
│ Hızlı Eylemler:                  │
│ • Tüm stratejileri durdur        │
│ • Kill Switch: Aç/Kapat          │
│ • Log'ları temizle               │
│ • Backtest sırasını gör          │
│                                   │
│ Son Uyarılar:                    │
│ ⚠️ MA Crossover: Yüksek kayma   │
└───────────────────────────────────┘
```

#### 3. Strategy Mode (Strateji Asistanı)

```
┌─ Strateji Asistanı ──────────────┐
│ Aktif Sekme: Backtest            │
│                                   │
│ Öneriler:                        │
│ • Komisyon oranını 0.1%'ye ayarla│
│ • Sharpe ratio optimize et       │
│ • 2023 verisiyle karşılaştır     │
│                                   │
│ [Parametreleri Optimize Et]      │
└───────────────────────────────────┘
```

### Event Bus Integration

```typescript
// apps/web-next/src/lib/copilotBus.ts
type CopilotEvent =
  | { type: "request:analysis"; symbol: string }
  | { type: "request:strategy"; context: StrategyContext }
  | { type: "action:stop-all" }
  | { type: "action:toggle-killswitch" };

export const copilotBus = {
  emit: (event: CopilotEvent) => {
    /* ... */
  },
  on: (type: string, handler: (e: CopilotEvent) => void) => {
    /* ... */
  },
};
```

---

## 📐 Responsive Breakpoints

```css
/* Mobile: Single column, collapsed sidebar (overlay) */
@media (max-width: 768px) {
  .sidebar {
    width: 0;
    transform: translateX(-100%);
  }
  .sidebar.open {
    width: 100vw;
    transform: translateX(0);
  }
  .copilot-dock {
    bottom: 80px;
  } /* Avoid nav bar */
}

/* Tablet: Collapsed sidebar (72px icons) */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 72px;
  }
  .copilot-dock {
    width: 320px;
  }
}

/* Desktop: Expanded sidebar (240px) */
@media (min-width: 1025px) {
  .sidebar {
    width: 240px;
  }
  .copilot-dock.expanded {
    width: 480px;
  }
}
```

---

## 🧩 Component Refactoring Checklist

### Phase 1: Layout Infrastructure

- [ ] `apps/web-next/src/components/layout/AppShell.tsx`
  - Remove secondary sidebar
  - Add TopStatusBar
  - Add CopilotDock placeholder

- [ ] `apps/web-next/src/components/layout/TopStatusBar.tsx`
  - API • WS • Engine indicators (with aria-live)
  - Error Budget badge
  - Environment indicator
  - Search input
  - Command button (⌘K)

- [ ] `apps/web-next/src/components/layout/Sidebar.tsx`
  - Single column navigation
  - Collapsible (72px ↔ 240px)
  - aria-current="page"
  - Keyboard navigation (↑/↓/Enter)

- [ ] `apps/web-next/src/components/copilot/CopilotDock.tsx`
  - Floating button (bottom-right)
  - Drawer expansion
  - Mode switching (analysis/manage/strategy)
  - Hotkey handler (Ctrl+K)

### Phase 2: Strategy Lab Tabs

- [ ] `apps/web-next/src/app/strategy-lab/page.tsx`
  - Tab container (4 tabs)
  - Shared state management
  - Tab navigation (URL hash or query param)

- [ ] `apps/web-next/src/app/strategy-lab/_tabs/GenerateTab.tsx`
  - AI prompt input
  - Indicator selector
  - Rule preview
  - Monaco code editor

- [ ] `apps/web-next/src/app/strategy-lab/_tabs/BacktestTab.tsx`
  - Dataset selector
  - Parameter form
  - SSE progress bar
  - Equity curve chart
  - Metrics table

- [ ] `apps/web-next/src/app/strategy-lab/_tabs/OptimizeTab.tsx`
  - Optimization method selector
  - Parameter bounds form
  - Leaderboard table
  - "Deploy Best" button

- [ ] `apps/web-next/src/app/strategy-lab/_tabs/DeployTab.tsx`
  - Strategy name input
  - Risk limits form
  - Lot size selector
  - Canary toggle
  - Deploy button

### Phase 3: i18n Implementation

- [ ] `apps/web-next/messages/tr/common.json`
- [ ] `apps/web-next/messages/en/common.json`
- [ ] `apps/web-next/messages/tr/dashboard.json`
- [ ] `apps/web-next/messages/en/dashboard.json`
- [ ] `apps/web-next/messages/tr/strategyLab.json`
- [ ] `apps/web-next/messages/en/strategyLab.json`
- [ ] `apps/web-next/src/i18n/config.ts`
- [ ] `apps/web-next/src/i18n/useTranslation.ts`

### Phase 4: Empty States & Polish

- [ ] `apps/web-next/src/components/ui/EmptyState.tsx`
  - Icon + Message + CTA
  - role="status"
  - aria-live="polite"

- [ ] Update all pages to use EmptyState
  - Dashboard: Alarm Taslakları, Canary Testleri
  - Strategies: İlk strateji oluştur
  - Running: Henüz çalışan strateji yok

- [ ] Kontrast düzeltmeleri
  - `--text-muted` → ≥4.5:1
  - Focus ring: `--ring` token

---

## 🎯 Kabul Kriterleri

### Navigation

- [ ] Tek sidebar (çift sidebar kaldırıldı)
- [ ] Klavye ile tam gezinti (Tab, ↑, ↓, Enter)
- [ ] `aria-current="page"` doğru sayfa işaretli
- [ ] Mobile'da overlay sidebar
- [ ] Collapse/expand toggle çalışıyor

### Copilot Dock

- [ ] Sağ-alt köşede floating button
- [ ] Ctrl+K ile açılır/kapanır
- [ ] 3 mod çalışıyor (analysis, manage, strategy)
- [ ] Strategy Lab sekmesinden context okuyor
- [ ] Drawer animasyonu smooth

### Strategy Lab

- [ ] 4 sekme: Üret, Backtest, Optimizasyon, Dağıt
- [ ] Sekmeler arası geçiş smooth
- [ ] Shared state korunuyor
- [ ] "Best Params → Dağıt" akışı çalışıyor
- [ ] Her sekme keyboard accessible

### i18n

- [ ] TR/EN ayrı dosyalar
- [ ] defaultLocale = 'tr'
- [ ] Karma dil %0 (tüm etiketler çevrilmiş)
- [ ] Dil değiştirme çalışıyor
- [ ] Lighthouse i18n uyarısı 0

### A11y

- [ ] Lighthouse Accessibility ≥90
- [ ] Axe critical/serious = 0
- [ ] Kontrast ≥4.5:1
- [ ] Focus ring visible
- [ ] Screen reader navigation çalışıyor

---

## 📅 Implementation Timeline

### Hafta 1: Infrastructure

- **Gün 1-2:** Layout refactoring (AppShell, TopStatusBar, Sidebar)
- **Gün 3-4:** CopilotDock skeleton + hotkey handler
- **Gün 5:** i18n setup (config, messages, hooks)

### Hafta 2: Strategy Lab

- **Gün 6-7:** Tab container + GenerateTab
- **Gün 8-9:** BacktestTab + OptimizeTab
- **Gün 10:** DeployTab + event bus

### Hafta 3: Polish & A11y

- **Gün 11-12:** EmptyState components + karma dil temizliği
- **Gün 13-14:** Kontrast düzeltmeleri + focus management
- **Gün 15:** Lighthouse/Axe audit + fixes

---

## 🚨 Riskler ve Azaltma

### Risk 1: Büyük Refactoring Breakage

**Neden:** Layout ve routing değişiklikleri mevcut component'leri bozabilir
**Azaltma:**

- Git branch: `feat/ui-ia-cleanup`
- Her phase'de build + typecheck
- Visual regression testing (Playwright screenshots)

### Risk 2: i18n Migration Zorluğu

**Neden:** 100+ string manuel çeviri gerekiyor
**Azaltma:**

- LLM ile batch translation (Claude/GPT)
- Missing key fallback (TR → EN)
- Gradual migration (sayfa sayfa)

### Risk 3: Copilot Dock Performans

**Neden:** Floating drawer, heavy React state
**Azaltma:**

- Lazy load drawer content
- Debounce event bus
- Memoize components

### Risk 4: Strategy Lab State Management

**Neden:** 4 sekme arası state sync karmaşık
**Azaltma:**

- Zustand store (single source of truth)
- URL query params (tab + params)
- LocalStorage backup

---

## 📖 İlgili Dokümanlar

- [UI/UX Plan](./UI_UX_PLAN.md) - NN/g + WCAG 2.2 AA standartları
- [Proje Analizi](../PROJE_ANALIZ_VE_EYLEM_PLANI_2025_10_29.md) - 12 haftalık roadmap
- [UI Rescue Report](../evidence/UI_RESCUE_FINAL_REPORT.md) - Backend servis bağlantıları

---

**Versiyon:** 1.0
**Hazırlayan:** Claude Sonnet 4.5
**Tarih:** 29 Ekim 2025
**Durum:** 📝 Plan Hazır - Implementation Bekliyor
