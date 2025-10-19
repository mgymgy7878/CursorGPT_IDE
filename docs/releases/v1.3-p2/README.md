# V1.3-P2 • UI Polish Pack Release

**Durum:** ✅ Tamamlandı  
**Tarih:** 2025-10-18  
**Branch:** `feature/v1.3-p2-ui-polish`

## Hızlı Özet

8 dosyada UI tutarlılık ve cilalama:
- `.num-tight` utility → sayısal metinler kompakt
- i18n anahtarları → cmdk, connected, active, paused, error
- Tailwind `colors.status.*` token hiyerarşisi
- FAB OS tespiti + safe-area fix
- Portfolio/Dashboard USD formatı TR'ye çevrildi

## Dosyalar

| Dosya | İçerik |
|-------|--------|
| `V1.3-P2_COMMIT_MESSAGE.md` | Commit mesajı + git komutları |
| `V1.3-P2_PR_DESCRIPTION.md` | PR açıklaması (GitHub/GitLab için) |

## Test Sonuçları

- **TypeCheck:** ✅ 0 error
- **Lint:** ✅ 0 warning
- **Dev Server:** ✅ localhost:3003
- **Risk Profili:** 🟢 Düşük

## Manuel QA

- [ ] Dashboard → P95/Staleness sayılar hizalı
- [ ] Portfolio → "Bağlı/Aktif" TR, USD "42.500,00 $"
- [ ] FAB → macOS/Win label doğru
- [ ] Mobile → safe-area etkin

## Commit Komutu

```bash
cd C:\dev
git checkout -b feature/v1.3-p2-ui-polish
git add apps/web-next/src/app/globals.css \
        apps/web-next/src/lib/i18n.ts \
        apps/web-next/tailwind.config.ts \
        apps/web-next/src/components/layout/FloatingActions.tsx \
        apps/web-next/src/app/portfolio/page.tsx \
        apps/web-next/src/components/portfolio/OptimisticPositionsTable.tsx \
        apps/web-next/src/app/dashboard/page.tsx \
        apps/web-next/src/components/ui/Metric.tsx
git commit -F docs/releases/v1.3-p2/V1.3-P2_COMMIT_MESSAGE.md
git push origin feature/v1.3-p2-ui-polish
```

## İlgili Dosyalar

- [Commit Mesajı](./V1.3-P2_COMMIT_MESSAGE.md)
- [PR Açıklaması](./V1.3-P2_PR_DESCRIPTION.md)
- [P3 Planı](../V1.3-P3_PLAN_DRAFT.md)

