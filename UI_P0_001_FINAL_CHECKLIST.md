# UI-P0-001: Final Checklist - PR Açmadan Önce

**Durum:** ✅ Geliştirme Tamamlandı - Test & PR Aşaması
**Branch:** `ui-ux/ui-p0-001-dashboard-skeleton`
**Tarih:** 26.11.2025

---

## ✅ Tamamlananlar (DoD - Kod + Test + Doküman + Ritüel)

### Component Katmanı
- [x] `DashboardSkeleton.tsx` - Loading state
- [x] `DashboardEmptyState.tsx` - Empty state
- [x] `DashboardErrorState.tsx` - Error state

### Sayfa Katmanı
- [x] State yönetimi (`loading / error / empty / success`)
- [x] API fetch logic (strategies + portfolio)
- [x] Shell sürekliliği (LeftNav + CopilotDock)

### Test & Telemetri
- [x] `dashboard-states.spec.ts` - 6 E2E senaryo
- [x] `useDashboardTelemetry.ts` - Telemetry hook

### Dokümantasyon & Ritüel
- [x] `UI_UX_MANUAL_TEST_SCENARIOS.md` - Manuel test rehberi
- [x] `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` - PR şablonu
- [x] `.github/PR_CHECKLIST_UI_P0.md` - PR checklist
- [x] `docs/UI_UX_P0_TEMPLATE.md` - Sonraki P0'lar için şablon

---

## 🔄 Operasyon Aşaması (Yapılacaklar)

### 1. Komutlar (Local Doğrulama)

```bash
# Type check
pnpm --filter web-next typecheck

# Lint
pnpm --filter web-next lint

# E2E test
pnpm --filter web-next test:e2e tests/e2e/dashboard-states.spec.ts
```

**Kontrol:**
- [ ] Type check geçti (hata yok)
- [ ] Lint geçti (hata yok)
- [ ] E2E testler geçti (6 senaryo)

---

### 2. Manual & A11y Test

**Doküman:** `docs/UI_UX_MANUAL_TEST_SCENARIOS.md`

**Test Senaryoları:**

#### Loading State
- [ ] Dev server başlatıldı (`pnpm --filter web-next dev`)
- [ ] Network throttling: Slow 3G
- [ ] Dashboard'a git
- [ ] Skeleton görünüyor
- [ ] `aria-busy="true"` var
- [ ] `aria-live="polite"` var

#### Empty State
- [ ] Boş strateji listesi mock'landı (veya gerçek kullanıcı)
- [ ] Dashboard'a git
- [ ] "Henüz strateji yok" mesajı görünüyor
- [ ] "Strateji Oluştur" butonu görünüyor ve çalışıyor
- [ ] "Stratejileri Görüntüle" butonu görünüyor ve çalışıyor
- [ ] Tab ile butonlara ulaşılabiliyor
- [ ] Focus ring görünür

#### Error State
- [ ] API 500 error mock'landı (veya network offline)
- [ ] Dashboard'a git
- [ ] "Bir hata oluştu" mesajı görünüyor
- [ ] "Tekrar Dene" butonu görünüyor
- [ ] `role="alert"` var
- [ ] Retry butonu çalışıyor

#### Klavye Navigasyonu
- [ ] Tab ile tüm butonlara ulaşılabiliyor
- [ ] Shift+Tab ile geri gidilebiliyor
- [ ] Enter/Space ile butonlar tetikleniyor
- [ ] Focus ring her zaman görünür

**Kontrol:**
- [ ] Tüm manuel testler geçti

---

### 3. Lighthouse & Axe

#### Lighthouse
- [ ] Chrome DevTools → Lighthouse → Accessibility
- [ ] Score: ≥ 90
- [ ] Screenshot alındı

#### Axe DevTools
- [ ] Chrome DevTools → Axe DevTools → Scan
- [ ] Critical violations: 0
- [ ] Screenshot veya metin çıktısı alındı

**Kontrol:**
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Axe Critical = 0
- [ ] Screenshot'lar hazır

---

### 4. Evidence Set

**Gereken Screenshot'lar:**

