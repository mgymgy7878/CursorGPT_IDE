# PR-6 Commit Message Template

## 🚀 Ana Commit Mesajı

```bash
ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- pnpm cache (setup-node) ile hızlı CI (<5 dk PR, <15 dk nightly)
- Playwright smoke E2E (7 senaryo) + trace/video debugging
- Lighthouse CI (Performance/A11y/SEO ≥80) + multi-browser testing
- Service containers desteği (PostgreSQL/Redis opsiyonel)
- Artifact yönetimi (trace/video/screenshot) + GitHub Actions v4

Co-authored-by: ChatGPT <chatgpt@openai.com>
```

## 📁 Dosya Bazlı Commit Mesajları (Opsiyonel)

### GitHub Actions
```bash
ci(actions): GitHub Actions workflows for PR and nightly testing

- .github/workflows/ci.yml: PR workflow (build + smoke E2E)
- .github/workflows/nightly-e2e-perf.yml: Nightly workflow (Lighthouse + multi-browser)
- pnpm cache integration with setup-node@v4
- Service containers support for PostgreSQL/Redis dependencies
```

### Playwright Configuration
```bash
test(playwright): Production build testing with webServer

- apps/web-next/playwright.config.ts: webServer + trace debugging
- apps/web-next/tests/e2e/smoke.spec.ts: 7 smoke test scenarios
- Trace on-first-retry, video retain-on-failure, screenshot only-on-failure
- Parallel execution and deterministic test IDs
```

### Package Scripts
```bash
chore(scripts): E2E test scripts and root package updates

- apps/web-next/package.json: test:e2e:smoke, test:e2e:all scripts
- package.json: test:coverage, lint scripts for monorepo
- Playwright integration with pnpm workspace
```

### Lighthouse CI
```bash
perf(lighthouse): Lighthouse CI configuration for performance testing

- apps/web-next/lhci.config.js: Performance/A11y/SEO thresholds
- treosh/lighthouse-ci-action integration
- 5 main pages testing (dashboard, market, portfolio, strategy-lab, alerts)
- Score thresholds: ≥80 for all categories
```

## 🎯 Tek Commit (Önerilen)

```bash
ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- pnpm cache (setup-node) ile hızlı CI (<5 dk PR, <15 dk nightly)
- Playwright smoke E2E (7 senaryo) + trace/video debugging
- Lighthouse CI (Performance/A11y/SEO ≥80) + multi-browser testing
- Service containers desteği (PostgreSQL/Redis opsiyonel)
- Artifact yönetimi (trace/video/screenshot) + GitHub Actions v4

Files changed:
- .github/workflows/ci.yml (PR workflow)
- .github/workflows/nightly-e2e-perf.yml (nightly workflow)
- apps/web-next/playwright.config.ts (production testing)
- apps/web-next/tests/e2e/smoke.spec.ts (7 smoke tests)
- apps/web-next/package.json (E2E scripts)
- package.json (root scripts)
- apps/web-next/lhci.config.js (Lighthouse config)

Co-authored-by: ChatGPT <chatgpt@openai.com>
```

## 🔧 PR Açma Komutları

```bash
# 1. Branch aç
git checkout -b feat/pr6-matriks-p0-features

# 2. Dosyaları ekle
git add .

# 3. Commit yap
git commit -m "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse

- pnpm cache (setup-node) ile hızlı CI (<5 dk PR, <15 dk nightly)
- Playwright smoke E2E (7 senaryo) + trace/video debugging
- Lighthouse CI (Performance/A11y/SEO ≥80) + multi-browser testing
- Service containers desteği (PostgreSQL/Redis opsiyonel)
- Artifact yönetimi (trace/video/screenshot) + GitHub Actions v4

Co-authored-by: ChatGPT <chatgpt@openai.com>"

# 4. Push yap
git push origin feat/pr6-matriks-p0-features

# 5. PR aç (GitHub CLI ile)
gh pr create --title "ci(test): PR-6 — GitHub Actions + Playwright E2E + Nightly Lighthouse" --body-file docs/PR_6_FINAL_PR_DESCRIPTION.md
```

## 📋 PR Açma Checklist

- [ ] Branch oluşturuldu: `feat/pr6-matriks-p0-features`
- [ ] Tüm dosyalar commit edildi
- [ ] Commit mesajı yukarıdaki template'e uygun
- [ ] PR açıklaması `docs/PR_6_FINAL_PR_DESCRIPTION.md`'den kopyalandı
- [ ] GitHub Actions workflow'ları çalışıyor
- [ ] Smoke test'ler lokal olarak geçiyor
- [ ] Lighthouse CI konfigürasyonu doğru

## 🎯 Sonraki Adımlar

1. **PR Aç** → GitHub'da PR oluştur
2. **CI Kontrol** → GitHub Actions'da job'ları izle
3. **Test Çalıştır** → Lokal olarak smoke test'leri çalıştır
4. **Review** → Code review için hazırla
5. **Merge** → CI geçtikten sonra merge et

---

**Not:** Bu template, GitHub Actions, Playwright ve Lighthouse'ın resmi best practice'lerine uygun olarak hazırlanmıştır. Tüm referanslar ve performans hedefleri dahil edilmiştir.
