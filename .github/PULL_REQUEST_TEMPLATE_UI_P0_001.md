# UI-P0-001: Dashboard skeleton & empty/error states

## Özet

Dashboard için P0 UI/UX iyileştirmeleri uygulandı:
- Loading state → skeleton
- Empty state → açıklayıcı mesaj + CTA
- Error state → kullanıcı dostu mesaj + retry akışı

## Yapılan Değişiklikler

### Yeni Component'ler

- **`DashboardSkeleton.tsx`** eklendi
  - Kart bazlı skeleton layout
  - `aria-busy` ve `aria-live` ile a11y desteği
  - Subtle pulse animasyonu

- **`DashboardEmptyState.tsx`** eklendi
  - Hiç strateji yokken gösterilen boş durum ekranı
  - "Strateji Oluştur" ve "Stratejileri Görüntüle" aksiyonları
  - Açıklayıcı metin + yardımcı bilgi

- **`DashboardErrorState.tsx`** eklendi
  - Hata mesajı + "Tekrar Dene" butonu
  - `role="alert"` ile erişilebilir hata bildirimi
  - Kullanıcı dostu hata mesajı

### Dashboard Page Güncellemeleri

- **State yönetimi** eklendi (`loading / error / empty / success`)
- **API fetch logic** eklendi (strategies + portfolio kontrolü)
- **Conditional rendering** state'e göre
- **LeftNav + CopilotDock** tüm state'lerde render ediliyor

## UI/UX Talimatları Uyumu

### §3.1 `/dashboard` P0 maddeleri

- [x] İlk yüklemede skeleton: Aktif strateji, risk/Günlük P&L ve Sistem Sağlığı widget'ları için skeleton state
- [x] Boş strateji durumunda boş state kartı: "Strateji Oluştur" CTA içeren açıklayıcı boş durum kartı
- [x] Sistem sağlığı/strateji bilgisi için net layout: Shell (LeftNav + CopilotDock) her durumda korunuyor

### §2.x Bileşen kuralları

- [x] Card spacing: 4'ün katları kullanıldı
- [x] Typography: 14px+ sistem font
- [x] Buton boyutu: min 44×44px (WCAG 2.2 AA)

### §1.7 Erişilebilirlik

- [x] `aria-busy="true"`, `aria-live="polite"`, `role="alert"` kullanıldı
- [x] Klavye ile erişilebilir CTA butonları
- [x] Focus ring gizlenmiyor
- [x] Tab navigation çalışıyor

## Testler

### Otomatik Testler

- [x] `pnpm lint` - Linter temiz
- [x] `pnpm typecheck` - TypeScript hata yok
- [x] `pnpm test` - Unit testler geçti (varsa)
- [x] `pnpm test:e2e` - E2E testler geçti (dashboard-states.spec.ts)

### Manuel Testler

- [x] **Loading state:** Yavaş API simülasyonu ile skeleton görünüyor
- [x] **Empty state:** Boş strateji listesi ile boş durum ekranı görünüyor
- [x] **Error state:** Network offline/500 error ile hata durumu görünüyor
- [x] **Retry:** Error state'te "Tekrar Dene" butonu çalışıyor
- [x] **Keyboard navigation:** Tab ile tüm butonlara ulaşılabiliyor

### Lighthouse & Axe

- [x] **Lighthouse Accessibility:** ≥ 90
- [x] **Axe DevTools:** Critical violations = 0

## Evidence

### Screenshot'lar

- [ ] Before: Mevcut durum (boş beyaz ekran)
- [ ] After - Loading: Skeleton state
- [ ] After - Empty: Boş durum ekranı
- [ ] After - Error: Hata durumu

### Lighthouse Raporu

- [ ] Accessibility Score: ≥ 90
- [ ] Performance Score: (opsiyonel)
- [ ] Best Practices Score: (opsiyonel)

### Axe DevTools

- [ ] Critical violations: 0
- [ ] Warning'ler: (varsa not edilmeli)

## İlgili Issue

- Closes #<issue-num>

## Notlar

- Skeleton pattern'i Strategy Lab ve diğer sayfalarda da kullanılacak
- Empty state pattern'i Portfolio/Market sayfalarında da uygulanacak
- Error state pattern'i global hata yönetimi için referans olacak

