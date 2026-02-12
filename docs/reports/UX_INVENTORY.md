# UX Inventory

## Routes

| path | inNav |
| --- | --- |

## Nav Items
- /
- /audit
- /dashboard
- /portfolio
- /settings
- /strategy-lab

## API Routes (MOCK/REAL & usage)

| route | type | used |
| --- | --- | --- |

### Unused API
- none

### Used but not implemented
- /api/copilot/action
- /api/backtest/run
- /api/backtest/walkforward
- /api/backtest/portfolio
- /api/reports/manifest
- /api/audit/push
- /api/marketdata/candles?symbol=${symbol}&timeframe=${tf}&limit=300&ts=${Date.now()}
- /api/alerts/create
- /api/alerts/preview
- /api/alerts/control
- /api/backtest/jobs/status
- /api/backtest/jobs/report
- /api/reports/sign
- /api/tools/metrics/breaches?hours=${hours}${severityParam}
- /api/audit/list
- /api/tools/get_metrics
- /api/tools/metrics/timeseries?window=${selectedWindow}
- /api/copro/summary
- /api/canary/run
- /api/lab/publish
- /api/evidence/zip
- /api/snapshot/export
- /api/healthz
- /api/tools/get_orders
- /api/strategy/control
- /api/guardrails/read
- /api/public/smoke/history?cursor=${encodeURIComponent(cur)}&limit=20
- /api/lab/backtest
- /api/lab/optimize
- /api/ai/strategy
- /api/model/baseline
- /api/guardrails/evaluate
- /api/model/promote
- /api/guardrails/approve
- /api/advisor/progress
- /api/advisor/suggest
- /api/tools/get_status
- /api/optimizer/progress?jobId=${encodeURIComponent(jobId)}
- /api/strategies/list
- /api/public/strategies-mock
- /api/strategies/create
- /api/strategies/${id}
- /api/public/strategies-mock/${id}
- /api/strategies/${id}/status
- /api/public/strategies-mock/${id}/status
- /api/tools/canary
- /api/tools/risk-report?emitZip=true
- /api/tools/kill-switch/toggle
- /api/tools/metrics?format=prometheus
- /api/tools/metrics/timeseries?window=1h

## i18n Keys (detected)
- audit.map

### Missing i18n
- audit.map

## HTTP Probe
Server up: YES

| path | status |
| --- | --- |
| / | 200 |
| /dashboard | 404 |
| /portfolio | 200 |
| /strategy-lab | 200 |
| /strategy-lab-copilot | 200 |
| /strategies | 200 |
| /audit | 404 |
| /observability | 404 |
| /settings | 200 |
| /news | 200 |
| /macro | 200 |
