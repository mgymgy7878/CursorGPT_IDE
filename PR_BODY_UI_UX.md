## Özet

NN/g kullanılabilirlik prensipleri + WCAG 2.2 AA talimatları, sayfa bazlı backlog ve ölçülebilir kabul kriterleri eklendi.

## Yeni Dokümanlar

- **docs/UI_UX_PLAN.md** — Stratejik hedefler, sayfa bazlı iş listesi, bileşen kuralları, test kriterleri
- **docs/UI_UX_BACKLOG.md** — Önceliklendirilmiş P0/P1/P2 işler
- **README.md** — UI/UX planı bağlantıları eklendi

## Kabul Kriterleri

- ✅ Kontrast ≥ 4.5:1 (WCAG AA)
- ✅ TAB ile tüm CTA'lara erişim
- ✅ Form alan-altı hata mesajları
- ✅ Skeleton/empty states (Dashboard, Lab, Portföy)
- ✅ Lighthouse a11y ≥ 90
- ✅ Axe kritik ihlal: 0

## Evidence

Evidence klasörü: `evidence/ui-ux/<YYYYMMDD>/`
- Axe JSON sonuçları
- Lighthouse JSON sonuçları
- Screenshot'lar

## Sonraki Adımlar

1. CI checks bekle (Lighthouse/Axe otomatik)
2. Evidence topla (smoke + screenshots)
3. PR ready + review
4. Merge → UI implementation sprints başlasın

---

**Commit:** 1b44cb06  
**Branch:** docs/ui-ux-plan  
**Type:** Documentation (no code changes)

