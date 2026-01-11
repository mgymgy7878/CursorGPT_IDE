# UI Screenshot Diff Tests

Golden Master Harness ile deterministik screenshot testleri.

## Amaç

Figma↔UI ping-pong'unu azaltmak için otomatik screenshot-diff mekanizması. Her UI değişikliği sonrası `pnpm ui:diff` → fark varsa anında gör, yoksa devam.

## Günlük Akış

### UI Değişikliği Sonrası

```bash
# 1. Değişiklik yap
# 2. Diff kontrolü
pnpm ui:diff

# 3a. Fark varsa ve beklenen → snapshot'ı güncelle
pnpm ui:snap
git add apps/web-next/tests/visual/snapshots/
git commit -m "ui: update dashboard snapshots"

# 3b. Fark varsa ve beklenmeyen → UI'ı düzelt, tekrar ui:diff
```

### Bilinçli Değişiklik (Tasarım Güncellemesi)

```bash
# 1. UI'ı güncelle
# 2. Snapshot'ları güncelle
pnpm ui:snap

# 3. Commit
git add apps/web-next/tests/visual/snapshots/
git commit -m "ui: update dashboard design"
```

## Done Kriteri (SERT)

- **P0 (Zorunlu):** Overlap/taşma/üst üste binme → 0 tolerans
- **P1 (Önemli):** Typography → token'lar üzerinden tutarlı
- **P2 (Backlog):** Figma pixel-perfect → şimdilik yok

UI stabil + testle korunuyor + feature'lara geri dönüyoruz.

## Kullanım

### 1. Snapshot'ları güncelle (ilk kurulum veya bilinçli değişiklik)

```bash
pnpm ui:snap
```

Bu komut:
- `/__gm__/dashboard` route'una gider (statik mock data)
- 3 viewport'ta screenshot alır: `1200x800`, `980x800`, `760x800`
- Snapshot'ları `tests/visual/snapshots/` altına kaydeder:
  - `dashboard-1200.png`
  - `dashboard-980.png`
  - `dashboard-760.png`

### 2. Değişiklik sonrası diff kontrolü

```bash
pnpm ui:diff
```

Bu komut:
- Mevcut UI ile snapshot'ları karşılaştırır
- Fark varsa test fail eder ve diff görseli oluşturur
- Fark yoksa test geçer

### 3. CI'da otomatik çalıştırma

PR'da otomatik çalışır. Snapshot farkı varsa PR kırmızı olur.

## Golden Master Route

`/__gm__/dashboard` route'u:
- **Statik mock data** kullanır (network bağımlılığı yok)
- **Animasyonlar kapalı** (test ortamında otomatik)
- **Tarih/saat sabit** (mock data içinde)
- **Aynı component'ler** (`DashboardGrid` + `AppFrame`)

## Viewport'lar

3 viewport splitter simülasyonu için:
- **1200px**: Geniş ekran (3 kolon Portfolio Summary)
- **980px**: Orta ekran (2 kolon Portfolio Summary)
- **760px**: Dar ekran (1 kolon Portfolio Summary)

## Overlap Kontrolü

Test otomatik olarak Portfolio Summary mini-stat'lerinin birbirine binip binmediğini kontrol eder. Overlap varsa test fail eder.

## Snapshot'ları Commit Et

`tests/visual/snapshots/` altındaki `.png` dosyalarını commit et. Bunlar "golden master" referans görselleridir.

## Troubleshooting

### Snapshot'lar güncellenmiyor

```bash
# Snapshot dizinini temizle ve yeniden oluştur
rm -rf apps/web-next/tests/visual/snapshots/dashboard-*.png
pnpm ui:snap
```

### Test flaky (bazen geçiyor bazen geçmiyor)

- Font yükleme: Test otomatik olarak `document.fonts.ready` bekler
- Animasyonlar: Test otomatik olarak animasyonları kapatır
- Render timing: `waitForSelector` ve `waitForLoadState` kullanılır

### Snapshot farkı çok küçük (subpixel rounding)

`playwright.config.ts` içinde `maxDiffPixels` ve `threshold` ayarlanabilir:
- `maxDiffPixels: 100` (varsayılan)
- `threshold: 0.2` (varsayılan)

## İleri Seviye

### Yeni viewport ekle

`tests/ui/dashboard.spec.ts` içinde `VIEWPORTS` array'ine ekle:

```typescript
const VIEWPORTS = [
  { width: 1200, height: 800, name: '1200' },
  { width: 980, height: 800, name: '980' },
  { width: 760, height: 800, name: '760' },
  { width: 1400, height: 800, name: '1400' }, // Yeni
] as const;
```

### Yeni sayfa için test ekle

1. `/__gm__/[sayfa]` route'u oluştur
2. `tests/ui/[sayfa].spec.ts` test dosyası oluştur
3. `package.json`'a script ekle:
   ```json
   "ui:snap:[sayfa]": "pnpm --filter web-next exec playwright test tests/ui/[sayfa].spec.ts --update-snapshots",
   "ui:diff:[sayfa]": "pnpm --filter web-next exec playwright test tests/ui/[sayfa].spec.ts",
   ```

