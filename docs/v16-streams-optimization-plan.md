# v1.6 Streams & Optimization Sprint Plan

## Hedef
Canlı akış kalitesi + param optimizasyonu, prod risk sınırlarıyla.

## Sprint Başarı Ölçütleri (SLO)

### WS Event→DB P95 < 300ms
- WebSocket event processing latency
- Database write performance
- Drop rate < 0.1%

### Optimization Run P95 < 45s
- Bayesian/HB param scanning
- Concurrent runs: 4 max
- Error rate < 1%

### Paper-trade PnL Drift < 5%
- Backtest vs paper drift
- Weekly measurement
- |drift| < 5% / hafta

## Sprint Kartları

### 1. Streams: Binance & BTCTurk WS
**Amaç**: Canlı veri akışı kalitesi

**Tasks**:
- Binance WebSocket integration
- BTCTurk WebSocket integration
- Drift/lag metrikleri (ws_gap_ms_p95, seq_gap_total)
- Connection health monitoring
- Auto-reconnection logic

**Acceptance Criteria**:
- WS connection uptime > 99.9%
- Event processing P95 < 300ms
- Drop rate < 0.1%
- Auto-reconnection < 5s

### 2. Optimization Lab: Bayesian/HB Param Taraması
**Amaç**: Parametre optimizasyonu laboratuvarı

**Tasks**:
- Bayesian optimization engine
- Hyperband (HB) implementation
- Param space definition
- Optimization result storage
- Progress tracking

**Acceptance Criteria**:
- Optimization run P95 < 45s
- Concurrent runs: 4 max
- Error rate < 1%
- Result persistence

### 3. Paper-trade Canary: Strategy Lab → Paper Runner
**Amaç**: Strateji canary testing

**Tasks**:
- Paper trading engine
- Strategy Lab integration
- Strict cash + T+1 fill korunması
- PnL tracking
- Drift monitoring

**Acceptance Criteria**:
- Paper-trade PnL drift < 5% / hafta
- T+1 fill compliance
- Cash balance accuracy
- Real-time PnL updates

### 4. Ops: Per-strategy SLO
**Amaç**: Strateji bazlı operasyonel metrikler

**Tasks**:
- Per-strategy SLO definition
- Model promote/downgrade onay kapısı
- Strategy performance tracking
- Risk limit enforcement
- Alert configuration

**Acceptance Criteria**:
- Per-strategy SLO monitoring
- Model approval workflow
- Risk limit enforcement
- Alert configuration

## Teknik Detaylar

### WebSocket Integration
```typescript
// Binance WS
const binanceWS = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

// BTCTurk WS  
const btcturkWS = new WebSocket('wss://ws-feed.btcturk.com/');

// Metrics
const wsGapMs = new Histogram({
  name: 'ws_gap_ms',
  help: 'WebSocket event processing gap',
  buckets: [10, 50, 100, 300, 1000, 3000]
});
```

### Optimization Engine
```typescript
// Bayesian optimization
const optimizer = new BayesianOptimizer({
  paramSpace: {
    sma_short: [5, 50],
    sma_long: [50, 200],
    stop_loss: [0.01, 0.05]
  },
  objective: 'sharpe_ratio',
  maxIterations: 100
});
```

### Paper Trading
```typescript
// Paper trading engine
const paperTrader = new PaperTrader({
  initialCapital: 10000,
  commission: 0.001,
  slippage: 0.0005,
  tPlusOne: true
});
```

## Metrikler

### WebSocket Metrics
- `ws_gap_ms_p95` - Event processing P95
- `ws_connection_uptime` - Connection uptime
- `ws_drop_rate` - Event drop rate
- `ws_reconnect_count` - Reconnection count

### Optimization Metrics
- `opt_run_duration_ms` - Optimization run duration
- `opt_concurrent_runs` - Concurrent runs
- `opt_error_rate` - Optimization error rate
- `opt_best_score` - Best optimization score

### Paper Trading Metrics
- `paper_pnl_drift` - PnL drift vs backtest
- `paper_fill_latency_ms` - Fill processing latency
- `paper_cash_accuracy` - Cash balance accuracy
- `paper_t_plus_one_compliance` - T+1 compliance

## Risk Sınırları

### WebSocket Risks
- Connection timeout: 30s
- Max reconnection attempts: 5
- Event buffer size: 1000
- Processing timeout: 1s

### Optimization Risks
- Max concurrent runs: 4
- Max run duration: 60s
- Memory limit: 2GB
- CPU limit: 80%

### Paper Trading Risks
- Max position size: 10% of capital
- Max daily loss: 5% of capital
- Max drawdown: 20% of capital
- T+1 compliance: 100%

## Sprint Timeline

### Week 1: WebSocket Integration
- Binance WS implementation
- BTCTurk WS implementation
- Basic metrics collection

### Week 2: Optimization Lab
- Bayesian optimization engine
- Hyperband implementation
- Param space definition

### Week 3: Paper Trading
- Paper trading engine
- Strategy Lab integration
- PnL tracking

### Week 4: Ops & SLO
- Per-strategy SLO
- Model approval workflow
- Risk limit enforcement

## Success Criteria

### Technical
- All SLO targets met
- Zero critical alerts
- 99.9% uptime
- < 1% error rate

### Business
- Paper trading accuracy > 95%
- Optimization efficiency > 80%
- Risk compliance 100%
- User satisfaction > 90%

## Handover Notes

v1.5 gözlem katmanı prod-grade kilitli. Dashboard JSON'larını repo altında koru, alert route'larını aktif et, ardından v1.6 kartlarını aç. Gözetim katmanı artık sizi utandırmaz; gerçek sorunları bağırarak haber verir.
