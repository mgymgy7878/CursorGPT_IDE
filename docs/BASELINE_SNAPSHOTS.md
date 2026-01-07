# Baseline Golden Master Snapshots — Kurulum Rehberi

Durum: İlk kurulum / baseline oluşturma

Sürüm: 1.0

---

## 0) Amaç

CI/PR pipeline'ında visual regression testlerinin çalışması için baseline snapshot'ları oluşturmak ve commit etmek.

**Kritik:** Baseline snapshot'lar olmadan testler her zaman fail olur (snapshot bulunamadı hatası).

---

## 1) Baseline Snapshot Oluşturma

### 1.1 Adım 1: Dev Server'ı Başlat

**Terminal 1 (Background):**
```bash
pnpm --filter web-next dev -- --port 3003
```

**Beklenen çıktı:**
```
▲ Next.js 14.x.x
- Local:        http://127.0.0.1:3003
- Ready in Xs
```

**Doğrulama:**
```bash
curl http://127.0.0.1:3003/api/healthz
# Beklenen: {"status":"UP",...}
```

### 1.2 Adım 2: Baseline Snapshot'ları Oluştur

**Terminal 2:**
```bash
# Repo root'tan
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots
```

**Beklenen çıktı:**
```
Running 15 tests using 1 worker

  ✓ tests/visual/dashboard-golden-master.spec.ts:29:5 › Dashboard Golden Master › dashboard - loading state (Xms)
  ✓ tests/visual/dashboard-golden-master.spec.ts:59:5 › Dashboard Golden Master › dashboard - empty state (Xms)
  ...

  15 passed (Xs)
```

**Oluşan Dosyalar:**
```
apps/web-next/tests/visual/
├── dashboard-golden-master.spec.ts
├── dashboard-golden-master.spec.ts-snapshots/
│   ├── dashboard-loading.png
│   ├── dashboard-empty.png
│   ├── dashboard-error.png
│   ├── dashboard-data.png
│   └── dashboard-default.png
├── market-data-golden-master.spec.ts
├── market-data-golden-master.spec.ts-snapshots/
│   ├── market-data-default.png
│   ├── market-data-loading.png
│   └── market-data-empty.png
├── strategy-lab-golden-master.spec.ts
├── strategy-lab-golden-master.spec.ts-snapshots/
│   ├── strategy-lab-default.png
│   ├── strategy-lab-loading.png
│   └── strategy-lab-empty.png
├── my-strategies-golden-master.spec.ts
├── my-strategies-golden-master.spec.ts-snapshots/
│   ├── my-strategies-default.png
│   ├── my-strategies-loading.png
│   └── my-strategies-empty.png
├── running-strategies-golden-master.spec.ts
└── running-strategies-golden-master.spec.ts-snapshots/
    ├── running-strategies-default.png
    ├── running-strategies-loading.png
    └── running-strategies-empty.png
```

### 1.3 Adım 3: Snapshot Path'ini Doğrula (Tahmin Etme!)

**Kritik:** Playwright snapshot path'i projeye göre değişebilir. **Tahmin etme, git status ile gör!**

**Git Status:**
```bash
git status
```

**Beklenen çıktı (Playwright default):**
```
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)

  new file:   apps/web-next/tests/visual/dashboard-golden-master.spec.ts-snapshots/dashboard-loading.png
  new file:   apps/web-next/tests/visual/dashboard-golden-master.spec.ts-snapshots/dashboard-empty.png
  new file:   apps/web-next/tests/visual/market-data-golden-master.spec.ts-snapshots/market-data-default.png
  ...
```

