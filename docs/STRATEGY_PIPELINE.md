# Strategy Pipeline Documentation

## Overview

The Spark Trading Platform Strategy Pipeline provides an end-to-end workflow for creating, testing, and deploying AI-powered trading strategies. The pipeline consists of five main stages:

1. **Strategy Generation** - AI-powered strategy creation from natural language prompts
2. **DSL Validation** - Domain Specific Language validation and schema checking
3. **Code Generation** - Automatic TypeScript strategy module generation
4. **Backtesting** - Historical performance testing with comprehensive metrics
5. **Paper Trading** - Live simulation with risk management and monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Strategy      │    │   DSL Schema    │    │   Code          │
│   Generation    │───▶│   Validation    │───▶│   Generation    │
│   (AI/LLM)      │    │   (Ajv/Zod)     │    │   (TypeScript)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Paper         │    │   Backtest      │    │   Strategy      │
│   Trading       │◀───│   Engine        │◀───│   Execution     │
│   (Binance)     │    │   (OHLCV)       │    │   (Runtime)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## DSL Schema

### Core Structure

```json
{
  "name": "Strategy Name",
  "description": "Strategy description",
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "indicators": {
    "sma": { "period": 20, "source": "close" },
    "rsi": { "period": 14, "source": "close" }
  },
  "conditions": {
    "rsi_oversold": { "type": "rsi_oversold", "operator": "<", "value": 30 }
  },
  "rules": {
    "entry": [
      { "condition": "rsi_oversold", "action": "BUY", "quantity": 0.01, "price": "MARKET" }
    ],
    "exit": [
      { "condition": "rsi_overbought", "action": "CLOSE_LONG", "quantity": 0.01, "price": "MARKET" }
    ]
  },
  "risk": {
    "riskPct": 2.0,
    "maxPos": 1,
    "maxDailyLoss": 100,
    "stopLoss": 5.0,
    "takeProfit": 10.0
  }
}
```

### Supported Indicators

| Indicator | Parameters | Description |
|-----------|------------|-------------|
| `sma` | `period`, `source` | Simple Moving Average |
| `ema` | `period`, `source` | Exponential Moving Average |
| `rsi` | `period`, `source` | Relative Strength Index |
| `atr` | `period` | Average True Range |

### Supported Conditions

| Condition | Parameters | Description |
|-----------|------------|-------------|
| `price_above_sma` | `operator`, `indicator`, `period` | Price comparison with indicator |
| `rsi_oversold` | `operator`, `value` | RSI oversold condition |
| `rsi_overbought` | `operator`, `value` | RSI overbought condition |
| `cross_up` | `indicator1`, `indicator2` | Indicator crossover up |
| `cross_down` | `indicator1`, `indicator2` | Indicator crossover down |

### Risk Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `riskPct` | 0.1-10% | Risk percentage per trade |
| `maxPos` | 1-10 | Maximum open positions |
| `maxDailyLoss` | 1-1000 USD | Maximum daily loss limit |
| `stopLoss` | 0.1-50% | Stop loss percentage |
| `takeProfit` | 0.1-100% | Take profit percentage |

## API Endpoints

### Strategy Generation

```http
POST /api/public/strategy/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "Create a mean reversion strategy using RSI with oversold/overbought levels at 30/70"
}
```

**Response:**
```json
{
  "ok": true,
  "dsl": { /* Generated DSL */ },
  "message": "Strategy generated successfully"
}
```

### Strategy Build

```http
POST /api/public/strategy/build
Content-Type: application/json
Authorization: Bearer <token>

{
  "dsl": { /* Strategy DSL */ }
}
```

**Response:**
```json
{
  "ok": true,
  "artifactId": "ART-MACROSS-abc123",
  "metadata": {
    "name": "MA Cross Strategy",
    "symbol": "BTCUSDT",
    "timeframe": "1h",
    "indicators": ["sma", "ema"],
    "riskParams": { /* Risk configuration */ }
  }
}
```

### Backtest

```http
POST /api/public/strategy/backtest
Content-Type: application/json
Authorization: Bearer <token>

{
  "artifactId": "ART-MACROSS-abc123",
  "symbol": "BTCUSDT",
  "startDate": "2024-01-01",
  "endDate": "2024-08-01",
  "initialCapital": 10000
}
```

**Response:**
```json
{
  "ok": true,
  "artifactId": "ART-MACROSS-abc123",
  "report": {
    "summary": {
      "totalReturn": 15.5,
      "totalPnL": 1550,
      "maxDrawdown": 8.2,
      "winRate": 65.5,
      "sharpeRatio": 1.8,
      "totalTrades": 45,
      "winningTrades": 30,
      "losingTrades": 15,
      "avgWin": 120,
      "avgLoss": -80,
      "profitFactor": 1.6
    },
    "metadata": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-08-01T00:00:00Z",
      "initialCapital": 10000,
      "finalCapital": 11550,
      "duration": 213
    }
  }
}
```

### Paper Trading Deployment

```http
POST /api/public/strategy/deploy-paper
Content-Type: application/json
Authorization: Bearer <token>

{
  "artifactId": "ART-MACROSS-abc123",
  "symbol": "BTCUSDT",
  "risk": {
    "maxPos": 1,
    "dailyLossCap": 100
  }
}
```

**Response:**
```json
{
  "ok": true,
  "runId": "RUN-ART-MACROSS-abc123-1234567890",
  "artifactId": "ART-MACROSS-abc123",
  "symbol": "BTCUSDT",
  "message": "Paper trading deployed successfully",
  "risk": {
    "maxPos": 1,
    "dailyLossCap": 100
  }
}
```

## Backtest Metrics

