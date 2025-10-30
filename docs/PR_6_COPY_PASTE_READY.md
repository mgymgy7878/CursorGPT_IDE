# PR-6: CI & E2E Paketi - Copy-Paste Hazır

## 🚀 PR Title
```
ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse
```

## 📝 PR Açıklaması (Kopyala-Yapıştır)

**Özet**

Bu PR; web-next uygulaması için **üretim benzeri derleme üzerinde E2E smoke** testi, **gece koşan (nightly) çok-tarayıcı + Lighthouse** performans taraması ve **hızlı CI önbellekleme** yapılandırmasını ekler.

* **Playwright**: prod build üstünden `webServer` ile test, **web-first assertions** ve **trace on-first-retry** ile flakiness azaltma.
* **CI Önbellek**: `actions/setup-node@v4` cache + pnpm ile hızlı bağımlılık yükleme.
* **Nightly**: Chromium/Firefox/WebKit + **Lighthouse CI Action** (Perf/A11y/SEO eşikleri).
* **(Opsiyonel)** Service containers ile DB/Redis gibi bağımlılıkların izole koşumu.

**Kapsam / Değişiklikler**

* **.github/workflows/ci.yml** — PR tetikli: build + Playwright smoke
* **.github/workflows/nightly-e2e-perf.yml** — gecelik: 3 tarayıcı + Lighthouse
* **apps/web-next/playwright.config.ts** — `webServer` prod build üzerinden test; **trace on-first-retry**; JUnit reporter
* **apps/web-next/tests/e2e/smoke.spec.ts** — 7 smoke senaryosu (Dashboard/Market/Alerts/Portfolio/StrategyLab + health/metrics) — **web-first assertions** kullanır
* **apps/web-next/lhci.config.js** — Lighthouse eşikleri (≥80) ve hata seviyesinde job fail
* **Root & app package scripts** — `test:e2e`, `test:e2e:smoke`, `ci` komutları

**Neden Bu Tasarım?**

* **Prod-like E2E**: Playwright'ın önerdiği `webServer` akışı; gerçek build'te test → "works on my machine" sapmalarını azaltır
* **Stabil Assertions**: **Web-first assertions** (otomatik bekleme) flaky testleri belirgin düşürür
* **Hızlı CI**: `setup-node` cache + pnpm; GitHub Actions resmi önbellek yönergelerine uygundur
* **Gecelik Kalite Kapısı**: treosh **Lighthouse CI Action** ile performans/a11y/SEO için ölçülebilir eşik
* **Servis Bağımlılıkları**: Postgres/Redis türü bağımlılıklar için GitHub **service containers** tavsiye edilen yaklaşımdır

**Acceptance Criteria**

* [ ] **PR CI < 5 dk**, cache hit ≥ %80
* [ ] **Smoke E2E ≥ %95** başarı (7 senaryo)
* [ ] **Nightly (Chromium/Firefox/WebKit)** PASS + Lighthouse (Perf/A11y/SEO **≥80**)
* [ ] Playwright raporları: **trace/video/screenshot** artifact'leri yükleniyor
* [ ] (Varsa) service containers ile bağımlılıklar izole çalıştırılıyor

**Test Planı**

**Lokal (dev makine):**
```bash
pnpm i
pnpm --filter web-next build
pnpm --filter web-next start -- -p 3003 &
BASE_URL=http://127.0.0.1:3003 pnpm --filter web-next test:e2e:smoke
```

**CI (PR):** `ci.yml` → build + smoke E2E + artifacts (trace/video)
**Nightly:** `nightly-e2e-perf.yml` → 3 tarayıcı + Lighthouse

**Riskler & Mitigasyon**

* **Flaky test** → web-first assertions + **trace on-first-retry** etkin
* **Yavaş CI** → pnpm + setup-node cache, bağımlılık pin'leme
* **Harici servisler** → service containers ile izole/tekrar üretilebilir ortam

**Telemetri (öneri)**

* CI süreleri, cache hit/miss, test başarısı, Lighthouse skorları; haftalık trend grafikleri (nightly job artifaktı)

---

## 🔧 Commit Mesajı (Kopyala)