**Alternatif path'ler (config'e göre):**
- `apps/web-next/tests/visual/__snapshots__/` (bazı config'lerde)
- `apps/web-next/tests/visual/snapshots/` (playwright.config.ts'de `snapshotDir` tanımlıysa)

**Not:** Playwright default olarak `*-snapshots/` klasörü oluşturur. Config'te `snapshotDir` tanımlı olsa bile, `toHaveScreenshot()` kullanıldığında test dosyasının yanında `*-snapshots/` klasörü oluşur.

**Doğrulama:**
```bash
# Hangi klasörler oluştu?
git status --short | grep -E "snapshot|visual"

# Veya Windows PowerShell:
git status --short | Select-String "snapshot|visual"
```

### 1.4 Adım 4: Commit Et

```bash
# Tüm snapshot klasörlerini ekle
git add apps/web-next/tests/visual

# Commit
git commit -m "chore(ui): add baseline golden master snapshots

- Dashboard (5 states: loading/empty/error/data/default)
- Market Data (3 states: default/loading/empty)
- Strategy Lab (3 states: default/loading/empty)
- My Strategies (3 states: default/loading/empty)
- Running Strategies (3 states: default/loading/empty)

Total: 17 baseline snapshots for visual regression tests."

# Push
git push
```

---

## 2) Doğrulama

### 2.1 Local Test

**CI Script'i Çalıştır:**
```bash
# Repo root'tan
pnpm --filter web-next exec bash ./scripts/ci-visual-regression.sh
```

**Beklenen:**
- ✅ Dev server başlar
- ✅ Healthz ready olur (200 veya 503)
- ✅ Tüm visual testler PASS
- ✅ Dev server durur

### 2.2 CI Test

**PR Aç:**
1. Küçük bir değişiklik yap (örn. comment ekle)
2. PR aç
3. GitHub Actions workflow'u tetiklenir
4. `ui-visual-regression` check'i yeşil olmalı

**Beklenen:**
- ✅ Workflow başarılı
- ✅ Tüm testler PASS
- ✅ PR merge edilebilir

---

## 3) Sorun Giderme

### 3.1 "No snapshots found" Hatası

**Sorun:**
```
Error: No snapshots found for test "dashboard - loading state"
```

**Çözüm:**
1. Baseline snapshot'ları oluştur (Adım 1.2)
2. Snapshot klasörlerini commit et (Adım 1.4)

### 3.2 "Connection refused" Hatası

**Sorun:**
```
Error: connect ECONNREFUSED 127.0.0.1:3003
```

**Çözüm:**
1. Dev server'ın çalıştığını kontrol et:
   ```bash
   curl http://127.0.0.1:3003/api/healthz
   ```
2. Port çakışması olabilir:
   ```bash
   # Windows
   netstat -ano | findstr :3003

   # Linux/Mac
   lsof -i :3003
   ```
3. Gerekirse port'u değiştir veya process'i kill et

### 3.3 Snapshot Diff Çıktı

**Sorun:**
```
Error: Screenshot comparison failed. See diff at: ...
```

**Çözüm:**
- **Intentional change:** `--update-snapshots` ile güncelle
- **Bug:** Shell kurallarını kontrol et, UI_UX_PLAN.md'ye uygun mu?

---

## 4) Snapshot Güncelleme (Intentional Change)

**PR'da Intentional UI Change:**
```bash
# 1) Dev server başlat
pnpm --filter web-next dev -- --port 3003

# 2) Snapshot'ları güncelle
pnpm --filter web-next exec playwright test tests/visual/*.spec.ts --update-snapshots

# 3) Yeni snapshot'ları commit et
git add apps/web-next/tests/visual
git commit -m "chore(ui): update golden master snapshots (intentional change)

- Updated dashboard layout per Figma design
- See PR #XXX for details"

# 4) PR'a evidence ekle (before/after screenshot)
```

---

## 5) İlgili Dokümanlar

- `docs/CI_PR_SMOKE_RCA.md` - CI/PR Smoke & RCA karar ağacı
- `docs/UI_UX_PLAN.md` - UI/UX standartları ve PR protokolü
- `.github/workflows/ui-visual-regression.yml` - GitHub Actions workflow
- `apps/web-next/scripts/ci-visual-regression.sh` - CI script

