# UI/UX İş Akışı Rehberi

Bu doküman, Spark Trading Platform'da UI/UX geliştirmelerinin nasıl yönetileceğini açıklar.

## 📚 Ana Referans

**Tek Kaynak:** [docs/UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md)

Tüm UI/UX kararları ve geliştirmeleri bu dokümana göre yapılmalıdır.

---

## 🏷️ GitHub Label'ları

### Zorunlu Label'lar

- **`ui-ux`** - Genel UI/UX geliştirmeleri
  - Açıklama: "UI/UX geliştirmeleri - [docs/UI_UX_TALIMATLAR_VE_PLAN.md](./docs/UI_UX_TALIMATLAR_VE_PLAN.md)"
  - Renk: `#8B5CF6` (mor)

- **`ui-ux:p0`** - Kritik UI/UX işleri (Hafta 1-2 hedefi)
  - Açıklama: "Kritik UI/UX - P0 checklist maddeleri (skeleton states, erişilebilirlik, boş durumlar)"
  - Renk: `#EF4444` (kırmızı)

- **`ui-ux:p1`** - Önemli UI/UX iyileştirmeleri (canary sonrası)
  - Açıklama: "Önemli UI/UX - P1 checklist maddeleri (animasyonlar, ek özellikler)"
  - Renk: `#F59E0B` (turuncu)

- **`ui-ux:p2`** - Polish / Quality of Life
  - Açıklama: "Polish UI/UX - P2 checklist maddeleri (mikro-etkileşimler, gelişmiş özellikler)"
  - Renk: `#10B981` (yeşil)

### İsteğe Bağlı Label'lar

- **`area:dashboard`** - Dashboard sayfası ile ilgili
- **`area:strategy-lab`** - Strategy Lab sayfası ile ilgili
- **`area:portfolio`** - Portfolio sayfası ile ilgili
- **`area:market`** - Market sayfası ile ilgili
- **`area:settings`** - Settings sayfası ile ilgili
- **`type:design`** - Sadece tasarım/Figma/flow işi (kod PR'ı değil)
- **`type:implementation`** - Gerçek kod implementasyonu

### Label Kullanım Kuralları

- Her UI/UX issue'da **en az bir** `ui-ux` label'ı olmalı
- Öncelik label'ı (`ui-ux:p0/p1/p2`) **mutlaka** eklenmeli
- İlgili sayfa için `area:*` label'ı eklenebilir
- Tasarım vs. implementasyon ayrımı için `type:*` kullanılabilir

---

## 📝 Issue Oluşturma

### UI/UX Issue Template Kullanımı

1. GitHub'da "New Issue" tıklayın
2. "UI/UX Improvement" template'ini seçin
3. İlgili sayfa/bileşeni işaretleyin (§3.x veya §2.x)
4. Öncelik seviyesini seçin (P0/P1/P2)
5. Mevcut durumu ve istenen değişikliği açıklayın

### Epic Oluşturma

Büyük UI/UX geliştirmeleri için epic oluşturun:

**Örnek Epic: "UI-P0: Hafta 1-2 Temel İyileştirmeler"**

Alt issue'lar:
- `UI-P0: Dashboard skeleton states` (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1)
- `UI-P0: Strategy Lab error/empty states` (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.2)
- `UI-P0: Portfolio/Market skeleton & empty` (docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.5, §3.6)

---

## 🔄 Pull Request Süreci

### PR Template Kontrol Listesi

Her UI/UX PR'ında şu kontroller yapılmalı:

1. **UI/UX Talimatları Uyumu:**
   - [ ] İlgili sayfanın P0/P1 maddeleri kontrol edildi (§3.x)
   - [ ] Yeni UI bileşeni, ilgili bileşen kurallarına uyuyor (§2.x)
   - [ ] Tasarım prensipleri uygulandı (§1.x)

2. **Evidence:**
   - [ ] Ekran görüntüsü/gif eklendi
   - [ ] Lighthouse raporu (Accessibility ≥ 90)
   - [ ] Axe DevTools screenshot (Critical violations = 0)

3. **Dokümantasyon:**
   - [ ] Hangi checklist maddesinin kapandığı belirtildi
   - [ ] A11y etkisi varsa not eklendi

### PR Başlık Formatı

```
ui-ux: [Sayfa/Bileşen] [Açıklama] (P0/P1/P2)
```

**Örnekler:**
- `ui-ux: Dashboard skeleton states (P0)`
- `ui-ux: Strategy Lab error handling (P0)`
- `ui-ux: Portfolio empty state (P1)`
- `ui-ux: Button hover animations (P2)`

---

## 📊 Sprint Planlama

### Roadmap'e Göre Sprint Bölümleme

**Hafta 1-2: Temel İyileştirmeler (P0)**
- Dashboard skeleton states
- Strategy Lab error/empty states
- Portfolio/Market skeleton & empty
- Form inline validation
- WCAG temel kontrolleri

**Hafta 3-4: Animasyonlar ve Etkileşim**
- Sayfa geçiş animasyonları
- Kart/buton hover feedback
- Modal animasyonları
- Toast animasyonları

**Hafta 5-6: Tema ve Erişilebilirlik**
- Light theme implementasyonu
- Tema toggle
- WCAG 2.2 AA audit
- Ekran okuyucu testleri

**Hafta 7-8: Gelişmiş Özellikler**
- Command palette geliştirmeleri
- Klavye kısayolları cheatsheet
- Data export
- Gelişmiş grafikler

### Issue Board Organizasyonu

GitHub Projects veya benzeri bir board kullanıyorsanız:

**Kolonlar:**
- 📋 Backlog (P0/P1/P2 label'larına göre)
- 🔄 In Progress
- 👀 Review
- ✅ Done

**Filtreler:**
- `label:ui-ux:p0` - Kritik işler
- `label:ui-ux:p1` - Önemli işler
- `label:ui-ux:p2` - Polish işler

---

## ✅ Definition of Done

Bir UI/UX geliştirmesi "tamamlandı" sayılır:

1. ✅ İlgili checklist maddesi tamamlandı
2. ✅ PR template'deki tüm kontroller geçti
3. ✅ Lighthouse Accessibility ≥ 90
4. ✅ Ekran görüntüsü/gif eklendi
5. ✅ Code review tamamlandı
6. ✅ Test coverage eklendi (gerekiyorsa)
7. ✅ Dokümantasyon güncellendi (gerekiyorsa)

---

## 🔍 Review Checklist

Code review yaparken kontrol edin:

- [ ] UI/UX talimatlarına uygun mu?
- [ ] Checklist maddesi doğru kapatılmış mı?
- [ ] Evidence (screenshot/gif) mevcut mu?
- [ ] Lighthouse/Axe sonuçları kabul edilebilir mi?
- [ ] Breaking change var mı? (varsa dokümante edilmiş mi?)

---

## 📞 İletişim

UI/UX kararları için:
- **Doküman:** [docs/UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md)
- **Issue:** `label:ui-ux` ile arama yapın
- **PR:** `label:ui-ux` ile arama yapın

---

**Son Güncelleme:** 26.11.2025

