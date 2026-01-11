# UI/UX Implementation Guide - UI-P0-001

Bu rehber, ilk UI/UX geliştirmesi (UI-P0-001: Dashboard skeleton + empty state) için adım adım implementasyon talimatları içerir.

---

## 🎯 Hedef

Dashboard sayfasına skeleton state ve boş durum ekranları eklemek.
**Referans:** [docs/UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md) §3.1 P0 maddeleri

---

## 📋 Adım 1: GitHub Hazırlığı (20 dakika)

### 1.1 Label'ları Oluştur

GitHub → Settings → Labels → New label

**Zorunlu:**
- `ui-ux` (#8B5CF6) - "UI/UX geliştirmeleri - docs/UI_UX_TALIMATLAR_VE_PLAN.md"
- `ui-ux:p0` (#EF4444) - "Kritik UI/UX - P0 checklist maddeleri"
- `ui-ux:p1` (#F59E0B) - "Önemli UI/UX - P1 checklist maddeleri"
- `ui-ux:p2` (#10B981) - "Polish UI/UX - P2 checklist maddeleri"

**İsteğe Bağlı:**
- `area:dashboard` (#6366F1) - "Dashboard sayfası"
- `type:implementation` (#06B6D4) - "Gerçek kod implementasyonu"

### 1.2 Epic'i Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Epic" template'ini seç
3. Doldur:

**Başlık:**
```
EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler (Skeleton + Error/Empty States)
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `epic` (varsa)

**Body (Template'den):**
- Kapsam: `docs/UI_UX_TALIMATLAR_VE_PLAN.md §3 ve §4 Hafta 1-2 P0 maddeleri`
- Hedef: Hiçbir ana sayfada "boş beyaz ekran" kalmaması
- Alt issue'lar checklist'i:
  - [ ] UI-P0-001: Dashboard skeleton + empty state
  - [ ] UI-P0-002: Strategy Lab loading / error / empty
  - [ ] UI-P0-003: Portfolio + Market skeleton / empty
  - [ ] UI-P0-004: Backtest sonuç ekranı loading + hata mesajları
  - [ ] UI-P0-005: Form validasyon pattern'i (global)

### 1.3 İlk Issue'u Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Improvement" template'ini seç
3. Doldur:

**Başlık:**
```
UI-P0-001: Dashboard skeleton ve boş durum ekranları
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `area:dashboard` (varsa)

**Template Alanları:**
- Hedef Sayfa: `/dashboard` (§3.1) ✅
- Öncelik: P0 (Kritik) ✅
- Mevcut Durum: İlk yüklemede boş kartlar, hiç strateji yokken boş tablo
- İstenen: Skeleton state, boş durum ekranı, loading durumları
- Kabul Kriterleri: Skeleton görünür, boş durum açıklayıcı, Lighthouse ≥ 90
- İlgili Issue: Epic issue numarası

4. Epic'e bağla: Epic issue'da checklist'e ekle

---

## 💻 Adım 2: Kod Implementasyonu

### 2.1 Branch Oluştur

```bash
git checkout -b ui-ux/ui-p0-001-dashboard-skeleton
```

### 2.2 State Yönetimi

`DashboardPage` veya ana container bileşende state'leri net ayır:

```typescript
// apps/web-next/src/app/dashboard/page.tsx veya ilgili component

type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'empty' }
  | { status: 'success'; data: DashboardData };

const [state, setState] = useState<DashboardState>({ status: 'loading' });
```

### 2.3 Skeleton Component Oluştur

**Dosya:** `apps/web-next/src/components/dashboard/DashboardSkeleton.tsx`

```typescript
'use client';

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Aktif Stratejiler Kartı Skeleton */}
      <div className="p-4 border border-neutral-800 rounded-lg">
        <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Risk/Günlük P&L Kartı Skeleton */}
      <div className="p-4 border border-neutral-800 rounded-lg">
        <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse mb-3" />
        <div className="h-8 w-32 bg-neutral-800 rounded animate-pulse" />
      </div>

      {/* Sistem Sağlığı Widget Skeleton */}
      <div className="p-4 border border-neutral-800 rounded-lg">
        <div className="h-4 w-28 bg-neutral-800 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Kurallar:**
- Spacing: 4'ün katları (§1.3)
- Renk: Mevcut dark theme ile uyumlu (§1.4)
- Animasyon: Subtle pulse effect (göz yormayan)

### 2.4 Empty State Component Oluştur

**Dosya:** `apps/web-next/src/components/dashboard/DashboardEmptyState.tsx`

```typescript
'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <PlusCircle className="w-16 h-16 text-neutral-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Henüz strateji yok
      </h3>
      <p className="text-neutral-400 mb-6 max-w-md">
        İlk stratejinizi oluşturarak başlayın. Strateji Lab'te yeni bir strateji
        oluşturabilir veya mevcut stratejilerinizi yönetebilirsiniz.
      </p>
      <Button
        asChild
        aria-label="Yeni strateji oluştur - Strategy Lab sayfasına gider"
      >
        <Link href="/strategy-lab">
          <PlusCircle className="w-4 h-4 mr-2" />
          Strateji Oluştur
        </Link>
      </Button>
    </div>
  );
}
```

**Kurallar:**
- Açıklayıcı metin (§1.6)
- CTA butonu (§1.6)
- A11y: `aria-label` (§1.7)
- Kontrast: WCAG 2.2 AA (§1.4)

### 2.5 Error State Component Oluştur

**Dosya:** `apps/web-next/src/components/dashboard/DashboardErrorState.tsx`

```typescript
'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function DashboardErrorState({ error, onRetry }: DashboardErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        <AlertCircle className="w-16 h-16 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Bir hata oluştu
      </h3>
      <p className="text-neutral-400 mb-2">
        {error.message || 'Veriler yüklenirken bir sorun oluştu.'}
      </p>
      <p className="text-sm text-neutral-500 mb-6">
        Lütfen tekrar deneyin veya sayfayı yenileyin.
      </p>
      <Button onClick={onRetry} aria-label="Tekrar dene">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tekrar Dene
      </Button>
    </div>
  );
}
```

### 2.6 Dashboard Page'e Entegre Et

**Dosya:** `apps/web-next/src/app/dashboard/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardErrorState } from '@/components/dashboard/DashboardErrorState';
// ... diğer import'lar

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });

  useEffect(() => {
    // Data fetch logic
    const fetchData = async () => {
      try {
        setState({ status: 'loading' });
        const data = await fetchDashboardData();

        if (!data || data.strategies.length === 0) {
          setState({ status: 'empty' });
        } else {
          setState({ status: 'success', data });
        }
      } catch (error) {
        setState({ status: 'error', error: error as Error });
      }
    };

    fetchData();
  }, []);

  // State'e göre render
  if (state.status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (state.status === 'error') {
    return (
      <DashboardErrorState
        error={state.error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (state.status === 'empty') {
    return <DashboardEmptyState />;
  }

  // Success state - normal dashboard content
  return (
    <div>
      {/* Mevcut dashboard içeriği */}
    </div>
  );
}
```

### 2.7 Loading Durumlarını Düzelt

Tüm interaktif elementler loading durumunda disabled olmalı:

```typescript
<Button disabled={state.status === 'loading'} aria-disabled={state.status === 'loading'}>
  {state.status === 'loading' ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Yükleniyor...
    </>
  ) : (
    'Kaydet'
  )}
</Button>
```

### 2.8 A11y İyileştirmeleri

- Empty state içinde kısa açıklayıcı metin
- Butonlara `aria-label` ekle
- Loading durumunda `aria-live="polite"` kullan
- Error mesajlarında `role="alert"` kullan

---

## 🧪 Adım 3: Test ve Doğrulama

### 3.1 Lint ve Type Check

```bash
cd apps/web-next
pnpm lint
pnpm typecheck
```

### 3.2 Unit Test (Varsa)

```bash
pnpm test
```

### 3.3 E2E Test

```bash
pnpm test:e2e
# veya dashboard spec'i varsa
pnpm test:e2e tests/e2e/dashboard.spec.ts
```

### 3.4 Lighthouse Test

```bash
# Manuel: Chrome DevTools → Lighthouse → Accessibility
# veya CI script'i varsa
pnpm lighthouse
```

**Hedef:** Accessibility Score ≥ 90

### 3.5 Axe DevTools Test

```bash
# Manuel: Chrome DevTools → Axe DevTools → Scan
```

**Hedef:** Critical violations = 0

### 3.6 Manuel Test Senaryoları

1. **Yavaş API Simülasyonu:**
   - Network throttling: Slow 3G
   - Dashboard'a git
   - Skeleton görünüyor mu? ✅

2. **Boş Durum:**
   - Strateji olmayan kullanıcı ile giriş yap
   - Dashboard'a git
   - Boş durum ekranı görünüyor mu? ✅
   - "Strateji Oluştur" butonu çalışıyor mu? ✅

3. **Error Durumu:**
   - Network → Offline
   - Dashboard'a git
   - Error state görünüyor mu? ✅
   - "Tekrar Dene" butonu çalışıyor mu? ✅

4. **Keyboard Navigation:**
   - Tab ile tüm elementlere ulaşılabiliyor mu? ✅
   - Focus indicator görünüyor mu? ✅

---

## 📸 Adım 4: Screenshot ve Evidence Hazırlama

### 4.1 Gereken Screenshot'lar

1. **Before:** Mevcut durum (boş beyaz ekran)
2. **After - Loading:** Skeleton state
3. **After - Empty:** Boş durum ekranı
4. **After - Error:** Error state

### 4.2 Lighthouse Result

- Accessibility Score screenshot
- Performance Score (opsiyonel)
- Best Practices Score (opsiyonel)

### 4.3 Axe Output

- Critical violations = 0 screenshot
- Varsa warning'ler not edilmeli

### 4.4 GIF (Opsiyonel)

- Skeleton animasyonu
- Boş durumdan "Strateji oluştur" butonuna tıklama

---

## 🔄 Adım 5: PR ve Review

### 5.1 PR Oluştur

```bash
git add .
git commit -m "ui-ux: Dashboard skeleton & empty states (P0)

- Skeleton component eklendi (aktif strateji, risk/P&L, sistem sağlığı)
- Empty state component eklendi (Strateji oluştur CTA ile)
- Error state component eklendi (retry butonu ile)
- Loading durumlarında butonlar disabled
- A11y iyileştirmeleri (aria-label, aria-live, role)

Closes #<issue-num>"

git push origin ui-ux/ui-p0-001-dashboard-skeleton
```

### 5.2 PR Template Doldur

**Başlık:**
```
UI-P0-001: Dashboard skeleton & empty states
```

**UI/UX Talimatları Uyumu:**

- [x] **Sayfa Checklist:** İlgili sayfanın checklist'i kontrol edildi (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1)
  - P0 maddeleri: Skeleton ✅, Boş durum ✅, Loading durumları ✅
- [x] **Bileşen Kuralları:** Kullanılan bileşenler §2.x kurallarına uyuyor
  - Card component: §2.2 kurallarına uygun ✅
  - Button component: §2.4 kurallarına uygun ✅
- [x] **Tasarım Prensipleri:** Değişiklikler §1.x tasarım prensipleriyle çelişmiyor
  - Kontrast: WCAG 2.2 AA uyumlu ✅
  - Spacing: 4'ün katları kullanıldı ✅
  - Tipografi: Sistem font, 14px+ ✅
  - A11y: Tab navigation, aria-label'lar ✅

**Evidence:**

- [x] Ekran görüntüleri: Before/After screenshot'lar eklendi
- [x] Lighthouse Raporu: Accessibility Score: 92 ✅
- [x] Axe DevTools: Critical violations: 0 ✅

### 5.3 Review Süreci

Reviewer şu soruları soracak (PR template'den):

- [x] "Boş durumda ne oluyor?" → Boş durum ekranı var ✅
- [x] "Skeleton var mı?" → Skeleton state var ✅
- [x] "Klavye ile ulaşılabiliyor mu?" → Tab navigation çalışıyor ✅
- [x] "Kısayol UI'da gözüküyor mu?" → Bu sayfa için geçerli değil (not edildi)
- [x] "Lighthouse Accessibility ≥ 90 mı?" → 92 ✅
- [x] "Ekran görüntüsü/gif var mı?" → Var ✅

---

## ✅ Definition of Done

- [x] Skeleton component oluşturuldu ve entegre edildi
- [x] Empty state component oluşturuldu ve entegre edildi
- [x] Error state component oluşturuldu ve entegre edildi
- [x] Loading durumlarında butonlar disabled
- [x] A11y iyileştirmeleri yapıldı
- [x] Lighthouse Accessibility ≥ 90
- [x] Axe Critical violations = 0
- [x] Screenshot'lar eklendi
- [x] PR template dolduruldu
- [x] Code review tamamlandı
- [x] Issue kapatıldı
- [x] Epic'te checklist güncellendi

---

## 📚 Referanslar

- [UI/UX Talimatları](./UI_UX_TALIMATLAR_VE_PLAN.md) §3.1
- [UI/UX İş Akışı](./UI_UX_WORKFLOW.md)
- [İlk Canlı Test Rehberi](./UI_UX_FIRST_LIVE_TEST.md)

---

**Son Güncelleme:** 26.11.2025

