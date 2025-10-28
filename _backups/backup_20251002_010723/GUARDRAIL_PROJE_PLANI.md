# CHAT/AGENT SERIALIZATION GUARDRAIL - DETAYLI PROJE PLANI

**Tarih:** 30 Eylül 2025  
**Durum:** Planlama Aşaması  
**Hedef:** Chat/Agent tool çağrılarında JSON serialization hatalarını önlemek

---

## 📊 PROJE ÖZET

### Sorun Tanımı
Chat/Agent katmanında "Serialization error in aiserver.v1.StreamUnifiedChatRequestWithTools" hatası oluşuyor. Bu hata iki ana sebepten kaynaklanıyor:

1. **Ağ Katmanı:** VPN/proxy/firewall yüzünden SSE stream kopması
2. **Payload Sorunları:** Serileştirilemeyen içerik (BigInt, NaN/Infinity, circular references, çok büyük payload)

### Çözüm Yaklaşımı
Payload guardrail sistemi kurarak:
- JSON'a çevrilemeyen değerleri sanitize etme
- Büyük payload'ları otomatik trim etme
- Prometheus metrikleri ile izleme
- Alarm kuralları ile proaktif müdahale

---

## 🏗️ PROJE YAPISI ANALİZİ

### Mevcut Mimari

#### 1. Monorepo Yapısı
```
CursorGPT_IDE/
├── apps/
│   └── web-next/          # Next.js 14 UI (port: 3003)
├── services/
│   └── executor/          # Fastify API (port: 4001)
│       ├── src/
│       │   ├── index.ts           # Ana uygulama
│       │   ├── metrics.ts         # Prometheus metrikleri
│       │   ├── guardrails.ts      # Mevcut guardrail (trading)
│       │   └── routes/
│       │       └── ai-generate.ts # AI routes
│       └── package.json
└── packages/
    └── guardrails/        # Guardrail paketi (@spark/guardrails)
        ├── src/
        │   ├── index.ts
        │   └── guardrails.ts
        └── package.json
```

#### 2. Mevcut Bağımlılıklar
**Root Package.json:**
- `pnpm@10.14.0` - Package manager
- `node@20.10.0` - Runtime
- `fastify@4.29.1` - Web framework
- `prom-client@15.1.3` - Prometheus client

**Executor Package.json:**
- `@spark/guardrails@workspace:*` - Mevcut guardrail paketi
- `pino@9.12.0` - Logger
- `undici@7.16.0` - HTTP client
- `zod@4.1.11` - Schema validation

#### 3. Mevcut Metrikler (services/executor/src/metrics.ts)
```typescript
// Mevcut AI metrikleri
- aiTokensTotal: Counter<'dir'>
- aiGenerateTotal: Counter<'model'>
- aiLatencyMs: Histogram<'model'>

// HTTP metrikleri
- httpRequestsTotal: Counter<'route'|'method'|'status'>
- httpLatencySeconds: Histogram<'route'|'method'|'status'>
- inFlight: Gauge<'route'>
```

#### 4. Mevcut AI Routes (services/executor/src/routes/ai-generate.ts)
```typescript
// Endpoint: POST /api/ai/strategies/generate
// - Token guard ile korumalı
// - AI provider (openai/mock) ile entegre
// - Metrik toplama mevcut
// - Fallback mekanizması var
```

---

## 🎯 ÇÖZÜM MİMARİSİ

### 1. Yeni Guardrail Modülleri

#### A. Safe JSON Module (services/executor/src/guardrails/safe-json.ts)
**Amaç:** JSON serileştirme hatalarını önlemek

**Özellikler:**
- `BigInt` → `string` dönüşümü
- `NaN/±Infinity` → `null` dönüşümü
- `undefined` → drop (JSON.stringify davranışı)
- Circular references → `"<circular>"` marker
- Uzun string'ler → trim (maxStringKB=100)

**Fonksiyonlar:**
```typescript
export interface SafeJsonOpts {
  maxStringKB?: number;      // default: 100 KB
  circularMarker?: string;   // default: "<circular>"
  trimMarker?: string;       // default: "<trimmed>"
}

export function safeStringify(input: unknown, opts?: SafeJsonOpts): string
```

