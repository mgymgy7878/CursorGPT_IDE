## ROADMAP — 4 Sprint
- **Sprint 1:** Strategy IR + NL Compiler (zod, domain sözlüğü, `/api/strategy/nl-compile`)
- **Sprint 2:** Backtest + Optimize (`/api/strategy/backtest`, `/api/strategy/optimize`; PnL/Sharpe/MaxDD/WinRate; grid+bayes)
- **Sprint 3:** Guardrails + Canary (`/api/strategy/canary`, `/api/strategy/deploy`; PASS: staleness<3s, ws_error_rate<1%, p95<800ms, Δmsgs_total≥1)
- **Sprint 4:** Runtime orkestrasyon + WS genişleme (Trades/OrderBook sayaçları; health dashboard; audit)
