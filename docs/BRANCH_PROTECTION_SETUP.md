# Branch Protection Setup - UI Visual Regression Gate

**Durum:** Drift gate'i PR merge'e bağlama rehberi
**Hedef:** `ui-visual-regression` check'ini required yaparak tasarım drift'ini "yanlışlıkla" main'e sızmasını engellemek

---

## 0) Amaç

Branch protection rules ile `ui-visual-regression` check'ini required yaparak:
- Tasarım drift'i "yanlışlıkla" main'e sızamaz
- Sadece bilinçli snapshot update ile geçer
- Trading risk gate gibi: default güvenli, override kanıtla

---

## 1) PR Doğrulama (Önce Yeşil Olmalı)

**Adım 1:** PR aç → Actions'ta `ui-visual-regression` run'ına gir

**Adım 2:** Run ekranında Artifacts bölümünde şunlar görünmeli:
- `playwright-report`
- `test-results`

**Adım 3:** Kontrollü fail testi (en güçlü kanıt - "Artifacts gerçekten always mi?"):
```typescript
// Geçici olarak bir spec'e ekle
test('test - kontrollü fail', async ({ page }) => {
  expect(1).toBe(2); // Fail üret
});
```
- Push → Actions kırmızı olsun
- Run sayfasında Artifacts bölümünde:
  - `playwright-report` mutlaka gelsin (`if: always()` garantisi)
  - `test-results` da gelsin (`if: failure()` - failure durumunda)
- Sonra hemen revert

**Adım 4:** İndirip açma testi (HTML report'un "tek başına yeterli" olduğunu doğrula):
- `playwright-report` zip → `index.html` aç
- HTML report içinde şunlar görünüyor mu?
  - Failure adımları (step logları)
  - Screenshot (failure anında)
  - Trace "View trace" bağlantısı (çalışıyor mu?)
- **Kritik:** Playwright HTML reporter trace/video/screenshot'ları `playwright-report/data/` içine kopyalar; çoğu ekip sadece report'u upload ederek yaşar.
- Eğer trace bağlantıları çalışmıyorsa: `test-results`'ı `if: failure()` bırak ama Playwright reporter ayarını sabitlemek gerekir (çoğu projede zaten OK).

---

## 2) Branch Protection Kurulumu

**GitHub Repo Settings → Branches → Branch protection rules**

### 2.1 Main Branch Protection (Trading Risk Gate Mantığı)

1. **Branch name pattern:** `main`
2. **Require a pull request before merging:**
   - ✅ Require approvals: 1
   - ✅ Dismiss stale pull request approvals when new commits are pushed
3. **Require status checks to pass before merging:**
   - ✅ Require branches to be up to date before merging
   - ✅ **Status checks (minimum):**
     - `ui-visual-regression` (required - drift gate)
     - `lint` (code quality)
     - `typecheck` (type safety)
4. **Require conversation resolution before merging:** (opsiyonel)
5. **Do not allow bypassing the above settings:** ✅ **Açık** (ekip disiplini için)

**Kural:** Default güvenli, override kanıtla. Snapshot güncellemesi "bilinçli ritüel" olur; drift sızamaz.

### 2.2 Required Check Listesi

Minimum required checks:
- `ui-visual-regression` (visual regression gate)
- `lint` (code quality)
- `typecheck` (type safety)

---

## 3) Artifact Upload Optimizasyonu

**Mevcut ayar:**
- `playwright-report`: `if: always()` - Her zaman upload (test fail olsa da report gelsin)
- `test-results`: `if: failure()` - Sadece failure durumunda upload (depolama tasarrufu)
- `retention-days: 3` - 3 gün sonra otomatik silinir (repo tarafında birikim yok)
- `compression-level: 6` - Upload hızı optimize edildi

**Playwright trace/video/screenshot ayarları:**
- `trace: on-first-retry` (default) - Sadece retry'da trace üretilir (artifact boyutu küçük)
- `video: only-on-failure` (önerilen) - Sadece fail durumunda video kaydedilir
- `screenshot: only-on-failure` (önerilen) - Sadece fail durumunda screenshot alınır

**HTML Reporter ayarları:**
- `reporter: ['html', { outputFolder: 'playwright-report' }]` - Trace/video/screenshot'ları `playwright-report/data/` içine kopyalar
- Bu sayede artifact olarak sadece `playwright-report` yeterli (HTML report içinde trace bağlantıları çalışır)

**Alternatif (iki katman):**
```yaml
# Success'ta sadece test-results
- name: Upload test results (on success)
  if: success()
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: apps/web-next/test-results
    retention-days: 3

# Failure'da report + trace
- name: Upload playwright report (on failure)
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: apps/web-next/playwright-report
    retention-days: 7
```

**Öneri:** Mevcut `if: always()` + `retention-days: 3` + `compression-level: 6` yeterli (basit ve etkili). Video/screenshot'ları `only-on-failure` modunda tutarak artifact boyutunu daha da düşürebilirsin.

---

## 4) Snapshot Update Ritüeli

**Intentional change (tasarım bilinçli değiştiyse):**

1. Lokalde dev server aç: `pnpm --filter web-next dev -- --port 3003`
2. Snapshot update: `pnpm --filter web-next exec playwright test "tests/visual/*.spec.ts" --update-snapshots`
3. `git status` ile snapshot değişimini kontrol et
4. Commit: `git add apps/web-next/tests/visual && git commit -m "chore(ui): update golden master snapshots (intentional change: ...)"`
5. Push → PR aç → CI yeşil olmalı

**Unintentional change (bug fix):**

1. CI kırmızı → Artifact'ten `playwright-report/index.html` indir
2. Diff'i incele → "intentional mı bug mı?" ayır
3. Bug ise: UI'yi düzelt → snapshot update yapma
4. Intentional ise: Snapshot update yap (yukarıdaki ritüel)

---

## 5) Troubleshooting

### 5.1 CI Kırmızı Ama Diff Yok

**Olası nedenler:**
- Font/render farkı (Windows vs Ubuntu) → `windows-latest` runner kullanılıyor mu?
- Timezone/locale farkı → `timezoneId: 'Europe/Istanbul'`, `locale: 'tr-TR'` sabit mi?
- Random data → Fixture data kullanılıyor mu?

**Çözüm:**
- Artifact'ten `playwright-report/index.html` indir → diff'i gör
- Lokalde aynı ortamda test et (Windows, aynı viewport)
- Deterministiklik ayarlarını kontrol et

### 5.2 Artifact Gelmiyor

**Kontrol listesi:**
- `if: always()` var mı?
- `if-no-files-found: ignore` var mı?
- Path doğru mu? (`apps/web-next/playwright-report`)
- Workflow step'i çalıştı mı?

---

## 6) Best Practices

1. **Default güvenli:** UI değişmedikçe snapshot'a dokunma
2. **Override kanıtla:** Intentional change'de snapshot update + evidence
3. **Artifact kontrolü:** Fail run'da mutlaka `playwright-report/index.html` indir
4. **Deterministiklik:** Fixture data, sabit viewport, sabit timezone/locale

---

**Son Güncelleme:** 2024-12-16
**Bakım:** Branch protection rules değiştiğinde bu dokümanı güncelle

