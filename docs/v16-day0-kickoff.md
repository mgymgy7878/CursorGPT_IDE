# v1.6 Streams & Optimization - Day-0 Kickoff

## Branch & Feature Flags
```bash
# Create release branch
git checkout -b release/v1.6-start

# Set feature flags
export STREAMS_ENABLE=1
export OPT_LAB_ENABLE=1
export PAPER_TRADE_ENABLE=1
```

## Secrets Configuration
```bash
# Binance WS API keys (read-only)
export BINANCE_WS_API_KEY="your_binance_api_key"
export BINANCE_WS_SECRET="your_binance_secret"

# BTCTurk WS API keys (read-only)
export BTCTURK_WS_API_KEY="your_btcturk_api_key"
export BTCTURK_WS_SECRET="your_btcturk_secret"

# Slack webhooks
export SLACK_WEBHOOK_ALERTS="https://hooks.slack.com/services/YOUR/ALERTS/WEBHOOK"
export SLACK_WEBHOOK_STREAMS="https://hooks.slack.com/services/YOUR/STREAMS/WEBHOOK"
```

## Ports & Services
- **Executor**: 4001 (WS streams, optimization engine)
- **Web-next**: 3003 (SSE /api/events, paper trading UI)
- **SSE Events**: /api/events (5s heartbeat)

## PM2 Health Checks
```javascript
// ecosystem.config.cjs - Enhanced health checks
health_check: {
  url: 'http://127.0.0.1:4001/__ping',
  interval: 30000,
  timeout: 5000,
  retries: 3
}
```

## Environment Variables
```bash
# Streams configuration
export WS_RECONNECT_INTERVAL=5000
export WS_BACKPRESSURE_LIMIT=1000
export WS_CLOCK_DRIFT_THRESHOLD=1000

# Optimization Lab
export OPT_MAX_CONCURRENT=4
export OPT_BUDGET_LIMIT=1000
export OPT_EARLY_STOP_PLATEAU=10

# Paper Trading
export PAPER_INITIAL_CAPITAL=10000
export PAPER_COMMISSION=0.001
export PAPER_SLIPPAGE=0.0005
export PAPER_T_PLUS_ONE=true
```

## Day-0 Checklist
- [ ] Branch created: `release/v1.6-start`
- [ ] Feature flags set: `STREAMS_ENABLE=1`, `OPT_LAB_ENABLE=1`
- [ ] Secrets configured: Binance/BTCTurk WS API keys
- [ ] Ports available: 4001 (executor), 3003 (web-next)
- [ ] PM2 health checks configured
- [ ] Environment variables set
- [ ] Slack webhooks configured
- [ ] SSE /api/events endpoint accessible
