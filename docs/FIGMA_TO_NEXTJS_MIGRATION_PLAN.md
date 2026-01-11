# Figma Arayüzünü Next.js Projesine Uyarlama Planı

**Tarih:** 2025-01-15
**Durum:** 📋 Planlama
**Hedef:** Figma'daki React SPA yapısını Next.js 14 App Router'a uyarlamak

---

## 🎯 Durum Analizi

### Figma'daki Yapı (React SPA)
- `App.tsx` - Ana component, useState ile sayfa yönetimi
- `MainLayout` - Layout wrapper
- `CopilotProvider` - Context provider
- Switch-case ile sayfa render
- Client-side routing

### Mevcut Proje (Next.js 14)
- Next.js App Router (her sayfa kendi route'unda)
- `layout.tsx` - Root layout
- `AppFrame` - Layout wrapper (mevcut)
- `CopilotDockRight` - Copilot panel (mevcut)
- Sayfalar zaten var (`/dashboard`, `/strategy-lab`, vb.)

---

## 📋 Uyarlama Adımları

### 1. CopilotProvider Context Oluştur
**Dosya:** `apps/web-next/src/lib/copilot-context.tsx`

Figma'daki `CopilotProvider`'ı Next.js'e uyarlayalım. Mevcut `useCopilotStore` (Zustand) ile entegre edelim.

### 2. MainLayout Component Oluştur
**Dosya:** `apps/web-next/src/components/layout/MainLayout.tsx`

Figma'daki `MainLayout`'u Next.js'e uyarlayalım. Mevcut `AppFrame` ve `PageShell` yapısını kullanarak.

### 3. Sayfa Component'lerini Kontrol Et
Figma'daki sayfa component'leri:
- `Dashboard` → `/dashboard/page.tsx` ✅ Var
- `MarketData` → `/market/page.tsx` ✅ Var
- `StrategyLab` → `/strategy-lab/page.tsx` ✅ Var
- `MyStrategies` → `/strategies/page.tsx` ✅ Var
- `RunningStrategies` → `/running/page.tsx` ✅ Var
- `Portfolio` → `/portfolio/page.tsx` ✅ Var
- `Alerts` → `/alerts/page.tsx` ✅ Var
- `AuditLogs` → `/audit/page.tsx` ✅ Var
- `RiskProtection` → `/guardrails/page.tsx` ✅ Var
- `Settings` → `/settings/page.tsx` ✅ Var

**Not:** Figma'daki `UxTestRunner` ve `DecisionLog` sayfaları projede yok, gerekirse eklenebilir.

### 4. Layout'u CopilotProvider ile Sarmala
**Dosya:** `apps/web-next/src/app/layout.tsx`

Root layout'u `CopilotProvider` ile sarmalayalım.

---

## 🔄 Farklar ve Çözümler

### Routing Farkı
- **Figma:** Client-side routing (useState + switch-case)
- **Next.js:** Server-side routing (App Router)
- **Çözüm:** Next.js routing'i kullanmaya devam et, sadece layout ve context'i uyarla

### Layout Farkı
- **Figma:** `MainLayout` component'i
- **Next.js:** `AppFrame` + `PageShell` mevcut
- **Çözüm:** `MainLayout`'u `AppFrame` ve `PageShell`'i kullanarak oluştur

### Context Farkı
- **Figma:** `CopilotProvider` context
- **Next.js:** `useCopilotStore` (Zustand) mevcut
- **Çözüm:** `CopilotProvider`'ı Zustand store ile entegre et

---

## ✅ Sonuç

Figma'daki yapıyı Next.js'e uyarladıktan sonra:
- ✅ Aynı görsel yapı
- ✅ Aynı component hiyerarşisi
- ✅ Next.js App Router avantajları (SSR, routing, vb.)
- ✅ Mevcut kod yapısı korunur

