# Metrics Troubleshooting Guide

## Route Label Hatası Çözümü

### Sorun
```
Error: Added label "route" is not included in initial labelset: []
```

### Kök Neden
Bu hata, prom-client kütüphanesinde bir metrik tanımlanırken `labelNames` dizisinde belirtilmeyen bir label'ın kullanılmaya çalışılmasından kaynaklanır.

**Örnek Hatalı Kod:**
```typescript
// ❌ HATALI: labelNames'de 'route' yok ama kullanılıyor
export const httpLatency = new Histogram({
  name: 'http_latency',
  help: 'HTTP latency',
  registers: [registry],
});

// Kullanımda:
httpLatency.labels({ route: '/api/test' }).observe(0.1); // ❌ HATA!
```

**Doğru Kod:**
```typescript
// ✅ DOĞRU: labelNames'de 'route' tanımlı
export const httpLatency = new Histogram({
  name: 'http_latency',
  help: 'HTTP latency',
  labelNames: ['route', 'method'], // ✅ labelNames tanımlı
  registers: [registry],
});

// Kullanımda:
httpLatency.labels({ route: '/api/test', method: 'GET' }).observe(0.1); // ✅ OK
```

### Çözüm Adımları

#### 1. Acil Çözüm (NOOP Shim)
```bash
# Executor'ı metriksiz modda çalıştır
export METRICS_DISABLED=1
node services/executor/dist/index.cjs
```

#### 2. Kalıcı Çözüm
1. **Metrik tanımını bulun:**
   ```bash
   grep -r "name.*your_metric_name" services/executor/src/
   ```

2. **labelNames ekleyin:**
   ```typescript
   export const yourMetric = new Counter({
     name: 'your_metric_name',
     help: 'Your metric description',
     labelNames: ['label1', 'label2'], // ✅ Eksik labelNames'i ekleyin
     registers: [registry],
   });
   ```

3. **Kullanımda tutarlı olun:**
   ```typescript
   yourMetric.labels({ label1: 'value1', label2: 'value2' }).inc();
   ```

### Metrik Sözleşmesi

#### HTTP Metrikleri
```typescript
labelNames: ['method', 'route', 'status']
```

#### AI Metrikleri
```typescript
labelNames: ['model', 'status']
```

#### Exchange Metrikleri
```typescript
labelNames: ['exchange', 'symbol', 'side']
```

#### Canary Metrikleri
```typescript
labelNames: ['route', 'status', 'reason']
```

### Test Etme

#### CI Test
```bash
# Metrik sözleşmesini test et
./scripts/test-metrics-contract.sh
```

#### Manuel Test
```bash
# 1. Executor'ı başlat
METRICS_DISABLED=0 node services/executor/dist/index.cjs

# 2. Canary test
curl -X POST http://localhost:4001/api/canary/run \
  -H "Content-Type: application/json" \
  -d '{"dry": true}'

# 3. Metrikleri kontrol et
curl http://localhost:4001/metrics | grep "your_metric_name"
```

### Önleme

1. **Metrik eklerken labelNames tanımlayın**
2. **Kullanımda tutarlı olun**
3. **CI testlerini çalıştırın**
4. **Duplicate metrik tanımlarından kaçının**

### Sık Karşılaşılan Hatalar

#### Duplicate Metrik Tanımı
```typescript
// ❌ HATALI: Aynı metrik iki yerde tanımlı
// metrics.ts
export const httpRequests = new Counter({ name: 'http_requests' });

// plugins/metrics.ts  
export const httpRequests = new Counter({ name: 'http_requests' }); // ❌ DUPLICATE!
```

#### Eksik Label
```typescript
// ❌ HATALI: labelNames'de olmayan label kullanımı
metric.labels({ unknownLabel: 'value' }).inc(); // ❌ unknownLabel tanımlı değil!
```

### İletişim
Bu sorunla karşılaştığınızda:
1. Bu dokümantasyonu kontrol edin
2. CI testlerini çalıştırın
3. Metrics Contract ekibine danışın
