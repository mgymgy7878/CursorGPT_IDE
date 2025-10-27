# DAY-10 Performance Pack - Operations Guide

## Overview

DAY-10 Performance Pack, aynı donanımda >2× throughput ve <p95 latency düşüşü hedefleyen kapsamlı performans optimizasyonları içerir. HTTP Keep-Alive v2, micro-batching, zero-copy JSON, WebSocket compression ve GC optimizasyonları ile sistem performansını artırır.

## Components

### 1. HTTP Keep-Alive v2 (Undici Global)
- **High Concurrency**: 256 bağlantı havuzu
- **Low TCP Churn**: Bağlantı yeniden kullanımı
- **Connection Pooling**: Otomatik bağlantı yönetimi

### 2. Micro-Batching
- **Order Batching**: 25-50ms pencerede sipariş birleştirme
- **Single Round-Trip**: Tek seferde birden fazla sipariş
- **Configurable Window**: BATCH_FLUSH_MS ile ayarlanabilir

### 3. Zero-Copy JSON
- **Fast JSON Stringify**: Schema-based serialization
- **GC Pressure Reduction**: Bellek kopyalama azaltma
- **Response Optimization**: Tek kopya ile JSON yazma

### 4. WebSocket Compression
- **Permessage-Deflate**: Level 2-3 sıkıştırma
- **Ping/Pong Compatible**: Watchdog uyumlu
- **Bandwidth Optimization**: Bant genişliği tasarrufu

### 5. GC/Profiling
- **Object Reuse**: Scratch object kullanımı
- **Hot-Path Profiling**: 0x ve CPU prof ile flamegraph
- **Memory Optimization**: Bellek basıncı azaltma

## Environment Variables

```bash
# ---- HTTP KEEP-ALIVE V2 ----
HTTP_KEEPALIVE=true
HTTP_KEEPALIVE_MAX_SOCKETS=256
HTTP_KEEPALIVE_TIMEOUT_MS=60000

# ---- MICRO-BATCHING ----
BATCH_ENABLED=true
BATCH_MAX_SIZE=8
BATCH_FLUSH_MS=40

# ---- JSON STRINGIFIER ----
JSON_STRINGIFIER=fast   # fast | native

# ---- WS COMPRESSION ----
WS_COMPRESS=true
WS_DEFLATE_LEVEL=3

# ---- PROFILING ----
CPU_PROFILING=false
```

## Performance Optimizations

### HTTP Keep-Alive v2

#### Configuration
```typescript
// services/executor/src/lib/httpClient.ts
export const httpAgent = new Agent({
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 90000,
  connections: 256,
  pipelining: 1
});
```

#### Benefits
- **Connection Reuse**: TCP bağlantıları yeniden kullanılır
- **Reduced Latency**: İkinci istekler daha hızlı
- **Lower CPU**: Bağlantı kurma maliyeti azalır

### Micro-Batching

#### Configuration
```typescript
// services/executor/src/lib/batcher.ts
const maxSize = Number(process.env.BATCH_MAX_SIZE || 8);
const flushMs = Number(process.env.BATCH_FLUSH_MS || 40);
const enabled = process.env.BATCH_ENABLED === "true";
```

#### Benefits
- **Reduced API Calls**: Birden fazla sipariş tek seferde
- **Lower Latency**: Round-trip sayısı azalır
- **Better Throughput**: Daha fazla sipariş işlenebilir

### Zero-Copy JSON

#### Configuration
```typescript
// services/executor/src/lib/fastJson.ts
const useFast = (process.env.JSON_STRINGIFIER || "fast") === "fast";

export function sendJson(res: any, schema: any, data: any) {
  if (useFast) {
    const stringify = fjs(schema);
    const json = stringify(data);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(json); // tek kopya
  } else {
    res.json(data);
  }
}
```

#### Benefits
- **Faster Serialization**: Schema-based optimization
- **Lower Memory Usage**: GC basıncı azalır
- **Reduced CPU**: JSON parsing maliyeti düşer

### WebSocket Compression

#### Configuration
```typescript
// services/executor/src/lib/websocketManager.ts
const compress = process.env.WS_COMPRESS === "true";
const level = Number(process.env.WS_DEFLATE_LEVEL || 3);

const wsOptions = compress ? {
  perMessageDeflate: { zlibDeflateOptions: { level } }
} : {};
```

