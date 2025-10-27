# Proje Checklist — Spark Trading Platform

## Tamamlananlar
- 2025-08-10: Strategy Lab geliştirmeleri ve UI (Top‑N, OptimizeSettings, SaveLoadBar) — `apps/web-next/pages/strategy-lab.tsx`, `apps/web-next/components/StrategyLab/*`
- 2025-08-10: Metrikler ve Gözlem — `/api/metrics`, `/api/metrics/stream`, `/api/metrics/prom`; `apps/web-next/pages/Gozlem.tsx`
- 2025-08-10 21:14: Ayarlar ve Portföy sayfaları — `apps/web-next/pages/Ayarlar.tsx`, `apps/web-next/pages/PortfoyYonetimi.tsx`
- 2025-08-09 17:22: Monorepo genişleme ve strateji API’leri — `pages/api/strategy/*`, `tsconfig.base.json`, `apps/web-next/*`
- 2025-08-13: Dev Dock (SSE Log Viewer + Metrics Mini) aktif; ana sayfa 200 OK — `apps/web-next/components/*`, `/`

## Sıradakiler (v1.2)
- Router konsolidasyonu Sprint‑1: health/metrics/kök UI app router’a — tag: `router_mig_s1_done`
- Edge‑safe auth: `apps/web-next/middleware.ts` `jsonwebtoken` → `jose` veya route-level doğrulama
- CI: typecheck, build, prom-lint, Playwright smoke — `.github/workflows/ci.yml`
- Grafana dashboard JSON: `ops/grafana/dashboards/spark-core.json`; Alertmanager (opsiyonel)
- Cleanup (dry‑run): `components/components`, `contexts/contexts`, `docs/docs`, `lib/lib`, `__tests__/__tests__`, `apps/web-next/apps/web-next`

## Bekleyen/Askıda
- Binance WS’in `portfolioHub` ile doğrudan entegrasyonu (delay p95/p99, publish/skip ayrımı)
- Portföy UI delta-highlight, skeleton ve render azaltma
- Rate‑limit bütçe görselleştirmesi ve kapasite planlama rehberi

## Notlar
- Çalışma portu: `apps/web-next` → 3003 (`npm --prefix apps/web-next run dev`).
- Güvenlik: `DASH_API_KEY` varsa `x-api-key` zorunlu; `.secrets/*.json` otomatik yönetilir.
- Telemetri: `/api/metrics/prom` Prometheus; Gözlem sayfası 1 Hz SSE ile güncel. 