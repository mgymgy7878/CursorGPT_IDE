# Shell Anayasası - Tasarım Drift Önleme Rehberi

## 🎯 Amaç

Shell yapısını "anayasa" haline getirerek tasarım drift'ini önlemek. Tüm shell değişiklikleri tek yerde yapılır, sayfalar shell'e dokunmaz.

## 📐 Shell Yapısı

### AppFrame Component

**Lokasyon:** `apps/web-next/src/components/layout/AppFrame.tsx`

**Kural:** Tüm shell yapısı (TopStatusBar + LeftNav + RightRail + Main) sadece burada tanımlı.

```tsx
<AppFrame>
  {/* Sayfa içeriği */}
</AppFrame>
```

**Yapı:**
- `TopStatusBar` (StatusBar component)
- `LeftNav` (Global navigation)
- `Main` (Sayfa içeriği - flex-1 min-w-0 overflow-auto)
- `RightRail` (Her zaman rezerve edilir - 360px sabit genişlik)

### RightRail Sözleşmesi

**Kural:** RightRail her zaman var. İçerik hazır değilse placeholder gösterilir.

**Kullanım:**
```tsx
// Dashboard sayfasında
<RightRailProvider value={<AlarmCard />}>
  <DashboardClient />
</RightRailProvider>
```

**Context:** `apps/web-next/src/components/layout/RightRailContext.tsx`

## 🚫 YASAKLAR

### ❌ Sayfa Layout'larında Shell Kullanımı

```tsx
// ❌ YANLIŞ - Dashboard layout'ta Shell kullanma
export default function DashboardLayout({ children }) {
  return <Shell>{children}</Shell>; // YASAK!
}

// ✅ DOĞRU - Layout boş bırakılır
export default function DashboardLayout({ children }) {
  return <>{children}</>;
}
```

### ❌ Sayfa Component'lerinde Shell Elementleri

```tsx
// ❌ YANLIŞ - DashboardClient içinde sidebar/nav
<div className="grid grid-cols-[240px_1fr]">
  <aside>Local Nav</aside> {/* YASAK! */}
  <main>Content</main>
</div>

// ✅ DOĞRU - Sadece içerik
<div className="w-full max-w-screen-2xl mx-auto px-6 py-6">
  {/* İçerik */}
</div>
```

### ❌ RightRail'i Koşullu Render Etme

```tsx
// ❌ YANLIŞ - RightRail'i aç/kapa yapma
{showRightRail && <aside>...</aside>}

// ✅ DOĞRU - Her zaman var, içerik context'ten gelir
<aside className="w-[360px]">
  {rightRail || <RightRailPlaceholder />}
</aside>
```

## ✅ DOĞRU KULLANIM

### Sayfa Component'i

```tsx
// apps/web-next/src/components/dashboard/DashboardClient.tsx
export default function DashboardClient() {
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-6 py-6">
      {/* Sadece içerik - shell'e dokunmaz */}
    </div>
  );
}
```

### RightRail İçeriği

```tsx
// apps/web-next/src/components/dashboard/DashboardWrapper.tsx
export default function DashboardWrapper() {
  const rightRail = (
    <div className="p-6 space-y-3">
      <AlarmCard />
      <SmokeCard />
    </div>
  );

  return (
    <RightRailProvider value={rightRail}>
      <DashboardClient />
    </RightRailProvider>
  );
}
```

## 🧪 Golden Master Testleri

**Lokasyon:** `apps/web-next/tests/visual/dashboard-golden-master.spec.ts`

**Amaç:** Tasarım drift'ini yakalamak için baseline screenshot'lar.

**Test Senaryoları:**
- `/dashboard?state=loading`
- `/dashboard?state=empty`
- `/dashboard?state=error`
- `/dashboard?state=data`
- `/dashboard` (default)

**Kullanım:**
```bash
# Baseline screenshot'ları al
pnpm --filter web-next exec playwright test tests/visual/dashboard-golden-master.spec.ts

# Screenshot'ları güncelle (değişiklik sonrası)
pnpm --filter web-next exec playwright test tests/visual/dashboard-golden-master.spec.ts --update-snapshots
```

## 📋 Checklist

Yeni sayfa eklerken:

- [ ] Shell yapısı AppFrame'de mi? (layout.tsx'te)
- [ ] Sayfa layout'u boş mu? (Shell kullanmıyor mu?)
- [ ] Sayfa component'i sadece içerik mi render ediyor?
- [ ] RightRail gerekiyorsa RightRailProvider kullanıldı mı?
- [ ] Golden Master testi eklendi mi?

## 🔄 Değişiklik Yaparken

1. **Shell değişikliği:** Sadece `AppFrame.tsx`'i düzenle
2. **RightRail değişikliği:** `RightRailContext.tsx` veya sayfa wrapper'ını düzenle
3. **Sayfa içeriği:** Sayfa component'ini düzenle (shell'e dokunma)

## 📚 Referanslar

- AppFrame: `apps/web-next/src/components/layout/AppFrame.tsx`
- RightRailContext: `apps/web-next/src/components/layout/RightRailContext.tsx`
- Golden Master Tests: `apps/web-next/tests/visual/dashboard-golden-master.spec.ts`

## 🔒 Kalite Kilitleri

### 1. ESLint - Shell Anayasası Polisi

**Lokasyon:** `apps/web-next/eslint.config.js`

Shell component'lerinin yanlış yerde import edilmesini engeller:

```javascript
'no-restricted-imports': [
  'error',
  {
    paths: [
      {
        name: '@/components/status-bar',
        message: 'Shell sadece AppFrame\'de. StatusBar\'ı doğrudan import etme, AppFrame kullan.',
      },
      {
        name: '@/components/left-nav',
        message: 'Shell sadece AppFrame\'de. LeftNav\'ı doğrudan import etme, AppFrame kullan.',
      },
    ],
  },
],
```

**Test:**
```bash
pnpm --filter web-next lint
```

### 2. Deterministik Visual Regression Testleri

**Lokasyon:** `apps/web-next/tests/visual/dashboard-golden-master.spec.ts`

Test ortamı sabit:
- Viewport: 1440x900
- Color Scheme: dark
- Reduced Motion: reduce
- Locale: tr-TR
- Timezone: Europe/Istanbul
- Animasyonlar: kapalı (CSS inject)

**Kullanım:**
```bash
# Baseline screenshot'ları al
pnpm --filter web-next exec playwright test tests/visual/dashboard-golden-master.spec.ts

# Screenshot'ları güncelle (değişiklik sonrası)
pnpm --filter web-next exec playwright test tests/visual/dashboard-golden-master.spec.ts --update-snapshots
```

### 3. Snapshot'lar Repo'da

**Kural:** Golden Master snapshot'ları commit edilir (drift yakalama için).

**Lokasyon:** `apps/web-next/tests/visual/snapshots/`

**Gitignore:** Test results commit edilmez, ama snapshot'lar edilir.

### 4. CI Entegrasyonu

**Script:** `apps/web-next/scripts/ci-visual-regression.sh` (Linux/macOS)
**Script:** `apps/web-next/scripts/ci-visual-regression.ps1` (Windows)

**PR Pipeline:**
1. Dev server başlat (background)
2. Golden Master testlerini çalıştır
3. Snapshot farkı varsa → PR kırmızı

**GitHub Actions Örneği:**
```yaml
- name: Visual Regression Test
  run: |
    cd apps/web-next
    bash scripts/ci-visual-regression.sh
```

---

**Son Güncelleme:** 2025-01-29
**Versiyon:** 2.0 (Kalite Kilitleri eklendi)

