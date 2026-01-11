# UI/UX Dokümantasyon Rehberi

Bu doküman, Spark Trading Platform UI/UX sistemi için tüm dokümanların index'i ve hızlı erişim rehberidir.

---

## 🎯 Sistem Durumu

**Durum:** ✅ **TAMAMLANDI** - GitHub label'ları ve ilk issue bekleniyor

**Versiyon:** 1.0
**Son Güncelleme:** 26.11.2025

---

## 📚 Doküman Seti (6 Doküman)

### 1. Ana Referans
**[UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md)** (v1.1)
- **Ne yapacağız?**
- Tasarım prensipleri, bileşen kuralları, sayfa checklist'leri
- 8 haftalık roadmap
- **Başlangıç noktası:** Tüm UI/UX kararları bu dokümana göre

### 2. İş Akışı
**[UI_UX_WORKFLOW.md](./UI_UX_WORKFLOW.md)**
- **Nasıl çalışacağız?**
- Label'lar, issue oluşturma, PR süreci
- Sprint planlama, review checklist
- **Kullanım:** Günlük iş akışı rehberi

### 3. Hızlı Başlangıç
**[UI_UX_QUICK_START.md](./UI_UX_QUICK_START.md)**
- **Yeni dev ne yapacak?**
- İlk kurulum (label'lar, epic, issue)
- Günlük kullanım senaryoları
- **Kullanım:** İlk kez UI/UX işi yapacaklar için

### 4. Sistem Genel Bakış
**[UI_UX_SYSTEM_OVERVIEW.md](./UI_UX_SYSTEM_OVERVIEW.md)**
- **Kuşbakışı mimari**
- Sistem katmanları, akış diyagramı
- Metrikler ve hedefler
- **Kullanım:** Sistemin genel yapısını anlamak için

### 5. İlk Canlı Test
**[UI_UX_FIRST_LIVE_TEST.md](./UI_UX_FIRST_LIVE_TEST.md)**
- **İlk deney senaryosu**
- GitHub hazırlığı, test adımları
- Olası sorunlar ve çözümleri
- **Kullanım:** İlk canlı test için adım adım rehber

### 6. Implementation Guide
**[UI_UX_IMPLEMENTATION_GUIDE.md](./UI_UX_IMPLEMENTATION_GUIDE.md)**
- **Component + state + test detayları**
- Kod örnekleri (Skeleton, Empty, Error)
- Test senaryoları, PR template doldurma
- **Kullanım:** Gerçek kod implementasyonu için

---

## 🚀 Hızlı Başlangıç

### Yeni Gelen Birine Ne Demeli?

> "`docs/UI_UX_QUICK_START.md` dosyasını oku, sonra issue aç."

Bu kadar. Doküman seti kendini açıklıyor.

### İlk UI/UX İşi İçin

1. **[QUICK_START.md](./UI_UX_QUICK_START.md)** → İlk kurulum
2. **[IMPLEMENTATION_GUIDE.md](./UI_UX_IMPLEMENTATION_GUIDE.md)** → Kod implementasyonu
3. **[FIRST_LIVE_TEST.md](./UI_UX_FIRST_LIVE_TEST.md)** → Test ve PR

### Mevcut İş İçin

1. **[TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md)** → Ne yapacağım?
2. **[WORKFLOW.md](./UI_UX_WORKFLOW.md)** → Nasıl çalışacağım?

---

## 🎯 Şu Anki Gerçek "Next Step"

### GitHub'da (20 dakika)

1. **Label'ları oluştur:**
   - `ui-ux` (#8B5CF6)
   - `ui-ux:p0` (#EF4444)
   - `ui-ux:p1` (#F59E0B)
   - `ui-ux:p2` (#10B981)

2. **Epic'i oluştur:**
   - Başlık: `EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler (Skeleton + Error/Empty States)`
   - Template: `ui-ux-epic`

3. **İlk issue'u oluştur:**
   - Başlık: `UI-P0-001: Dashboard skeleton ve boş durum ekranları`
   - Template: `ui-ux`
   - Label: `ui-ux`, `ui-ux:p0`, `area:dashboard`

### Local'de (2-4 saat)

1. **Branch aç:**
   ```bash
   git checkout -b ui-ux/ui-p0-001-dashboard-skeleton
   ```

2. **Implementation Guide'e bak:**
   - [IMPLEMENTATION_GUIDE.md](./UI_UX_IMPLEMENTATION_GUIDE.md)
   - Skeleton + Empty + Error state + A11y uygula

3. **PR aç:**
   - Yeni PR template'i kullan
   - Screenshot + Lighthouse + Axe ekle

---

## 💡 Implementation Guide'in Gizli Gücü

Implementation Guide'deki Skeleton/Empty/Error örnekleri:

✅ **Pattern Standardizasyonu:**
- Dashboard'ta işe yarayan pattern, diğer sayfalara **rehberli klon** olacak
- Kopyala-yapıştır değil, standart pattern kullanımı

✅ **Review Kalitesi:**
- "Bu skeleton diğer sayfadakine benzemiyor" → Muğlak tartışma
- "Guide'daki pattern'den sapmışsın" → Net referans

✅ **Hız:**
- Yeni sayfa için skeleton eklerken guide'a bak, pattern'i uygula
- Her seferinde sıfırdan düşünmeye gerek yok

---

## 📊 Sistem Metrikleri

### Takip Edilecek
- **Lighthouse Accessibility:** ≥ 90 (tüm sayfalarda)
- **WCAG 2.2 AA:** Kritik ihlal sayısı = 0
- **Görev Tamamlama:** ≥ %90 (ilk denemede)
- **Form Hata Oranı:** ≤ %10

### Raporlama
- Her sprint sonunda checklist ilerlemesi
- Epic tamamlanma oranı
- PR review süresi (UI/UX PR'ları için)

---

## 🔗 İlgili Dosyalar

### GitHub Template'leri
- [PR Template](../.github/pull_request_template.md) - UI/UX kontrolleri eklendi
- [Issue Template](../.github/ISSUE_TEMPLATE/ui-ux.md) - Standart issue
- [Epic Template](../.github/ISSUE_TEMPLATE/ui-ux-epic.md) - Epic oluşturma
- [Örnek Issue](../.github/ISSUE_EXAMPLES/ui-p0-001-dashboard-skeleton.md) - Golden sample

### Cursor Rules
- [.cursorrules](../.cursorrules) - UI/UX standartları eklendi

---

## ✅ Definition of Done

Sistem "tamamlandı" sayılır:

- [x] Tüm dokümanlar hazır (6 doküman)
- [x] Template'ler oluşturuldu (PR, Issue, Epic)
- [x] Örnek issue hazır
- [x] Implementation guide hazır
- [ ] GitHub label'ları oluşturuldu (Manuel)
- [ ] İlk epic oluşturuldu (Manuel)
- [ ] İlk issue oluşturuldu (Manuel)
- [ ] İlk PR merge edildi (İlk canlı test)

---

## 🎉 Sonuç

**Sistem Durumu:** ✅ Hazır

Artık:
- Plansız UI patch → **Bitti**
- Her değişiklik → Dokümana bağlı, issue'lu, epic'li, PR checklist'li
- Trading sistemi gibi → SLO, metric, guardrail ile kontrollü

**İlk UI-P0-001 PR merge olduğu anda:**
- Sistem "kağıt üzerinde" değil, **tarihçede kanıtlanmış** olacak
- Sonraki P0'lar sadece bu şablonun tekrarı haline gelir
- Sistem kendini büyütmeye başlar

---

**Son Güncelleme:** 26.11.2025
**Sistem Versiyonu:** 1.0

