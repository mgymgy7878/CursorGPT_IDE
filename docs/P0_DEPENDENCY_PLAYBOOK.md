# P0 Dependency Playbook

## 🎯 Amaç

PR #35/#36 merge olmadan Strategy Lab'de kod merge etmemek, ama ön hazırlık yapmak için rehber.

## 🚧 Blocking Dependencies

**Kritik Kural:** PR #35/#36 merge olmadan Strategy Lab branch'inde sadece docs/evidence skeleton commitleri (opsiyonel) dışında kod merge etme.

### PR #35 (ui/p0-global-foundation)
- **Durum:** OPEN (henüz merge olmamış)
- **İçerik:** UIStates kit + WSStatusBadge + Modal a11y + Table a11y
- **Review Yorumu:** Hazırlanacak (hangi dosyalar değişti + nasıl test edilir + risk yok kanıtı)

### PR #36 (ui/p0-page-targets-dashboard)
- **Durum:** OPEN (base: ui/p0-global-foundation)
- **İçerik:** Dashboard UIStates kit + dev toggle
- **Review Yorumu:** Hazırlanacak (hangi dosyalar değişti + nasıl test edilir + risk yok kanıtı)

## 📋 While Waiting (Ön Hazırlık)

### 1. PR #35/#36 Review Yorumları

**PR #35 için:**
- Hangi dosyalar değişti (UIStates kit, StatusBadge, Modal, Table)
- Nasıl test edilir (smoke test komutları)
- Risk yok kanıtı (production güvenliği, SSR-safe)

**PR #36 için:**
- Hangi dosyalar değişti (Dashboard page, dev toggle)
- Nasıl test edilir (`?state=loading|empty|error`)
- Risk yok kanıtı (dev-only gate, production'da pasif)

### 2. Strategy Lab Ön Hazırlık

**Mevcut Dosya Yolları:**

#### Strategy Lab Sayfası
- `apps/web-next/src/app/strategy-lab/page.tsx` - Ana sayfa component
- `apps/web-next/src/app/strategy-lab/_ctx.tsx` - Context provider
- `apps/web-next/src/app/strategy-lab/loading.tsx` - Loading state
- `apps/web-next/src/app/strategy-lab/error.tsx` - Error state

#### Backtest/Optimize Trigger Noktaları
- `apps/web-next/src/components/lab/LabResultsPanel.tsx` - `runBacktest()`, `runOptimize()` fonksiyonları
- `apps/web-next/src/components/lab/LabToolbar.tsx` - Backtest/Optimize butonları

#### Log State Kaynağı
- `LabResultsPanel.tsx` içinde `res` state'i (backtest/optimize sonuçları)
- Last logs için: API response'dan log satırları çıkarılacak

#### Buton Handler'lar
- `runBacktest()` - `/api/lab/backtest` POST
- `runOptimize()` - `/api/lab/optimize` POST
- `onPublish()` - Draft publish

### 3. Kısayollar İçin Teknik Karar

**Mevcut Durum:**
- `CommandPalette.tsx` var ama sadece `Cmd/Ctrl+K` için
- `useHotkeys()` hook'u yok
- `window.addEventListener('keydown')` dağınık kullanım var

**Önerilen Çözüm: Minimal `useHotkeys()` Hook**

**Avantajlar:**
- Strategy Lab ve Running Strategies'te aynı standart
- P0-Global gibi bir kez ödenen maliyet, sürekli kazanç
- Dağınık `addEventListener` yerine merkezi yönetim

**Implementation Plan:**
```tsx
// hooks/useHotkeys.ts
export function useHotkeys(
  keys: string,
  handler: (e: KeyboardEvent) => void,
  deps?: React.DependencyList
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Parse keys string (örn: "ctrl+enter", "ctrl+shift+o")
      if (matchesKeys(e, keys)) {
        e.preventDefault();
        handler(e);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, deps);
}
```

**Kullanım:**
```tsx
// Strategy Lab'de
useHotkeys('ctrl+enter', () => runBacktest(), [runBacktest]);
useHotkeys('ctrl+shift+o', () => runOptimize(), [runOptimize]);
useHotkeys('escape', () => closeModal(), [closeModal]);
```

**Alternatif:** Eğer `react-hotkeys-hook` gibi bir library kullanılıyorsa, onu kullan.

## 🔄 Merge Sonrası Akış

### PR #35 Merge Sonrası

1. **PR #36 base değiştir:**
   - GitHub UI'dan: Change base → `main`
   - Lokal:
     ```bash
     git fetch origin
     git checkout ui/p0-page-targets-dashboard
     git rebase origin/main
     git push --force-with-lease
     ```

2. **Dashboard evidence ekle:**
   - Screenshot'lar PR #36 yorumuna
   - Test sonucu özeti PR #36 yorumuna

### PR #36 Merge Sonrası

1. **Strategy Lab branch aç:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -B ui/p0-page-targets-strategy-lab
   ```

2. **useHotkeys hook ekle** (P0-Global foundation'a eklenebilir veya Strategy Lab'de):
   - `hooks/useHotkeys.ts` oluştur
   - Minimal implementation (keys parsing + event handling)

3. **Strategy Lab P0 implementasyonu:**
   - UIStates kit entegrasyonu
   - Dev toggle (`?job=idle|backtest|optimize`)
   - Progress panel + last logs
   - Inline error explanation panel
   - Kısayollar (useHotkeys hook ile)

## ✅ No-Code-Merge Rule

**Kesin Kural:** PR #35/#36 merge olmadan Strategy Lab branch'inde:
- ❌ Kod merge etme (UIStates kit, dev toggle, vb.)
- ✅ Docs/evidence skeleton commitleri yapılabilir (opsiyonel)
- ✅ useHotkeys hook'u P0-Global foundation'a eklenebilir (eğer PR #35 merge olmadan eklenirse)

**Neden:** Rebase cehennemi riski. Dependency chain temiz kalmalı.

---

**Son Güncelleme:** 2025-01-29
**Durum:** PR #35/#36 merge bekleniyor, ön hazırlık yapıldı

