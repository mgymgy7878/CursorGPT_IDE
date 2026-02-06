# Spark — Agent Talimatları (Tek Doğru Kaynak)

Bu dosya Codex, Cursor Agent ve diğer AI araçları için tek referans kaynaktır.

## Komutlar (pnpm monorepo)

```bash
pnpm -w install                    # Bağımlılıklar
pnpm -w build                      # Tüm paketler
pnpm -w --filter web-next dev      # Web UI (port 3003)
pnpm -w --filter web-next test     # Jest testleri
pnpm -w --filter web-next build    # Next.js build
```

## Kurallar

### SSR-safe

- `window` / `document` doğrudan kullanılmaz; `typeof window !== 'undefined'` kontrolü veya `"use client"`.
- Sayfa bileşenleri: dynamic import `ssr: false` veya loading boundary.

### Locale / Format

- Sayı/para: `formatNumber`, `formatMoney`, `formatPrice` (lib/format.ts).
- Varsayılan locale: tr-TR.
- Bkz. docs/UI_UX_PLAN.md §5 Para sembolü politikası.

### Canlı Etki

- Trade, iptal, pozisyon kapatma gibi gerçek aksiyonlar için onay gerekir.
- Sadece kod/test/build değişikliği yapıyorsan bu kısıt yok.

## Evidence Rutini

- P0 değişiklik: evidence/\* altında screenshot + kısa not.
- Test: `pnpm -C apps/web-next test` yeşil olmalı.

## Referanslar

- docs/UI_UX_PLAN.md — UI standardı, backlog, kabul kriterleri
- docs/INFORMATION_ARCHITECTURE.md — Sayfa yapısı
