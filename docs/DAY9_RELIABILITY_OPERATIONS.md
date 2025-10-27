# DAY-9 Reliability Pack - Operations Guide

## Overview

DAY-9 Reliability Pack, production ortamında dayanıklılığı artırmak için tasarlanmış kapsamlı bir sistemdir. Chaos testing, durable queue, snapshots, SLO'lar ve shadow-live A/B ölçümü içerir.

## Components

### 1. Chaos Testing
- **HTTP Chaos**: Hata oranı ve gecikme enjeksiyonu
- **WebSocket Flap**: Bağlantı kopma simülasyonu
- **Recovery Testing**: Sistem toparlanma yeteneği

### 2. Durable Queue
- **At-Least-Once Delivery**: Dosya tabanlı journal sistemi
- **Crash Recovery**: Restart sonrası kaldığı yerden devam
- **Visibility Timeout**: Job claim/ack mekanizması

### 3. Snapshots & Retention
- **State Snapshots**: Zaman damgalı durum kayıtları
- **Automatic Cleanup**: Eski dosyaların otomatik temizlenmesi
- **Feature Store Export**: ML verilerinin dışa aktarımı

### 4. Shadow-Live A/B Testing
- **Do-Not-Send Orders**: Canlı emir simülasyonu
- **Latency Measurement**: Gerçek vs simüle edilmiş latency
- **Slippage Analysis**: Fiyat kayması ölçümü

### 5. SLO Monitoring
- **Per-Strategy SLOs**: Strateji bazlı performans hedefleri
- **Burn Rate Alerts**: Hızlı düşüş uyarıları
- **Prometheus Integration**: Metrik toplama ve analiz

## Environment Variables

```bash
# ---- CHAOS ----
CHAOS_HTTP_ERROR_PCT=0        # 0..100 (yüzde)
CHAOS_HTTP_LATENCY_MS=0       # her isteğe eklenecek gecikme (ms)
CHAOS_WS_FLAP_SEC=0           # >0 ise WS'i periyodik düşür (s)

# ---- DURABLE QUEUE ----
QUEUE_DIR=runtime/queue
QUEUE_NAME=signals
QUEUE_VISIBILITY_MS=10000     # claim sonrası ack edilmezse tekrar teslim

# ---- SNAPSHOTS / RETENTION ----
SNAPSHOT_DIR=runtime/snapshots
SNAPSHOT_RETENTION_DAYS=7

# ---- SHADOW-LIVE (do-not-send) ----
SHADOW_LIVE_ENABLED=true      # TRADE_MODE=live && LIVE_ENABLED=false iken gölge yürütme
```

## API Endpoints

### Chaos Control
```bash
# HTTP chaos toggle
POST /api/private/chaos/toggle
{
  "httpErrorPct": 15,
  "latencyMs": 200,
  "wsFlapSec": 10
}
```

### Queue Management
```bash
# Job enqueue
POST /api/private/queue/enqueue
{
  "job": "test-job-1",
  "data": "test-data"
}
```

### Shadow-Live
```bash
# Shadow order (do-not-send)
POST /api/private/order/shadow
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "price": "65000",
  "quantity": "0.001"
}
```

### Snapshots
```bash
# Manual snapshot
POST /api/private/snapshot
{
  "name": "state",
  "data": {
    "note": "manual snapshot",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Operations Scripts

### Chaos Testing
```bash
# HTTP chaos başlat
.\runtime\day9_chaos_http.cmd on

# HTTP chaos bitir
.\runtime\day9_chaos_http.cmd off

# WS flap simülasyonu
.\runtime\day9_ws_flap.cmd
```

### Queue Testing
```bash
# Queue crash-resume testi
.\runtime\day9_queue_kill_resume.cmd
```

### Shadow-Live Testing
```bash
# Shadow-live smoke testi
.\runtime\day9_shadow_smoke.cmd
```

### Snapshots
```bash
# Manual snapshot
.\runtime\day9_snapshot_once.cmd
```

## Monitoring & Alerts

### Key Metrics

#### Chaos Testing
- `spark_chaos_http_errors_total`: HTTP chaos hataları
- `spark_chaos_ws_flaps_total`: WS flap olayları
- `spark_chaos_recovery_total`: Toparlanma sayısı

#### Queue Performance
- `spark_queue_enqueued_total`: Enqueue edilen job'lar
- `spark_queue_processed_total`: İşlenen job'lar
- `spark_queue_lag_seconds`: Queue gecikmesi

#### Shadow-Live
- `spark_shadow_orders_total`: Shadow emir sayısı
- `spark_shadow_latency_ms_bucket`: Shadow latency
- `spark_shadow_slippage_ms`: Fiyat kayması

#### Snapshots
- `spark_snapshot_created_total`: Oluşturulan snapshot'lar
- `spark_snapshot_retention_deleted_total`: Silinen dosyalar
- `spark_snapshot_size_bytes`: Snapshot boyutları

### Grafana Queries

#### Queue Lag
```promql
spark_queue_enqueued_total - spark_queue_processed_total
```

#### WS Flap Events
```promql
increase(spark_ws_disconnects_total[15m])
```

#### Shadow-Live Latency
```promql
histogram_quantile(0.95, rate(spark_shadow_latency_ms_bucket[5m]))
```

#### Chaos Recovery Rate
```promql
rate(spark_chaos_recovery_total[5m])
```

## SLO Targets

### Primary SLOs
- **API Error Rate**: < 1% (99% availability)
- **WebSocket Availability**: > 99.9%
- **Snapshot Success**: > 99%
- **Signal Latency**: < 1s (95th percentile)

### Secondary SLOs
- **Queue Lag**: < 5% (95% throughput)
- **Chaos Recovery**: > 99%
- **Shadow-Live Latency**: < 500ms
- **Emergency Stop Response**: < 100ms

### Burn Rate Alerts
- **1-Hour Window**: 14x error rate increase
- **6-Hour Window**: 7x error rate increase

## Troubleshooting

### Chaos Testing Issues

#### HTTP Chaos Not Working
```bash
# Check environment variables
echo %CHAOS_HTTP_ERROR_PCT%
echo %CHAOS_HTTP_LATENCY_MS%

