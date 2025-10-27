# v1.6 Risk & Triage Notes

## Backpressure Management
**Problem**: Lag artar → queue bound + drop-policy (oldest) ekle
**Solution**: 
```typescript
// Bounded queue with drop policy
if (this.messageQueue.length >= this.backpressureLimit) {
  // Drop oldest message
  this.messageQueue.shift();
}
```

## Sequence Gap Detection
**Problem**: Seq gap görürsen snapshot yenile
**Solution**:
```typescript
// Check for sequence gaps
if (message.seq && message.seq !== this.lastSequence + 1) {
  const gap = message.seq - this.lastSequence - 1;
  prometheus.wsSeqGapTotal.inc({ exchange, channel }, gap);
}
```

## NTP Skew Detection
**Problem**: Ardışık iki borsada aynı anda ise NTP skew veya ağ
**Solution**:
```typescript
// Check for clock drift
const now = Date.now();
const messageTime = message.timestamp || now;
const drift = Math.abs(now - messageTime);

if (drift > this.clockDriftThreshold) {
  prometheus.wsGapMs.observe({ exchange, channel }, drift);
}
```

## Histogram Bucket Limits
**Problem**: Histogram kovaları 10–12 ile sınırla; aksi halde Prom CPU ve cardinality artar
**Solution**:
```typescript
// Limit histogram buckets
buckets: [10, 50, 100, 300, 1000, 3000, 10000] // 7 buckets max
```

## Cardinality Diet
**Allowed Labels**: `{exchange, channel, tf}`
**Forbidden Labels**: `{user, requestId, ip, sessionId, userId, strategyId}`

## Alert Thresholds
- **StreamsLagHigh**: P95 > 1500ms for 10m
- **SeqGapBurst**: Rate > 0 for 5m  
- **IngestLatencyHigh**: P95 > 300ms for 10m
- **OptimSlowRunner**: P95 > 45s for 15m
- **PaperDriftHigh**: Drift > 5% for 24h

## Performance Limits
- **WS Reconnect**: Max 5 attempts with jitter
- **Batch Size**: ≤ 500 events
- **Flush Interval**: ≤ 100ms
- **Concurrent Opt**: ≤ 4 runs
- **Memory Limit**: ≤ 2GB per process

## Triage Commands
```bash
# Check WS connection state
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=ws_conn_state'

# Check lag metrics
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=histogram_quantile(0.95, sum by (le,exchange) (rate(ws_gap_ms_bucket[5m])))'

# Check sequence gaps
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=rate(ws_seq_gap_total[5m])'

# Check optimization status
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=opt_runs_total'

# Check paper trading drift
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=paper_pnl_drift'
```

## Common Issues & Solutions

### High Lag
1. Check backpressure limits
2. Scale ingestion pipeline
3. Check network connectivity
4. Verify NTP synchronization

### Sequence Gaps
1. Refresh snapshot
2. Check exchange connectivity
3. Verify message ordering
4. Check for network issues

### Optimization Slow
1. Check resource limits
2. Scale concurrent runs
3. Check parameter space
4. Verify early stopping

### Paper Trading Drift
1. Check T+1 compliance
2. Verify commission/slippage
3. Check market data quality
4. Verify execution logic
