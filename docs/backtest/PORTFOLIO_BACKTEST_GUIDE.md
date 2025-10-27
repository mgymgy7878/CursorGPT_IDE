# Portfolio Backtest Guide

**Feature**: Multi-Asset Portfolio Backtests  
**Sprint**: V1.5 Task 3  
**Purpose**: Test portfolio-level strategies with correlation analysis

---

## 📋 Overview

Portfolio backtesting allows you to test strategies across **2-10 assets** simultaneously, providing insights into:
- Combined portfolio performance
- Asset correlations
- Diversification benefits
- Risk-adjusted returns

---

## 🎯 Key Features

### 1. Multi-Asset Support
- Test 2-10 assets in a single backtest
- Custom or equal weighting
- Automatic timestamp alignment

### 2. Correlation Analysis
- NxN symmetric correlation matrix
- Pearson correlation coefficient
- Average correlation metrics

### 3. Diversification Metrics
- **Diversification Benefit** = Portfolio Sharpe - Avg Individual Sharpe
- Positive value indicates successful diversification
- Typically 0.1-0.3 for well-diversified portfolios

### 4. Performance Features
- **Batch Cache Loading**: Single connection, parallel queries
- **Timestamp Alignment**: Automatic intersection of common timestamps
- **Forward-Fill**: Max 1-step gap tolerance

---

## 🔧 API Usage

### Endpoint

`POST /backtest/portfolio`

### Request Body

```json
{
  "symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
  "weights": [0.4, 0.4, 0.2],
  "timeframe": "1h",
  "start": "2024-01-01",
  "end": "2024-03-01",
  "exchange": "binance",
  "useCache": true,
  "config": {
    "rebalance": "none",
    "correlation": {
      "enabled": true,
      "threshold": 0.7
    }
  },
  "strategy": {
    "type": "emaCross",
    "params": {
      "emaFast": 20,
      "emaSlow": 50,
      "atr": 14
    }
  }
}
```

### Response

```json
{
  "ok": true,
  "symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
  "result": {
    "symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
    "weights": [0.4, 0.4, 0.2],
    "combined": {
      "sharpe": 1.82,
      "winRate": 0.61,
      "ddMax": 12.5,
      "pnl": 1850,
      "trades": 156
    },
    "individual": [
      {
        "symbol": "BTCUSDT",
        "weight": 0.4,
        "sharpe": 1.65,
        "winRate": 0.59,
        "pnl": 1200,
        "trades": 52
      },
      {
        "symbol": "ETHUSDT",
        "weight": 0.4,
        "sharpe": 1.55,
        "winRate": 0.58,
        "pnl": 980,
        "trades": 48
      },
      {
        "symbol": "BNBUSDT",
        "weight": 0.2,
        "sharpe": 1.48,
        "winRate": 0.62,
        "pnl": 750,
        "trades": 56
      }
    ],
    "correlation": {
      "matrix": [
        [1.00, 0.85, 0.72],
        [0.85, 1.00, 0.68],
        [0.72, 0.68, 1.00]
      ],
      "avgCorrelation": 0.75,
      "diversificationBenefit": 0.26
    },
    "timing": {
      "commonTimestamps": 1440,
      "totalCandles": 4320
    }
  },
  "timing": {
    "totalMs": 2150,
    "avgPerSymbol": 716
  }
}
```

---

## 📊 Interpreting Results

### Combined Metrics

**Sharpe Ratio**: Risk-adjusted return
- > 2.0: Excellent
- 1.5 - 2.0: Good
- 1.0 - 1.5: Fair
- < 1.0: Poor

**Win Rate**: Percentage of winning trades
- > 60%: Excellent
- 50-60%: Good
- < 50%: Review strategy

### Correlation Matrix

**Interpretation**:
- **1.0**: Perfect positive correlation (diagonal)
- **0.7 - 1.0**: High correlation (limited diversification)
- **0.3 - 0.7**: Moderate correlation (some diversification)
- **-0.3 - 0.3**: Low correlation (good diversification)
- **-1.0 - -0.3**: Negative correlation (excellent diversification)

**Example**:
```
     BTC  ETH  BNB
BTC [1.0  0.85 0.72]
ETH [0.85 1.0  0.68]
BNB [0.72 0.68 1.0 ]
```

- BTC-ETH: 0.85 (high correlation - both crypto majors)
- BTC-BNB: 0.72 (moderate-high)
- ETH-BNB: 0.68 (moderate)

**Average**: 0.75 (high correlation - expected for crypto)

### Diversification Benefit

**Formula**:
```
Diversification Benefit = Portfolio Sharpe - Avg(Individual Sharpe)
```

**Interpretation**:
- **> 0.3**: Excellent diversification
- **0.1 - 0.3**: Good diversification
- **0 - 0.1**: Minimal diversification
- **< 0**: Poor combination (worse than average individual)

**Example**:
- Portfolio Sharpe: 1.82
- Avg Individual: 1.56
- Benefit: 0.26 ✅ Good!

---

## 🧪 Example Usage

### PowerShell

```powershell
$body = @{
  symbols = @("BTCUSDT", "ETHUSDT", "SOLUSDT")
  weights = @(0.4, 0.4, 0.2)
  timeframe = "1h"
  start = "2024-01-01"
  end = "2024-03-01"
  exchange = "binance"
  useCache = $true
  config = @{
    rebalance = "none"
    correlation = @{
      enabled = $true
      threshold = 0.7
    }
  }
  strategy = @{
    type = "emaCross"
    params = @{
      emaFast = 20
      emaSlow = 50
      atr = 14
    }
  }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri http://127.0.0.1:4001/backtest/portfolio `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Equal Weighting (Automatic)

