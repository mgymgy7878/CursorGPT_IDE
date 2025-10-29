# Spark Trading — PR Merge Gating Guide

## 🚦 Merge Sırası (Dependency Order)

```
PR-1 → PR-3 → PR-2 → PR-4
```

**Mantık:**

1. **PR-1:** Nav + i18n infrastructure (temel)
2. **PR-3:** Strategy Lab tabs + redirect (PR-1'e bağımlı)
3. **PR-2:** Copilot Dock (bağımsız, ama PR-1/PR-3 i18n'i kullanır)
4. **PR-4:** Final i18n + A11y CI (hepsini test eder)

---

## ✅ PR-1 Merge Checklist

### Pre-Merge

- [ ] Branch: `feat/ui-ia-pr1-nav-i18n`
- [ ] Typecheck: PASS
- [ ] Build: Run `pnpm --filter web-next build`
- [ ] Visual check: 5 nav items (Anasayfa, Strateji Lab, Stratejilerim, Çalışan, Ayarlar)

### Mini-Smoke (PowerShell)

```powershell
# Health checks
(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3003/dashboard).StatusCode
# Beklenen: 200

(Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/healthz).StatusCode
# Beklenen: 200

# Navigation check
$html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content
$html -match 'Anasayfa' -and $html -match 'Strateji Lab'
# Beklenen: True
```

### Post-Merge

- [ ] Main'e merge
- [ ] Delete branch
- [ ] Local: `git checkout main && git pull`

---

## ✅ PR-3 Merge Checklist

### Pre-Merge

- [ ] Branch: `feat/ui-ia-pr3-strategy-lab`
- [ ] Base: main (PR-1 merged)
- [ ] Typecheck: PASS
- [ ] Build: Run `pnpm --filter web-next build`

### Mini-Smoke (PowerShell)

```powershell
# Strategy Lab tabs
$html = (Invoke-WebRequest http://127.0.0.1:3003/strategy-lab).Content
$html -match 'Üret' -and $html -match 'Backtest' -and $html -match 'Optimizasyon' -and $html -match 'Dağıt'
# Beklenen: True

# Redirect test
$response = Invoke-WebRequest -UseBasicParsing -MaximumRedirection 0 http://127.0.0.1:3003/backtest -ErrorAction SilentlyContinue
$response.StatusCode
# Beklenen: 200 (client-side redirect) veya 302/307 (server-side)

$redirectHtml = (Invoke-WebRequest http://127.0.0.1:3003/backtest).Content
$redirectHtml -match 'Yönlendiriliyor'
# Beklenen: True
```

### Post-Merge

- [ ] Main'e merge
- [ ] Delete branch
- [ ] Test: /backtest otomatik redirect
- [ ] Test: Strategy Lab 4 sekme görünür

---

## ✅ PR-2 Merge Checklist

### Pre-Merge

- [ ] Branch: `feat/ui-ia-pr2-copilot`
- [ ] Base: main (PR-1 + PR-3 merged)
- [ ] Typecheck: PASS
- [ ] Build: Run `pnpm --filter web-next build`

### Mini-Smoke (PowerShell)

```powershell
# Copilot button check
$html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content
$html -match 'Copilot'
# Beklenen: True

# Sidebar width
$html -match 'w-\[72px\]' -or $html -match 'w-\[224px\]'
# Beklenen: True (responsive classes)

# i18n StatusBar
$html -match 'Koruma Doğrulama'
# Beklenen: True
```

### Post-Merge

- [ ] Main'e merge
- [ ] Delete branch
- [ ] Test: Ctrl+K Copilot açar
- [ ] Test: Sidebar 72px/224px responsive

---

## ✅ PR-4 Merge Checklist

### Pre-Merge

- [ ] Branch: `feat/ui-ia-pr4-i18n-a11y`
- [ ] Base: main (all previous PRs merged)
- [ ] Typecheck: PASS
- [ ] Build: Run `pnpm --filter web-next build`

### Mini-Smoke (PowerShell)

```powershell
# Translation completeness
$html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content

# Karma dil check (should be minimal/none)
$englishMatches = ([regex]::Matches($html, '\b(Dashboard|Strategy Lab|Audit|Portfolio|Settings|Commands)\b')).Count
Write-Host "English words found: $englishMatches (target: <5)"

# i18n keys present
$html -match 'Anasayfa' -and $html -match 'Strateji Lab'
# Beklenen: True
```

### Post-Merge

- [ ] Main'e merge
- [ ] Delete branch
- [ ] CI: Axe + Lighthouse workflow çalışır
- [ ] Review: Accessibility report

---

## 🧪 Comprehensive Smoke (After All Merges)

```powershell
# 1. Health checks
$tests = @{
  "Web root" = "http://127.0.0.1:3003/"
  "Dashboard" = "http://127.0.0.1:3003/dashboard"
  "Strategy Lab" = "http://127.0.0.1:3003/strategy-lab"
  "Backtest redirect" = "http://127.0.0.1:3003/backtest"
  "Executor health" = "http://127.0.0.1:4001/healthz"
}

$results = @()
foreach ($name in $tests.Keys) {
  try {
    $status = (Invoke-WebRequest -UseBasicParsing $tests[$name] -TimeoutSec 5).StatusCode
    $results += "✅ $name : $status"
  } catch {
    $results += "❌ $name : FAIL"
  }
}

$results | Out-File evidence/merge_smoke_results.txt
$results

# 2. i18n check
$html = (Invoke-WebRequest http://127.0.0.1:3003/dashboard).Content
$trWords = @('Anasayfa', 'Strateji Lab', 'Stratejilerim', 'Çalışan Stratejiler', 'Ayarlar', 'Koruma Doğrulama')
$found = 0
foreach ($word in $trWords) {
  if ($html -match $word) { $found++ }
}
Write-Host "TR words found: $found / $($trWords.Count) (target: $($trWords.Count))"

# 3. Copilot check (manual)
Write-Host "`n⌨️  Manual test: Press Ctrl+K on /dashboard (should open Copilot in 'analysis' mode)"
Write-Host "⌨️  Manual test: Press Ctrl+K on /strategy-lab (should open Copilot in 'strategy' mode)"
```

**Expected Output:**

```
✅ Web root : 200
✅ Dashboard : 200
✅ Strategy Lab : 200
✅ Backtest redirect : 200
✅ Executor health : 200

TR words found: 6 / 6 (target: 6)

⌨️  Manual test: Press Ctrl+K ...
```

---

## 🔧 Son Rötuşlar (Quick Patches)

### 1. Dashboard İç Liste i18n

```typescript
// apps/web-next/src/app/dashboard/page.tsx
// Find: "Dashboard", "Strategy Lab", "Audit", "Portfolio", "Settings"
// Replace with: t('dashboard'), t('strategyLab'), t('audit'), t('strategies'), t('settings')
```

### 2. Tema Satırı Temizliği

```typescript
// Mevcut: "Gün ışığı (Auto) ✓ (light)"
// Önerilen: "Gün ışığı (Otomatik)" veya "Sistem (Aydınlık)"
```

### 3. Status Pill Mapping

```typescript
// StatusPills component already uses i18n ✅
// But health status → color mapping needs verification:

// apps/web-next/src/components/layout/StatusPills.tsx
const feedTone =
  feed === "Healthy" ? "success" : feed === "Degraded" ? "warn" : "danger";
const brokerTone = broker === "Online" ? "success" : "warn";
```

---

## 📋 Regresyon Matrix (Minimal Set)

| Test      | Command                                  | Expected              | Risk     |
| --------- | ---------------------------------------- | --------------------- | -------- |
| Redirect  | `curl -I http://127.0.0.1:3003/backtest` | 200 or 302            | PR-3     |
| Hotkey    | Manual Ctrl+K                            | Copilot opens         | PR-2     |
| i18n      | Check page HTML                          | No "Dashboard" string | PR-1/4   |
| WS        | Disconnect/reconnect                     | Signal color updates  | Existing |
| Tab order | Manual Tab key                           | Visual order matches  | A11y     |

---

## 🎯 Kabul Kriterleri (Post-Merge)

### Navigation ✅

- [ ] 5 PRIMARY items görünür
- [ ] Aktif sayfa mavi highlight
- [ ] Keyboard navigation (↑/↓/Enter)
- [ ] aria-current="page" doğru

### Strategy Lab ✅

- [ ] 4 sekme: Üret, Backtest, Optimizasyon, Dağıt
- [ ] URL param (?tab=\*) çalışıyor
- [ ] /backtest redirect çalışıyor
- [ ] State sekmeler arası korunuyor

### Copilot ✅

- [ ] Sağ-alt FAB görünür
- [ ] Ctrl/Cmd+K açar/kapar
- [ ] Context-aware mode (Strategy Lab: strategy)
- [ ] 3 mode butonu çalışıyor

### i18n ✅

- [ ] 41 translation key
- [ ] TR default working
- [ ] Karma dil <5%
- [ ] Missing key fallback yok

### A11y ✅

- [ ] Lighthouse Accessibility ≥90
- [ ] Axe critical/serious = 0
- [ ] Keyboard navigation tam
- [ ] Focus ring visible

---

## 🚀 Merge Sonrası Eylemler

### Immediate

1. **Main branch'i pull:**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Clean rebuild:**

   ```bash
   pnpm --filter web-next clean
   pnpm install
   pnpm --filter web-next build
   ```

3. **Restart services:**
   ```bash
   pnpm --filter @spark/executor dev  # Terminal 1
   pnpm --filter web-next dev          # Terminal 2
   ```

### Validation

1. **Run comprehensive smoke:**

   ```powershell
   .\tools\smoke\comprehensive-smoke.ps1
   ```

2. **Manual visual check:**
   - Dashboard: 5 nav items, TR labels
   - Strategy Lab: 4 tabs, redirect works
   - Copilot: FAB visible, Ctrl+K works
   - Settings: Theme text clean

3. **CI check:**
   - Axe + Lighthouse workflow triggered
   - Review artifacts

---

## 📝 Quick Patch Script

### Son Rötuşlar (Opsiyonel)

```powershell
# Create quick-patch branch
git checkout -b chore/post-merge-polish

# 1. Dashboard iç liste i18n (if needed)
# 2. Tema metni temizliği
# 3. Status pill mapping verification

git commit -m "chore: post-merge polish - dashboard i18n, theme text"
git push -u origin chore/post-merge-polish
```

---

## ✅ Başarı Metrikleri

### Technical

- [ ] Typecheck: PASS
- [ ] Build: PASS
- [ ] All services: Running
- [ ] No console errors

### UX

- [ ] Navigation: Intuitive
- [ ] i18n: Consistent
- [ ] Copilot: Accessible
- [ ] Strategy Lab: Clear workflow

### Quality

- [ ] Lighthouse A11y: ≥90
- [ ] Axe critical: 0
- [ ] Translation coverage: 100%
- [ ] Karma dil: <5%

---

**Guide Versiyonu:** 1.0
**Tarih:** 29 Ekim 2025
**Durum:** ✅ Hazır
