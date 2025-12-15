# UI/UX İlk Canlı Test Rehberi

Bu rehber, UI/UX sisteminin ilk kez gerçek bir geliştirme ile test edilmesi için adım adım talimatlar içerir.

---

## 🎯 Test Hedefi

İlk canlı test ile şunları doğrulayacağız:

1. ✅ Label'lar çalışıyor mu?
2. ✅ Issue template doğru çalışıyor mu?
3. ✅ Epic bağlantısı çalışıyor mu?
4. ✅ PR template UI/UX kontrolleri çalışıyor mu?
5. ✅ Review süreci sorunsuz işliyor mu?

---

## 📋 Ön Hazırlık (Tek Seferlik)

### 1. GitHub Label'larını Oluştur

GitHub → Settings → Labels → New label

**Zorunlu Label'lar:**

| Label | Açıklama | Renk |
|-------|----------|------|
| `ui-ux` | UI/UX geliştirmeleri - docs/UI_UX_TALIMATLAR_VE_PLAN.md | `#8B5CF6` |
| `ui-ux:p0` | Kritik UI/UX - P0 checklist maddeleri | `#EF4444` |
| `ui-ux:p1` | Önemli UI/UX - P1 checklist maddeleri | `#F59E0B` |
| `ui-ux:p2` | Polish UI/UX - P2 checklist maddeleri | `#10B981` |

**İsteğe Bağlı (Test için gerekli değil):**

| Label | Açıklama | Renk |
|-------|----------|------|
| `area:dashboard` | Dashboard sayfası | `#6366F1` |
| `type:implementation` | Gerçek kod implementasyonu | `#06B6D4` |

### 2. Epic'i Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Epic" template'ini seç
3. Şu bilgileri doldur:

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
- Alt issue'lar checklist'i ekle (henüz boş, sonra doldurulacak)

**Milestone:** İlgili sprint milestone'u (varsa)

### 3. İlk Test Issue'u Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Improvement" template'ini seç
3. Şu bilgileri doldur:

**Başlık:**
```
UI-P0-001: Dashboard skeleton ve boş durum ekranları
```

**Label'lar:**
- `ui-ux`
- `ui-ux:p0`
- `area:dashboard` (varsa)

**Template Alanları:**

- **Hedef Sayfa/Bileşen:** `/dashboard` (§3.1) ✅
- **Öncelik Seviyesi:** P0 (Kritik) ✅
- **Mevcut Durum:**
  ```
  - İlk yüklemede veri gelene kadar kartlar boş
  - Hiç strateji yokken sadece boş tablo görünüyor
  - Loading durumunda butonlar aktif kalıyor
  ```
- **İstenen Değişiklik:**
  ```
  docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1 P0 maddelerine göre:
  - Aktif strateji, risk/Günlük P&L ve Sistem Sağlığı widget'ları için skeleton state
  - Hiç strateji yokken "Strateji ekle" CTA içeren açıklayıcı boş durum kartı
  - Loading durumunda butonların disabled + spinner durumu
  ```
- **Kabul Kriterleri:**
  ```
  - Dashboard'a yavaş API ile girildiğinde skeleton görülür
  - Hiç strateji olmayan kullanıcının ekranında açıklayıcı metin + "Strateji oluştur" butonu var
  - Loading durumunda tüm interaktif elementler disabled
  - Lighthouse Accessibility ≥ 90
  ```
- **Tasarım Notları:**
  ```
  - Skeleton şablonu Strategy Lab'te kullanılacak skeleton ile aynı stil ailesinden
  - Renkler mevcut dark theme ile uyumlu, contrast kurallarına uygun
  ```
- **İlgili Issue/PR:** Epic issue numarasını ekle

4. Epic'e bağla: Issue açıldıktan sonra, epic issue'da bu issue'u "Alt Issue'lar" checklist'ine ekle

---

## 🚀 Canlı Test Adımları

### Adım 1: Branch Oluştur

```bash
git checkout -b ui-ux/ui-p0-001-dashboard-skeleton
```

### Adım 2: Geliştirme Yap

1. Dashboard sayfasına skeleton state ekle
2. Boş durum ekranı ekle
3. Loading durumlarını düzelt

**Referans:** `docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1`

**Kontrol Listesi:**
- [ ] Skeleton component oluşturuldu
- [ ] Boş durum component'i oluşturuldu
- [ ] Loading durumları düzeltildi
- [ ] WCAG 2.2 AA kontrast kurallarına uygun
- [ ] Tab navigation çalışıyor

### Adım 3: Test Et

```bash
# Dev server başlat
pnpm --filter web-next dev

# Lighthouse test (manuel)
# Chrome DevTools → Lighthouse → Accessibility

# Axe test (manuel)
# Chrome DevTools → Axe DevTools → Scan
```

**Kontrol:**
- [ ] Skeleton görünüyor mu? (yavaş API simülasyonu ile)
- [ ] Boş durum görünüyor mu? (strateji olmayan kullanıcı ile)
- [ ] Loading durumunda butonlar disabled mı?
- [ ] Lighthouse Accessibility ≥ 90 mı?
- [ ] Axe Critical violations = 0 mı?

