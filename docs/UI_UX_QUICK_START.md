# UI/UX Hızlı Başlangıç Rehberi

Bu rehber, Spark Trading Platform'da UI/UX geliştirmelerine hızlıca başlamak için gereken tüm adımları içerir.

## 🚀 İlk Kurulum (Tek Seferlik)

### 1. GitHub Label'larını Oluştur

GitHub repository'de şu label'ları oluşturun:

#### Zorunlu Label'lar

| Label | Açıklama | Renk |
|-------|----------|------|
| `ui-ux` | UI/UX geliştirmeleri - [docs/UI_UX_TALIMATLAR_VE_PLAN.md](./UI_UX_TALIMATLAR_VE_PLAN.md) | `#8B5CF6` (mor) |
| `ui-ux:p0` | Kritik UI/UX - P0 checklist maddeleri (Hafta 1-2 hedefi) | `#EF4444` (kırmızı) |
| `ui-ux:p1` | Önemli UI/UX - P1 checklist maddeleri (canary sonrası) | `#F59E0B` (turuncu) |
| `ui-ux:p2` | Polish UI/UX - P2 checklist maddeleri | `#10B981` (yeşil) |

#### İsteğe Bağlı Label'lar

| Label | Açıklama | Renk |
|-------|----------|------|
| `area:dashboard` | Dashboard sayfası | `#6366F1` (indigo) |
| `area:strategy-lab` | Strategy Lab sayfası | `#6366F1` (indigo) |
| `area:portfolio` | Portfolio sayfası | `#6366F1` (indigo) |
| `area:market` | Market sayfası | `#6366F1` (indigo) |
| `type:design` | Sadece tasarım/Figma işi | `#EC4899` (pembe) |
| `type:implementation` | Gerçek kod implementasyonu | `#06B6D4` (cyan) |

**Nasıl Oluşturulur:**
1. GitHub → Settings → Labels
2. "New label" tıklayın
3. Label adı, açıklama ve rengi yukarıdaki tabloya göre girin

### 2. İlk Epic'i Oluştur

1. GitHub → Issues → New Issue
2. "UI/UX Epic" template'ini seçin
3. Şu bilgileri doldurun:
   - **Başlık:** `EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler (Skeleton + Error/Empty States)`
   - **Label:** `ui-ux`, `ui-ux:p0`, `epic`
   - **Milestone:** İlgili sprint milestone'u

**Örnek Epic:** [.github/ISSUE_TEMPLATE/ui-ux-epic.md](../.github/ISSUE_TEMPLATE/ui-ux-epic.md)

### 3. İlk Alt Issue'ları Oluştur

Epic'e bağlı olarak şu issue'ları oluşturun:

1. **UI-P0-001: Dashboard skeleton + empty state**
   - Template: UI/UX Improvement
   - Label: `ui-ux`, `ui-ux:p0`, `area:dashboard`
   - Epic'e bağla

2. **UI-P0-002: Strategy Lab loading / error / empty**
   - Template: UI/UX Improvement
   - Label: `ui-ux`, `ui-ux:p0`, `area:strategy-lab`
   - Epic'e bağla

3. **UI-P0-003: Portfolio + Market skeleton / empty**
   - Template: UI/UX Improvement
   - Label: `ui-ux`, `ui-ux:p0`, `area:portfolio`, `area:market`
   - Epic'e bağla

4. **UI-P0-004: Backtest sonuç ekranı loading + error states**
   - Template: UI/UX Improvement
   - Label: `ui-ux`, `ui-ux:p0`
   - Epic'e bağla

5. **UI-P0-005: Global form validation & inline error pattern**
   - Template: UI/UX Improvement
   - Label: `ui-ux`, `ui-ux:p0`
   - Epic'e bağla

**Örnek Issue:** [.github/ISSUE_EXAMPLES/ui-p0-001-dashboard-skeleton.md](../.github/ISSUE_EXAMPLES/ui-p0-001-dashboard-skeleton.md)

---

## 📝 Günlük İş Akışı

### Yeni UI/UX Issue Açarken

1. GitHub → Issues → New Issue
2. "UI/UX Improvement" template'ini seç
3. Template'i doldur:
   - Hedef sayfa/bileşeni işaretle
   - Öncelik seviyesini seç (P0/P1/P2)
   - Mevcut durumu açıkla
   - İstenen değişikliği belirt
   - Kabul kriterlerini yaz
4. Label'ları ekle:
   - `ui-ux` (zorunlu)
   - `ui-ux:p0` veya `ui-ux:p1` veya `ui-ux:p2` (zorunlu)
   - `area:*` (isteğe bağlı)
   - `type:*` (isteğe bağlı)

### PR Açarken

1. Branch oluştur: `ui-ux/dashboard-skeleton-states`
2. Değişiklikleri yap
3. PR aç: GitHub otomatik olarak PR template'i yükleyecek
4. **UI/UX Talimatları Uyumu** bölümünü kontrol et:
   - [ ] İlgili sayfanın checklist'i kontrol edildi (§3.x)
   - [ ] Kullanılan bileşenler §2.x kurallarına uyuyor
   - [ ] Değişiklikler §1.x tasarım prensipleriyle çelişmiyor
5. Evidence ekle:
   - Ekran görüntüsü/gif (before/after)
   - Lighthouse raporu (Accessibility ≥ 90)
   - Axe DevTools screenshot (Critical violations = 0)
6. PR başlığı formatı: `ui-ux: Dashboard skeleton states (P0)`

### Code Review Yaparken

PR review sırasında şu soruları sor:

- ✅ "Boş durumda ne oluyor?"
- ✅ "Skeleton var mı?"
- ✅ "Klavye ile ulaşılabiliyor mu?"
- ✅ "Kısayol UI'da gözüküyor mu?"
- ✅ "Lighthouse Accessibility ≥ 90 mı?"
- ✅ "Ekran görüntüsü/gif var mı?"

Tüm sorular PR template'deki checklist'ten geliyor.

---

## 📚 Referans Dokümanlar

- **[UI/UX Talimatları](./UI_UX_TALIMATLAR_VE_PLAN.md)** - Ana referans doküman
- **[UI/UX İş Akışı](./UI_UX_WORKFLOW.md)** - Detaylı iş akışı rehberi
- **[PR Template](../.github/pull_request_template.md)** - PR checklist'i
- **[Issue Template](../.github/ISSUE_TEMPLATE/ui-ux.md)** - Issue template'i
- **[Epic Template](../.github/ISSUE_TEMPLATE/ui-ux-epic.md)** - Epic template'i

---

## ✅ Checklist: İlk Kurulum Tamamlandı mı?

- [ ] GitHub label'ları oluşturuldu (`ui-ux`, `ui-ux:p0`, `ui-ux:p1`, `ui-ux:p2`)
- [ ] İsteğe bağlı label'lar oluşturuldu (`area:*`, `type:*`)
- [ ] İlk epic oluşturuldu (EPIC: UI-P0 — Hafta 1-2)
- [ ] İlk 5 alt issue oluşturuldu ve epic'e bağlandı
- [ ] PR template güncellendi (UI/UX kontrolleri eklendi)
- [ ] Takım dokümanları okudu ve anladı

---

**Son Güncelleme:** 26.11.2025

