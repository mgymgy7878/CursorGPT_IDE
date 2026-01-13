# Visual Snapshot Setup Guide

Bu doküman, ilk visual snapshot'ları üretmek ve commit etmek için adım adım talimatlar içerir.

## Önkoşullar

1. ✅ Command Palette popover token'ları eklendi (`globals.css`, `tailwind.config.ts`)
2. ✅ CommandPalette component'i token'lara geçirildi
3. ✅ Visual smoke test flakiness azaltma özellikleri eklendi
4. ✅ Dev server çalışıyor (`http://127.0.0.1:3003`)

## Adım 1: Dev Server'ı Başlat

**Terminal 1:**

```bash
pnpm --filter web-next dev -- --hostname 127.0.0.1 --port 3003
```

Server'ın hazır olduğunu kontrol edin:
```bash
curl http://127.0.0.1:3003
# veya tarayıcıda http://127.0.0.1:3003/dashboard açın
```

## Adım 2: Snapshot'ları Üret

**Terminal 2 (yeni terminal):**

```bash
# Snapshot'ları oluştur
pnpm ui:test:update

# Alternatif (doğrudan playwright):
pnpm --filter web-next exec playwright test tests/e2e/visual-smoke.spec.ts --update-snapshots
```

**Beklenen Çıktı:**
- Testler çalışır ve snapshot'lar oluşturulur
- `apps/web-next/tests/e2e/visual-smoke.spec.ts-snapshots/` klasörü oluşmalı
- Her route için screenshot dosyaları oluşmalı:
  - `_dashboard_full-win32.png` (veya platform-specific)
  - `_market-data_full-win32.png`
  - `_strategies_full-win32.png`
  - `_running_full-win32.png`
  - `_control_full-win32.png`
  - `_settings_full-win32.png`
  - `command-palette-open-win32.png`
  - `strategies-empty-state-win32.png` (varsa)

**Not:** Playwright snapshot dosya adlarını platform-specific yapar (`-win32`, `-linux`, `-darwin`). Bu normaldir.

## Adım 3: Snapshot'ları Kontrol Et

**Command Palette Görünürlük Kontrolü:**

1. `command-palette-open-win32.png` dosyasını açın
2. Command Palette'in içeriğinin görünür olduğundan emin olun:
   - ✅ Input alanı görünür
   - ✅ Komut listesi görünür (varsa)
   - ✅ Empty state görünür (komut yoksa)
   - ✅ Footer görünür
   - ❌ Sadece siyah blok görünmüyor

**Eğer siyah blok görünüyorsa:**
- Popover token'larını kontrol edin (`globals.css`, `tailwind.config.ts`)
- CommandPalette component'ini kontrol edin
- Dev server'ı yeniden başlatın

## Adım 4: Snapshot'ları Commit Et

```bash
# Git durumunu kontrol et
git status apps/web-next/tests/e2e

# Snapshot dosyalarını ekle
git add apps/web-next/tests/e2e

# Commit et
git commit -m "chore(ui): add initial visual smoke snapshots"
```

**Not:** Snapshot dosyaları genelde `*-snapshots/` klasöründe oluşur. Platform-specific dosya adları normaldir (`-win32`, `-linux`, `-darwin`).

## Adım 5: Final Sağlık Kontrolü

```bash
# Token kontrolü
pnpm check:ui-tokens
# Beklenen: ✅ No NEW hardcode UI classes found!

# Visual smoke test (snapshot compare)
pnpm ui:test:visual
# Beklenen: Tüm testler PASS (ilk snapshot'lardan sonra)
```

## Snapshot Güncelleme Kuralları

**Normal Akış:**
- `pnpm ui:test:visual` → Snapshot karşılaştırması (CI'da otomatik)
- UI değişikliği yoksa snapshot update yapma

**UI Değişikliği Yaptıysanız:**
- `pnpm ui:test:update` → Snapshot'ları güncelle
- Snapshot'ları commit et (PR'da review edilebilir)
- CI snapshot compare yapar (fark varsa fail eder)

**Kural:** Snapshot baseline aldıktan sonra, UI tarafında büyük değişiklik yoksa `ui:test:update` sadece bilinçli PR'larda çalıştırılsın.

## Sorun Giderme

### Snapshot'lar oluşmuyor

1. Dev server çalışıyor mu? (`curl http://127.0.0.1:3003`)
2. Playwright browsers yüklü mü? (`pnpm --filter web-next exec playwright install chromium`)
3. Port 3003 kullanılabilir mi?
4. Test dosyası doğru mu? (`apps/web-next/tests/e2e/visual-smoke.spec.ts`)

### Command Palette siyah blok görünüyor

1. Popover token'larını kontrol edin (`globals.css`)
2. Tailwind config kontrol edin (`tailwind.config.ts`)
3. CommandPalette component'ini kontrol edin
4. Dev server'ı yeniden başlatın

### Snapshot'lar flaky (her çalıştırmada farklı)

1. Flakiness azaltma özelliklerini kontrol edin (`playwright.config.ts`)
2. Animasyonlar kapatıldı mı?
3. Viewport sabit mi? (1920x1080)
4. Dark theme sabitlendi mi?

### Platform-specific snapshot dosyaları

Playwright snapshot dosya adlarını platform-specific yapar:
- Windows: `-win32.png`
- Linux: `-linux.png`
- macOS: `-darwin.png`

Bu normaldir. CI'da platform'a göre doğru snapshot kullanılır.

## İlgili Dosyalar

- `apps/web-next/tests/e2e/visual-smoke.spec.ts` - Visual smoke testleri
- `apps/web-next/playwright.config.ts` - Playwright config
- `apps/web-next/tests/e2e/visual-smoke.spec.ts-snapshots/` - Snapshot dosyaları (oluşturulacak)
