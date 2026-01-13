# UI Guardrails

UI regressions'ı kalıcı olarak engellemek için kurulan sigorta mekanizmaları.

## 🛡️ Token Lockdown (Baseline Mode)

Hardcode renk sınıflarını yakalar ve PR'da patlatır. **Baseline modu**: Mevcut violation'ları baseline'a kaydeder, sadece yeni ihlalleri yakalar.

### Kullanım

```bash
# Baseline oluştur (ilk kez veya güncelleme)
pnpm check:ui-tokens:baseline

# Yeni violation'ları kontrol et
pnpm check:ui-tokens

# Hotspot dosyaları görüntüle (temizlik önceliği)
pnpm check:ui-tokens:hotspot
```

### Baseline Modu

Baseline modu sayesinde:
- ✅ Mevcut violation'lar "borç" olarak kalır (temizlik zamanla yapılır)
- ✅ Yeni violation'lar anında yakalanır (PR'da fail eder)
- ✅ UI işi "sürekli tamir" olmaktan çıkar
- ✅ Stabil hash: Satır kayması yeni ihlal olarak algılanmaz (file + matched_class + pattern)

### Baseline Cleanup Strategy

Baseline violation'larını temizlemek için:

```bash
# Hotspot dosyaları görüntüle (en çok ihlal üretenler)
pnpm check:ui-tokens:hotspot

# 1. Top hotspot dosyalarından başla (highest ROI)
# 2. Hardcode sınıfları token'lara çevir
# 3. Baseline'ı güncelle: pnpm check:ui-tokens:baseline
# 4. Tekrar et
```

**Not:** Baseline cleanup acil değil. Yeni violation'lar zaten engelleniyor. Temizlik zamanla yapılabilir.

### Yasaklı Sınıflar

- `bg-white`, `text-black`
- `border-gray-*`, `bg-gray-*`, `text-gray-*`
- `dark:bg-*`, `dark:text-*`, `dark:border-*`

### İzinli Token'lar

- `bg-card`, `bg-background`, `bg-surface`
- `text-card-foreground`, `text-foreground`
- `border-border`, `border-neutral-*`
- `bg-neutral-*`, `text-neutral-*`
- `bg-white/\d+`, `text-white/\d+` (opacity kullanımları)
- `bg-popover`, `text-popover-foreground` (Command Palette vb.)
- `bg-muted`, `text-muted-foreground` (secondary text, disabled states)

### Düzeltme

```tsx
// ❌ YANLIŞ
<div className="bg-white text-black border-gray-200 dark:bg-gray-800">

// ✅ DOĞRU
<div className="bg-card text-card-foreground border-border">
```

## 📸 Visual Smoke Test

Core route'ların screenshot'larını alır ve snapshot karşılaştırması yapar.

### Kullanım

```bash
# Visual smoke test çalıştır (snapshot compare)
pnpm ui:test:visual

# Snapshot'ları güncelle (UI değişikliği yaptıysanız)
pnpm ui:test:update
```

### İlk Snapshot Oluşturma

**ÖNEMLİ:** Snapshot baseline alınmadan önce Command Palette'in görünür olduğundan emin olun (popover token'ları eksikse siyah blok görünebilir).

```bash
# Terminal 1: Dev server'ı başlat
pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003

# Terminal 2: Snapshot'ları oluştur
pnpm ui:test:update

# Snapshot'ları kontrol et (Command Palette görünür mü?)
pnpm ui:test:visual

# Snapshot'ları commit et
git add apps/web-next/tests/e2e
git commit -m "chore(ui): add initial visual smoke snapshots"
```

**Not:** Command Palette'te siyah blok görünüyorsa, popover token'larını kontrol edin (`globals.css` ve `tailwind.config.ts`).

### Snapshot Güncelleme Kuralları

**Normal Akış:**
- `pnpm ui:test:visual` → Snapshot karşılaştırması (CI'da otomatik)
- UI değişikliği yoksa snapshot update yapma

**UI Değişikliği Yaptıysanız:**
- `pnpm ui:test:update` → Snapshot'ları güncelle
- Snapshot'ları commit et (PR'da review edilebilir)
- CI snapshot compare yapar (fark varsa fail eder)

**Kural:** Snapshot baseline aldıktan sonra, UI tarafında büyük değişiklik yoksa `ui:test:update` sadece bilinçli PR'larda çalıştırılsın.

### Test Edilen Route'lar

- `/dashboard`
- `/market-data`
- `/strategies`
- `/running`
- `/control`
- `/settings`
- Command Palette (Ctrl+K)

### Flakiness Azaltma

- Sabit viewport (1920x1080)
- Animasyonlar kapatıldı
- Caret gizlendi
- Input focus'ları kaldırıldı
- Dark theme sabitlendi

### CI'da Otomatik

Her PR'da otomatik çalışır. Screenshot farkları varsa CI fail eder.

## ✅ UI Definition of Done (DoD)

Her UI değişikliği için kontrol edilmesi gereken checklist.

Detaylar için: [UI_UX_PLAN.md](./UI_UX_PLAN.md#ui-definition-of-done-dod-checklist)

### Hızlı Kontrol

- [ ] Token kullanıldı (`check:ui-tokens` geçti)
- [ ] Empty/Error state'ler var
- [ ] Keyboard navigation çalışıyor (ESC, Tab, Enter)
- [ ] Visual smoke test geçti
- [ ] Responsive test edildi

## 🔧 CI Workflow

`.github/workflows/ui-guard.yml` dosyası şunları çalıştırır:

1. **Token Lockdown (Baseline Mode)**: Yeni hardcode sınıfları yakalar
2. **Visual Smoke**: Screenshot karşılaştırması yapar

PR açıldığında otomatik çalışır.

## 📚 İlgili Dokümanlar

- [UI_UX_PLAN.md](./UI_UX_PLAN.md) - UI/UX plan ve DoD checklist
- [scripts/check-ui-tokens.js](../../scripts/check-ui-tokens.js) - Token guard script
- [scripts/ui-tokens.baseline.json](../../scripts/ui-tokens.baseline.json) - Baseline violation'ları
- [scripts/ui-tokens-hotspot-report.js](../../scripts/ui-tokens-hotspot-report.js) - Hotspot report script
- [tests/e2e/visual-smoke.spec.ts](../../apps/web-next/tests/e2e/visual-smoke.spec.ts) - Visual smoke testleri
