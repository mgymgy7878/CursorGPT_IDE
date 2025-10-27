# BACKTEST ENGINE CONTRACT (v1.4)

## OHLCV Schema (JSONL)
```json
{"ts": <epoch_ms>, "o": <number>, "h": <number>, "l": <number>, "c": <number>, "v": <number>, "tf": "1m", "sym": "BTCUSDT"}
```

## Trades (derived)
```json
{"ts": <epoch_ms>, "side": "BUY|SELL", "price": <number>, "qty": <number>}
```

## Metrics (index.json)
- thresholds.dataset_bars_gte (>=20000)
- thresholds.compute_total_ms_leq (<=2000)
- strategy: cagr_pct, sharpe, max_dd_pct, trades, win_rate_pct
- perf: compute_total_ms, p50_ms, p95_ms 