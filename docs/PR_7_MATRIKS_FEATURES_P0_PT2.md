# PR-7: Matriks IQ P0 Özellikleri (Part 2) — Layout Presets + PWA

**Tarih:** 29 Ekim 2025
**Kapsam:** P0 — Hemen değer üretenler (UI + akış) — Part 2
**Kaynak:** Matriks IQ (Kişiselleştirilebilir ekranlar + PWA desteği)

---

## 📋 Özet

Matriks IQ'nun esnek arayüz ve offline destek özelliklerinin Spark Trading'e entegrasyonu:

1. **Layout Presets** — Operatör/Grafik/Portföy şablonları
2. **PWA + Offline Detector** — Progressive Web App manifest + service worker + online/offline banner

---

## 🎯 Özellik Detayları

### 1. Layout Presets

**Hedef:** Farklı kullanıcı tiplerine hitap eden ekran düzeni şablonları

**Preset'ler:**
- **Operatör Mode:** Dashboard ağırlıklı, compact widgets, real-time metrics
- **Grafik Mode:** Chart ağırlıklı, geniş grafik alanı, minimizasyon
- **Portföy Mode:** Portföy + pozisyon yönetimi ağırlıklı

**Teknik:**
```typescript
Hook: useLayoutPreset()
State: Zustand layoutStore
Storage: localStorage (persist middleware)

type LayoutPreset = {
  id: string;
  name: string;
  description: string;
  config: {
    sidebarCollapsed: boolean;
    dashboardColumns: number;
    portfolioView: 'table' | 'cards';
    chartHeight: number;
    visibleWidgets: string[];
  };
};
```

**UI Eklemeleri:**
- Layout switcher (header sağ üst)
- Preset kaydetme ("Mevcut düzeni şablon olarak kaydet")
- Hızlı geçiş (keyboard shortcut: `Ctrl+Shift+L`)

---

### 2. PWA + Offline Detector

**Hedef:** Offline-first experience + native app feel

**Özellikler:**
- ✅ `manifest.webmanifest` — App metadata
- ✅ Service Worker — Cache stratejisi (runtimeChunk caching)
- ✅ Offline banner — Bağlantı durumu göstergesi
- ✅ Online/offline toast — Reconnection bildirimleri
- ✅ Install prompt — "Spark Trading'i yükle" butonu

**Manifest:**
```json
{
  "name": "Spark Trading",
  "short_name": "Spark",
  "description": "Trading platform with AI assistance",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#18181b",
  "theme_color": "#0ea5e9",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker Stratejisi:**
```typescript
// Cache first for static assets
// Network first for API calls
// Fallback to cached data when offline

Cache strategies:
- Static assets: Cache First
- API responses: Network First (with stale-while-revalidate)
- SSE streams: Network Only
```

---

## 📂 Dosya Yapısı

### Yeni Dosyalar

```
apps/web-next/
├── public/
│   ├── manifest.webmanifest (yeni)
│   └── icons/
│       ├── icon-192.png (yeni)
│       └── icon-512.png (yeni)
├── sw.js (yeni — service worker)
└── src/
    ├── components/
    │   ├── layout/
    │   │   ├── LayoutPresetSelector.tsx (yeni)
    │   │   └── LayoutPresetManager.tsx (yeni)
    │   └── common/
    │       ├── OfflineBanner.tsx (yeni)
    │       └── InstallPrompt.tsx (yeni)
    ├── hooks/
    │   └── useLayoutPreset.ts (yeni)
    ├── stores/
    │   └── layoutStore.ts (yeni — Zustand)
    └── lib/
        └── sw/
            ├── register.ts (yeni — SW registration)
            └── cache-strategy.ts (yeni — cache logic)
```

---

## 🔧 Implementation Adımları

### Phase 1: Layout Presets (2 saat)

1. **Zustand Store**
   - [ ] `layoutStore.ts` (3 preset + custom)
   - [ ] Persist middleware (localStorage)
   - [ ] Preset CRUD actions

2. **Hook**
   - [ ] `useLayoutPreset()` hook
   - [ ] Preset değiştirme logic
   - [ ] Custom preset kaydetme

3. **UI Components**
   - [ ] LayoutPresetSelector (header dropdown)
   - [ ] LayoutPresetManager (modal — kaydet/düzenle)
   - [ ] Keyboard shortcut (`Ctrl+Shift+L`)

4. **Integration**
   - [ ] Page layouts'e preset logic ekle
   - [ ] CSS variables ile dynamic styling
   - [ ] Sidebar collapse state sync

### Phase 2: PWA Support (2.5 saat)

1. **Manifest**
   - [ ] `manifest.webmanifest` oluştur
   - [ ] Icons generate (192x192, 512x512)
   - [ ] Theme colors + display mode

2. **Service Worker**
   - [ ] SW registration (`register.ts`)
   - [ ] Cache strategies (3 farklı)
   - [ ] Background sync (gerekirse)

3. **Offline Detection**
   - [ ] `useOnlineStatus()` hook
   - [ ] OfflineBanner component
   - [ ] Reconnection toast

4. **Install Prompt**
   - [ ] `beforeinstallprompt` event handler
   - [ ] InstallPrompt component (conditional render)
   - [ ] Dismiss logic (localStorage)

---

## 🧪 Test Planı

### Manual Tests

- [ ] Layout Preset: "Operatör" → "Grafik" geçişi
- [ ] Custom Preset: Kaydet + yükle
- [ ] PWA: Manifest download
- [ ] Offline: Service worker cache
- [ ] Online/Offline: Banner görünümü

### Lighthouse Audit

```bash
pnpm dlx lighthouse http://localhost:3003/dashboard --view

Targets:
- PWA: 100/100
- Performance: >90
- Accessibility: >95
```

---

## 📊 Metrikler

**Beklenen Çıktılar:**
- Offline uptime: %100 (SW cache ile)
- Layout geçişi: 500ms animasyon
- Install prompt CTR: %15-20
- Lighthouse PWA score: 100/100

---

## 🔗 İlgili Dokümanlar

- PR-6: `PR_6_MATRIKS_FEATURES_P0.md`
- PWA Best Practices: https://web.dev/pwa-checklist/
- Next: PR-8 (P1 özellikleri — AI Assistant + Rule Builder)

---

**Status:** 🟡 PLANNED
**Branch:** feat/pr7-layout-pwa
**ETA:** ~4.5 saat

