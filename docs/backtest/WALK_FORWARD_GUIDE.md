# Walk-Forward Optimization Guide

**Feature**: Walk-Forward Optimization (WFO)  
**Sprint**: V1.5  
**Purpose**: Prevent overfitting in strategy backtests

---

## 📋 Overview

Walk-Forward Optimization splits historical data into **Train/Validate/Test** segments to ensure strategy performance is not overly optimized to past data.

### Why WFO?

Traditional backtesting can suffer from **overfitting**:
- Strategy parameters are tuned to maximize historical performance
- This may not generalize to future (unseen) data
- Walk-forward provides **out-of-sample** validation

---

## 🎯 How It Works

### Single Fold Mode

```
|<---------- Train (60%) -------->|<- Validate (20%) ->|<- Test (20%) ->|
0%                               60%                  80%              100%
```

1. **Train**: Optimize strategy parameters
2. **Validate**: Check if optimized params are stable
3. **Test**: Final performance on unseen data (most important!)

### Rolling Window Mode

```
Fold 1: |Train|Val|Test|
Fold 2:     |Train|Val|Test|
Fold 3:         |Train|Val|Test|
```

Multiple folds with overlapping windows provide more robust results.

---

## 🔧 Configuration

### WalkForwardConfig

```typescript
{
  trainRatio: 0.6,       // 60% for training
  validateRatio: 0.2,    // 20% for validation (optional)
  testRatio: 0.2,        // 20% for testing
  rollingWindow: false,  // Use single fold (false) or rolling (true)
  step: 0.2              // Step size for rolling window (20%)
}
```

### Common Configurations

#### Conservative (Single Fold)
```json
{
  "trainRatio": 0.6,
  "validateRatio": 0.2,
  "testRatio": 0.2,
  "rollingWindow": false
}
```

Best for: Long-term strategies, limited data

#### Aggressive (Rolling Window)
```json
{
  "trainRatio": 0.5,
  "validateRatio": 0.0,
  "testRatio": 0.5,
  "rollingWindow": true,
  "step": 0.1
}
```

Best for: High-frequency strategies, abundant data

---

## 📊 API Usage

### Endpoint

`POST /backtest/walkforward`

### Request Body

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "start": "2024-01-01",
  "end": "2024-06-01",
  "exchange": "binance",
  "useCache": true,
  "config": {
    "trainRatio": 0.6,
    "validateRatio": 0.2,
    "testRatio": 0.2,
    "rollingWindow": false
  },
  "strategy": {
    "type": "emaCross",
    "params": {
      "emaFast": 20,
      "emaSlow": 50,
      "atr": 14,
      "atrMult": 2,
      "takeProfitRR": 1.5
    }
  }
}
```

### Response

```json
{
  "ok": true,
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "candles": 10000,
  "result": {
    "folds": 1,
    "overfitting": {
      "detected": false,
      "ratio": 0.85,
      "threshold": 0.6
    },
    "summary": {
      "train": {
        "sharpe": 1.82,
        "winRate": 0.62,
        "ddMax": 8.3,
        "pnl": 1250,
        "trades": 45
      },
      "test": {
        "sharpe": 1.55,
        "winRate": 0.58,
        "ddMax": 10.2,
        "pnl": 950,
        "trades": 38
      }
    }
  }
}
```

---

## 🚨 Overfitting Detection

### Detection Rule

**Overfitting detected if:**
```
test_sharpe / train_sharpe < 0.6
```

### Interpretation

| Ratio | Interpretation | Action |
|-------|----------------|--------|
| > 0.9 | Excellent | Strategy generalizes well |
| 0.7 - 0.9 | Good | Acceptable performance degradation |
| 0.5 - 0.7 | Warning | Review strategy complexity |
| < 0.5 | Critical | Strategy is overfitted, don't use! |

### Example: Overfitting Detected

```json
{
  "overfitting": {
    "detected": true,
    "ratio": 0.45,
    "threshold": 0.6
  },
  "summary": {
    "train": { "sharpe": 2.5 },
    "test": { "sharpe": 1.125 }
  }
}
```

**Action**: Simplify strategy or use more data.

---

## 📈 Metrics

### Prometheus Metrics

```promql
# Train duration
spark_backtest_walkforward_train_ms

# Test duration
spark_backtest_walkforward_test_ms

# Overfitting cases
spark_backtest_overfitting_detected_total{symbol, timeframe}

# Total runs
spark_backtest_walkforward_runs_total{symbol, folds}
```

### Example Query

```promql
# Overfitting rate per symbol
rate(spark_backtest_overfitting_detected_total[1h])
  / 
rate(spark_backtest_walkforward_runs_total[1h])
```

---

## 🧪 Testing Strategy

### Step 1: Baseline Backtest
Run without walk-forward to get baseline performance.

### Step 2: Single Fold WFO
Test with 60/20/20 split, check test performance.

### Step 3: Rolling Window WFO
Use multiple folds to validate consistency.

### Step 4: Parameter Robustness
Try slightly different params, check if test results are stable.

---

## 💡 Best Practices

### 1. Minimum Data Requirements
- **Single fold**: Minimum 1000 bars (3-6 months daily)
- **Rolling window**: Minimum 5000 bars (1+ year daily)

### 2. Fold Size
- Train: 50-70% of data
- Validate: 10-20% (optional but recommended)
- Test: 20-30% (most critical)

### 3. Interpretation
- Focus on **test metrics**, not train metrics
- If test sharpe > train sharpe → lucky period, retest
- Consistent performance across folds = robust strategy

### 4. Overfitting Prevention
- Use simple strategies (fewer parameters)
- Avoid "cherry-picking" best folds
- Test on multiple symbols/timeframes

---

## 🔧 PowerShell Example

```powershell
$body = @{
  symbol = "ETHUSDT"
  timeframe = "1h"
  start = "2024-01-01"
  end = "2024-06-01"
  exchange = "binance"
  useCache = $true
  config = @{
    trainRatio = 0.6
    validateRatio = 0.2
    testRatio = 0.2
    rollingWindow = $false
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

Invoke-WebRequest -Uri http://127.0.0.1:4001/backtest/walkforward `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## 🐛 Troubleshooting

### Error: "Not enough data"
**Cause**: Dataset too small for train/test split  
**Fix**: Use longer date range or reduce train ratio

### Warning: High overfitting ratio
**Cause**: Strategy too complex or market regime changed  
**Fix**: Simplify strategy or use more recent data

### Performance: Slow execution
**Cause**: Large datasets or many folds  
**Fix**: 
- Enable cache (`useCache: true`)
- Reduce rolling window step size
- Use lower timeframe or shorter date range

---

## 📚 References

- [Walk-Forward Analysis (Wikipedia)](https://en.wikipedia.org/wiki/Walk_forward_analysis)
- [Overfitting in Trading Strategies](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2308659)
- [Cross-Validation for Time Series](https://robjhyndman.com/hyndsight/tscv/)

---

**Author**: Cursor (Claude 3.5 Sonnet)  
**Sprint**: V1.5 - Task 2  
**Date**: 10 Ekim 2025