# Verify middleware is loaded
curl -s http://localhost:4001/api/private/health
```

#### WS Flap Not Triggering
```bash
# Check WS flap setting
echo %CHAOS_WS_FLAP_SEC%

# Monitor WS logs
tail -f logs/executor.log | grep -i "ws\|flap"
```

### Queue Issues

#### Jobs Not Processing
```bash
# Check queue directory
dir runtime\queue\signals

# Verify journal file
type runtime\queue\signals\journal.ndjson

# Check cursor position
type runtime\queue\signals\cursor.txt
```

#### Queue Corruption
```bash
# Backup and reset
copy runtime\queue\signals\journal.ndjson runtime\queue\signals\journal.backup
del runtime\queue\signals\cursor.txt
```

### Shadow-Live Issues

#### Shadow Orders Rejected
```bash
# Check environment
echo %TRADE_MODE%
echo %LIVE_ENABLED%
echo %SHADOW_LIVE_ENABLED%

# Verify shadow directory
dir runtime\shadow
```

### Snapshot Issues

#### Snapshots Not Creating
```bash
# Check directory permissions
dir runtime\snapshots

# Verify retention settings
echo %SNAPSHOT_RETENTION_DAYS%
```

## Performance Optimization

### Queue Performance
- **Batch Processing**: Multiple jobs in single batch
- **Memory Management**: Regular cache cleanup
- **Disk I/O**: Async file operations

### Chaos Testing
- **Selective Chaos**: Only specific endpoints
- **Gradual Increase**: Start with low error rates
- **Recovery Monitoring**: Track recovery times

### Shadow-Live
- **Parallel Processing**: Multiple shadow orders
- **Latency Tracking**: Real-time measurement
- **Slippage Analysis**: Historical comparison

## Security Considerations

### Chaos Testing
- **Staging Only**: Never in production
- **Controlled Access**: Admin-only endpoints
- **Audit Logging**: All chaos events logged

### Shadow-Live
- **Admin Authentication**: Secure access control
- **Data Protection**: Sensitive data encryption
- **Audit Trail**: Complete order history

### Queue Security
- **File Permissions**: Secure queue directory
- **Job Validation**: Input sanitization
- **Access Control**: Restricted queue access

## Emergency Procedures

### Chaos Emergency Stop
```bash
# Disable all chaos
.\runtime\day9_chaos_http.cmd off
curl -s -X POST http://localhost:4001/api/private/chaos/toggle \
  -H "Content-Type: application/json" \
  -d "{\"httpErrorPct\":0,\"latencyMs\":0,\"wsFlapSec\":0}"
```

### Queue Emergency
```bash
# Stop queue processing
# Check for stuck jobs
# Restart with clean state
```

### Shadow-Live Emergency
```bash
# Disable shadow mode
set SHADOW_LIVE_ENABLED=false
# Restart executor service
```

## Best Practices

### Chaos Testing
1. **Start Small**: Begin with low error rates
2. **Monitor Closely**: Watch system behavior
3. **Document Results**: Record all findings
4. **Gradual Increase**: Ramp up chaos gradually
5. **Recovery Testing**: Verify system recovery

### Queue Management
1. **Regular Monitoring**: Check queue health
2. **Backup Strategy**: Regular journal backups
3. **Performance Tuning**: Optimize for throughput
4. **Error Handling**: Robust error recovery
5. **Capacity Planning**: Monitor queue growth

### Shadow-Live
1. **Safe Testing**: Never affect real trades
2. **Accurate Simulation**: Realistic order simulation
3. **Performance Tracking**: Monitor latency impact
4. **Data Analysis**: Analyze shadow results
5. **Continuous Improvement**: Refine simulation

### Snapshots
1. **Regular Snapshots**: Automated scheduling
2. **Retention Policy**: Clear cleanup rules
3. **Storage Management**: Monitor disk usage
4. **Data Integrity**: Verify snapshot validity
5. **Recovery Testing**: Test restore procedures

## Monitoring Checklist

### Daily Checks
- [ ] Queue lag monitoring
- [ ] Chaos testing results
- [ ] Shadow-live performance
- [ ] Snapshot creation status
- [ ] SLO compliance check

### Weekly Reviews
- [ ] Performance trend analysis
- [ ] Chaos testing effectiveness
- [ ] Queue performance optimization
- [ ] Shadow-live accuracy review
- [ ] Snapshot retention cleanup

### Monthly Assessments
- [ ] SLO target review
- [ ] Chaos testing strategy update
- [ ] Queue capacity planning
- [ ] Shadow-live methodology review
- [ ] Snapshot strategy optimization

---

**Bu operasyon kılavuzu, DAY-9 Reliability Pack'in etkili kullanımı için gerekli tüm bilgileri içerir. Tüm prosedürler testnet-safe olarak tasarlanmıştır.** 