```
ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- Playwright: prod build üstünde webServer, web-first assertions, trace on-first-retry
- CI: setup-node@v4 cache + pnpm (hızlı PR CI)
- Nightly: Chromium/Firefox/WebKit + Lighthouse CI (Perf/A11y/SEO ≥80)
- Artifacts: trace/video/screenshots
- Service containers (ops): bağımlılık izolasyonu

Refs: docs/PR_6_FINAL_PR_DESCRIPTION.md
```

## ✅ Reviewer Checklist (Hızlı Göz)

* [ ] CI log: pnpm cache **hit** gözüküyor mu?
* [ ] Playwright trace'leri indirilebilir mi? **(Artifacts)**
* [ ] Smoke testler **web-first assertions** ile yazılmış mı?
* [ ] Nightly run'da Lighthouse skorları ≥80 mi?
* [ ] (Varsa) service containers ile bağımlılıklar ayağa kalkıyor mu?

---

## 🚀 Tek Komut Kurulum

```bash
# 1. Branch aç
git checkout -b feat/pr6-matriks-p0-features

# 2. Tüm dosyalar hazır (aşağıda listelenen)
# 3. Commit yap
git add .
git commit -m "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- Playwright: prod build üstünde webServer, web-first assertions, trace on-first-retry
- CI: setup-node@v4 cache + pnpm (hızlı PR CI)
- Nightly: Chromium/Firefox/WebKit + Lighthouse CI (Perf/A11y/SEO ≥80)
- Artifacts: trace/video/screenshots
- Service containers (ops): bağımlılık izolasyonu

Refs: docs/PR_6_FINAL_PR_DESCRIPTION.md"

# 4. Push yap
git push origin feat/pr6-matriks-p0-features

# 5. PR aç (GitHub CLI ile)
gh pr create --title "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse" --body-file docs/PR_6_COPY_PASTE_READY.md
```

---

## 📁 Hazır Dosyalar

### GitHub Actions (Optimized)
- `.github/workflows/ci.yml` — PR workflow (pnpm cache + setup-node)
- `.github/workflows/nightly-e2e-perf.yml` — Nightly (multi-browser + Lighthouse)

### Playwright (Production-Ready)
- `apps/web-next/playwright.config.ts` — webServer + trace debugging
- `apps/web-next/tests/e2e/smoke.spec.ts` — 7 smoke test (web-first assertions)

### Lighthouse CI (Strict Thresholds)
- `apps/web-next/lhci.config.js` — Performance/A11y/SEO ≥80 (error level)

### Package Scripts
- `apps/web-next/package.json` — E2E test scripts
- `package.json` — Root scripts

---

## 🧪 E2E Smoke Kapsamı (7 Test)

1. **Dashboard** — LED'ler unknown → up/down geçişi
2. **Market Grid** — 6 kart render eder
3. **Alerts** — "convert to order" CTA görünür/çalışır
4. **Portfolio** — Tabular hizalı sütunlar
5. **Strategy-Lab** — Sekmeler arasında geçiş
6. **Metrics API** — `/api/public/metrics` 200 döner
7. **Health API** — `/api/public/health` 200 döner

---

## 📊 Performans Hedefleri

| Metrik | Hedef | Teknoloji |
|--------|-------|-----------|
| PR CI | <5 dk | pnpm cache + setup-node |
| Nightly CI | <15 dk | Multi-browser + Lighthouse |
| E2E Success | >%95 | Web-first assertions |
| Lighthouse | ≥80 | Performance/A11y/SEO |

---

## 📚 Resmi Referanslar

- [Playwright Page Object Models](https://playwright.dev/docs/pom)
- [Playwright Page API](https://playwright.dev/docs/api/class-page)
- [Web-First Assertions](https://playwright-ruby-client.vercel.app/docs/article/guides/rspec_integration)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [GitHub Service Containers](https://docs.github.com/en/actions/using-containerized-services)

---

**Sonuç:** PR-6 CI & E2E paketi copy-paste hazır! Tüm dosyalar, test senaryoları, performans hedefleri ve resmi referanslar dahil. Hemen uygulanabilir! 🎉