### Adım 4: Screenshot/GIF Hazırla

**Gereken Screenshot'lar:**
1. **Before:** Mevcut durum (boş beyaz ekran)
2. **After:** Skeleton state
3. **After:** Boş durum ekranı
4. **After:** Loading durumu

**GIF (Opsiyonel):**
- Skeleton animasyonu
- Boş durumdan "Strateji oluştur" butonuna tıklama

### Adım 5: PR Aç

1. Değişiklikleri commit et ve push et
2. GitHub → Pull Requests → New Pull Request
3. PR template otomatik yüklenecek

**PR Başlığı:**
```
ui-ux: Dashboard skeleton states (P0)
```

**PR Body - UI/UX Talimatları Uyumu Bölümü:**

- [x] **Sayfa Checklist:** İlgili sayfanın checklist'i kontrol edildi (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1)
  - P0 maddeleri: Skeleton ✅, Boş durum ✅, Loading durumları ✅
- [x] **Bileşen Kuralları:** Kullanılan bileşenler §2.x kurallarına uyuyor
  - Card component: §2.2 kurallarına uygun ✅
  - Skeleton component: Yeni component, mevcut stil ailesine uygun ✅
- [x] **Tasarım Prensipleri:** Değişiklikler §1.x tasarım prensipleriyle çelişmiyor
  - Kontrast: WCAG 2.2 AA uyumlu ✅
  - Spacing: 4'ün katları kullanıldı ✅
  - Tipografi: Sistem font, 14px+ ✅

**Evidence Bölümü:**

- [x] **Ekran Görüntüleri:** Before/After screenshot'lar eklendi
- [x] **Lighthouse Raporu:** Accessibility Score: 92 ✅
- [x] **Axe DevTools:** Critical violations: 0 ✅
- [x] **GIF:** Skeleton animasyonu eklendi (opsiyonel)

**Değişiklik Tanımı:**
```
Dashboard sayfasına skeleton state ve boş durum ekranları eklendi.
UI/UX Talimatları §3.1 P0 maddeleri tamamlandı.

- Skeleton component oluşturuldu (aktif strateji, risk/P&L, sistem sağlığı widget'ları için)
- Boş durum component'i eklendi ("Strateji oluştur" CTA ile)
- Loading durumlarında butonlar disabled + spinner eklendi
```

### Adım 6: Review Sürecini Test Et

**Reviewer Kontrol Listesi:**

PR template'deki soruları kontrol et:

- [x] "Boş durumda ne oluyor?" → Boş durum ekranı var ✅
- [x] "Skeleton var mı?" → Skeleton state var ✅
- [x] "Klavye ile ulaşılabiliyor mu?" → Tab navigation çalışıyor ✅
- [x] "Kısayol UI'da gözüküyor mu?" → Bu issue için geçerli değil
- [x] "Lighthouse Accessibility ≥ 90 mı?" → 92 ✅
- [x] "Ekran görüntüsü/gif var mı?" → Var ✅

### Adım 7: Merge ve Issue Kapatma

1. PR merge edildikten sonra
2. Issue'u kapat: "Closes #XXX" (PR'da otomatik olabilir)
3. Epic'te checklist'i güncelle: UI-P0-001 ✅

---

## ✅ Test Başarı Kriterleri

Test başarılı sayılır:

- [x] Label'lar doğru çalışıyor
- [x] Issue template doğru dolduruldu
- [x] Epic bağlantısı çalışıyor
- [x] PR template UI/UX kontrolleri çalışıyor
- [x] Review süreci sorunsuz işledi
- [x] Issue kapatıldı ve epic güncellendi

---

## 🐛 Olası Sorunlar ve Çözümleri

### Sorun: Label'lar görünmüyor
**Çözüm:** GitHub → Settings → Labels → Label'ların oluşturulduğunu kontrol et

### Sorun: Issue template yüklenmiyor
**Çözüm:** `.github/ISSUE_TEMPLATE/ui-ux.md` dosyasının doğru yerde olduğunu kontrol et

### Sorun: PR template UI/UX bölümü görünmüyor
**Çözüm:** `.github/pull_request_template.md` dosyasının güncel olduğunu kontrol et

### Sorun: Epic bağlantısı çalışmıyor
**Çözüm:** GitHub Projects kullanıyorsanız, epic'i project'e ekleyin ve issue'u epic'e bağlayın

---

## 📊 Test Sonrası

Test başarılı olduktan sonra:

1. ✅ Sistemin çalıştığını doğrula
2. ✅ Kalan 4 issue'u oluştur (UI-P0-002, 003, 004, 005)
3. ✅ Takıma dokümanları paylaş
4. ✅ İlk sprint'i başlat

---

**Son Güncelleme:** 26.11.2025
**Test Durumu:** 🔧 Hazır (GitHub label'ları ve issue'ları bekleniyor)