#### B. Payload Guardrail Module (services/executor/src/guardrails/payload.ts)
**Amaç:** Payload boyutunu kontrol etmek ve sınırlamak

**Özellikler:**
- İlk aşama: Safe stringify (maxStringKB=100)
- Boyut kontrolü (maxPayloadKB=256)
- Agresif shrink: Büyük dizileri kısalt (>256 eleman → 128 head + 32 tail)
- Uyarı mesajları üret

**Fonksiyonlar:**
```typescript
export interface GuardrailOpts {
  maxPayloadKB?: number;     // default: 256 KB
  maxStringKB?: number;      // default: 100 KB
}

export interface GuardrailResult {
  json: string;
  bytes: number;
  truncated: boolean;
  warnings: string[];
}

export function guardrailSerialize(payload: unknown, opts?: GuardrailOpts): GuardrailResult
```

### 2. Metrik Güncellemeleri (services/executor/src/metrics.ts)

**Yeni Metrikler:**
```typescript
// Payload boyut dağılımı
export const aiPayloadBytes = Histogram<'stage'> {
  name: 'ai_payload_bytes',
  help: 'AI tool payload size (bytes)',
  labelNames: ['stage'],  // 'pre' (guardrail öncesi)
  buckets: [1e3, 5e3, 1e4, 5e4, 1e5, 2.5e5, 5e5, 1e6]
}

// Trim/truncate sayacı
export const aiPayloadTruncatedTotal = Counter<'reason'> {
  name: 'ai_payload_truncated_total',
  help: 'Payload trimmed or limited',
  labelNames: ['reason']  // 'size', 'upstream'
}
```

### 3. AI Routes Entegrasyonu

**Değişiklik Alanı:** `services/executor/src/routes/ai-generate.ts`

**Entegrasyon Noktası:**
```typescript
// Mevcut kod:
app.post('/api/ai/strategies/generate', async (req, reply) => {
  const body = req.body;
  // ... AI işlemleri
});

// Yeni kod:
import { guardrailSerialize } from '../../guardrails/payload.js';
import { aiPayloadBytes, aiPayloadTruncatedTotal } from '../../metrics.js';

app.post('/api/ai/strategies/generate', async (req, reply) => {
  const body = req.body;
  
  // Guardrail uygula
  const ser = guardrailSerialize(body, { 
    maxPayloadKB: 256, 
    maxStringKB: 100 
  });
  
  // Metrik kaydet
  aiPayloadBytes.observe({ stage: 'pre' }, ser.bytes);
  
  if (ser.truncated) {
    aiPayloadTruncatedTotal.inc({ reason: 'size' });
    req.log.warn({ bytes: ser.bytes, warnings: ser.warnings }, 
      'payload trimmed by guardrail');
  }
  
  // Upstream'e güvenli JSON ile gönder
  // ... AI işlemleri (ser.json kullan)
});
```

---

## 📋 İMPLEMENTASYON PLANI

### Faz 1: Guardrail Modülleri (2-3 saat)

#### Adım 1.1: Safe JSON Module
**Dosya:** `services/executor/src/guardrails/safe-json.ts`

**Görevler:**
- [ ] `SafeJsonOpts` interface tanımla
- [ ] `safeStringify()` fonksiyonu yaz
  - [ ] WeakSet ile circular detection
  - [ ] BigInt → string converter
  - [ ] NaN/Infinity → null converter
  - [ ] String length kontrol ve trim
- [ ] Unit test senaryoları belirle
  - [ ] Circular reference testi
  - [ ] BigInt/NaN/Infinity testleri
  - [ ] Uzun string trim testi

**Bağımlılıklar:**
- `Buffer` (Node.js built-in) - Byte hesaplama için
- Harici bağımlılık yok ✅

#### Adım 1.2: Payload Guardrail Module
**Dosya:** `services/executor/src/guardrails/payload.ts`

**Görevler:**
- [ ] `GuardrailOpts` interface tanımla
- [ ] `GuardrailResult` interface tanımla
- [ ] `guardrailSerialize()` fonksiyonu yaz
  - [ ] İlk aşama: safe stringify
  - [ ] Boyut kontrolü
  - [ ] Agresif shrink (büyük diziler)
  - [ ] Warning mesajları
