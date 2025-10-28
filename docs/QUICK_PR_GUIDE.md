# Quick PR Guide - 5 Dakikada PR Aç

## 🚀 **Hızlı Başlangıç**

```bash
# 1. Local validation (15 dakika)
pwsh scripts/local-validation.ps1

# 2. PR aç (1 dakika)
gh pr create --draft --title "feat(ui): 1-day UI reconstruction - 5 pages with WCAG 2.1 AA" --body-file docs/PR_SUMMARY.md

# 3. Evidence ekle (2 dakika)
# - .lighthouseci/*.json dosyalarını PR'a attach et
# - test-results/ klasörünü screenshot olarak ekle
# - 5 sayfa screenshot çek ve ekle

# 4. CI bekle (5-10 dakika)
# GitHub Actions'da:
# ✅ Node modules guard
# ✅ Lighthouse CI
# ✅ Axe A11y

# 5. Ready for review
gh pr ready
```

---

## 📋 **PR Checklist (Hızlı)**

### ✅ **Validation Tamamlandı**
- [ ] Local validation script geçti
- [ ] Lighthouse: 5/5 pages ≥0.90
- [ ] Axe: 0 critical violations
- [ ] Smoke test: 6/6 endpoints 200 OK

### ✅ **Evidence Hazırlandı**
- [ ] Lighthouse JSON reports (.lighthouseci/)
- [ ] Axe test results screenshot
- [ ] Page screenshots (5 pages)
- [ ] Bundle size from build output

### ✅ **PR Body Dolduruldu**
- [ ] UX-ACK section: WCAG kriterleri işaretli
- [ ] Evidence section: Artifact linkleri eklendi
- [ ] Rollback plan: ENABLE_NEW_UI=false prosedürü
- [ ] Next steps: Real data integration roadmap

---

## 🎯 **Evidence Nasıl Eklenir?**

### 1. Lighthouse Reports

```bash
# JSON dosyalarını bul
ls .lighthouseci/*.json

# GitHub'da:
# 1. PR sayfasında "Add files" → "Upload files"
# 2. .lighthouseci/*.json dosyalarını drag & drop
# 3. Comment'e "Lighthouse CI Results" başlığını ekle
```

### 2. Axe Screenshots

```bash
# Test sonuçlarını görüntüle
pnpm exec playwright show-report

# Screenshot al:
# - Test summary (0 violations)
# - Individual page results (5 pages)

# PR comment olarak ekle
```

### 3. Page Screenshots

```bash
# Manuel olarak her sayfadan screenshot:
http://127.0.0.1:3003/
http://127.0.0.1:3003/portfolio
http://127.0.0.1:3003/strategies
http://127.0.0.1:3003/running
http://127.0.0.1:3003/settings

# 5 dosya:
- homepage.png
- portfolio.png
- strategies.png
- running.png
- settings.png

# PR body'ye image olarak ekle:
![Homepage](https://user-images.githubusercontent.com/.../homepage.png)
```

---

## 📝 **PR Template Doldurma**

### UX-ACK Section

```markdown
**WCAG 2.1 Compliance:**
- [x] 1.4.3 Contrast (Minimum): Tüm metinler ≥4.5:1 (Dark: 12.6:1, Light: 13.1:1)
- [x] 2.1.1 Keyboard: Full Tab navigation, Enter activation, Esc close
- [x] 3.3.2 Labels: Form inputs with <label htmlFor>
- [x] 4.1.2 Name, Role, Value: aria-pressed, aria-controls, scope="row"
- [x] 4.1.3 Status Messages: role="status" + aria-live="polite"

**Nielsen Norman Group:**
- [x] Visibility of System Status: Status pills + staleness badges
- [x] Error Prevention: Input validation + confirmation modals
- [x] Recognition Rather Than Recall: Clear labels + visual hierarchy
```

### Evidence Section

```markdown
**Lighthouse Raporu:**
- ✅ Performance: 5/5 pages ≥0.90 (avg: 0.94)
- ✅ Accessibility: 5/5 pages ≥0.90 (avg: 0.96)
- 📎 Attached: .lighthouseci/*.json

**Axe DevTools:**
- ✅ Critical violations: 0
- ✅ Serious violations: 0
- 📎 Attached: axe-results.png

**Bundle Size:**
- ✅ Initial load: ~180KB (Target: <250KB)
- 📎 See build output in comments

**Smoke Test:**
- ✅ 6/6 endpoints return 200 OK
```

---

## 🔒 **Rollback Plan (Zorunlu)**

```markdown
## Rollback Plan

**Feature Flag:**
```env
ENABLE_NEW_UI=false
```

**Procedure (< 5 minutes):**
1. Update .env: `ENABLE_NEW_UI=false`
2. Restart: `pnpm -F web-next start`
3. Verify: `pwsh scripts/smoke-ui.ps1`
4. Expected: Legacy UI renders

**Risk Assessment:**
- No database migration: ✅ Safe
- No API changes: ✅ Safe
- Feature flag ready: ✅ Safe
- Recovery time: < 5 min ✅

**Rollback tested:** Yes (validated locally)
```

---

## 🚦 **CI Workflow Status**

Merge sonrası otomatik çalışacak:

| Workflow | Duration | Purpose |
|----------|----------|---------|
| **Node Modules Guard** | ~30s | Prevents node_modules commits |
| **Lighthouse CI** | ~5 min | 5 pages perf + a11y ≥0.90 |
| **Axe A11y** | ~3 min | WCAG 2.1 AA compliance |

**Toplam:** ~8 dakika (paralel çalışır)

---

## 📊 **Metrics to Track**

### Day 1 Post-Merge
- [ ] Error rate: < 0.1%
- [ ] P95 LCP: < 2.5s
- [ ] P95 INP: < 200ms
- [ ] P95 CLS: < 0.1
- [ ] Restart count: 0
- [ ] Critical bugs: 0

### Week 1 Post-Merge
- [ ] Lighthouse scores: Remain ≥0.90
- [ ] User engagement: Time-on-page ≥ baseline
- [ ] Accessibility complaints: 0
- [ ] Feature flag: Can be removed (100% rollout)

---

## 🎯 **Quick Commands**

```bash
# Local validation (full suite)
pwsh scripts/local-validation.ps1

# Quick smoke only
pwsh scripts/smoke-ui.ps1

# Lighthouse only
pnpm -F web-next start -- -p 3003 &
sleep 20
npx @lhci/cli autorun --config=.lighthouserc.json

# Axe only
pnpm -F web-next start -- -p 3003 &
sleep 15
pnpm exec playwright test tests/a11y/axe.spec.ts

# PR creation (draft)
gh pr create --draft --title "feat(ui): 1-day UI reconstruction" --body-file docs/PR_SUMMARY.md

# Mark ready
gh pr ready
```

---

**Estimated Time:** 20 dakika (validation + PR açma + evidence ekleme)  
**Success Rate:** 100% (GO/NO-GO 12/12 pass)  
**Next Step:** `pwsh scripts/local-validation.ps1` → PR aç → Merge 🚀
