# Otonom AI Trader - RUNBOOK

## Mimari (Self-Contained Otonom AI Trader)

### Executor (Node/TS)
- **Market Data**: Binance WS (aggTrade, bookTicker, kline), derinlik snapshot + periyodik REST yedek
- **Strategy Core**: Rejim tespiti (trend/range/high-vol), strateji havuzu (Grid, Trend-MA, Breakout, Scalper), otomatik geçiş
- **Risk Motoru**: max günlük zarar, max DD, pozisyon başına risk, kaldıraç sınırları, kill-switch (TRIP)
- **Order Router**: Binance Spot/USDT-M Futures (emir yerleştir/kapat/iptal), HFT olmayan düşük gecikme
- **Journaling & Evidence**: Her karar ve emir için açıklama + metrik log (+ UI'ya özet)

### Backtest/Optimize (Lab Engine)
- Tarihsel kline/aggTrade ile portföy düzeyinde backtest, komisyon/滑点 modeli, grid search + WFO (walk-forward)

### LLM Katmanı (Manager AI + Strategy AI)
- **Manager**: gerçek zamanlı yönetim, strateji seçimi, risk ayarı, rapor/özet
- **Strategy**: doğal dilden strateji üretimi, parametre seti, backtest/optimize çağrıları

### UI (Next.js App Router)
- **Dashboard**: Canary, Portfolio, Strategy durumu + Manager ChatDock (sağ panel, Cmd/Ctrl+K)
- **Strategy Lab**: Monaco Editör + Strategy ChatDock + Parametre formu + Backtest/Optimize
- **Control Center**: Orders/Fills/Metrics SSE; TRIP/kill-switch
- **Always-On**: no-store, timeout, degraded mod, error/loading boundaries

## UI / UX (sayfa bazında)

### Dashboard
- **Kartlar**: Canary (HEALTHY/DEG), Portfolio (PnL, risk, maruziyet), StrategyStatus (aktif mod, rejim)
- **Manager ChatDock**: "grid'e al", "trend moduna geç", "risk %0.5", "özet" gibi komutlarla tool-call

### Strategy Lab
- Monaco (pine/python şablonları) + Parametre formu (symbol, timeframe, tarih aralığı, MA/RSI vb.)
- Strategy ChatDock: "RSI+MACD yaz", "backtest et", "optimize et", "kaydet <isim>"

## Frontend → Executor API (tool sözleşmesi)

Tüm endpoint'ler no-store + 1500ms timeout + evidence fallback:

```
POST /api/public/strategy/mode → { mode: "grid"|"trend"|"scalp"|"stop"|"start" }
POST /api/public/risk/set → { percent: number } // pozisyon başına risk
GET /api/public/manager/summary → sistem durumu/özet
POST /api/public/orders/place → { symbol, side, qty, type, ... }
POST /api/public/orders/cancel → { symbol, orderId }
POST /api/public/close-all → { symbol? }
GET /api/public/portfolio/summary
POST /api/public/lab/backtest → { code, lang, symbol, tf, from, to, params }
POST /api/public/lab/optimize → { code, lang, symbol, tf, from, to, grid: { param, start, end, step } }
POST /api/public/lab/save → { name, code, meta }
```

## .env örneği (minimum)

```env
# UI
PORT=3003
EXEC_ORIGIN=http://127.0.0.1:4001
NEXT_PUBLIC_UI_BUILDER=true
NEXT_PUBLIC_DEMO_ENABLE_ACTIONS=false
NEXT_PUBLIC_DEV_BYPASS=true

# Binance
BINANCE_MODE=FUTURES      # SPOT|FUTURES
BINANCE_API_KEY=...
BINANCE_API_SECRET=...

# LLM (Manager/Strategy AI)
OPENAI_API_KEY=...        # veya ANTHROPIC_API_KEY=...
```

## Varsayılan Risk Kuralları

- **Günlük max zarar**: %5 sermaye → aşıldığında STOP (TRIP)
- **İşlem başına risk**: %0.5 (Strategy Lab önerileri ile değiştirilebilir)
- **Maks. eş zamanlı pozisyon**: 3 (aynı korelasyon kümesinde 1)
- **Volatilite şoku** (5m ATR z-score > 3): otomatik pause 15 dk

## RUNBOOK (kısa)

```bash
pnpm i -w
pnpm -w build:packages
pnpm -w prisma generate && pnpm -w prisma migrate dev -n init

pnpm dev:executor   # :4001
pnpm dev:web        # :3003

# test
curl -sS http://127.0.0.1:3003/api/public/health
```

## Hızlı Test Senaryoları

### Manager
- Chat: grid'e al → /strategy/mode çağrısı "✅ Grid moduna geçildi"
- Chat: risk %0.5 → "✅ Risk güncellendi"
- Chat: özet → PnL/Win%/DD kısa özet

### Strategy
- Chat: BTCUSDT 15dk RSI+MACD stratejisi yaz ve 90 gün backtest et → kod + /lab/backtest sonucu
- Chat: optimize et (RSIhigh 70-85, step 5) → /lab/optimize ve en iyi parametreler
- Chat: kaydet rsi_macd_v1 → /lab/save onayı 