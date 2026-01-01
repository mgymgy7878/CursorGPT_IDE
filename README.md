# Spark Trading Platform

AI destekli, çoklu borsa (Binance/BTCTurk/BIST) entegrasyonuna sahip, strateji üreten ve risk kontrollü çalışan trading platformu.

## Hızlı Durum
- **D1 (Export + Error Pages + Audit):** PASS
- **D2 (BTCTurk WS + Pause/Resume + Metrics):** SMOKE geçildi (ticker akışı, staleness, pause/resume)
- **UI (Figma Golden Master):** Dashboard/MarketData temel parity tamam; kalanlar docs/UI_UX_PLAN.md backlog'da.

## Belgeler
- [Docs/Features](docs/FEATURES.md)
- [Docs/Architecture](docs/ARCHITECTURE.md)
- [Docs/Roadmap](docs/ROADMAP.md)
- [Docs/API](docs/API.md)
- [Docs/Metrics & Canary](docs/METRICS_CANARY.md)
- [Docs/UI & UX Planı](docs/UI_UX_PLAN.md)

## Çalıştırma (lokal)
```bash
pnpm -w --filter web-next dev
# prod:
pnpm -w --filter web-next build
pnpm -w --filter web-next start
```

## Audit / Smoke
- **D1 Audit:** `powershell -NoProfile -ExecutionPolicy Bypass -File .\audit_d1.ps1`
- **D2 Smoke:** bkz. docs/METRICS_CANARY.md

## Proje Yapısı
```
apps/
  web-next/          # Next.js 14 Ana UI
  executor/          # Python strateji çalıştırıcı
packages/
  shared-types/      # TypeScript shared tipler
  ui/                # Paylaşılan UI bileşenleri
docs/                # Dokümantasyon
scripts/             # Otomasyon & yardımcı scriptler
```

## Teknoloji Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Python (executor)
- **Real-time:** WebSocket (Binance, BTCTurk)
- **Observability:** Custom metrics endpoint, Prometheus-ready

## Katkıda Bulunma
Bkz. [CONTRIBUTING.md](CONTRIBUTING.md)

## Lisans
Proprietary - Tüm hakları saklıdır.
