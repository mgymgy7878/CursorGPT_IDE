# Spark Trading Platform — Monorepo (Next.js 14 + Node/TS)

> Not: Güncellenmiş kapsamlı proje yol haritası ve sayfa akış planı için bkz. `docs/roadmap/PROJE_YOL_HARITASI_2025-09-09.md`

## Docs / Quick Links

- Kapsamlı Yol Haritası (2025-09-09): `docs/roadmap/PROJE_YOL_HARITASI_2025-09-09.md`
- Roadmap (üst seviye): `Roadmap.md`
- Arayüz Geliştirme Planı: `ARAYUZ_GELISTIRME_PLANI.md`

## Hızlı Başlangıç

```bash
pnpm -w install
pnpm --filter @spark/types run build
pnpm --filter @spark/exchange-btcturk run build
pnpm --filter executor run build
pnpm --filter web-next run dev   # :3003
pnpm --filter executor run dev   # :4001
```

## Ortam Değişkenleri

Kök `.env` veya app/service bazında `.env.local` kullanın. Örnekler: `env.example`, `.env.local.example`.

## Proxy Mimarisi

Web → `/api/executor/*` → Executor (4001). Rewrites + yedek proxy route ile çalışır.

## Sağlık & Metrikler

- **UI Ping**: `/api/public/ping`
- **Executor**: `http://127.0.0.1:4001/health`, `/metrics`

## Canary (Dry-Run)

`/canary/run` sadece dry-run ile; canlı etkiler onaylıdır.

## Geliştirici Notları

### Keybinding Ayarları

Shift+Backspace sorunu için `.vscode/keybindings.json` dosyası kişisel olarak oluşturulabilir. Bu dosya .gitignore'da olduğu için repo'ya dahil edilmez.

### CSS Pipeline

Tailwind v3 classic profile kullanılıyor. PostCSS/Tailwind config karışıklığını önlemek için guard'lar aktif:

- `pnpm guard:postcss` - Tek config dosyası kontrolü
- `pnpm guard:ts-types` - TypeScript types kontrolü

### Smoke Testler

`pnpm smoke` - UI ve Executor health check'leri tek komutla
