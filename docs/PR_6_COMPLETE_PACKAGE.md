# PR-6: CI & E2E Paketi - Tek Komutta Hazır

## 🚀 PR Başlığı
```
ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse
```

## 📝 PR Açıklaması (Kopyala-Yapıştır)

**Özet**

Bu PR, Spark Web (apps/web-next) için prod-kalite CI & E2E test altyapısını kurar:

* PR başına build + smoke E2E
* Nightly çok-tarayıcı + Lighthouse
* pnpm cache + setup-node ile hızlı kurulum
* Trace/video/screenshot artifact'leri

**Neden şimdi?**

* Operatör odaklı P0 akışları (Dashboard/Market/Alerts) artık "bir bakışta" net; bunları bozmadan ilerlemek için **tekrarlanabilir CI + E2E** şart.
* **Playwright** ile GitHub Actions üzerinde tarayıcı testleri ve web server orkestrasyonu native şekilde desteklenir.
* **pnpm** + **actions/setup-node** ile cache desteği işleri ciddi hızlandırır (doğrudan pnpm dökümantasyon önerisi ve cache input'u).
* Nightly'de **Lighthouse CI** ile performans/A11y/SEO skorları izlenir.
* Gerekirse **service containers** ile DB/Redis gibi bağımlılıklar izole edilebilir.

**Kapsam**

1. **PR CI (ci.yml)**
   * Node 20, pnpm kurulumu ve cache
   * Üretim build'i + Playwright browser install + smoke E2E
   * Trace/video artifact'leri ve junit çıktıları

2. **Nightly (nightly-e2e-perf.yml)**
   * Chromium/Firefox/WebKit üçlüsü
   * 5 kritik sayfada Lighthouse (Perf/A11y/SEO ≥ 80 hedefi)

3. **Test Altyapısı**
   * `playwright.config.ts`: webServer + retries + **trace: on-first-retry**
   * `tests/e2e/smoke.spec.ts`: 7 smoke senaryosu
   * LHCI konfigürasyonu

**Kabul Kriterleri**

* PR workflow < 5 dk, Nightly < 15 dk
* Smoke E2E: ≥ %95 başarı
* Lighthouse: Perf/A11y/SEO her biri ≥ 80
* Tüm artifact'ler (trace/video) build çıktısına yükleniyor

**Riskler & Önlemler**

* Flaky E2E → **web-first assertions** & **auto-wait** kullanımı (Playwright best practice)
* Uzun CI → pnpm cache + bağımlılık adımları minimize (pnpm resmi öneri)
* Gece başarısızlıkları → Nightly ayrı job, sonuçlar "required" değil; raporlanır

**Telemetri**

* CI süreleri, cache hit rate, E2E pass rate
* Lighthouse skor trendi (Perf/A11y/SEO)

---

## 🔧 Tek Komut Kurulum

```bash
# 1. Branch aç
git checkout -b feat/pr6-matriks-p0-features

# 2. Tüm dosyaları oluştur (aşağıdaki dosyalar otomatik oluşturulacak)
# 3. Commit yap
git add .
git commit -m "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- pnpm + setup-node cache (hızlı PR CI)
- Playwright smoke E2E (trace/video)
- Nightly: Chromium/Firefox/WebKit + LHCI
- Artifacts: test-results/ (trace, video, screenshots)
- Gelecek: service containers ile DB/Redis orkestrasyonu

Refs: docs/PR_6_FINAL_PR_DESCRIPTION.md"

# 4. Push yap
git push origin feat/pr6-matriks-p0-features

# 5. PR aç
gh pr create --title "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse" --body-file docs/PR_6_COMPLETE_PACKAGE.md
```

---

## 📁 Oluşturulacak Dosyalar

### GitHub Actions
- `.github/workflows/ci.yml` — PR workflow
- `.github/workflows/nightly-e2e-perf.yml` — Nightly workflow

### Playwright
- `apps/web-next/playwright.config.ts` — Production testing config
- `apps/web-next/tests/e2e/smoke.spec.ts` — 7 smoke test scenarios

### Package Scripts
- `apps/web-next/package.json` — E2E test scripts
- `package.json` — Root scripts

### Lighthouse CI
- `apps/web-next/lhci.config.js` — Performance testing

---

## 🧪 E2E Smoke Kapsamı (7 Test)

1. **Dashboard** — LED'ler unknown → up/down geçişi
2. **Market Grid** — 6 kart render eder
3. **Alerts** — "convert to order" CTA görünür/çalışır
4. **Portfolio** — Sayfa açılır (tabular hizalı sütunlar)
5. **Strategy-Lab** — Sekmeler arasında geçiş
6. **Metrics API** — `/api/public/metrics` 200 döner
7. **Health API** — `/api/public/health` 200 döner

---

## ✅ QA / Onay Checklist

* [ ] PR CI < 5 dk (cache hit ≥ %80)
* [ ] Smoke E2E ≥ %95
* [ ] Nightly çok-tarayıcı PASS
* [ ] Lighthouse (Perf/A11y/SEO) ≥ 80
* [ ] Trace/video artifacts yüklendi
* [ ] (Ops.) Service containers ile bağımlılıklar izole

---

## 📚 Referanslar

- [Playwright Web Server](https://playwright.dev/docs/test-webserver)
- [pnpm CI Guide](https://pnpm.io/continuous-integration)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Lighthouse CI Action](https://github.com/treosh/lighthouse-ci-action)

---

**Sonuç:** PR-6 CI & E2E paketi tek komutta hazır. Tüm dosyalar, test senaryoları ve performans hedefleri dahil. Hemen uygulanabilir! 🎉