- [ ] **Before:** Mevcut durum (boş beyaz ekran - eğer varsa)
- [ ] **After - Loading:** Skeleton state (tüm kartlar skeleton)
- [ ] **After - Empty:** Boş durum ekranı (mesaj + butonlar)
- [ ] **After - Error:** Hata durumu (mesaj + retry butonu)
- [ ] **Lighthouse:** Accessibility Score ≥ 90 ekran görüntüsü
- [ ] **Axe:** Critical violations = 0 ekran görüntüsü veya metin

**Kontrol:**
- [ ] Tüm screenshot'lar hazır

---

### 5. Git & PR

#### Git İşlemleri

```bash
# Değişiklikleri kontrol et
git status
git diff

# Commit
git add .
git commit -m "UI-P0-001: Dashboard skeleton & empty/error states

- Skeleton component eklendi (DashboardSkeleton.tsx)
- Empty state component eklendi (DashboardEmptyState.tsx)
- Error state component eklendi (DashboardErrorState.tsx)
- Dashboard page state yönetimi eklendi
- Telemetry hook eklendi (useDashboardTelemetry.ts)
- E2E testler eklendi (dashboard-states.spec.ts)
- A11y iyileştirmeleri (aria-busy, aria-live, role=alert)

UI/UX Talimatları §3.1 P0 maddeleri karşılandı.

Closes #<issue-num>"

# Push
git push -u origin ui-ux/ui-p0-001-dashboard-skeleton
```

**Kontrol:**
- [ ] Git commit yapıldı
- [ ] Branch push edildi

#### PR Açma

**GitHub'da:**
1. New Pull Request
2. Base: `main` (veya ilgili branch)
3. Compare: `ui-ux/ui-p0-001-dashboard-skeleton`

**Başlık:**
```
UI-P0-001: Dashboard skeleton & empty/error states
```

**Body:**
- `.github/PULL_REQUEST_TEMPLATE_UI_P0_001.md` içeriğini kopyala
- Tüm alanları doldur:
  - [x] Özet
  - [x] Yapılan Değişiklikler
  - [x] UI/UX Talimatları Uyumu
  - [x] Testler
  - [x] Evidence (screenshot'lar eklendi)
  - [x] İlgili Issue (`Closes #<issue-num>`)

**Label'lar:**
- [ ] `ui-ux`
- [ ] `ui-ux:p0`
- [ ] `area:dashboard`

**Kontrol:**
- [ ] PR açıldı
- [ ] PR template dolduruldu
- [ ] Evidence eklendi
- [ ] Issue bağlandı

---

## ✅ Final Definition of Done

### Kod
- [x] Component'ler oluşturuldu
- [x] State yönetimi eklendi
- [x] A11y iyileştirmeleri yapıldı
- [ ] Type check geçti
- [ ] Lint geçti

### Test
- [x] E2E testler yazıldı
- [ ] E2E testler geçti
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
- [ ] Issue bağlandı

---

## 🎯 Sistem Açısından Önemi

Bu PR merge olduğu anda:

1. **UI/UX Pipeline Kanıtlandı:**
   - Issue → branch → component/state/test → manual scenarios → Lighthouse/Axe → PR template + evidence
   - Tüm adımlar tek bir iş üzerinde doğrulandı

2. **Golden Sample Oluştu:**
   - UI-P0-001, sonraki P0 işleri için referans
   - Pattern'ler kopyalanabilir
   - Ritüel standartlaştı

3. **Sistem Prod'da:**
   - UI/UX sistemi "kağıt üzerinde" değil, git history'de kanıtlanmış
   - Sonraki P0/P1 işleri aynı raylarda ilerleyecek

---

## 📚 Sonraki Adım

**UI-P0-002: Strategy Lab skeleton + empty/error states**

**Yaklaşım:**
> UI-P0-001 şablonunu birebir kopyalayarak başlat.

**Referans:**
- [UI_UX_P0_TEMPLATE.md](./docs/UI_UX_P0_TEMPLATE.md)
- UI-P0-001 (Golden sample)

---

**Son Güncelleme:** 26.11.2025
**Durum:** ✅ PR Açılmaya Hazır - Test & Evidence Bekleniyor

