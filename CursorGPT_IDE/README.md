# Spark Trading Platform

A comprehensive trading platform with backtesting, strategy development, and real-time monitoring capabilities.

## Quick Links

- 📋 [Roadmap](docs/roadmap/PROJE_YOL_HARITASI_2025-09-09.md) - Project roadmap and milestones
- 🧪 [Strategy Lab](apps/web-next/README.md) - Strategy development and backtesting
- 🔌 [API Documentation](services/executor/README.md) - REST API endpoints
- 🔧 [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Architecture

- **Frontend**: Next.js 14 (apps/web-next)
- **Backend**: Fastify (services/executor)
- **Monitoring**: Prometheus + Grafana
- **Process Management**: PM2

## Quick Start

```bash
# Install dependencies
pnpm -w install

# Start development
pnpm -w run dev

# Build for production
pnpm -w build
```

## Services

- **Web UI**: http://localhost:3003
- **API**: http://localhost:4001
- **Metrics**: http://localhost:4001/metrics

## v1.4.1 Release Notes

- ✅ Executor health check and metrics
- ✅ Web-next Next.js modül sorunu çözüldü
- ✅ Strategy Lab API çalışıyor
- ✅ Prometheus metrics toplama
- ✅ Fusion Gate risk yönetimi
- ✅ CI Guard JSON validation

## Development

See individual service READMEs for detailed setup instructions.