# UI-P0-001: Dashboard skeleton ve boş durum ekranları

**Template:** UI/UX Improvement
**Label:** `ui-ux`, `ui-ux:p0`, `area:dashboard`
**Epic:** EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler

---

## 📋 UI/UX Talimatları Referansı

**Doküman:** [docs/UI_UX_TALIMATLAR_VE_PLAN.md](../../docs/UI_UX_TALIMATLAR_VE_PLAN.md)

## 🎯 Hedef Sayfa/Bileşen

- [x] `/dashboard` (§3.1)
- [ ] `/strategy-lab` (§3.2)
- [ ] `/strategies` (§3.3)
- [ ] `/running` (§3.4)
- [ ] `/portfolio` (§3.5)
- [ ] `/market` veya `/technical-analysis` (§3.6)
- [ ] `/settings`, `/alerts`, `/guardrails`, `/observability` (§3.7)
- [ ] Bileşen (Card, Form, Modal, Chart vb.) (§2.x)
- [ ] Diğer: <!-- belirtiniz -->

## 📊 Öncelik Seviyesi

- [x] **P0 (Kritik)** - Temel işlevsellik, erişilebilirlik, yükleme/boş durum
- [ ] **P1 (Önemli)** - Kullanıcı deneyimi iyileştirmeleri, ek özellikler
- [ ] **P2 (Polish)** - Animasyonlar, mikro-etkileşimler, gelişmiş özellikler

## 🔍 Mevcut Durum

- İlk yüklemede veri gelene kadar kartlar boş; kullanıcı "bozuldu mu?" hissine sahip
- Hiç strateji yokken sadece boş tablo görünüyor
- Loading durumunda butonlar aktif kalıyor, kullanıcı "çalışmıyor mu?" diye düşünüyor

## ✨ İstenen Değişiklik

`docs/UI_UX_TALIMATLAR_VE_PLAN.md §3.1` P0 maddelerine göre:

1. **Skeleton States:**
   - Aktif strateji kartları için skeleton state
   - Risk/Günlük P&L kartı için skeleton state
   - Sistem Sağlığı widget'ı için skeleton state
   - WS/Executor durum kartı için skeleton state

2. **Boş Durum:**
   - Hiç strateji yokken "Strateji ekle" CTA içeren açıklayıcı boş durum kartı
   - Kullanıcıya "neden boş?" sorusunu cevaplayan kısa metin

3. **Loading Durumları:**
   - Loading durumunda butonların disabled + spinner durumu
   - Veri yenileme sırasında subtle loading indicator

## 📝 Kabul Kriterleri

- [ ] Dashboard'a yavaş API ile girildiğinde (simulated delay), kullanıcı her zaman skeleton görür, beyaz blok görmez
- [ ] Hiç strateji olmayan kullanıcının ekranında "neden boş?" sorusunu cevaplayan kısa metin + "Strateji oluştur" butonu var
- [ ] Loading durumunda tüm interaktif elementler disabled
- [ ] Sidebar'da Dashboard aktif highlight (§3.1 P0)
- [ ] En az 3 ana widget mevcut: "Aktif Stratejiler", "Risk/Günlük P&L", "Sistem Sağlığı" (§3.1 P0)
- [ ] WCAG 2.2 AA uyumluluğu sağlandı
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Ekran görüntüsü/gif eklendi (before/after)
- [ ] Test coverage eklendi (skeleton component test)

## 🎨 Tasarım Notları

- Skeleton şablonu Strategy Lab'te kullanılacak skeleton ile aynı stil ailesinden olmalı
- Renkler mevcut dark theme ile uyumlu, contrast kurallarına uygun (§1.4)
- Spacing: 4'ün katları (§1.3)
- Skeleton animasyonu: subtle pulse effect (göz yormayan)

## 🔗 İlgili Issue/PR

- Epic: EPIC: UI-P0 — Hafta 1-2 Temel İyileştirmeler
- İlgili: UI-P0-002 (Strategy Lab), UI-P0-003 (Portfolio/Market)

## 📚 Referanslar

- [UI/UX Talimatları](../../docs/UI_UX_TALIMATLAR_VE_PLAN.md) §3.1
- [UI/UX İş Akışı](../../docs/UI_UX_WORKFLOW.md)

