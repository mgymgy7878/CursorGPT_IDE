# Spark Trading Platform

> **IC Stickies**: [docs/IC_STICKY_LABELS.txt](docs/IC_STICKY_LABELS.txt) · **Haftalık Drill**: [docs/WEEKLY_DRILL.md](docs/WEEKLY_DRILL.md)

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
- [Docs/All-in-One](docs/SPARK_ALL_IN_ONE.md)
- **[Docs/UI & UX Planı](docs/UI_UX_PLAN.md)**
- **[Docs/UI & UX Backlog](docs/UI_UX_BACKLOG.md)**

## Çalıştırma (lokal)
```bash
pnpm -w --filter web-next dev
# prod (standalone): pnpm -w --filter web-next build && node apps/web-next/.next/standalone/server.js
```

### Windows Build Notu (Standalone)
- Next.js `output: 'standalone'` çıktısı Windows'ta symlink/junction gerektirebilir. **Developer Mode** (Settings → For Developers) açın veya PowerShell'i **Administrator** olarak çalıştırın; alternatif: **WSL/Linux** runner'da build.
- Symlink readiness kontrolü: `powershell -File .\scripts\win_symlink_readiness.ps1`
- Çalıştırma: `node apps/web-next/.next/standalone/server.js`

### CI — Web Next Standalone
[![web-next-standalone](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/web-next-standalone.yml/badge.svg)](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/web-next-standalone.yml)
[![Guard Validate](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml/badge.svg)](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/guard-validate.yml)
[![UI Smoke](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/ui-smoke.yml/badge.svg)](https://github.com/mgymgy7878/CursorGPT_IDE/actions/workflows/ui-smoke.yml)

**WSL Build (lokal):** `bash scripts/build_web_next_wsl.sh`  
**Çalıştırma (self-host):** `node apps/web-next/.next/standalone/server.js`  
**CI Artefact:** Workflow sonunda `web-next-standalone.tgz` indirilir (7 gün saklama)

**Ops:** Error Budget rozeti Dashboard'da görünür. Endpoint: `/api/public/error-budget`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENGINE_URL` | - | Strategy engine health endpoint (optional, fallback to mock) |
| `PROMETHEUS_URL` | - | Prometheus server for real error budget (optional, fallback to mock) |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:3001` | Frontend API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://127.0.0.1:4001` | WebSocket endpoint |
| `NEXT_PUBLIC_GUARD_VALIDATE_URL` | Workflow URL | Guard Validate badge link |

**See:** `apps/web-next/.env.example` for template

**Monitoring:** SLO burn alerts ve Grafana panelleri → [monitoring/README.md](monitoring/README.md) (DRY-RUN template)