# PR-6 Final Checklist

**Status:** 🟢 HAZIR
**Branch:** `feat/pr6-matriks-p0-features`
**Date:** 29 Ekim 2025

---

## ✅ Hazır Dosyalar (20)

### Dokümanlar (8)
- [x] `docs/MATRIKS_FEATURES_MASTER_PLAN.md` — 3 PR master planı
- [x] `docs/PR_6_MATRIKS_FEATURES_P0.md` — PR-6 genel plan
- [x] `docs/PR_6_DETAILED_IMPLEMENTATION_PLAN.md` — 500+ satır detaylı
- [x] `docs/PR_6_CLEAN_PLACEHOLDER.md` — PR açıklaması
- [x] `docs/PR_6_SUMMARY.md` — Final özet + CI status
- [x] `docs/PR_7_MATRIKS_FEATURES_P0_PT2.md` — Layout + PWA planı
- [x] `docs/PR_8_MATRIKS_FEATURES_P1.md` — AI + Rule Builder planı
- [x] `docs/CI_COMMENT_TEMPLATE.md` — PR yorum şablonu

### CI/Test (7)
- [x] `.github/workflows/pr6-e2e.yml` — Canary-first 3 job
- [x] `apps/web-next/playwright.config.ts` — CI-aware config
- [x] `tests/e2e/pr6-matriks-features.spec.ts` — 15+ scenarios
- [x] `tests/e2e/smoke.dashboard.spec.ts` — Smoke tests
- [x] `tests/e2e/market.chart-trading.spec.ts` — Chart Trading tests
- [x] `apps/web-next/package.json` — Test scripts
- [x] Önceki CI dosyaları var

### Özet Raporlar (3)
- [x] `PR_6_COMPLETE_PACKAGE.md` — Master özet
- [x] `PR_6_HAZIR_PAKET_RAPORU.md` — Operasyonel rapor
- [x] `PR_6_FINAL_CHECKLIST.md` — Bu dosya

### Diğer (2)
- [x] `docs/PR_6_STRATEGY_LAB_PLAN.md` — Mevcut (eski)
- [x] `PR_6_UI_POLISH_SUMMARY.md` — Mevcut (eski)

---

## 🎯 Canary Pattern (Standard)

**6 Adım:**
1. Build web-next
2. Start (standalone-aware, port 3003)
3. UI health → `/api/healthz` (zorunlu)
4. Metrics → `/api/public/metrics.prom` (zorunlu)
5. Markets (soft) → executor, BIST, BTCTurk
6. Evidence upload → JSONs

**Soft Failure:**
- UI down → ❌ CI fail
- Metrics yok → ❌ CI fail
- Markets yok → ⚠️ Kanıt üretilir, CI kırılmaz

---

## 📋 PR Yorum Şablonu

```text
✅ CI: canary ✅ | build ✅ | e2e (4/4) ✅

Infra: ui ✅, metrics ✅
Markets: executor ⚠️, bist ⚠️, btcturk ⚠️

Evidence: ci-evidence-canary + pw-*
```

**Kullanım:** Kopyala → Statusleri güncelle → PR comment'e yapıştır

---

## 🚀 Sonraki Adımlar

### 1. Branch Aç
```bash
git checkout -b feat/pr6-matriks-p0-features
```

### 2. Dosyaları Commit & Push
```bash
git add .
git commit -m "feat(ci): PR-6 canary-first CI + Matriks features docs"
git push origin feat/pr6-matriks-p0-features
```

### 3. PR Aç
- PR Title: `feat(ui): PR-6 — Chart Trading + Session Widget + Alert Presets`
- Description: `docs/PR_6_CLEAN_PLACEHOLDER.md` içeriğini kopyala
- CI tetiklenir → Canary → Build → E2E (4 shard)

### 4. CI Tamamlandığında
PR comment'e şablonu yapıştır:
```text
✅ CI: canary ✅ | build ✅ | e2e (4/4) ✅
Infra: ui ✅, metrics ✅
Markets: executor ⚠️, bist ⚠️, btcturk ⚠️
Evidence: ci-evidence-canary + pw-*
```

### 5. Implementation Başlat
**Phase 1: Chart Trading** (2h)
- `ChartTradingPanel.tsx`
- `useChartTrading.ts`
- `/api/trade/place`

**Phase 2: Session Widget** (1.5h)
- `SessionMini.tsx`
- SSE wrapper
- `/api/stream/session`

**Phase 3: Alert Presets** (1.5h)
- `AlertPresets.tsx`
- Convert utility
- `/api/alerts/presets`

---

## 📊 Acceptance Criteria

### Chart Trading
- [ ] Grafik üstünden ≤3 sn'de limit/market emir
- [ ] TP/SL sürükle-bırak çalışır
- [ ] Hotkeys: B/S/Esc/Cmd+Enter
- [ ] Optimistic UI + undo (5 sn)

### Session Widget
- [ ] Widget ≤5 sn güncellenir (SSE)
- [ ] SSE koparsa exponential backoff
- [ ] Online/offline banner görünür

### Alert Presets
- [ ] Preset kaydet/yükle/sil
- [ ] Convert to Order tek tık
- [ ] localStorage persistence

---

## 🎓 Öğrenilen Pattern

**Canary-First Philosophy:**
- "Önce sistem yaşıyor mu?" → CI seviyesinde yanıtlanıyor
- Zorunlu checks → CI fail
- Optional checks → Soft failure (evidence toplanır)
- Her aşamada kanıt üretilir

**Genişletilebilirlik:**
- Yeni market reader → Canary'ye 1 satır ekle
- Evidence'e yaz → Pattern aynı kalır

**PR-7/PR-8 Template:**
- Canary pattern kopyala
- Markets satırını güncelle
- Done

---

## 📚 Referanslar

- Master Plan: `docs/MATRIKS_FEATURES_MASTER_PLAN.md`
- Implementation: `docs/PR_6_DETAILED_IMPLEMENTATION_PLAN.md`
- PR Body: `docs/PR_6_CLEAN_PLACEHOLDER.md`
- CI Template: `docs/CI_COMMENT_TEMPLATE.md`
- Next PRs: PR-7 (Layout + PWA), PR-8 (AI + Rule Builder)

---

**Status:** 🟢 HAZIR
**Philosophy:** Güvenlik > Doğruluk > Hız (canary-first)
**Evidence:** Her aşamada kanıt toplanır
**Template:** PR-7/PR-8 için hazır

**Evren tuhaf ama CI düzgün.** 🪐🟢

