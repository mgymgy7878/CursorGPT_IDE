# Spark Trading Platform

[![UI/UX Guide](https://img.shields.io/badge/UI%2FUX-Guide-blue)](docs/UI_UX_GUIDE.md)

## Quick Links / Docs

- [**UI/UX Guide**](docs/UI_UX_GUIDE.md) — Hızlı başlangıç / özet yönlendirme (Plan → Playbook → Guardrails)
- [**UI & UX Planı**](docs/UI_UX_PLAN.md) — **Tek kaynak:** arayüz standardı + backlog + kabul kriterleri (NN/g + WCAG 2.2 AA + veri-viz best practices)
- [**UI/UX Playbook**](docs/UX/UI_UX_PLAYBOOK.md) — Plan'dan türetilmiş uygulama sözleşmesi (loading/error/empty/success + regresyon matrisi)
- [**UI Guardrails**](docs/UI_GUARDRAILS.md) — Enforcement/sigorta: CI + görsel smoke + DoD checklist
- **Raporlar**: [2025-01-14 Detaylı Proje Analizi](docs/reports/PROJE_ANALIZ_2025_01_14_DETAYLI_TAM_RAPOR.md)

### Belgeler

- [Docs/Features](docs/FEATURES.md)
- [Docs/Architecture](docs/ARCHITECTURE.md)
- [Docs/Roadmap](docs/ROADMAP.md)
- [Docs/API](docs/API.md)
- [Docs/Metrics & Canary](docs/METRICS_CANARY.md)
- [Docs/UI & UX Planı](docs/UI_UX_PLAN.md)
- [Docs/UI/UX Playbook](docs/UX/UI_UX_PLAYBOOK.md)
- [Docs/UI Guardrails](docs/UI_GUARDRAILS.md)

### Development Tools

- **Chart Series Helper**: `apps/web-next/src/lib/charts/chartSeries.ts` - Lightweight Charts v5 compat wrapper (tek yerden seri ekleme)
- **Error Classifier**: `apps/web-next/src/lib/errorClassifier.ts` - Hata sınıflandırması (Executor OFFLINE, Upstream 5xx, Network)
- **Chart API Drift Check**: `pnpm -C apps/web-next check:charts-api` - v4 API kullanımını yakalar

### GREEN Receipt (v1.6-p1)

- **Streams Service**: `services/streams/` - WebSocket streams with Prometheus metrics
- **Alert Rules**: `rules/streams.yml` - Prometheus alert rules for streams monitoring
- **Grafana Dashboard**: `grafana-dashboard.json` - Import ready dashboard with 3 panels
- **CI Metrics Guard**: `.github/workflows/metrics-guard.yml` - Automated metrics validation
- **Health Check**: `scripts/health-check.sh` - Multi-service health validation

### Services

- **Web**: Next.js frontend (port 3003)
- **Executor**: Trading engine (port 4001)
- **Streams**: WebSocket data feeds (port 4001)
- **Marketdata**: Market data orchestrator

### Monitoring

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboards and visualization
- **Health Checks**: Automated service validation

### Development

```bash
# Start all services
pnpm -w install
pnpm -w build
pnpm -w dev

# Health check
./scripts/health-check.sh

# Metrics validation
curl http://127.0.0.1:4001/metrics | grep ws_msgs_total
```

### Admin Configuration (v1.4.3+)

Backtest write operations require admin authentication:

```bash
# 1. Generate admin token
openssl rand -hex 32

# 2. Set environment variable
export ADMIN_TOKEN="your-generated-token"

# 3. Start executor
pnpm --filter @spark/executor dev

# 4. Enable UI admin features
export NEXT_PUBLIC_ADMIN_ENABLED=true
pnpm --filter @spark/web-next dev

# 5. Set token in browser
localStorage.setItem("admin-token", "your-generated-token")
```

**Security Notes:**

- Never commit `ADMIN_TOKEN` to git
- Use strong tokens (≥32 bytes random)
- Rotate tokens regularly
- Audit logs: `logs/audit/backtest_*.log`

### Production Deployment

- **Docker Compose**: Multi-service orchestration
- **Nginx**: Reverse proxy with `/streams/metrics` route
- **Prometheus**: Scrape config for all services
- **Grafana**: Dashboard import from `grafana-dashboard.json`
