# UI/UX Sistem Genel Bakış

Bu doküman, Spark Trading Platform'da UI/UX geliştirmeleri için kurulmuş sistemin genel yapısını ve katmanlarını açıklar.

---

## 📚 Sistem Katmanları

### 1. Bilgi Katmanı (Dokümantasyon)

#### Ana Referans
- **[UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md)** (v1.1)
  - **Ne yapacağız?** - Tasarım prensipleri, bileşen kuralları, sayfa checklist'leri, 8 haftalık roadmap
  - **Kapsam:** Tüm UI/UX kararları bu dokümana göre alınır
  - **Versiyon:** 1.1 (26.11.2025)

#### İş Akışı Rehberi
- **[UI_UX_WORKFLOW.md](./UI_UX_WORKFLOW.md)**
  - **Nasıl çalışacağız?** - Label'lar, issue oluşturma, PR süreci, sprint planlama
  - **Kapsam:** Günlük iş akışı, review checklist, definition of done

#### Hızlı Başlangıç
- **[UI_UX_QUICK_START.md](./UI_UX_QUICK_START.md)**
  - **İlk gelen dev ne yapacak?** - İlk kurulum, label'lar, epic oluşturma, örnek issue
  - **Kapsam:** Tek seferlik kurulum ve günlük kullanım

---

### 2. İşlem Katmanı (GitHub)

#### PR Template
- **`.github/pull_request_template.md`**
  - UI/UX denetimini **zorunlu** hale getiriyor
  - 3 kontrol maddesi: Sayfa checklist, bileşen kuralları, tasarım prensipleri
  - Evidence gereksinimleri: Screenshot, Lighthouse, Axe

#### Issue Template'leri
- **`.github/ISSUE_TEMPLATE/ui-ux.md`**
  - Standart UI/UX issue oluşturma
  - Sayfa/bileşen seçimi, öncelik seviyesi, kabul kriterleri

- **`.github/ISSUE_TEMPLATE/ui-ux-epic.md`**
  - Büyük UI/UX geliştirmeleri için epic
  - Alt issue checklist formatı

#### Örnek Issue
- **`.github/ISSUE_EXAMPLES/ui-p0-001-dashboard-skeleton.md`**
  - "Doğru doldurulmuş" issue örneği
  - Template kullanım rehberi

---

## 🔄 Sistem Akışı

### Yeni UI/UX Geliştirmesi

```
1. Issue Aç
   └─> UI/UX Improvement template
       └─> Label ekle (ui-ux, ui-ux:p0/p1/p2)
           └─> Epic'e bağla (varsa)

2. Branch Oluştur
   └─> ui-ux/[issue-numarası]-[kısa-açıklama]

3. Geliştirme Yap
   └─> UI_UX_TALIMATLAR_VE_PLAN.md'ye göre
       └─> Checklist maddelerini takip et

4. PR Aç
   └─> PR template otomatik yüklenir
       └─> UI/UX Talimatları Uyumu bölümünü doldur
           └─> Evidence ekle (screenshot, Lighthouse, Axe)

5. Review
   └─> Checklist'e göre kontrol
       └─> Definition of Done kontrolü

6. Merge
   └─> Issue kapat
       └─> Epic güncelle (varsa)
```

---

## ✅ Sistem Durumu

### Tamamlanan ✅
- [x] Ana referans doküman (v1.1)
- [x] İş akışı rehberi
- [x] Hızlı başlangıç rehberi
- [x] PR template (UI/UX kontrolleri eklendi)
- [x] Issue template'leri (ui-ux, ui-ux-epic)
- [x] Örnek issue (ui-p0-001)

### GitHub'da Yapılacaklar (Manuel) 🔧
- [ ] Label'ları oluştur (`ui-ux`, `ui-ux:p0`, `ui-ux:p1`, `ui-ux:p2`)
- [ ] İsteğe bağlı label'lar (`area:*`, `type:*`)
- [ ] İlk epic'i oluştur (EPIC: UI-P0 — Hafta 1-2)
- [ ] İlk 5 alt issue'u oluştur ve epic'e bağla

### İlk Canlı Test 🧪
- [ ] İlk issue'dan branch aç
- [ ] Gerçek geliştirme yap (skeleton + empty state)
- [ ] PR aç ve template'i doldur
- [ ] Review sürecini test et
- [ ] Sistemin çalıştığını doğrula

---

## 🎯 Sistem Hedefleri

### Kısa Vadeli (1-2 Hafta)
- Tüm P0 checklist maddeleri tamamlanır
- Hiçbir ana sayfada "boş beyaz ekran" kalmaz
- Skeleton + empty + error state'ler tüm kritik sayfalarda mevcut

### Orta Vadeli (1-2 Ay)
- Tüm P1 checklist maddeleri tamamlanır
- Animasyonlar ve etkileşimler eklenir
- Light theme implementasyonu

### Uzun Vadeli (3-6 Ay)
- Tüm P2 checklist maddeleri tamamlanır
- Command palette geliştirmeleri
- Gelişmiş özellikler (data export, print-friendly)

---

## 📊 Metrikler

### Takip Edilecek Metrikler
- **Lighthouse Accessibility:** ≥ 90 (tüm sayfalarda)
- **WCAG 2.2 AA:** Kritik ihlal sayısı = 0
- **Görev Tamamlama:** ≥ %90 (ilk denemede)
- **Form Hata Oranı:** ≤ %10 (inline validasyon sonrası)

### Raporlama
- Her sprint sonunda checklist ilerlemesi
- Epic tamamlanma oranı
- PR review süresi (UI/UX PR'ları için)

---

## 🔗 İlgili Dokümanlar

- [UI/UX Talimatları](./UI_UX_TALIMATLAR_VE_PLAN.md) - Ana referans
- [UI/UX İş Akışı](./UI_UX_WORKFLOW.md) - Detaylı iş akışı
- [UI/UX Hızlı Başlangıç](./UI_UX_QUICK_START.md) - İlk kurulum
- [PR Template](../.github/pull_request_template.md) - PR checklist'i
- [Issue Template](../.github/ISSUE_TEMPLATE/ui-ux.md) - Issue template'i

---

**Son Güncelleme:** 26.11.2025
**Sistem Durumu:** ✅ Hazır (GitHub label'ları ve issue'ları bekleniyor)