- [ ] Unit test senaryoları belirle
  - [ ] Normal payload (limit altı)
  - [ ] Büyük payload (limit üstü)
  - [ ] Büyük dizi kırpma

**Bağımlılıklar:**
- `./safe-json.js` - Safe stringify
- `Buffer` (Node.js built-in)

### Faz 2: Metrik Entegrasyonu (1 saat)

#### Adım 2.1: Metrics.ts Güncelleme
**Dosya:** `services/executor/src/metrics.ts`

**Görevler:**
- [ ] `aiPayloadBytes` histogram tanımla
  - [ ] Bucket değerleri: [1e3, 5e3, 1e4, 5e4, 1e5, 2.5e5, 5e5, 1e6]
  - [ ] Label: 'stage' (pre)
- [ ] `aiPayloadTruncatedTotal` counter tanımla
  - [ ] Label: 'reason' (size, upstream)
- [ ] Export ekle
- [ ] Mevcut registry'ye kayıt

**Bağımlılıklar:**
- Mevcut `prom-client` kurulumu ✅
- Mevcut `registry` ✅

### Faz 3: AI Routes Entegrasyonu (1-2 saat)

#### Adım 3.1: ai-generate.ts Güncelleme
**Dosya:** `services/executor/src/routes/ai-generate.ts`

**Görevler:**
- [ ] Import ekle: `guardrailSerialize`
- [ ] Import ekle: `aiPayloadBytes`, `aiPayloadTruncatedTotal`
- [ ] `/api/ai/strategies/generate` endpoint'ine guardrail ekle
  - [ ] Request body'yi guardrailSerialize'dan geçir
  - [ ] Metrik kaydet (aiPayloadBytes)
  - [ ] Truncate durumunda log yaz
  - [ ] Truncate durumunda counter artır
- [ ] Backward compatibility kontrolü
  - [ ] `/api/advisor/suggest` passthrough'u koru

**Bağımlılıklar:**
- `../../guardrails/payload.js`
- `../../metrics.js`

**Risk Analizi:**
- ⚠️ Mevcut AI generate akışını bozma riski
- ✅ Mitigation: Guardrail sadece serialize ediyor, lojik değiştirmiyor
- ✅ Backward compat: Mevcut endpoint davranışı aynı kalıyor

### Faz 4: Test & Doğrulama (2-3 saat)

#### Adım 4.1: Birim Testleri
**Hedef:** Safe JSON ve Payload modüllerini test et

**Test Senaryoları:**
1. **Circular Reference Test**
   ```typescript
   const obj: any = { name: "test" };
   obj.self = obj;
   // Beklenen: { name: "test", self: "<circular>" }
   ```

2. **BigInt Test**
   ```typescript
   const data = { id: 12345678901234567890n };
   // Beklenen: { id: "12345678901234567890" }
   ```

3. **NaN/Infinity Test**
   ```typescript
   const data = { 
     nan: NaN, 
     inf: Infinity, 
     negInf: -Infinity 
   };
   // Beklenen: { nan: null, inf: null, negInf: null }
   ```

4. **Uzun String Test**
   ```typescript
   const data = { msg: "x".repeat(200_000) };
   // Beklenen: { msg: "xxxx...<trimmed>" } (100KB limit)
   ```

5. **Büyük Dizi Test**
   ```typescript
   const data = { items: Array(1000).fill("item") };
   // Beklenen: { items: [128 head, "__TRIMMED__", 32 tail] }
   ```

#### Adım 4.2: Entegrasyon Testleri
**Hedef:** Executor servisinde guardrail'i test et

**Test Adımları:**
1. **Dev Ortamı Hazırlık**
   ```powershell
   # Executor'ı başlat
   cd CursorGPT_IDE
   pnpm -C services/executor run dev
   # Beklenen: http://127.0.0.1:4001
   ```

