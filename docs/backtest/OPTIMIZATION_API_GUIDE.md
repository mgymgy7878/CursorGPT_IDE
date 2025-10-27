# Optimization API Guide - Grid Search

**Feature**: Grid Search Optimization  
**Sprint**: V1.5 Task 5  
**Purpose**: Automated parameter tuning for strategies

---

## 📋 Overview

The Optimization API allows automated testing of parameter combinations to find the best-performing strategy configuration.

### Features
- **Grid Search**: Cartesian product of parameter ranges
- **Bounded Concurrency**: Parallel execution (max CPU cores)
- **WFO Integration**: Top-N candidates validated with walk-forward
- **DuckDB Storage**: Results persisted for analysis
- **Prometheus Metrics**: Full observability

---

## 🚀 API Usage

### Endpoint

`POST /backtest/optimize`

### Request Body

```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "start": "2024-01-01",
  "end": "2024-03-01",
  "exchange": "binance",
  "useCache": true,
  "grid": {
    "emaFast": [12, 16, 20, 24],
    "emaSlow": [40, 50, 60],
    "atr": [10, 14]
  },
  "objective": "sharpe",
  "wf": {
    "enabled": false,
    "topN": 5
  }
}
```

### Response

```json
{
  "ok": true,
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "candles": 1440,
  "grid": { "emaFast": [12, 16, 20, 24], "emaSlow": [40, 50, 60], "atr": [10, 14] },
  "objective": "sharpe",
  "result": {
    "totalCombinations": 24,
    "completed": 24,
    "bestParams": {
      "emaFast": 20,
      "emaSlow": 50,
      "atr": 14
    },
    "bestScore": 1.85,
    "leaderboard": [
      {
        "params": { "emaFast": 20, "emaSlow": 50, "atr": 14 },
        "metrics": { "sharpe": 1.85, "winRate": 0.62, "pnl": 1250 }
      },
      {
        "params": { "emaFast": 16, "emaSlow": 50, "atr": 14 },
        "metrics": { "sharpe": 1.78, "winRate": 0.61, "pnl": 1180 }
      }
    ],
    "timing": {
      "totalMs": 15000,
      "avgPerRun": 625
    }
  },
  "timing": {
    "totalMs": 15250,
    "avgPerCombo": 635
  }
}
```

---

## ⚙️ Configuration

### Grid Parameters

```json
"grid": {
  "emaFast": [8, 12, 16, 20],      // Fast EMA periods
  "emaSlow": [40, 50, 60],          // Slow EMA periods
  "atr": [10, 14, 18],              // ATR periods
  "atrMult": [1.5, 2.0, 2.5],       // ATR multipliers
  "takeProfitRR": [1.0, 1.5, 2.0]   // Risk/reward ratios
}
```

**Total Combinations**: Product of all array lengths
- Example: 4 × 3 × 3 = 36 combinations

### Objectives

- `"sharpe"` (default): Maximize Sharpe ratio
- `"pnl"`: Maximize profit
- `"winRate"`: Maximize win rate

### WFO Validation (Optional)

```json
"wf": {
  "enabled": true,
  "topN": 5  // Validate top 5 candidates
}
```

When enabled:
1. Grid search finds best params
2. Top N are tested with walk-forward
3. Overfitted candidates are filtered
4. Best non-overfitted params returned

---

## 📊 Prometheus Metrics

```promql
# Total optimization jobs
spark_backtest_opt_jobs_total{objective}

# Latency histogram
spark_backtest_opt_latency_ms{combinations}

# Candidates tested
spark_backtest_opt_candidates_total

# WFO filtered (overfitting)
spark_backtest_opt_wfo_filtered_total

# Best score achieved
spark_backtest_opt_best_score{symbol, objective}
```

### Example Queries

**Average optimization time for 100 combinations**:
```promql
avg(spark_backtest_opt_latency_ms{combinations="100"})
```

**Overfitting filter rate**:
```promql
rate(spark_backtest_opt_wfo_filtered_total[1h])
  /
rate(spark_backtest_opt_candidates_total[1h])
```

---

## 🧪 Example Usage

### PowerShell

```powershell
$body = @{
    symbol = "ETHUSDT"
    timeframe = "1h"
    start = "2024-01-01"
    end = "2024-03-01"
    exchange = "binance"
    useCache = $true
    grid = @{
        emaFast = @(10, 15, 20, 25)
        emaSlow = @(40, 50, 60)
        atr = @(12, 14, 16)
    }
    objective = "sharpe"
    wf = @{
        enabled = $true
        topN = 5
    }
} | ConvertTo-Json -Depth 10

Invoke-WebRequest -Uri http://127.0.0.1:4001/backtest/optimize `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 💡 Best Practices

### 1. Grid Size

**Small** (< 50 combinations):
- Quick iteration (<5s)
- Good for initial exploration

**Medium** (50-200 combinations):
- Balanced performance/coverage
- Recommended for production

**Large** (> 200 combinations):
- Thorough search
- Requires cache + time (>30s)

### 2. Parameter Ranges

**Too Narrow**: May miss optimal params
```json
"emaFast": [19, 20, 21]  // Only 3 values
```

**Too Wide**: Expensive, may find noise
```json
"emaFast": [5, 10, 15, 20, 25, 30, 35, 40]  // 8 values
```

**Optimal**: 3-5 values per parameter
```json
"emaFast": [12, 16, 20, 24]  // 4 values ✅
```

### 3. Objective Selection

- **Sharpe**: Risk-adjusted returns (best for most cases)
- **PnL**: Absolute profit (good for short-term)
- **WinRate**: Strategy consistency (complementary)

### 4. WFO Validation

Always enable WFO for production strategies:
```json
"wf": {
  "enabled": true,
  "topN": 5
}
```

Prevents deploying overfitted strategies.

---

## ⚡ Performance

### Benchmarks

| Combinations | Cache | Latency (P95) |
|--------------|-------|---------------|
| 24 (small) | Cold | ~10s |
| 24 (small) | Warm | ~8s |
| 180 (medium) | Cold | ~45s |
| 180 (medium) | Warm | ~25s |
| 300 (large) | Warm | ~45s |

**Target**: 200 combinations ≤ 30s (cache warm, 8 cores)

### Optimization Tips

1. **Enable cache**: `useCache: true`
2. **Smaller date range**: Faster backtests
3. **Lower timeframe**: Fewer bars = faster
4. **Reduce grid size**: Fewer combinations

---

## 🐛 Troubleshooting

### Error: "Grid config produced no combinations"
**Cause**: Empty grid arrays  
**Fix**: Ensure each parameter has at least one value

### Error: Timeout (> 120s)
**Cause**: Too many combinations or slow backtests  
**Fix**: Reduce grid size or enable cache

### Warning: All candidates overfitted (WFO)
**Cause**: Strategy is inherently overfitted  
**Fix**: Simplify strategy or use more data

---

**Author**: Cursor (Claude 3.5 Sonnet)  
**Sprint**: V1.5 Task 5  
**Date**: 10 Ekim 2025

