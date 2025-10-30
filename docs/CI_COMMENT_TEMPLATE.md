# CI Comment Template (Reusable)

PR yorumlarında kullanılacak standart CI durum şablonu.

---

## PR-6 Format

```
✅ CI: canary ✅ | build ✅ | e2e (4/4) ✅

Infra: ui ✅, metrics ✅
Markets: executor ⚠️, bist ⚠️, btcturk ⚠️

Evidence: ci-evidence-canary + pw-*
```

---

## Explanation

**CI Jobs:**
- `canary`: Healthz + metrics + executor checks (5 dk)
- `build`: Monorepo build + standalone artifact (10 dk)
- `e2e (4/4)`: 2 browser × 2 shard, all passing

**Infra Status:**
- `ui ✅`: `/api/healthz` returns 200
- `metrics ✅`: `/api/public/metrics.prom` returns data

**Markets Status (Soft):**
- `executor ⚠️`: Executor not available in CI (expected)
- `bist ⚠️`: BIST reader endpoint not responding
- `btcturk ⚠️`: BTCTurk reader endpoint not responding

**Evidence Artifacts:**
- `ci-evidence-canary`: healthz, metrics, executor, bist, btcturk JSONs
- `pw-*`: Playwright reports (4 shards)

---

## Usage in PR Comments

Bu şablonu her PR'da kullan:

1. CI tamamlandığında → Template'i kopyala
2. Statusleri güncelle (✅/⚠️/❌)
3. PR comment'e yapıştır

Reviewer 30 saniyede:
- CI geçti mi? ✅
- Hangi service'ler var? ✅
- Hangi service'ler eksik? ⚠️
- Evidence nerede? ci-evidence-*

---

## Template Variations

### Minimal (Fast PRs)
```
CI: ✅✅✅ | Evidence: ci-evidence-*
```

### Detailed (Complex PRs)
```
CI: canary ✅ | build ✅ | e2e (4/4) ✅
Infra: ui ✅, metrics ✅
Markets: executor ⚠️, bist ⚠️, btcturk ⚠️
Evidence: ci-evidence-canary + pw-chromium-* + pw-firefox-*
```

---

**Usage:** Copy-paste into PR comment after CI completion

