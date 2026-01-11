# UI-P0-001: PR Öncesi Final Adımlar

**Durum:** ✅ Teknik Taraf Tamamlandı - PR Açılmaya Hazır
**Tarih:** 26.11.2025
**Branch:** `ui-ux/ui-p0-001-dashboard-skeleton`

---

## ✅ Teknik Cephe: Tamamlandı

### Kod
- [x] Skeleton / Empty / Error component'leri
- [x] Dashboard state machine (`loading / error / empty / success`)
- [x] `response.ok` tabanlı error handling
- [x] A11y (aria-busy, aria-live, role="alert", focus)

### Test
- [x] `typecheck` geçti
- [x] `lint` geçti (sadece warning, kritik yok)
- [x] 6/6 Playwright E2E senaryosu geçti

**Bu, P0 için beklenen "motor seviyesi kalite".**

---

## 🔄 PR Öncesi Minimum Set

### A. Manuel Tur (Çok Kısa)

**Komut:**
```bash
pnpm --filter web-next dev
```

**Test Senaryoları:** `docs/UI_UX_MANUAL_TEST_SCENARIOS.md`

- [ ] **Loading State:**
  - Network throttling: Slow 3G
  - Dashboard'a git
  - Skeleton görünüyor mu?
  - `aria-busy="true"` var mı?

- [ ] **Empty State:**
  - Boş strateji listesi (mock veya gerçek kullanıcı)
  - "Henüz strateji yok" mesajı görünüyor mu?
  - CTA butonları çalışıyor mu?
  - Tab ile navigasyon çalışıyor mu?

- [ ] **Error State:**
  - Network offline veya 500 error
  - "Bir hata oluştu" mesajı görünüyor mu?
  - Retry butonu çalışıyor mu?
  - `role="alert"` var mı?

- [ ] **Success State:**
  - Normal dashboard içeriği görünüyor mu?
  - Klavye navigasyonu çalışıyor mu?

**Checklist'te işaretle → bitti.**

---

### B. Lighthouse & Axe

**Lighthouse:**
- [ ] Chrome DevTools → Lighthouse → **Accessibility** (Desktop)
- [ ] Hedef: **≥ 90**
- [ ] Screenshot al

**Axe DevTools:**
- [ ] Chrome DevTools → Axe DevTools → Scan
- [ ] Hedef: **Critical = 0**
- [ ] Screenshot al

**İkisi için birer screenshot yeter, PR'da "Evidence" bölümüne iliştir.**

---

### C. Screenshot Paketi (Minimum Viable Set)

**En azından:**

1. [ ] **Loading (skeleton)** - Skeleton state ekran görüntüsü
2. [ ] **Empty** - Boş durum ekran görüntüsü
3. [ ] **Error** - Hata durumu ekran görüntüsü
4. [ ] **Lighthouse sonucu** - Accessibility Score ≥ 90
5. [ ] **Axe sonucu** - Critical violations = 0

**Success ekranı opsiyonel ama hoş olur.**

---

### D. Git & PR

#### Git İşlemleri

```bash
# Değişiklikleri kontrol et
git status
git diff   # Burada anormallik var mı diye bir bakış at

# Commit
git add .
git commit -m "UI-P0-001: Dashboard skeleton & empty/error states

- Skeleton component eklendi (DashboardSkeleton.tsx)
- Empty state component eklendi (DashboardEmptyState.tsx)
- Error state component eklendi (DashboardErrorState.tsx)
- Dashboard page state yönetimi eklendi
- Error handling iyileştirildi (response.ok kontrolü)
- Telemetry hook eklendi (useDashboardTelemetry.ts)
- E2E testler eklendi (dashboard-states.spec.ts - 6/6 passed)
- A11y iyileştirmeleri (aria-busy, aria-live, role=alert)

UI/UX Talimatları §3.1 P0 maddeleri karşılandı.

Closes #<issue-num>"

# Push
git push -u origin ui-ux/ui-p0-001-dashboard-skeleton
```

#### GitHub PR Açma

**Başlık:**
```
UI-P0-001: Dashboard skeleton & empty/error states
```

**Body:**
- `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` içeriğini **tam doldur**
- Özellikle şu kısmı unutma: `Closes #<issue-num>` → gerçek issue ID ile

**Label'lar:**
- [ ] `ui-ux`
- [ ] `ui-ux:p0`
- [ ] `area:dashboard`

**Evidence:**
- Screenshot'ları PR'a ekle (Loading, Empty, Error, Lighthouse, Axe)

---

## 🎯 Bu PR Merge Olduğunda

1. **UI/UX Pipeline Kanıtlandı:**
   - Sadece "tasarlanmış" değil, **git history'de kanıtlanmış bir ritüel**

2. **Golden Sample Oluştu:**
   - `UI_UX_P0_TEMPLATE.md` + bu PR = Strategy Lab / Portfolio / Market için **kopyalanabilir P0 fabrikası**

3. **Sonraki P0'lar:**
   - UI-P0-002'de sadece aynı rayları Strategy Lab'e taşımak kalıyor

---

## 📋 Final Checklist

### Teknik
- [x] Kod tamamlandı
- [x] Testler geçti (E2E 6/6)
- [x] Type check geçti
- [x] Lint geçti

### Manuel & A11y
- [ ] Manuel testler yapıldı
- [ ] Lighthouse ≥ 90
- [ ] Axe Critical = 0

### Evidence
- [ ] Screenshot'lar hazır
- [ ] Lighthouse raporu hazır
- [ ] Axe sonucu hazır

### PR
- [ ] Git commit & push yapıldı
- [ ] PR açıldı
- [ ] PR template dolduruldu
- [ ] Evidence eklendi
- [ ] Issue bağlandı (`Closes #<issue-num>`)

---

**Son Güncelleme:** 26.11.2025
**Durum:** ✅ PR Açılmaya Hazır - Manuel Test & Evidence Bekleniyor

