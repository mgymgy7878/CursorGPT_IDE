# H1 — Backtest Engine (Gerçek)

## 📋 Özet

Backtest Engine, geçmiş piyasa verisi üzerinde trading stratejilerinin performansını test etmek için minimal fakat üretim-uyumlu bir sistemdir.

## 🎯 Özellikler

- **History Loaders**: Binance (spot+futures), BTCTurk (spot)
- **Teknik İndikatörler**: EMA, SMA, RSI, ATR
- **Giriş Kuralları**: EMA/SMA crossover (crossUp/crossDown)
- **Çıkış Kuralları**: ATR stop loss, Risk/Reward multiple take profit
- **Metrikler**: PnL, Win Rate, Sharpe Ratio, Max Drawdown, Trade sayısı
- **Prometheus Entegrasyonu**: Job count, latency, error tracking

## 🚀 Hızlı Başlangıç

### 1. API Endpoint

```bash
POST http://127.0.0.1:4001/backtest/run
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "timeframe": "15m",
  "start": "2024-01-01",
  "end": "2024-01-15",
  "exchange": "binance",
  "futures": false,
  "config": {
    "indicators": { "emaFast": 20, "emaSlow": 50, "atr": 14 },
    "entry": { "type": "crossUp", "fast": "EMA", "slow": "EMA" },
    "exit": { "atrMult": 2, "takeProfitRR": 1.5 },
    "feesBps": 5,
    "slippageBps": 1
  }
}
```

### 2. UI Kullanımı

1. Tarayıcıda açın: <http://localhost:3003/backtest-lab>
2. Symbol, timeframe, tarih aralığı girin
3. Exchange seçin (Binance/BTCTurk)
4. "Backtest Çalıştır" butonuna tıklayın
5. Sonuçları görüntüleyin: PnL, Win Rate, Sharpe, Max DD, Trades

## 📊 Metrikler

Prometheus metrics:
- `spark_backtest_jobs_total`: Toplam backtest job sayısı
- `spark_backtest_latency_ms`: Backtest çalışma süresi (histogram)
- `spark_backtest_errors_total`: Hata sayısı

Grafana Dashboard: <http://localhost:3005> → "Spark • Backtest Jobs"

## 🔧 Parametre Açıklamaları

### Indicators
- `emaFast`: Hızlı EMA periyodu (varsayılan: 20)
- `emaSlow`: Yavaş EMA periyodu (varsayılan: 50)
- `atr`: ATR periyodu (varsayılan: 14)

### Entry
- `type`: "crossUp" veya "crossDown"
- `fast`: "EMA" veya "SMA"
- `slow`: "EMA" veya "SMA"

### Exit
- `atrMult`: ATR multiplier for stop loss (varsayılan: 2)
- `takeProfitRR`: Risk/Reward ratio for TP (varsayılan: 1.5)

### Costs
- `feesBps`: Trading fees in basis points (varsayılan: 5 = 0.05%)
- `slippageBps`: Slippage in basis points (varsayılan: 1 = 0.01%)

## 🧪 Smoke Test

```powershell
# 1. Test API endpoint
$body = @{
  symbol = "BTCUSDT"
  timeframe = "15m"
  start = "2024-01-01"
  end = "2024-01-15"
  exchange = "binance"
  futures = $false
} | ConvertTo-Json

Invoke-WebRequest -Uri http://127.0.0.1:4001/backtest/run `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# 2. Check metrics
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics).Content | Select-String "spark_backtest"

# 3. Open UI
Start-Process "http://localhost:3003/backtest-lab"
```

## 📈 Performans

- **Hedef P95 Latency**: < 8 saniye (50k+ bar)
- **Veri Cache**: In-memory (MVP), gelecekte DuckDB/Parquet
- **Ölçeklenebilirlik**: İş kuyruğu (BullMQ) planlanıyor

## 🔐 Güvenlik

- **Read-only**: Backtest hiçbir trade işlemi yapmaz
- **RBAC**: Viewer rolü backtest çalıştırabilir
- **Rate Limiting**: API rate limit uygulanır

## 🎯 Kabul Kriterleri

✅ 50k+ bar için P95 < 8s  
✅ Rapor metrikleri: PnL, WinRate, Sharpe, MaxDD, Exposure, Trades  
✅ Prometheus metrikleri akıyor  
✅ Grafana paneli çalışıyor  
✅ RBAC uygulanıyor  

## 🚧 Gelecek Geliştirmeler (v2)

- [ ] DuckDB/Parquet için persistent storage
- [ ] Multi-asset backtests
- [ ] Walk-forward optimization
- [ ] Strategy parameter optimization
- [ ] Equity curve visualization
- [ ] Trade-by-trade breakdown

## 📚 İlgili Dökümanlar

- [Strategy Lab Guide](../strategy/STRATEGY_LAB_GUIDE.md)
- [Copilot Integration](../copilot/COPILOT_GUIDE.md)
- [Portfolio Management](../portfolio/PORTFOLIO_GUIDE.md)
