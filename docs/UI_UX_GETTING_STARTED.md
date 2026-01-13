# UI/UX Sistemi - Başlangıç Kontrol Listesi

Bu doküman, UI/UX sistemini kullanmaya başlamak için yapılması gereken tüm adımları içerir.

---

## ✅ Sistem Durumu

**Durum:** ✅ **TAMAMLANDI** - Uygulama aşamasına geçildi

**Doküman Seti:** 7 doküman hazır
**Template'ler:** PR, Issue, Epic hazır
**Implementation Guide:** Kod örnekleri hazır

---

## 🚀 Başlangıç Adımları

### Adım 1: GitHub Hazırlığı (20 dakika)

#### 1.1 Label'ları Oluştur

GitHub → Settings → Labels → New label

**Zorunlu Label'lar:**

| Label | Açıklama | Renk | Durum |
|-------|----------|------|-------|
| `ui-ux` | UI/UX geliştirmeleri - docs/UI_UX_TALIMATLAR_VE_PLAN.md | `#8B5CF6` | [ ] |
| `ui-ux:p0` | Kritik UI/UX - P0 checklist maddeleri | `#EF4444` | [ ] |
| `ui-ux:p1` | Önemli UI/UX - P1 checklist maddeleri | `#F59E0B` | [ ] |
| `ui-ux:p2` | Polish UI/UX - P2 checklist maddeleri | `#10B981` | [ ] |

**İsteğe Bağlı Label'lar:**

| Label | Açıklama | Renk | Durum |
|-------|----------|------|-------|
| `area:dashboard` | Dashboard sayfası | `#6366F1` | [ ] |
| `area:strategy-lab` | Strategy Lab sayfası | `#6366F1` | [ ] |
| `area:portfolio` | Portfolio sayfası | `#6366F1` | [ ] |
| `area:market` | Market sayfası | `#6366F1` | [ ] |
| `type:implementation` | Gerçek kod implementasyonu | `#06B6D4` | [ ] |

#### 1.2 Epic'i Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Epic" template'ini seç
3. Doldur:

**Başlık:**
```
EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler (Skeleton + Error/Empty States)
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `epic` (varsa)

**Body (Template'den):**
- Kapsam: `docs/UI_UX_TALIMATLAR_VE_PLAN.md §3 ve §4 Hafta 1-2 P0 maddeleri`
- Hedef: Hiçbir ana sayfada "boş beyaz ekran" kalmaması
- Alt issue'lar checklist'i:
  - [ ] UI-P0-001: Dashboard skeleton + empty state
  - [ ] UI-P0-002: Strategy Lab loading / error / empty
  - [ ] UI-P0-003: Portfolio + Market skeleton / empty
  - [ ] UI-P0-004: Backtest sonuç ekranı loading + hata mesajları
  - [ ] UI-P0-005: Form validasyon pattern'i (global)

**Durum:** [ ] Tamamlandı

#### 1.3 İlk Issue'u Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Improvement" template'ini seç
3. Doldur:

**Başlık:**
```
UI-P0-001: Dashboard skeleton ve boş durum ekranları
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `area:dashboard` (varsa)

**Template Alanları:**
- Hedef Sayfa: `/dashboard` (§3.1) ✅
- Öncelik: P0 (Kritik) ✅
- Mevcut Durum: İlk yüklemede boş kartlar, hiç strateji yokken boş tablo
- İstenen: Skeleton state, boş durum ekranı, loading durumları
- Kabul Kriterleri: Skeleton görünür, boş durum açıklayıcı, Lighthouse ≥ 90
- İlgili Issue: Epic issue numarası

4. Epic'e bağla: Epic issue'da checklist'e ekle

**Durum:** [ ] Tamamlandı

**Referans:** [Örnek Issue](../.github/ISSUE_EXAMPLES/ui-p0-001-dashboard-skeleton.md)

---

### Adım 2: Local Geliştirme (2-4 saat)

#### 2.1 Branch Oluştur

```bash
git checkout -b ui-ux/ui-p0-001-dashboard-skeleton
```

**Durum:** [ ] Tamamlandı

#### 2.2 Implementation Guide'e Bak

**Doküman:** [UI_UX_IMPLEMENTATION_GUIDE.md](./UI_UX_IMPLEMENTATION_GUIDE.md)

**Yapılacaklar:**
- [ ] Skeleton component oluştur
- [ ] Empty state component oluştur
- [ ] Error state component oluştur
- [ ] State yönetimi (loading, error, empty, success)
- [ ] Loading durumlarında butonlar disabled
- [ ] A11y iyileştirmeleri (aria-label, aria-live, role)

**Durum:** [ ] Tamamlandı

