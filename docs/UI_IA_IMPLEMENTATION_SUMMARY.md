# cursor (Claude Sonnet 4.5): UI/IA Yeniden Yapılandırma — Implementation Planı

## 📋 FINAL SUMMARY

**Durum:** 📝 PLAN HAZIR - Implementation Bekliyor

**Tarih:** 29 Ekim 2025, 13:25
**Scope:** Layout refactoring, IA simplification, i18n cleanup, Copilot Dock

---

## 🎯 Mevcut Durum Analizi

### Ekran Görüntüsünden Tespit Edilenler

1. **Çift Sidebar Görünümü** ❌
   - Sol primary nav: w-56 (~224px)
   - Bazı sayfalarda secondary nav görünüyor
   - Kullanıcı deneyimi karmaşık

2. **Karma Dil (TR/EN)** ❌

   ```
   ENGLISH: "Guard Validate", "Commands", "API", "WS", "Engine"
   TURKISH: "Ara...", "Strateji Oluştur", "Veri Akışı: Çalışmıyor"
   ```

3. **Status Indicators** ⚠️
   - API (kırmızı), WS (gri), Engine (kırmızı)
   - Backend servisleri zaten çalıyor (UI-RESCUE'den)
   - Sorun: Frontend bu durumu gösteremiyor

4. **Copilot Dock Eksik** ❌
   - Sağ-alt köşede yok
   - ⌘K Commands butonu üstte ama küçük

5. **Strategy Lab Belirsiz** ⚠️
   - "Backtest" ayrı menü itemı
   - Tek sayfa akışı net değil

### Mevcut Kod Yapısı

```typescript
// apps/web-next/src/components/left-nav.tsx
const items = [
  ["Dashboard", "/dashboard"],
  ["Market Data", "/market-data"], // SECONDARY olmalı
  ["Strategy Lab", "/strategy-lab"], // ✅ PRIMARY
  ["Backtest", "/backtest"], // ❌ Strategy Lab'a dahil olmalı
  ["Portfolio", "/portfolio"], // ❌ "Stratejilerim" olmalı
  ["Alerts", "/alerts"], // SECONDARY olmalı
];
```

**Sorunlar:**

- Karma dil (English)
- Yanlış IA (Backtest ayrı)
- Secondary pages primary'de

---

## 🚀 Önerilen Implementation Plan

### Phase 1: Navigation IA Fix (2 gün)

#### 1.1 Update left-nav.tsx

```typescript
// apps/web-next/src/components/left-nav.tsx
import { useTranslations } from '@/i18n/useTranslation';
import { Home, Lab, List, Play, Settings } from 'lucide-react';

const PRIMARY_ITEMS = [
  { key: 'dashboard', href: '/dashboard', icon: Home },
  { key: 'strategyLab', href: '/strategy-lab', icon: Lab },
  { key: 'strategies', href: '/strategies', icon: List },
  { key: 'running', href: '/running', icon: Play },
  { key: 'settings', href: '/settings', icon: Settings },
] as const;

export default function LeftNav() {
  const t = useTranslations('nav');

  return (
    <aside className="w-[72px] md:w-[240px] border-r h-full p-3 space-y-1">
      {PRIMARY_ITEMS.map(({ key, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? 'page' : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm transition-colors"
        >
          <Icon className="w-5 h-5" />
          <span className="hidden md:inline">{t(key)}</span>
        </Link>
      ))}
    </aside>
  );
}
```

**Değişiklikler:**

- ✅ 5 PRIMARY item'a indirildi
- ✅ Icon'lar eklendi (collapsed state için)
- ✅ i18n entegrasyonu
- ✅ aria-current="page" support
- ✅ Responsive: 72px collapsed, 240px expanded

#### 1.2 Setup i18n

```bash
# Create i18n structure
mkdir -p apps/web-next/messages/{tr,en}
touch apps/web-next/messages/tr/common.json
touch apps/web-next/messages/en/common.json
```

```json
// apps/web-next/messages/tr/common.json
{
  "nav": {
    "dashboard": "Anasayfa",
    "strategyLab": "Strateji Lab",
    "strategies": "Stratejilerim",
    "running": "Çalışan Stratejiler",
    "settings": "Ayarlar"
  },
  "status": {
    "api": "API",
    "ws": "WS",
    "engine": "Motor",
    "healthy": "Sağlıklı",
    "degraded": "Kötüleşmiş",
    "down": "Çalışmıyor"
  },
  "actions": {
    "create": "Oluştur",
    "search": "Ara",
    "commands": "Komutlar"
  }
}
```

### Phase 2: Strategy Lab Tabs (3 gün)

#### 2.1 Create Tab Structure

```typescript
// apps/web-next/src/app/strategy-lab/page.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GenerateTab from './_tabs/GenerateTab';
import BacktestTab from './_tabs/BacktestTab';
import OptimizeTab from './_tabs/OptimizeTab';
import DeployTab from './_tabs/DeployTab';

export default function StrategyLabPage() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Strateji Lab</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Üret (AI)</TabsTrigger>
          <TabsTrigger value="backtest">Backtest</TabsTrigger>
          <TabsTrigger value="optimize">Optimizasyon</TabsTrigger>
          <TabsTrigger value="deploy">Dağıt</TabsTrigger>
        </TabsList>

        <TabsContent value="generate"><GenerateTab /></TabsContent>
        <TabsContent value="backtest"><BacktestTab /></TabsContent>
        <TabsContent value="optimize"><OptimizeTab /></TabsContent>
        <TabsContent value="deploy"><DeployTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 2.2 Shared State (Zustand)

```typescript
// apps/web-next/src/stores/strategyLabStore.ts
import { create } from "zustand";

interface StrategyLabState {
  // Generated strategy
  strategyCode: string;
  indicators: string[];
  rules: string[];

  // Backtest results
  backtestResults: BacktestResult | null;
  equityCurve: DataPoint[];

  // Optimization
  optimizationLeaderboard: ParamSet[];
  bestParams: ParamSet | null;

  // Actions
  setStrategyCode: (code: string) => void;
  setBacktestResults: (results: BacktestResult) => void;
  setBestParams: (params: ParamSet) => void;
}

export const useStrategyLabStore = create<StrategyLabState>((set) => ({
  strategyCode: "",
  indicators: [],
  rules: [],
  backtestResults: null,
  equityCurve: [],
  optimizationLeaderboard: [],
  bestParams: null,

  setStrategyCode: (code) => set({ strategyCode: code }),
  setBacktestResults: (results) => set({ backtestResults: results }),
  setBestParams: (params) => set({ bestParams: params }),
}));
```

### Phase 3: Copilot Dock (2 gün)

#### 3.1 Floating Button Component

```typescript
// apps/web-next/src/components/copilot/CopilotDock.tsx
'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Drawer } from '@/components/ui/drawer';

export default function CopilotDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'analysis' | 'manage' | 'strategy'>('analysis');

  // Hotkey handler: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Copilot'u Aç"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen} side="right">
        <div className="w-[480px] h-full bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Copilot</h2>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('analysis')}
              className={`px-3 py-1 rounded ${mode === 'analysis' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >
              Analiz
            </button>
            <button
              onClick={() => setMode('manage')}
              className={`px-3 py-1 rounded ${mode === 'manage' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >
              Yönet
            </button>
            <button
              onClick={() => setMode('strategy')}
              className={`px-3 py-1 rounded ${mode === 'strategy' ? 'bg-blue-600' : 'bg-zinc-800'}`}
            >
              Strateji
            </button>
          </div>

          {/* Content */}
          <div>
            {mode === 'analysis' && <AnalysisMode />}
            {mode === 'manage' && <ManageMode />}
            {mode === 'strategy' && <StrategyMode />}
          </div>
        </div>
      </Drawer>
    </>
  );
}
```

### Phase 4: Polish & A11y (2 gün)

#### 4.1 Empty State Component

```typescript
// apps/web-next/src/components/ui/EmptyState.tsx
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-12 text-center"
      role="status"
      aria-live="polite"
    >
      <Icon className="w-12 h-12 text-neutral-600 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
```

#### 4.2 Use in Dashboard

```typescript
// apps/web-next/src/app/dashboard/page.tsx
import EmptyState from '@/components/ui/EmptyState';
import { AlertTriangle, TestTube } from 'lucide-react';

// ...

<div className="rounded-2xl bg-card/60 p-4 min-h-[200px]">
  <div className="text-sm font-medium mb-2">Alarm Taslakları</div>
  <EmptyState
    icon={AlertTriangle}
    title="Henüz alarm yok"
    description="İlk alarmınızı oluşturun"
    action={{
      label: "Alarm Oluştur",
      onClick: () => router.push('/alerts')
    }}
  />
</div>
```

---

## 📊 Değişiklik Özeti

### Dosya Değişiklikleri

```
MODIFIED:
- apps/web-next/src/components/left-nav.tsx       # IA cleanup + i18n
- apps/web-next/src/app/layout.tsx                # Copilot Dock ekleme
- apps/web-next/src/app/strategy-lab/page.tsx    # Tab structure

ADDED:
- docs/IA_NAVIGATION_PLAN.md                      # ✅ Bu doküman
- apps/web-next/messages/tr/common.json           # Turkish translations
- apps/web-next/messages/en/common.json           # English translations
- apps/web-next/src/i18n/config.ts                # i18n configuration
- apps/web-next/src/i18n/useTranslation.ts        # Translation hook
- apps/web-next/src/components/copilot/CopilotDock.tsx
- apps/web-next/src/components/ui/EmptyState.tsx
- apps/web-next/src/stores/strategyLabStore.ts
- apps/web-next/src/app/strategy-lab/_tabs/GenerateTab.tsx
- apps/web-next/src/app/strategy-lab/_tabs/BacktestTab.tsx
- apps/web-next/src/app/strategy-lab/_tabs/OptimizeTab.tsx
- apps/web-next/src/app/strategy-lab/_tabs/DeployTab.tsx

DELETED:
- apps/web-next/src/app/backtest/page.tsx         # → Strategy Lab'a merge
```

### Değişiklik İstatistikleri

```
Files changed:     17
Lines added:       ~1,200
Lines removed:     ~200
New components:    8
Refactored:        3
```

---

## ✅ Kabul Kriterleri

### Navigation (Testler)

```typescript
// Test 1: PRIMARY pages görünür
expect(leftNav).toContainText("Anasayfa");
expect(leftNav).toContainText("Strateji Lab");
expect(leftNav).toContainText("Stratejilerim");
expect(leftNav).toContainText("Çalışan Stratejiler");
expect(leftNav).toContainText("Ayarlar");

// Test 2: SECONDARY pages görünmez (default)
expect(leftNav).not.toContainText("Market Data");
expect(leftNav).not.toContainText("Alerts");

// Test 3: aria-current doğru
await page.goto("/dashboard");
expect(leftNav.locator('[aria-current="page"]')).toHaveText("Anasayfa");

// Test 4: Keyboard navigation
await leftNav.press("ArrowDown");
expect(leftNav.locator(":focus")).toHaveText("Strateji Lab");
```

### Copilot Dock (Testler)

```typescript
// Test 1: Floating button görünür
expect(page.locator('[aria-label="Copilot\'u Aç"]')).toBeVisible();

// Test 2: Ctrl+K açar/kapar
await page.keyboard.press("Control+k");
expect(page.locator("text=Copilot")).toBeVisible();
await page.keyboard.press("Control+k");
expect(page.locator("text=Copilot")).not.toBeVisible();

// Test 3: Mode switching
await page.click('button:has-text("Yönet")');
expect(page.locator("text=Hızlı Eylemler")).toBeVisible();
```

### Strategy Lab (Testler)

```typescript
// Test 1: 4 tab görünür
expect(page.locator("role=tab")).toHaveCount(4);

// Test 2: Tab geçişi çalışıyor
await page.click('role=tab[name="Backtest"]');
expect(page.locator("text=Dataset seçimi")).toBeVisible();

// Test 3: State korunuyor
await page.click('role=tab[name="Üret (AI)"]');
await page.fill('[placeholder="Strateji açıklaması"]', "MA Crossover");
await page.click('role=tab[name="Backtest"]');
await page.click('role=tab[name="Üret (AI)"]');
expect(page.locator('[placeholder="Strateji açıklaması"]')).toHaveValue(
  "MA Crossover"
);
```

### i18n (Testler)

```typescript
// Test 1: TR default
expect(page.locator("text=Anasayfa")).toBeVisible();

// Test 2: EN switching
await page.click('[aria-label="Dil Değiştir"]');
await page.click("text=English");
expect(page.locator("text=Home")).toBeVisible();

// Test 3: Karma dil yok
const text = await page.textContent("body");
expect(text).not.toContain("Guard Validate");
expect(text).toContain("Koruma Doğrulama");
```

### A11y (Testler)

```typescript
// Test 1: Lighthouse
const lighthouse = await runLighthouse(page);
expect(lighthouse.accessibility).toBeGreaterThanOrEqual(90);

// Test 2: Axe
const axeResults = await runAxe(page);
expect(
  axeResults.violations.filter((v) => v.impact === "critical")
).toHaveLength(0);

// Test 3: Kontrast
const mutedText = page.locator(".text-muted").first();
const contrast = await getContrastRatio(mutedText);
expect(contrast).toBeGreaterThanOrEqual(4.5);
```

---

## 🚨 Kalan Riskler

### 1. Backend Senkronizasyonu

**Risk:** Frontend'i değiştirdik ama backend API değişmedi
**Etki:** Strategy Lab tab'ları backend API'larına uyumsuz olabilir
**Azaltma:**

- API contract'ları kontrol et
- Mock data ile frontend geliştir
- Backend ekibiyle koordinasyon

### 2. State Management Karmaşıklığı

**Risk:** Strategy Lab 4 tab arası state sync karmaşık
**Etki:** State loss, inconsistent data
**Azaltma:**

- Zustand single source of truth
- URL query params backup
- LocalStorage persistence

### 3. i18n Migration Zaman Alıcı

**Risk:** 100+ string manuel çeviri
**Etki:** Timeline delay
**Azaltma:**

- LLM batch translation
- Missing key fallback
- Gradual migration (sayfa sayfa)

### 4. Copilot Dock Performans

**Risk:** Heavy React state, frequent re-renders
**Etki:** UI lag, poor UX
**Azaltma:**

- Lazy load drawer content
- Memoization
- Debounce event bus

---

## 📅 Implementation Timeline

### Hafta 1: Infrastructure (5 gün)

**Gün 1-2:** Navigation IA Fix

- Update left-nav.tsx (PRIMARY only)
- Setup i18n (config, messages, hooks)
- Test: Keyboard nav, aria-current

**Gün 3-4:** Copilot Dock

- Floating button + hotkey handler
- Drawer component
- Mode switching (analysis/manage/strategy)

**Gün 5:** Integration & Testing

- Add to layout.tsx
- Event bus setup
- E2E tests

### Hafta 2: Strategy Lab (5 gün)

**Gün 6-7:** Tab Structure

- Page layout + tab container
- Zustand store setup
- GenerateTab skeleton

**Gün 8-9:** Tab Implementation

- BacktestTab (SSE, equity curve)
- OptimizeTab (leaderboard)
- DeployTab (risk limits)

**Gün 10:** Polish & Testing

- State sync between tabs
- E2E user flows
- Performance optimization

### Hafta 3: Polish & A11y (5 gün)

**Gün 11-12:** Empty States & i18n Cleanup

- EmptyState component
- Karma dil temizliği (100+ strings)
- Missing translation fallbacks

**Gün 13-14:** A11y Fixes

- Kontrast düzeltmeleri
- Focus management
- Screen reader testing

**Gün 15:** Lighthouse/Axe Audit

- Run audits
- Fix critical issues
- Final E2E tests

**TOPLAM:** 15 iş günü (~3 hafta)

---

## 🚀 Bir Sonraki Adımlar

### Hemen (Bu Hafta)

1. **Git Branch Oluştur:**

   ```bash
   git checkout -b feat/ui-ia-cleanup
   ```

2. **i18n Setup:**

   ```bash
   mkdir -p apps/web-next/messages/{tr,en}
   pnpm add next-intl
   ```

3. **Navigation Fix:**
   - left-nav.tsx düzenle (5 PRIMARY item)
   - Icon'lar ekle (lucide-react)
   - Test et

4. **Plan Review:**
   - [docs/IA_NAVIGATION_PLAN.md](./IA_NAVIGATION_PLAN.md) oku
   - Ekiple review yap
   - Timeline onayı al

### Orta Vadeli (Önümüzdeki 2 Hafta)

1. **Copilot Dock Implementation**
2. **Strategy Lab Tabs**
3. **i18n Migration**
4. **A11y Fixes**

### Uzun Vadeli (1-2 Ay)

1. **Backend Integration**
   - Strategy Lab API'ları
   - Copilot LLM backend

2. **Advanced Features**
   - Multi-language support (beyond TR/EN)
   - Theme customization
   - Keyboard shortcuts expansion

3. **Performance Optimization**
   - Code splitting
   - Lazy loading
   - Bundle size reduction

---

## 📖 İlgili Dokümanlar

1. **[IA Navigation Plan](./IA_NAVIGATION_PLAN.md)** - Detaylı IA tasarımı (bu doküman)
2. **[UI/UX Plan](./UI_UX_PLAN.md)** - NN/g + WCAG 2.2 AA standartları
3. **[UI Rescue Report](../evidence/UI_RESCUE_FINAL_REPORT.md)** - Backend servisleri
4. **[Proje Analizi](../PROJE_ANALIZ_VE_EYLEM_PLANI_2025_10_29.md)** - 12 haftalık roadmap

---

## ✅ SONUÇ

**Durum:** 📝 PLAN HAZIR

**Özet:**

- ✅ IA planı oluşturuldu (PRIMARY/SECONDARY pages)
- ✅ Mevcut kod analiz edildi (left-nav.tsx, layout.tsx)
- ✅ Implementation plan hazırlandı (3 haftalık timeline)
- ✅ Kabul kriterleri tanımlandı (tests + metrics)
- ✅ Riskler belirlendi + azaltma stratejileri

**Değişiklik Kapsamı:**

- 17 dosya değişiklik
- ~1,200 satır yeni kod
- 8 yeni component
- 3 refactored component

**Süre Tahmini:** 15 iş günü (~3 hafta)

**Bir Sonraki Adım:**

1. `feat/ui-ia-cleanup` branch'i oluştur
2. i18n setup yap
3. left-nav.tsx'i düzenle (5 PRIMARY item)
4. Test et ve PR aç

Ekiple plan review'ı yaptıktan sonra implementation'a başlayabiliriz! 🚀

---

**Hazırlayan:** Claude Sonnet 4.5
**Tarih:** 29 Ekim 2025, 13:25
**Durum:** ✅ Tamamlandı