2. **Normal Payload Test**
   ```powershell
   $body = @{
     pair = "BTCUSDT"
     tf = "1h"
     style = "momentum"
     risk = "low"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri http://127.0.0.1:4001/api/ai/strategies/generate `
     -Method POST -ContentType "application/json" -Body $body
   
   # Beklenen: 200 OK, truncated: false
   ```

3. **Oversize Payload Test**
   ```powershell
   $big = @{
     msg = ("x" * 500000)
     n1 = [double]::PositiveInfinity
     bi = [bigint]12345678901234567890
   }
   $big.self = $big  # circular
   
   $body = $big | ConvertTo-Json -Depth 6
   
   Invoke-RestMethod -Uri http://127.0.0.1:4001/api/ai/strategies/generate `
     -Method POST -ContentType "application/json" -Body $body
   
   # Beklenen: 200 OK veya upstream response, truncated: true
   ```

4. **Metrik Kontrolü**
   ```powershell
   (Invoke-WebRequest http://127.0.0.1:4001/metrics).Content | 
     Select-String "ai_payload_"
   
   # Beklenen metrikler:
   # - ai_payload_bytes_bucket{stage="pre",le="..."} ...
   # - ai_payload_bytes_count{stage="pre"} ...
   # - ai_payload_truncated_total{reason="size"} ...
   ```

5. **Log Kontrolü**
   ```powershell
   Get-Content logs/executor-combined.log -Tail 50 | 
     Select-String "payload trimmed by guardrail"
   
   # Beklenen: Warning log mesajı
   ```

#### Adım 4.3: Yük Testi (Opsiyonel)
**Hedef:** Guardrail'in performans etkisini ölç

**Test Senaryoları:**
1. **Baseline (Guardrail Yok)**
   - 100 istek/saniye, normal payload
   - P95 latency kaydet

2. **With Guardrail (Normal Payload)**
   - 100 istek/saniye, normal payload
   - P95 latency kaydet ve baseline ile karşılaştır
   - Beklenen: <5% overhead

3. **With Guardrail (Büyük Payload)**
   - 10 istek/saniye, 200KB payload
   - P95 latency kaydet
   - Beklenen: <100ms overhead

### Faz 5: Alarm & Monitoring (1 saat)

#### Adım 5.1: Prometheus Alarm Kuralları
**Dosya:** `ops/alerts/ai-guardrails.yml` (yeni)

**Kurallar:**
```yaml
groups:
- name: ai-guardrails
  rules:
  # Trim spike alarm
  - alert: AIPayloadTrimSpike
    expr: rate(ai_payload_truncated_total[5m]) > 0
    for: 5m
    labels: 
      severity: warning
    annotations:
      summary: "AI payload trimming detected"
      description: "Guardrail trimmed payloads in the last 5m."
  
  # Payload size P95 alarm
  - alert: AIPayloadSizeHigh
    expr: histogram_quantile(0.95, sum(rate(ai_payload_bytes_bucket[5m])) by (le)) > 250000
    for: 10m
    labels: 
      severity: info
    annotations:
      summary: "AI payload bytes p95 high"
      description: "p95 payload size exceeded 250 KB."
```

**Görevler:**
- [ ] Alarm dosyası oluştur
- [ ] Prometheus config'e dahil et
- [ ] Prometheus reload
- [ ] Grafana dashboard'a ekle (opsiyonel)

#### Adım 5.2: Grafana Dashboard (Opsiyonel)
**Panel Önerileri:**
1. **AI Payload Size Distribution**
   - Metric: `ai_payload_bytes_bucket`
   - Visualization: Histogram
   - Time: Last 1h

2. **Payload Truncation Rate**
   - Metric: `rate(ai_payload_truncated_total[5m])`
   - Visualization: Graph
   - Time: Last 24h

3. **Truncation Reasons**
   - Metric: `ai_payload_truncated_total`
   - Visualization: Pie chart
   - Group by: reason

---

## 🔍 BAĞIMLILIK ANALİZİ

### Mevcut Bağımlılıklar ✅
- `fastify@4.29.1` - Web framework (mevcut)
- `prom-client@15.1.3` - Prometheus client (mevcut)
- `pino@9.12.0` - Logger (mevcut)
- `undici@7.16.0` - HTTP client (mevcut, upstream için)
- `zod@4.1.11` - Schema validation (mevcut)

### Yeni Bağımlılıklar ❌
**GEREKLI DEĞİL!** Tüm implementasyon Node.js built-in modülleri ile yapılabilir:
- `Buffer` - Byte hesaplama
- `JSON.stringify/parse` - Serialization
- `WeakSet` - Circular detection

### TypeScript Bağımlılıkları ✅
- `@types/node@20.19.13` - Node.js type definitions (mevcut)
- `typescript@5.9.2` - Compiler (mevcut)

---

## ⚠️ RİSK ANALİZİ

### Yüksek Risk (P0)
❌ **YOK** - Bu implementasyon kritik sistemleri etkilemiyor

### Orta Risk (P1)
⚠️ **AI Generate Endpoint Performansı**
- **Risk:** Guardrail serialize işlemi latency ekleyebilir
- **Olasılık:** Düşük (<5ms overhead bekleniyor)
- **Etki:** Orta (AI yanıt süresi artışı)
- **Mitigation:** 
  - Yük testleri ile doğrula
  - Büyük payload'lar için chunking ekle (Faz 6)
  - Gerekirse caching ekle

⚠️ **Backward Compatibility**
- **Risk:** Mevcut AI generate akışını bozabilir
- **Olasılık:** Çok Düşük (sadece serialize ekleniyor)
- **Etki:** Yüksek (AI servisi çalışmaz)
- **Mitigation:**
  - Kapsamlı test senaryoları
  - Staged rollout (önce dev, sonra prod)
  - Rollback planı hazır

### Düşük Risk (P2)
⚠️ **Metrik Overhead**
- **Risk:** Yeni metrikler Prometheus yükünü artırabilir
- **Olasılık:** Çok Düşük
- **Etki:** Düşük
- **Mitigation:** Metrik kardinalite düşük (2-3 label)

---

## 🚀 DEPLOYMENT PLANI

### Aşama 1: Dev Ortamı (Gün 1)
**Hedef:** Lokal development ortamında test

**Adımlar:**
1. Guardrail modüllerini yaz
2. Metrik entegrasyonu yap
3. AI routes güncellemesi yap
4. Birim testleri çalıştır
5. Lokal smoke test (oversize payload)

**Başarı Kriteri:**
- ✅ Tüm testler geçiyor
- ✅ Metrics `/metrics` endpoint'inde görünüyor
- ✅ Oversize payload test başarılı
- ✅ Log'da uyarı mesajı var

### Aşama 2: Integration Test (Gün 1-2)
**Hedef:** CI/CD pipeline'da otomatik test

**Adımlar:**
1. Test script'leri yaz (PowerShell/Bash)
2. CI config güncelle (varsa)
3. Automated smoke test ekle
4. Metrik validation ekle

**Başarı Kriteri:**
- ✅ CI pipeline geçiyor
- ✅ Smoke test otomatik çalışıyor
- ✅ Coverage >80%

### Aşama 3: Staging (Gün 2-3)
**Hedef:** Production benzeri ortamda test

**Adımlar:**
1. Staging'e deploy et
2. Yük testi çalıştır
3. P95 latency ölç
4. Metrik dashboard'u izle
5. Alarm kurallarını test et

**Başarı Kriteri:**
- ✅ P95 latency <500ms (AI endpoint)
- ✅ Guardrail overhead <5ms
- ✅ Metrikler doğru toplanıyor
- ✅ Alarmlar çalışıyor

### Aşama 4: Production (Gün 3-4)
**Hedef:** Canlı ortamda gradual rollout

**Adımlar:**
1. **Canary Deployment (5% trafik)**
   - Canary pod'a deploy et
   - 1 saat izle
   - Error rate kontrol et
   
2. **Blue-Green Rollout (50% trafik)**
   - Blue fleet güncelle
   - 2 saat izle
   - Metrik karşılaştır
   
3. **Full Rollout (100% trafik)**
   - Green fleet güncelle
   - 24 saat izle
   - Incident yok ise başarılı

**Başarı Kriteri:**
- ✅ Error rate artışı yok
- ✅ P95 latency artışı <5%
- ✅ Serialization error sayısı azaldı
- ✅ 24 saat incident yok

### Rollback Planı
**Tetikleyiciler:**
- Error rate >1% artış
- P95 latency >10% artış
- Critical bug tespit

**Rollback Adımları:**
1. Önceki version'a dön (git revert)
2. CI/CD ile deploy et
3. Servisleri restart et
4. Metrik izlemeye devam et
5. Post-mortem analizi yap

---

## 📊 BAŞARI KRİTERLERİ & SLO

### Fonksiyonel Başarı
- ✅ BigInt/NaN/Infinity değerleri güvenli şekilde dönüştürülüyor
- ✅ Circular references algılanıyor ve marker ile işaretleniyor
- ✅ Büyük payload'lar (>256KB) otomatik trim ediliyor
- ✅ Serialization error sayısı %90+ azaldı

### Performans Başarı (SLO)
- ✅ AI generate endpoint P95 latency <500ms
- ✅ Guardrail overhead <5ms (P95)
- ✅ Memory overhead <10MB
- ✅ CPU overhead <2%

### Operasyonel Başarı
- ✅ Metrikler doğru toplanıyor (`/metrics`)
- ✅ Alarmlar çalışıyor (Prometheus)
- ✅ Log'da uyarı mesajları var
- ✅ Dashboard görünürlüğü (Grafana)

### Güvenilirlik (SLO)
- ✅ AI service availability >99.9%
- ✅ Error rate <0.1%
- ✅ 24 saat incident-free operation

---

## 📅 ZAMAN ÇİZELGESİ

### Gün 1 (6-8 saat)
**Sabah (3-4 saat):**
- [ ] Safe JSON module (1.5 saat)
- [ ] Payload guardrail module (1.5 saat)
- [ ] Birim testleri (1 saat)

**Öğleden Sonra (3-4 saat):**
- [ ] Metrik entegrasyonu (1 saat)
- [ ] AI routes entegrasyonu (1.5 saat)
- [ ] Lokal smoke test (0.5 saat)
- [ ] İlk commit & PR (1 saat)

### Gün 2 (4-6 saat)
**Sabah (2-3 saat):**
- [ ] Entegrasyon testleri (1.5 saat)
- [ ] CI/CD pipeline güncellemesi (1 saat)

**Öğleden Sonra (2-3 saat):**
- [ ] Staging deployment (1 saat)
- [ ] Yük testleri (1.5 saat)
- [ ] Performance validation (0.5 saat)

### Gün 3 (2-4 saat)
**Sabah (1-2 saat):**
- [ ] Alarm kuralları (0.5 saat)
- [ ] Dashboard oluştur (1 saat)

**Öğleden Sonra (1-2 saat):**
- [ ] Canary deployment (5% trafik)
- [ ] 1 saat monitoring

### Gün 4 (2-4 saat)
**Sabah (1-2 saat):**
- [ ] Blue-Green rollout (50% trafik)
- [ ] 2 saat monitoring

**Öğleden Sonra (1-2 saat):**
- [ ] Full rollout (100% trafik)
- [ ] 24 saat monitoring planla
- [ ] Dokümantasyon tamamla

**TOPLAM SÜRE:** 14-22 saat (yaklaşık 2-3 iş günü)

---

## 📖 DOKÜMANTASYON PLANI

### Kod Dokümantasyonu
**Hedef Dosyalar:**
- `services/executor/src/guardrails/safe-json.ts`
- `services/executor/src/guardrails/payload.ts`
- `services/executor/src/metrics.ts`
- `services/executor/src/routes/ai-generate.ts`

**Dokümantasyon İçeriği:**
- JSDoc comment'ler (fonksiyon/interface)
- Kullanım örnekleri (inline)
- Edge case notları
- Performance notları

### Runbook Dokümantasyonu
**Dosya:** `docs/runbooks/ai-payload-guardrail.md`

**İçerik:**
1. **Genel Bakış**
   - Guardrail ne yapar?
   - Ne zaman devreye girer?
   
2. **Monitoring**
   - Hangi metrikler izlenir?
   - Dashboard linkleri
   - Alarm kuralları
   
3. **Troubleshooting**
   - Yaygın sorunlar ve çözümleri
   - Debug komutları
   - Log örnekleri
   
4. **Rollback**
   - Ne zaman rollback yapılır?
   - Rollback adımları
   - Post-rollback validation

### README Güncellemesi
**Dosya:** `CursorGPT_IDE/README.md`

**Eklenecek Bölüm:**
```markdown
## AI Payload Guardrail

Chat/Agent serialization hatalarını önlemek için payload guardrail sistemi aktif.

### Özellikler
- BigInt/NaN/Infinity → güvenli dönüşüm
- Circular references → marker
- Büyük payload → otomatik trim
- Prometheus metrikleri

### Metrikler
- `ai_payload_bytes` - Payload boyutu (histogram)
- `ai_payload_truncated_total` - Trim sayısı (counter)

### Konfigürasyon
Env değişkenleri:
- `AI_PAYLOAD_MAX_KB` - Max payload size (default: 256)
- `AI_STRING_MAX_KB` - Max string size (default: 100)
```

---

## 🔄 GELECEK İYİLEŞTİRMELER (Faz 6+)

### Öncelik 1: Chunked Upload
**Amaç:** Çok büyük logları parça parça gönder

**Tasarım:**
```typescript
// services/executor/src/guardrails/chunked-upload.ts
export async function uploadChunked(
  data: string, 
  chunkSizeKB: number = 100
): Promise<string> {
  // 100KB parçalara böl
  // Her parçayı upload et
  // Manifest dosyası oluştur
  // Manifest URL'i döndür
}
```

**Faydalar:**
- Serialization timeout'u önler
- Network stability artışı
- Daha büyük log/payload desteği

### Öncelik 2: SSE Retry Mekanizması
**Amaç:** Ağ kopmaları için otomatik retry

**Tasarım:**
```typescript
// services/executor/src/ai/sse-client.ts
export class SSEClient {
  private backoff = [500, 1000, 2000, 5000]; // ms
  private maxRetries = 3;
  
  async connect(url: string): Promise<EventSource> {
    // Exponential backoff ile retry
    // requestId ile idempotent request
  }
}
```

**Faydalar:**
- Ağ kopmalarından otomatik recovery
- Kullanıcı deneyimi iyileşmesi
- Error rate azalması

### Öncelik 3: Payload Compression
**Amaç:** Büyük payload'ları sıkıştır

**Tasarım:**
```typescript
// services/executor/src/guardrails/compression.ts
import zlib from 'zlib';

export function compressPayload(data: string): Buffer {
  return zlib.gzipSync(Buffer.from(data, 'utf8'));
}
```

**Faydalar:**
- Network bandwidth tasarrufu
- Latency azalması
- Daha büyük payload desteği

### Öncelik 4: Smart Sampling
**Amaç:** Büyük dizileri akıllı şekilde örnekle

**Tasarım:**
```typescript
// services/executor/src/guardrails/sampling.ts
export function sampleArray<T>(
  arr: T[], 
  maxSamples: number = 256
): T[] {
  // İlk N, son M, rastgele K eleman
  // Istatistiksel temsiliyeti koru
}
```

**Faydalar:**
- Daha iyi veri temsiliyeti
- Debugging kolaylığı
- Payload boyutu kontrolü

---

## 📞 İLETİŞİM & DESTEK

### Proje Sahipleri
- **Backend Lead:** [Ekip üyesi]
- **DevOps Lead:** [Ekip üyesi]

### Slack Kanalları
- `#spark-backend` - Genel backend tartışmaları
- `#spark-ops` - Operasyonel sorunlar
- `#spark-incidents` - Incident response

### Dokümantasyon
- **Confluence:** [Link]
- **GitHub Wiki:** [Link]
- **Runbooks:** `docs/runbooks/`

---

## ✅ ONAY & İMZALAR

| Rol | İsim | Tarih | İmza |
|-----|------|-------|------|
| Tech Lead | [İsim] | YYYY-MM-DD | ✅ |
| DevOps Lead | [İsim] | YYYY-MM-DD | ✅ |
| Product Owner | [İsim] | YYYY-MM-DD | ✅ |

---

**SON GÜNCELLEME:** 30 Eylül 2025  
**DURUM:** Planlama Tamamlandı ✅  
**SONRAKİ ADIM:** Faz 1 implementasyonuna başla