#### 2.3 Test Et

```bash
# Lint ve type check
pnpm lint
pnpm typecheck

# E2E test (varsa)
pnpm test:e2e

# Lighthouse test (manuel)
# Chrome DevTools → Lighthouse → Accessibility

# Axe test (manuel)
# Chrome DevTools → Axe DevTools → Scan
```

**Kontrol:**
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Axe Critical violations = 0
- [ ] Skeleton görünüyor (yavaş API simülasyonu)
- [ ] Boş durum görünüyor (strateji olmayan kullanıcı)
- [ ] Error state görünüyor (network offline)

**Durum:** [ ] Tamamlandı

#### 2.4 Screenshot ve Evidence Hazırla

**Gereken:**
- [ ] Before screenshot (mevcut durum)
- [ ] After screenshot - Loading (skeleton)
- [ ] After screenshot - Empty (boş durum)
- [ ] After screenshot - Error (hata durumu)
- [ ] Lighthouse result screenshot
- [ ] Axe output screenshot

**Durum:** [ ] Tamamlandı

---

### Adım 3: PR ve Review

#### 3.1 PR Aç

**Başlık:**
```
UI-P0-001: Dashboard skeleton & empty states
```

**PR Template Doldur:**

**UI/UX Talimatları Uyumu:**
- [x] Sayfa Checklist: İlgili sayfanın checklist'i kontrol edildi (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1)
- [x] Bileşen Kuralları: Kullanılan bileşenler §2.x kurallarına uyuyor
- [x] Tasarım Prensipleri: Değişiklikler §1.x tasarım prensipleriyle çelişmiyor

**Evidence:**
- [x] Ekran görüntüleri eklendi
- [x] Lighthouse Raporu: Accessibility Score ≥ 90
- [x] Axe DevTools: Critical violations = 0

**Issue Referansı:**
```
Closes #<issue-num>
```

**Durum:** [ ] Tamamlandı

#### 3.2 Review Süreci

**Reviewer Kontrol Listesi:**
- [ ] "Boş durumda ne oluyor?" → Boş durum ekranı var
- [ ] "Skeleton var mı?" → Skeleton state var
- [ ] "Klavye ile ulaşılabiliyor mu?" → Tab navigation çalışıyor
- [ ] "Lighthouse Accessibility ≥ 90 mı?" → Evet
- [ ] "Ekran görüntüsü/gif var mı?" → Var

**Durum:** [ ] Tamamlandı

#### 3.3 Merge ve Kapatma

- [ ] PR merge edildi
- [ ] Issue kapatıldı
- [ ] Epic'te checklist güncellendi (UI-P0-001 ✅)

**Durum:** [ ] Tamamlandı

---

## ✅ Başlangıç Kontrol Listesi

### GitHub Hazırlığı
- [ ] Label'lar oluşturuldu (`ui-ux`, `ui-ux:p0`, `ui-ux:p1`, `ui-ux:p2`)
- [ ] Epic oluşturuldu (EPIC: UI-P0 — Hafta 1-2)
- [ ] İlk issue oluşturuldu (UI-P0-001)
- [ ] Issue epic'e bağlandı

### Local Geliştirme
- [ ] Branch oluşturuldu
- [ ] Implementation Guide'e bakıldı
- [ ] Skeleton + Empty + Error state eklendi
- [ ] A11y iyileştirmeleri yapıldı
- [ ] Test edildi (Lighthouse, Axe)

### PR ve Review
- [ ] PR açıldı
- [ ] PR template dolduruldu
- [ ] Screenshot'lar eklendi
- [ ] Review tamamlandı
- [ ] PR merge edildi
- [ ] Issue kapatıldı

---

## 🎯 Başarı Kriteri

**Sistem "canlı" sayılır:**
- [x] Tüm dokümanlar hazır
- [x] Template'ler hazır
- [ ] GitHub label'ları oluşturuldu
- [ ] İlk epic oluşturuldu
- [ ] İlk issue oluşturuldu
- [ ] İlk PR merge edildi ← **Bu nokta sistemin kanıtlandığı an**

---

## 📚 Referanslar

- [UI/UX README](./UI_UX_README.md) - Ana index
- [UI/UX Talimatları](./UI_UX_TALIMATLAR_VE_PLAN.md) - Ana referans
- [Implementation Guide](./UI_UX_IMPLEMENTATION_GUIDE.md) - Kod rehberi
- [İlk Canlı Test](./UI_UX_FIRST_LIVE_TEST.md) - Test senaryosu

---

**Son Güncelleme:** 26.11.2025
**Durum:** ✅ Hazır - Uygulama aşamasına geçildi

