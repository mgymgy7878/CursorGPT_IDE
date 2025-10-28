# V1.3-P4 PR Manuel Checklist

## ✅ DURUM

- **Jest:** 29/29 PASS ✅
- **i18n:** 40 keys OK ✅  
- **TypeCheck:** 5 WS TS hataları (P5 kapsamı) 🟡
- **Karar:** P4 PR = **GO** ✅

---

## 📋 P4 PR KOMUTLARI (PowerShell)

```powershell
# P4 Branch oluştur
git checkout -b feature/v1.3-p4-health-viz

# P4 dosyalarını stage et
git add apps/web-next/jest.config.js `
        apps/web-next/src/lib/health.ts `
        apps/web-next/src/lib/health.test.ts `
        apps/web-next/src/components/ui/DataModeBadge.tsx `
        apps/web-next/src/components/dashboard/DraftsBadge.tsx `
        apps/web-next/package.json

# Commit (mesaj hazır)
git commit -F docs/releases/v1.3-p4/V1.3-P4_COMMIT.md

# Push
git push origin feature/v1.3-p4-health-viz
```

---

## 📝 P4 PR DETAYLARI

**Başlık:**
```
V1.3-P4 • Health Visualization (Core + Quick Wins)
```

**Body:**
```
✅ 29/29 test PASS • ✅ 40 i18n keys OK • ✅ P4 dosyaları typecheck temiz
🟡 WS TS hataları (5 adet) P5 kapsamına alındı: exponential backoff + 2s throttle + TS=0
✨ Quick wins: DataModeBadge & DraftsBadge → StatusBadge
📸 /portfolio & /alerts önce/sonra
🚦 CI (blocker): typecheck (WS hariç), test, i18n:check
🔀 Merge: Squash & merge
```

**CI Gates (blocker):**
- ✅ `pnpm --filter web-next test` (29/29 PASS)
- ✅ `pnpm --filter web-next run i18n:check` (40 keys OK)
- 🟡 `pnpm --filter web-next typecheck` (WS hataları P5'te çözülecek - P4 dışı)

---

## 🚀 P5 BAŞLATMA KOMUTLARI

```powershell
# P5 Branch oluştur
git checkout -b feature/v1.3-p5-health-viz-migration
```

**Cursor Prompt:** `docs/releases/V1.3-P5_PROMPT.md`

---

## 🎯 P5 DoD (Definition of Done)

- [ ] **Migration:** Eski chip/badge = 0  
  - `grep -r "import.*Chip" --include="*.tsx" apps/web-next/src` → 0 results (StatusBadge haricinde)
  
- [ ] **Health Wiring:**  
  - `getHealthStatus()` + `StatusBadge` → CanaryCard & HealthSummary
  
- [ ] **WS Cleanup:**  
  - Exponential backoff + 2s log throttle
  - TS error = 0
  - Reconnect warn ≥%50 azaltma
  
- [ ] **CI Gates:**  
  - typecheck = 0
  - jest PASS
  - i18n OK
  - build PASS

---

## 📊 P4 DEĞIŞEN DOSYALAR

```
apps/web-next/jest.config.js                      (NEW)
apps/web-next/src/lib/health.ts                    (NEW)
apps/web-next/src/lib/health.test.ts               (NEW)
apps/web-next/src/components/ui/DataModeBadge.tsx  (MODIFIED)
apps/web-next/src/components/dashboard/DraftsBadge.tsx (MODIFIED)
apps/web-next/package.json                         (MODIFIED - devDeps)
```

**Toplam:** 6 dosya (3 yeni, 3 değişiklik)

---

## 🔍 ÖNCEKİ DURUM vs ŞİMDİKİ DURUM

### DataModeBadge
**Önce:**
```tsx
<div className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm ${isReal ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-400"}`}>
  Data: {isReal ? 'Real' : 'Mock'}
</div>
```

**Şimdi:**
```tsx
<StatusBadge
  status={isReal ? 'success' : 'warn'}
  label={`Data: ${isReal ? 'Real' : 'Mock'}`}
/>
```

### DraftsBadge
**Önce:**
```tsx
<div className={`inline-flex items-center rounded-md px-2 py-0.5 text-sm ${count >= 5 ? "bg-yellow-500/15 text-yellow-400" : "bg-gray-500/15 text-gray-400"}`}>
  Drafts: {count}
</div>
```

**Şimdi:**
```tsx
<StatusBadge
  status={count >= 5 ? 'warn' : 'neutral'}
  label={`Drafts: ${count}`}
/>
```

---

## ✅ MANUEL AKSIYON

1. **PowerShell'de yukarıdaki P4 PR komutlarını çalıştır**
2. **GitHub'da PR aç (başlık ve body hazır)**
3. **/portfolio ve /alerts sayfalarının ekran görüntülerini PR'a ekle**
4. **P5 branch'i oluştur**
5. **Cursor'a `docs/releases/V1.3-P5_PROMPT.md` dosyasını yükle**

---

**HAZIR ✅** - P4 PR manuel aç → P5'e geç
