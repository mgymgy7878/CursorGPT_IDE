# Spark Trading Platform

AI destekli, çoklu borsa entegrasyonuna sahip, strateji üreten ve risk kontrollü çalışan trading platformu.

## Hızlı Durum
- **D1**: PASS
- **D2**: SMOKE geçildi (ticker akışı, staleness, pause/resume)

## Belgeler
- [Docs/Features](docs/FEATURES.md)
- [Docs/Architecture](docs/ARCHITECTURE.md)
- [Docs/Roadmap](docs/ROADMAP.md)
- [Docs/API](docs/API.md)
- [Docs/Metrics & Canary](docs/METRICS_CANARY.md)

## Çalıştırma (lokal)
```bash
pnpm -w --filter web-next dev
# prod (standalone): pnpm -w --filter web-next build && node apps/web-next/.next/standalone/server.js
```