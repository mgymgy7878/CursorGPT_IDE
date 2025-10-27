# Backtest Engine — Quick Start

## 1) Fetch Historical Data
```bash
PNPM_FILTER=@spark/marketdata SYMBOL=BTCUSDT TF=1m DAYS=30 pnpm -F @spark/marketdata build && pnpm -F @spark/marketdata fetch:binance
```

## 2) Dump CSV
```bash
pnpm -F @spark/marketdata dump:csv ./packages/marketdata/data/BTCUSDT_1m.json
```

## 3) Run Backtest
```bash
pnpm -F @spark/backtest build && pnpm -F @spark/backtest exec --strategy sma_cross --file ./packages/marketdata/data/BTCUSDT_1m.csv
```

## Available Strategies
- `sma_cross` - Simple Moving Average Crossover
- `rsi_contrarian` - RSI Contrarian Strategy  
- `breakout` - Breakout Strategy

## Expected Output
```json
{
  "ok": true,
  "equity": 10500,
  "cash": 2000,
  "pos": 0.1,
  "pnl": 500,
  "fills": [...]
}
```
