# Web-Next V2

Yeni nesil Spark Trading Platform UI - Next.js App Router + Tailwind + shadcn/ui

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Geliştirme sunucusunu başlat (port 3004)
pnpm dev

# Production build
pnpm build
pnpm start
```

## Özellikler

- ✅ Next.js App Router (file-based routing)
- ✅ Tailwind CSS (utility-first CSS)
- ✅ shadcn/ui (Radix primitives)
- ✅ Framer Motion (animasyonlar)
- ✅ CSP Middleware (dev/prod ayrımı)
- ✅ WCAG 2.2 uyumlu (Target Size ≥24px)

## Yapı

```
apps/web-next-v2/
├── app/
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   └── grid.tsx
│   ├── ui/
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   └── navigation-menu.tsx
│   ├── sidebar.tsx
│   └── topbar.tsx
├── lib/
│   └── utils.ts
└── middleware.ts
```

## CSP

- **DEV**: `unsafe-inline`/`unsafe-eval` (React Refresh için)
- **PROD**: Nonce tabanlı strict CSP

## Referanslar

- [Next.js: App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://www.radix-ui.com)