```powershell
$body = @{
  symbols = @("BTCUSDT", "ETHUSDT", "BNBUSDT")
  # weights omitted = equal weight (0.33, 0.33, 0.34)
  timeframe = "1h"
  start = "2024-01-01"
  end = "2024-03-01"
  exchange = "binance"
  useCache = $true
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri http://127.0.0.1:4001/backtest/portfolio `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## ⚙️ Configuration

### Weights

**Rules**:
1. Must sum to 1.0 (± 1e-6 tolerance)
2. If omitted, equal weighting applied (1/N per asset)
3. Length must match symbols array

**Examples**:
```json
// Equal weight (3 assets)
"weights": [0.333, 0.333, 0.334]

// Custom weight
"weights": [0.5, 0.3, 0.2]

// Not provided (auto equal-weight)
// "weights": []  <- omit field
```

### Rebalance Mode

**Options**:
- `"none"` (default): No rebalancing
- `"daily"`: Rebalance at day boundaries (future)
- `"weekly"`: Rebalance at week boundaries (future)

**MVP Note**: Only `"none"` is implemented. Rebalancing adds complexity (fees, slippage) and will be added in future sprints.

### Correlation

```json
"correlation": {
  "enabled": true,
  "threshold": 0.7  // Warning threshold (not enforced)
}
```

- `enabled`: Calculate correlation matrix
- `threshold`: Reference value (e.g., 0.7 = high correlation)

---

## 📈 Prometheus Metrics

### Available Metrics

```promql
# Total portfolio backtest runs
spark_backtest_portfolio_runs_total{symbols_count}

# Current symbols count
spark_backtest_portfolio_symbols_count

# Average correlation
spark_backtest_portfolio_correlation_avg{symbols_count}

# Diversification benefit
spark_backtest_portfolio_diversification_benefit{symbols_count}

# Latency histogram
spark_backtest_portfolio_latency_ms{symbols_count}
```

### Example Queries

**P95 Latency for 3-asset portfolios**:
```promql
histogram_quantile(0.95, 
  sum by (le) (rate(spark_backtest_portfolio_latency_ms_bucket{symbols_count="3"}[5m]))
)
```

**Average diversification benefit**:
```promql
avg(spark_backtest_portfolio_diversification_benefit)
```

---

## 💡 Best Practices

### 1. Asset Selection

**Good**: Low-correlated assets
```
BTC + Gold + USD bonds (crypto + commodity + fixed income)
```

**Poor**: High-correlated assets
```
BTC + ETH + BNB (all crypto majors)
```

**Expected Correlations**:
- Crypto-Crypto: 0.7-0.9 (high)
- Crypto-Stocks: 0.3-0.6 (moderate)
- Crypto-Gold: 0.0-0.3 (low)
- Stocks-Bonds: -0.2-0.2 (low/negative)

### 2. Weight Allocation

**Conservative**: Equal weight
```json
"weights": [0.25, 0.25, 0.25, 0.25]
```

**Aggressive**: Risk-parity or custom
```json
"weights": [0.5, 0.3, 0.15, 0.05]  // Focus on top performers
```

### 3. Timeframe Considerations

- **1h**: Good for crypto (high liquidity)
- **1d**: Better for stocks (lower noise)
- **15m-1h**: Sweet spot for multi-asset crypto

### 4. Data Quality

- Ensure all symbols have sufficient data
- Check `timing.commonTimestamps` (should be >100 for meaningful results)
- High `totalCandles / commonTimestamps` ratio indicates gaps

---

## 🐛 Troubleshooting

### Error: "symbols must contain 2-10 assets"

**Cause**: Too few or too many symbols  
**Fix**: Use 2-10 symbols

```json
"symbols": ["BTCUSDT", "ETHUSDT"]  // Minimum 2
```

### Error: "Weights must sum to 1.0"

**Cause**: Weights don't sum to 1.0  
**Fix**: Adjust weights or omit for equal weighting

```json
"weights": [0.5, 0.3, 0.2]  // Sum = 1.0 ✅
"weights": [0.5, 0.4, 0.2]  // Sum = 1.1 ❌
```

### Error: "No common timestamps found"

**Cause**: Assets don't overlap in time  
**Fix**: Check date ranges, use same exchange

### Warning: High correlation (>0.8)

**Interpretation**: Limited diversification benefit  
**Action**: Consider adding uncorrelated assets

---

## 🔬 Technical Details

### Timestamp Alignment

**Method**: Intersection (∩)
```
T_common = T_BTC ∩ T_ETH ∩ T_BNB
```

**Gap Handling**: Forward-fill max 1 step
- Missing bar at t: Copy previous bar
- Missing bar at t and t+1: Drop both

### Correlation Calculation

**Method**: Pearson correlation on log returns
```
r_t = ln(close_t / close_{t-1})
ρ = Cov(r1, r2) / (σ_r1 * σ_r2)
```

### Portfolio Equity

**Weighted Combination**:
```
Eq_portfolio(t) = Σ w_i * (Eq_i(t) - 10000) + 10000
```

Where:
- `w_i`: Weight of asset i
- `Eq_i(t)`: Equity of asset i at time t
- `10000`: Initial capital

---

## 📚 References

- [Modern Portfolio Theory (Markowitz)](https://en.wikipedia.org/wiki/Modern_portfolio_theory)
- [Pearson Correlation](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient)
- [Sharpe Ratio](https://en.wikipedia.org/wiki/Sharpe_ratio)

---

**Author**: Cursor (Claude 3.5 Sonnet)  
**Sprint**: V1.5 Task 3  
**Date**: 10 Ekim 2025

