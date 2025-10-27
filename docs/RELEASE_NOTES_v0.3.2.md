# Spark v0.3.2 — Release Notes

## Highlights
- Private API (Binance Spot Testnet), write guard (LIVE_DISABLED)
- Advanced orders: OCO/STOP, Cancel-All
- Precision & Idempotency, Replace
- Symbol Auto-Sync + Diff Analyzer
- WS + Risk + PnL real-time
- CI + Secret Guard GREEN

## Proof Links (runtime/)
- Green-Gate, Canary logs, Metrics snapshots
- UI-RESCUE, ROOT-CAUSE bundles

## Upgrade Guide
1) `.env.local`: TRADE_MODE=testnet, LIVE_ENABLED=false
2) `pnpm install && pnpm run build`
3) Canary-48h başlat

## Features
- **Private API Integration**: Binance Spot Testnet HMAC authentication
- **Advanced Order Types**: OCO, STOP, Cancel-All operations
- **Precision Handling**: MinNotional clamp, quantity rounding
- **Idempotency**: Duplicate order prevention
- **Symbol Management**: Auto-sync discovery, diff analysis
- **Real-time Monitoring**: WebSocket feeds, risk rules, PnL tracking

## Security
- Write guard: LIVE_ENABLED=false enforcement
- Testnet-only operations
- HMAC signature validation
- Rate limiting protection

## Monitoring
- Prometheus metrics integration
- Grafana dashboard templates
- Canary-48h automated testing
- Error rate monitoring

## CI/CD
- Automated changelog generation
- GitHub Actions release workflow
- Secret Guard integration
- Artifact bundling

## Breaking Changes
None - this is a feature release with backward compatibility.

## Known Issues
- TypeScript import path warnings (non-blocking)
- ESLint configuration requires manual setup per package

## Support
- Runtime logs: `runtime/logs/`
- Canary results: `runtime/canary/`
- Metrics: `/api/public/metrics/prom`
- Health check: `/api/public/health` 