#### Benefits
- **Bandwidth Savings**: Veri transferi azalır
- **Lower Latency**: Küçük payload'lar daha hızlı
- **Better Scalability**: Daha fazla bağlantı desteklenir

## Performance Testing

### Latency Testing
```bash
# Keep-Alive v2 test
.\runtime\perf_latency_test.cmd

# Expected: Second request faster than first
# open_orders_1=0.150s
# open_orders_2=0.080s
# open_orders_3=0.075s
```

### Micro-Batching Testing
```bash
# Batch test
.\runtime\perf_batch_test.cmd

# Expected: Batch flush metrics visible
# spark_batch_flush_total{key="BTCUSDT"} 1
```

### JSON Performance Testing
```bash
# Zero-copy JSON test
.\runtime\perf_json_test.cmd

# Expected: Fast JSON faster than native
# fast_json=0.050s
# native_json=0.080s
```

### Profiling
```bash
# HTTP profiling with 0x
.\runtime\perf_profile_http.cmd

# CPU profiling
node --cpu-prof --cpu-prof-dir=runtime\perf services\executor\dist\bundle.cjs
```

## Monitoring & Metrics

### Key Performance Metrics

#### HTTP Performance
- `spark_perf_http_duration_ms`: HTTP response times
- `spark_http_keepalive_connections`: Active connections
- `spark_http_keepalive_reused`: Reused connections

#### Batching Performance
- `spark_batch_flush_total`: Batch flush count
- `spark_batch_size`: Average batch size
- `spark_batch_latency_ms`: Batch processing time

#### JSON Performance
- `spark_json_serialization_ms`: JSON serialization time
- `spark_json_stringifier_cache_hits`: Cache hit rate
- `spark_json_memory_usage`: Memory usage

#### WebSocket Performance
- `spark_ws_compressed_frames_total`: Compressed frames
- `spark_ws_compression_ratio`: Compression ratio
- `spark_ws_bandwidth_saved`: Bandwidth savings

### Grafana Queries

#### HTTP Latency
```promql
histogram_quantile(0.95, rate(spark_perf_http_duration_ms_bucket[5m]))
```

#### Batch Throughput
```promql
rate(spark_batch_flush_total[1m])
```

#### JSON Performance
```promql
histogram_quantile(0.95, rate(spark_json_serialization_ms_bucket[5m]))
```

#### WebSocket Compression
```promql
rate(spark_ws_compressed_frames_total[5m])
```

## Performance Targets

### Latency Targets
- **HTTP P95**: < 100ms (hedef: < 50ms)
- **JSON Serialization**: < 5ms (hedef: < 2ms)
- **Batch Processing**: < 50ms (hedef: < 25ms)
- **WebSocket Latency**: < 10ms (hedef: < 5ms)

### Throughput Targets
- **HTTP Requests/sec**: > 1000 (hedef: > 2000)
- **Orders/sec**: > 100 (hedef: > 200)
- **WebSocket Messages/sec**: > 500 (hedef: > 1000)
- **Batch Efficiency**: > 80% (hedef: > 90%)

### Memory Targets
- **GC Pressure**: < 10% (hedef: < 5%)
- **Memory Usage**: < 512MB (hedef: < 256MB)
- **Object Allocation**: < 1000/sec (hedef: < 500/sec)

## Troubleshooting

### HTTP Keep-Alive Issues

#### High Connection Count
```bash
# Check connection pool
curl -s http://localhost:4001/api/public/metrics/prom | findstr spark_http_keepalive

# Reduce max connections
set HTTP_KEEPALIVE_MAX_SOCKETS=128
```

#### Connection Timeouts
```bash
# Increase timeout
set HTTP_KEEPALIVE_TIMEOUT_MS=120000

# Check for connection leaks
netstat -an | findstr :4001
```

### Micro-Batching Issues

#### Batch Not Flushing
```bash
# Check batch settings
echo %BATCH_ENABLED%
echo %BATCH_MAX_SIZE%
echo %BATCH_FLUSH_MS%

# Force flush
curl -s -X POST http://localhost:4001/api/private/order \
  -H "Content-Type: application/json" \
  -d "{\"symbol\":\"BTCUSDT\",\"side\":\"BUY\",\"type\":\"MARKET\",\"quantity\":\"0.001\"}"
```

#### High Batch Latency
```bash
# Reduce batch window
set BATCH_FLUSH_MS=20

# Reduce batch size
set BATCH_MAX_SIZE=4
```

