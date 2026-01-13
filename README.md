# Spark Trading Platform

[![UI/UX Guide](https://img.shields.io/badge/UI%2FUX-Guide-blue)](docs/UI_UX_GUIDE.md)

## Quick Links / Docs

- [**UI/UX Guide**](docs/UI_UX_GUIDE.md) — UI standartları, erişilebilirlik kuralları, bileşen standartları ve 2 haftalık uygulama planı
- [**UI & UX Planı**](docs/UI_UX_PLAN.md) — UI/UX playbook (WCAG 2.2 AA, NN/g heuristics, tasarım ilkeleri, bileşen kuralları, sayfa backlog'u)
- [**UI Guardrails**](docs/UI_GUARDRAILS.md) — UI regressions'ı engelleyen sigorta mekanizmaları (Token Lockdown, Visual Smoke, DoD Checklist)
- **Raporlar**: [2025-01-14 Detaylı Proje Analizi](docs/reports/PROJE_ANALIZ_2025_01_14_DETAYLI_TAM_RAPOR.md)

### Belgeler

- [Docs/Features](docs/FEATURES.md)
- [Docs/Architecture](docs/ARCHITECTURE.md)
- [Docs/Roadmap](docs/ROADMAP.md)
- [Docs/API](docs/API.md)
- [Docs/Metrics & Canary](docs/METRICS_CANARY.md)
- [Docs/UI & UX Planı](docs/UI_UX_PLAN.md)
- [Docs/UI Guardrails](docs/UI_GUARDRAILS.md)

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
