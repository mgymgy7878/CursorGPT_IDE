# PR-6: CI & Test Altyapısı (GitHub Actions + Playwright + E2E)

## Özet

* pnpm cache + `setup-node` entegrasyonu → hızlı CI
* Playwright smoke (PR) + nightly tam tarama (chromium/firefox/webkit)
* Artifact (trace/video/screenshot) yükleme
* (Opsiyonel) Lighthouse CI ve Codecov entegrasyonu

## Kabul Kriterleri

* [ ] PR'da `build_lint_typecheck` ve `e2e_smoke` yeşil
* [ ] Smoke: Dashboard/Market/Alerts 3 temel senaryo **PASS**
* [ ] Nightly (chromium/firefox/webkit) **PASS**
* [ ] Artifacts indirilebilir (trace/video)
* [ ] (Opsiyonel) Lighthouse puanları 80+ (PWA hariç)

## Test Planı

* Unit/Vitest: `pnpm -w test`
* E2E/Playwright (lokal):
  * `pnpm --filter web-next build && pnpm --filter web-next start -p 3003`
  * `BASE_URL=http://127.0.0.1:3003 pnpm --filter web-next test:e2e:smoke`

## Risk & Mitigasyon

* Build süresi artışı → cache + ayrık job'lar (build once, reuse)
* E2E flaky → Playwright trace/video + retry stratejisi
* Servis bağımlılıkları → service containers ile izole ortam

## Referanslar

* Caching best-practices (GitHub Docs)
* pnpm CI kılavuzu
* Playwright on CI (resmi dokümantasyon)
* Service containers (GitHub Docs)
* Lighthouse CI Action
* Codecov Action
* Artifact v4 (GitHub)

## Değişen Dosyalar

### GitHub Actions
- `.github/workflows/ci.yml` — Ana CI workflow (PR + main)
- `.github/workflows/nightly-e2e-perf.yml` — Nightly E2E + Lighthouse

### Playwright
- `apps/web-next/playwright.config.ts` — Production build testing
- `apps/web-next/tests/e2e/smoke.spec.ts` — Smoke test senaryoları

### Package Scripts
- `apps/web-next/package.json` — E2E test script'leri
- `package.json` — Root test ve lint script'leri

### Lighthouse CI
- `apps/web-next/lhci.config.js` — Lighthouse CI konfigürasyonu

## Teknik Detaylar

### CI Pipeline
1. **build_lint_typecheck** (2-3 dk)
   - pnpm cache ile hızlı dependency kurulumu
   - Lint + TypeCheck + Build

2. **e2e_smoke** (3-5 dk)
   - Production build ile test
   - Playwright smoke test'leri
   - Artifact yükleme (trace/video)

### Nightly Pipeline
1. **playwright_all_browsers** (10-15 dk)
   - Chromium, Firefox, WebKit test'leri
   - Matrix strategy ile paralel çalışma

2. **lighthouse_ci** (5-8 dk)
   - Web Vitals analizi
   - Performance, Accessibility, SEO skorları

### Cache Stratejisi
- **pnpm cache:** Node modules için otomatik cache
- **Build cache:** Next.js build cache (gelecek)
- **Playwright cache:** Browser binary cache

### Artifact Yönetimi
- **E2E artifacts:** Trace, video, screenshot
- **Lighthouse reports:** Performance raporları
- **Test results:** JSON + JUnit format

## Performans Hedefleri

- **CI Süresi:** <5 dakika (PR), <15 dakika (nightly)
- **Cache Hit Rate:** >80% (pnpm)
- **E2E Success Rate:** >95%
- **Lighthouse Scores:** >80 (Performance, A11y, SEO)

## Gelecek Geliştirmeler

- [ ] Build cache implementasyonu
- [ ] Parallel test execution
- [ ] Codecov entegrasyonu
- [ ] Visual regression testing
- [ ] Load testing (k6)