### JSON Performance Issues

#### Slow Serialization
```bash
# Check stringifier setting
echo %JSON_STRINGIFIER%

# Switch to fast mode
set JSON_STRINGIFIER=fast

# Verify schema compilation
curl -s http://localhost:4001/api/private/open-orders
```

#### Memory Issues
```bash
# Check memory usage
node --inspect-brk services/executor/dist/bundle.cjs

# Monitor GC
node --trace-gc services/executor/dist/bundle.cjs
```

### WebSocket Compression Issues

#### High CPU Usage
```bash
# Reduce compression level
set WS_DEFLATE_LEVEL=1

# Disable compression
set WS_COMPRESS=false

# Monitor CPU usage
top -p $(pgrep -f "node.*executor")
```

#### Compression Not Working
```bash
# Check compression settings
echo %WS_COMPRESS%
echo %WS_DEFLATE_LEVEL%

# Verify WebSocket connection
curl -s http://localhost:4001/api/private/websocket/status
```

## Performance Optimization

### HTTP Optimization
1. **Connection Pooling**: Optimal pool size ayarlama
2. **Keep-Alive Tuning**: Timeout değerleri optimizasyonu
3. **Pipelining**: HTTP/1.1 pipelining kullanımı

### Batching Optimization
1. **Window Size**: Batch penceresi optimizasyonu
2. **Batch Size**: Optimal batch boyutu
3. **Priority Queuing**: Öncelikli siparişler

### JSON Optimization
1. **Schema Caching**: Şema önbellekleme
2. **String Pooling**: String havuzu kullanımı
3. **Memory Reuse**: Bellek yeniden kullanımı

### WebSocket Optimization
1. **Compression Level**: Sıkıştırma seviyesi
2. **Message Batching**: Mesaj birleştirme
3. **Connection Pooling**: Bağlantı havuzu

## Best Practices

### Performance Monitoring
1. **Continuous Monitoring**: Sürekli performans izleme
2. **Baseline Establishment**: Performans baz çizgisi
3. **Trend Analysis**: Performans trend analizi
4. **Alert Configuration**: Performans uyarıları
5. **Capacity Planning**: Kapasite planlaması

### Optimization Strategy
1. **Measure First**: Önce ölç, sonra optimize et
2. **Incremental Changes**: Kademeli değişiklikler
3. **A/B Testing**: Karşılaştırmalı testler
4. **Rollback Plan**: Geri alma planı
5. **Documentation**: Değişiklik dokümantasyonu

### Production Deployment
1. **Staging Testing**: Staging ortamında test
2. **Gradual Rollout**: Kademeli yayınlama
3. **Monitoring**: Canlı izleme
4. **Rollback**: Hızlı geri alma
5. **Post-Deployment**: Yayın sonrası analiz

## Emergency Procedures

### Performance Degradation
```bash
# Disable optimizations
set HTTP_KEEPALIVE=false
set BATCH_ENABLED=false
set JSON_STRINGIFIER=native
set WS_COMPRESS=false

# Restart service
pnpm restart
```

### Memory Issues
```bash
# Force GC
node --expose-gc -e "global.gc()"

# Increase heap size
set NODE_OPTIONS=--max-old-space-size=2048

# Restart with profiling
node --cpu-prof --heap-prof services/executor/dist/bundle.cjs
```

### High Latency
```bash
# Check system resources
top -p $(pgrep -f "node.*executor")

# Reduce batch size
set BATCH_MAX_SIZE=2

# Disable compression
set WS_COMPRESS=false
```

## Monitoring Checklist

### Daily Checks
- [ ] HTTP latency monitoring
- [ ] Batch performance check
- [ ] JSON serialization time
- [ ] WebSocket compression ratio
- [ ] Memory usage monitoring

### Weekly Reviews
- [ ] Performance trend analysis
- [ ] Optimization effectiveness
- [ ] Resource utilization review
- [ ] Capacity planning update
- [ ] Alert threshold adjustment

### Monthly Assessments
- [ ] Performance target review
- [ ] Optimization strategy update
- [ ] Technology stack evaluation
- [ ] Infrastructure scaling plan
- [ ] Cost optimization analysis

---

**Bu operasyon kılavuzu, DAY-10 Performance Pack'in etkili kullanımı için gerekli tüm bilgileri içerir. Tüm optimizasyonlar testnet-safe olarak tasarlanmıştır.** 