### Performance Metrics

| Metric | Description | Formula |
|--------|-------------|---------|
| **Total Return** | Overall percentage return | `(FinalCapital - InitialCapital) / InitialCapital * 100` |
| **Total P&L** | Absolute profit/loss | `FinalCapital - InitialCapital` |
| **Max Drawdown** | Maximum peak-to-trough decline | `max((Peak - Current) / Peak * 100)` |
| **Win Rate** | Percentage of winning trades | `WinningTrades / TotalTrades * 100` |
| **Sharpe Ratio** | Risk-adjusted return | `(AvgReturn - RiskFreeRate) / StdDev` |
| **Profit Factor** | Ratio of gross profit to gross loss | `GrossProfit / GrossLoss` |

### Risk Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| **Max Drawdown** | Maximum portfolio decline | < 20% (Conservative) |
| **Sharpe Ratio** | Risk-adjusted performance | > 1.0 (Good) |
| **Win Rate** | Trade success rate | > 50% (Acceptable) |
| **Profit Factor** | Profit to loss ratio | > 1.5 (Good) |

## Risk Management

### Position Limits

- **Maximum Positions**: Configurable per strategy (1-10)
- **Daily Loss Cap**: Maximum daily loss in USD
- **Cooldown Period**: Minimum time between trades (60s default)

### Kill Switch

The system includes a kill switch mechanism for emergency situations:

```bash
# Enable kill switch
export TRADING_KILL_SWITCH=1

# Disable kill switch
export TRADING_KILL_SWITCH=0
```

When enabled, all paper trading deployments return 503 Service Unavailable.

### Environment Variables

```bash
# Binance Testnet Configuration
BINANCE_TESTNET_API_KEY=your_api_key
BINANCE_TESTNET_API_SECRET=your_api_secret

# Risk Management
RISK_MAX_POS=1
RISK_DAILY_LOSS_CAP=100
RISK_COOLDOWN_MS=60000

# Authentication
EXECUTOR_AUTH_MODE=bearer
EXECUTOR_TOKEN=dev-secret-change-me

# Kill Switch
TRADING_KILL_SWITCH=0
```

## Monitoring & Metrics

### Prometheus Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `spark_strategy_generate_total` | Counter | `status` | Strategy generation attempts |
| `spark_strategy_build_total` | Counter | `status` | Strategy build attempts |
| `spark_strategy_backtest_total` | Counter | `status` | Backtest executions |
| `spark_strategy_backtest_duration_seconds` | Histogram | `strategy` | Backtest duration |
| `spark_strategy_paper_deploy_total` | Counter | `status` | Paper trading deployments |
| `spark_strategy_failures_total` | Counter | `stage`, `reason` | Pipeline failures |

### Grafana Dashboard

The strategy pipeline includes a dedicated Grafana dashboard (`ops/grafana/spark-proxy-dashboard.json`) with panels for:

- Strategy generation success rate
- Build and backtest performance
- Paper trading deployment status
- Pipeline failure analysis
- Risk management alerts

## Testing

### Reference Strategies

The pipeline includes three reference strategies for testing:

1. **MA Cross Strategy** (`packages/strategy-dsl/examples/ma-cross.json`)
   - Moving average crossover strategy
   - 20-period SMA vs 50-period EMA
   - Trend following approach

2. **RSI Reversal Strategy** (`packages/strategy-dsl/examples/rsi-reversal.json`)
   - RSI-based mean reversion
   - Oversold/overbought levels at 30/70
   - 14-period RSI

3. **Breakout Strategy** (`packages/strategy-dsl/examples/breakout.json`)
   - ATR-based volatility breakout
   - Price action with support/resistance
   - Momentum following

### Test Scripts

```bash
# Run backtest tests
scripts/run-backtest.cmd

# Test paper trading deployment
scripts/deploy-paper.cmd

# Test strategy pipeline end-to-end
scripts/test-proxy.cmd
```

## Troubleshooting

### Common Issues

1. **DSL Validation Errors**
   - Check schema compliance
   - Verify indicator parameters
   - Ensure required fields are present

2. **Backtest Failures**
   - Verify OHLCV data availability
   - Check strategy logic implementation
   - Review risk parameter ranges

3. **Paper Trading Issues**
   - Confirm Binance testnet API credentials
   - Check risk limit configurations
   - Verify kill switch status

4. **Authentication Errors**
   - Validate bearer token
   - Check API key permissions
   - Verify HMAC signature (if using HMAC mode)

### Debug Endpoints

```http
# Check system health
GET /api/public/health

# View metrics
GET /api/public/metrics/prom

# Test authentication
POST /api/public/strategy/generate
```

## Security Considerations

1. **API Key Management**
   - Store keys securely (environment variables)
   - Rotate keys regularly
   - Use testnet for development

2. **Risk Controls**
   - Implement position limits
   - Set daily loss caps
   - Use kill switch for emergencies

3. **Data Protection**
   - Mask sensitive data in logs
   - Encrypt API communications
   - Implement request tracing

## Future Enhancements

1. **LLM Integration**
   - OpenAI GPT-4 for strategy generation
   - Claude for detailed analysis
   - Local model support

2. **Advanced Indicators**
   - Bollinger Bands
   - MACD
   - Stochastic Oscillator
   - Custom indicators

3. **Live Trading**
   - Binance mainnet integration
   - Real-time market data
   - Advanced order types

4. **Strategy Optimization**
   - Genetic algorithms
   - Machine learning optimization
   - Parameter tuning

## Support

For technical support and questions:

1. Check the troubleshooting section
2. Review error logs and metrics
3. Test with reference strategies
4. Contact the development team

---

*Last updated: August 18, 2024* 