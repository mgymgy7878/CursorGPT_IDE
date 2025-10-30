# PR-6: CI & E2E Test Altyapısı (Playwright + Lighthouse)

## 🎯 Amaç
PR'larda smoke/E2E güvence, nightly'de performans ve erişilebilirlik taraması.

## 📊 Hedefler
- **PR Süresi:** <5 dk
- **Nightly Süresi:** <15 dk
- **E2E Başarı:** >%95
- **Lighthouse Skorları:** ≥80

---

## 🏗️ CI Boru Hattı Tasarımı

### Job: build&test (PR)
- **Node 20 + pnpm kurulumu** - `cache=pnpm` (setup-node'ın yerleşik cache'i)
- **Playwright bağımlılıkları** - `npx playwright install --with-deps` (OS bağımlılıkları dahil)
- **Next.js prod build** - `playwright.config` içinde `webServer` ile test sunucusu
- **E2E smoke senaryoları** - Chromium + trace on-first-retry + artifacts yükleme

### Job: nightly-perf-a11y (cron)
- **Lighthouse CI action** - `treosh/lighthouse-ci-action` ile Performance/A11y/SEO taraması
- **Service containers** - PostgreSQL/Redis bağımlılıkları için (opsiyonel)

> **Neden `cache: 'pnpm'`?** `actions/setup-node`'un dahili cache desteği pnpm-lock.yaml'ı anahtar olarak kullanır ve ek `actions/cache` adımına gerek bırakmaz. Bu, CI süresini ciddi kısaltır.

---

## 🎭 Playwright E2E Yapılandırması

### playwright.config.ts
- **webServer:** `pnpm --filter web-next start -p 3003`, `reuseExistingServer: !process.env.CI`
- **Debugging:** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`
- **Shard/Parallel:** `--shard=1/2` ile PR'larda yatay ölçeklenebilirlik

---

## 🚀 Lighthouse (Nightly) Yapılandırması

- **treosh/lighthouse-ci-action** ile site URL'lerini test et
- **Skor eşikleri:** perf ≥ 0.80, a11y ≥ 0.90 (job'ı fail edecek şekilde)
- **Raporlar:** Geçici depoya veya artifact olarak yükle

---

## 📁 Değişen Dosyalar

### GitHub Actions
- `.github/workflows/ci.yml` — PR workflow (build + smoke E2E)
- `.github/workflows/nightly-e2e-perf.yml` — Nightly workflow (Lighthouse + multi-browser)

### Playwright
- `apps/web-next/playwright.config.ts` — Production build testing + webServer
- `apps/web-next/tests/e2e/smoke.spec.ts` — 7 smoke test senaryosu

### Package Scripts
- `apps/web-next/package.json` — E2E test script'leri
- `package.json` — Root test ve lint script'leri

### Lighthouse CI
- `apps/web-next/lhci.config.js` — Performance testing konfigürasyonu

---

## 🧪 E2E Smoke Kapsamı (PR Koşusu)

### Test Senaryoları (7 test)
1. **Dashboard:** LED resolve (unknown→up/down), KPI unit (ms/s) doğrulaması
2. **Market:** 6 kart + sparkline, ChartTrading panel görünür
3. **Alerts:** "Preset kaydet/yükle" + "Emre dönüştür" CTA
4. **Portfolio:** sticky header + tabular num hizası
5. **Strategy Lab:** Tab navigation + form elements
6. **Health Check:** `/api/healthz` 200 response
7. **Metrics:** `/api/public/metrics` Prometheus format

### Playwright Best-Practice
- `on-first-retry` trace
- Parallel run
- `webServer` bekleme
- Deterministic test ID'leri

---

## ✅ Kabul Kriterleri

1. **PR koşusunda smoke testleri <5 dk** tamamlanır (cache=pnpm)
2. **E2E başarısı ≥%95** (trace on-first-retry)
3. **Nightly Lighthouse skorları Perf/A11y/SEO ≥ 80** (eşik fail'letir)
4. **Service containers** ile DB/Redis bağımlılıkları ayağa kalkar (varsa)

---

## ⚠️ Risk Matrisi & Önlemler

### Yüksek Risk: Flaky E2E
**Önlemler:**
- Trace/video debugging
- `--retry=2` strategy
- Deterministic test ID'leri
- Test sharding (gerektiğinde)

### Orta Risk: Uzayan CI Süreleri
**Önlemler:**
- pnpm cache (`cache: 'pnpm'`)
- `node-version: 20`
- Monorepo install optimizasyonu
- Minimal artifacts

### Orta Risk: 3P Servis Bağımlılığı
**Önlemler:**
- Service containers
- Health-check ve readiness prob'ları
- Graceful degradation

---

## 📈 Telemetri/Hedefler

### Metrikler
- **CI süresi** (trend grafikleri)
- **Cache hit rate** (pnpm cache)
- **E2E pass rate** (nightly)
- **Lighthouse skorları** (performance, a11y, seo)

### Hedefler
- PR CI: <5 dakika
- Nightly CI: <15 dakika
- E2E Success: >%95
- Lighthouse: ≥80 (tüm kategoriler)

---

## 🚀 Hemen Uygula Kontrol Listesi

- [ ] `setup-node@v4` + `cache: 'pnpm'` eklendi mi? (lock dosyası kökte)
- [ ] `playwright install --with-deps` ve `webServer` kullanımı var mı?
- [ ] Nightly'de `treosh/lighthouse-ci-action` ile skor eşikleri kondu mu?
- [ ] DB/Redis için service container tanımlandı mı? (varsa)
- [ ] Artifacts: trace/video yalnızca failure'da yüklensin (boyutu sınırlı tut)

---

## 📚 Referanslar

- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [pnpm CI Guide](https://pnpm.io/continuous-integration)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Lighthouse CI Action](https://github.com/treosh/lighthouse-ci-action)
- [GitHub Service Containers](https://docs.github.com/en/actions/using-containerized-services)
- [GitHub Artifacts v4](https://github.com/actions/upload-artifact)

---

## 🎯 Sonuç

Bu PR ile Spark Trading Platform'un CI/CD altyapısı production-ready hale gelir. PR'larda hızlı feedback, nightly'de kapsamlı test ve performans izleme sağlanır. Tüm implementasyon GitHub Actions, Playwright ve Lighthouse'ın resmi best practice'lerine uygun olarak yapılmıştır.
