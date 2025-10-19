# V1.3-P4 → P5 Geçiş Hazır

**Tarih:** 2025-10-18  
**Durum:** 🟢 **GO** ✅

---

## 📊 SMOKE TEST SONUÇLARI

| Test | Durum | P4 Impact |
|------|-------|-----------|
| **Jest** | ✅ 29/29 PASS | ✅ GREEN |
| **i18n** | ✅ 40 keys OK | ✅ GREEN |
| **TypeCheck** | 🟡 5 WS errors | 🟢 P5 kapsamı |
| **Dev Server** | ✅ :3003 stabil | ✅ GREEN |

**P4 PR:** 🟢 **GO** ✅

---

## 📋 P4 PR KOMUTLARI (PowerShell - Kopyala/Yapıştır)

```powershell
# 1. P4 Branch
git checkout -b feature/v1.3-p4-health-viz

# 2. Stage P4 dosyaları
git add apps/web-next/jest.config.js `
        apps/web-next/src/lib/health.ts `
        apps/web-next/src/lib/health.test.ts `
        apps/web-next/src/components/ui/DataModeBadge.tsx `
        apps/web-next/src/components/dashboard/DraftsBadge.tsx `
        apps/web-next/package.json

# 3. Commit (mesaj hazır)
git commit -F docs/releases/v1.3-p4/V1.3-P4_COMMIT.md

# 4. Push
git push origin feature/v1.3-p4-health-viz
```

---

## 📝 P4 PR (GitHub)

**Başlık:**
```
V1.3-P4 • Health Visualization (Core + Quick Wins)
```

**Body (Kopyala/Yapıştır):**
```
✅ 29/29 test PASS • ✅ 40 i18n keys OK • ✅ P4 dosyaları typecheck temiz
🟡 WS TS hataları (5) P5 kapsamı: exponential backoff + 2s throttle + TS=0
✨ Quick wins: DataModeBadge & DraftsBadge → StatusBadge
📸 /portfolio & /alerts önce/sonra
🚦 CI (blocker): typecheck (WS hariç), test, i18n:check
🔀 Merge: Squash & merge
```

**Ekle:**
- 📸 `/portfolio` (StatusBadge - önce/sonra)
- 📸 `/alerts` (StatusBadge - önce/sonra)

**Merge Stratejisi:** Squash & merge

---

## 🚀 P5 BAŞLATMA

```powershell
# P5 Branch oluştur
git checkout -b feature/v1.3-p5-health-viz-migration
```

**Cursor Prompt:** `docs/releases/V1.3-P5_PROMPT.md`

**Akış:** PATCH → SMOKE TEST → SUMMARY

---

## 🎯 P5 DoD (Definition of Done)

### Migration
- [ ] Eski chip/badge = 0
- [ ] SLOChip → StatusBadge
- [ ] `grep -r "import.*Chip" --include="*.tsx" apps/web-next/src` → 0 (StatusBadge hariç)

### Health Wiring
- [ ] `getHealthStatus()` + `StatusBadge` → CanaryCard
- [ ] `getHealthStatus()` + `StatusBadge` → HealthSummary

### WS Cleanup
- [ ] Exponential backoff logic
- [ ] 2s log throttle
- [ ] TS error = 0 (5 WS hatası çözülecek)
- [ ] Reconnect uyarıları ≥%50 azaltma

### CI Gates
- [ ] typecheck = 0
- [ ] jest PASS
- [ ] i18n OK
- [ ] build PASS

---

## 📦 P4 ARTEFAKTLAR

✅ `docs/releases/v1.3-p4/V1.3-P4_COMMIT.md` (commit mesajı)  
✅ `docs/releases/v1.3-p4/P4_PR_MANUAL_CHECKLIST.md` (checklist)  
✅ `docs/releases/v1.3-p4/P4_FINAL_SMOKE_RESULTS.md` (smoke test)  
✅ `docs/releases/v1.3-p4/P4_TO_P5_TRANSITION_READY.md` (bu dosya)

---

## 📦 P5 ARTEFAKTLAR

✅ `docs/releases/V1.3-P5_PROMPT.md` (P5 prompt - HAZIR)  
✅ `docs/releases/V1.3_RELEASE_NOTES.md` (release notes)

---

## ✅ MANUEL AKSİYON

1. **PowerShell'de P4 git komutlarını çalıştır**
2. **GitHub'da P4 PR aç** (başlık + body + screenshots)
3. **P5 branch'i oluştur**
4. **Cursor'a P5 promptu yükle**

---

## 🔒 KİLİTLENDİ

**P4 PR:** 🟢 GO → Squash & merge  
**P5:** 🟢 HAZIR → PATCH → SMOKE → SUMMARY

**Sonraki adım:** P4 PR manuel aç → P5'e geç 🚀

