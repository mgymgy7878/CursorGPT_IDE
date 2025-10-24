# Metrics & Canary - Technical Requirements

**Proje:** Spark Trading Platform  
**Tarih:** 2025-10-24  
**Kapsam:** Prometheus Metrics & Smoke/Canary Tests

---

## 🎯 Prometheus Content-Type Requirement

### ⚠️ CRITICAL: Content-Type Zorunluluğu

Prometheus endpoint **MUTLAKA** aşağıdaki Content-Type header'ı ile yanıt vermeli:

```
Content-Type: text/plain; version=0.0.4; charset=utf-8
```

### Neden Önemli?

- ✅ **Version `0.0.4`**: 2014'ten beri stabil Prometheus exposition format
- ✅ **Prometheus scraper uyumluluğu**: Resmi Prometheus client'lar bu formatı bekler
- ❌ **`text/plain` yalnız başına YETERLI DEĞİL** - `version` parametresi zorunlu
- ❌ **Yanlış Content-Type**: Scraper hataları ve metric kaybı

### Doğrulama

**HEAD İsteği ile:**
```bash
curl -I http://127.0.0.1:3004/api/public/metrics.prom

# Beklenen çıktı:
# HTTP/1.1 200 OK
# Content-Type: text/plain; version=0.0.4; charset=utf-8
# ...
```

**PowerShell ile:**
```powershell
$response = Invoke-WebRequest -Uri "http://127.0.0.1:3004/api/public/metrics.prom" -Method Head -UseBasicParsing
$response.Headers.'Content-Type'

# Beklenen: text/plain; version=0.0.4; charset=utf-8
```

**Smoke Test ile:**
```bash
powershell -File scripts/smoke_v2.ps1 -Port 3004
# Ready via: prom
# Prometheus endpoint başarıyla tespit edildi
```

### Referanslar

- [Prometheus Exposition Formats](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Content Negotiation](https://prometheus.io/docs/instrumenting/content_negotiation/)
- [Text Format Spec](https://github.com/prometheus/docs/blob/main/content/docs/instrumenting/exposition_formats.md#text-format-details)

---

## 📊 Metrics Endpoints

### Prometheus Format
```
GET /api/public/metrics.prom
Content-Type: text/plain; version=0.0.4; charset=utf-8

# TYPE spark_ws_last_message_ts gauge
spark_ws_last_message_ts 1761281864544
# TYPE spark_ws_staleness_seconds gauge
spark_ws_staleness_seconds 0.566
# TYPE spark_ws_btcturk_msgs_total counter
spark_ws_btcturk_msgs_total 42
```

### JSON Format
```
GET /api/public/metrics
Content-Type: application/json

{
  "counters": {
    "spark_ws_btcturk_msgs_total": 42,
    "spark_ws_trades_msgs_total": 0
  },
  "gauges": {
    "spark_ws_staleness_seconds": 0.566,
    "spark_ws_last_message_ts": 1761281864544
  }
}
```

### Endpoint Autodetect

Smoke test otomatik olarak şu sırayla endpoint'leri dener:

1. **Prometheus** (`/api/public/metrics.prom`) - Öncelikli
2. **JSON** (`/api/public/metrics`) - Fallback

```powershell
# smoke_v2.ps1 excerpt
$source = 'prom'
$prom = Invoke-WebRequest "$base/api/public/metrics.prom"
if (-not $prom -or $prom.StatusCode -ne 200) {
  $source = 'json'
}
```

---

## 🔬 Smoke Test Expectations

### Başarı Kriterleri

**PASS Durumu:**
- ✅ Metrics endpoint ulaşılabilir (HTTP 200)
- ✅ Content-Type doğru (Prom: `0.0.4`, JSON: `application/json`)
- ✅ WS message delta > 0 (canlı veri akışı var)
- ✅ Staleness < 5 saniye

**ATTENTION Durumu:**
- ⚠️ Metrics endpoint ulaşılabilir (HTTP 200)
- ⚠️ Content-Type doğru
- ⚠️ WS message delta = 0 (canlı veri akışı yok)
- ⚠️ Staleness = 999 (WS bağlantısı yok)

**FAIL Durumu:**
- ❌ Metrics endpoint ulaşılamaz (HTTP ≠ 200)
- ❌ Content-Type yanlış
- ❌ 45 saniye içinde readiness gelmedi

### Örnek Çıktılar

**PASS:**
```
ready_via: prom
try #1 | port: 3004
msgs_total delta: 5
staleness s: 1.2
SMOKE: PASS
```

**ATTENTION:**
```
ready_via: prom
try #1 | port: 3004
msgs_total delta: 0
staleness s: 999
SMOKE: ATTENTION
```

---

## 🚀 Smoke Test Kullanımı

### Basic Run
```bash
# Default (port 3004, 12s warmup)
powershell -File scripts/smoke_v2.ps1

# Custom port
powershell -File scripts/smoke_v2.ps1 -Port 3003

# Hızlı test (5s warmup)
powershell -File scripts/smoke_v2.ps1 -Port 3004 -WarmupSeconds 5
```

### With WebSocket Trigger
```bash
# WS bağlantısını test et
powershell -File scripts/smoke_v2.ps1 -Port 3004 -TriggerWS

# wscat gereklidir:
# npm install -g wscat
```

### Evidence Collection
```bash
# Kanıt klasörü
powershell -File scripts/smoke_v2.ps1 -Port 3004

# Evidence yolu:
# apps/web-next/evidence/local/oneshot/
#   - metrics_headers_and_version.txt
#   - metrics_prom_head.txt
#   - warmup.txt
```

---

## 📋 Verify Test Integration

### Advisory Mode (Default)
```bash
powershell -File tools/release/verify.ps1 -Port 3004

# SUMMARY:
# HEALTH:True
# REDIR1:False REDIR2:False
# UXACK:UX-ACK:6f982abc75df
# LINT:ADVISORY_WARN
# RESULT:PASS ✅
# PORT:3004
# SOURCE:prom
# STRICT:False
```

### Strict Mode
```bash
# ENV ile
$env:SPARK_VERIFY_STRICT_LINT="1"
powershell -File tools/release/verify.ps1 -Port 3004

# Parametre ile
powershell -File tools/release/verify.ps1 -Port 3004 -StrictLint

# SUMMARY:
# LINT:STRICT_FAIL
# RESULT:FAIL ❌
# STRICT:True
```

---

## 🎯 Canary Best Practices

### 1. Health Check Sequence
```
1. Port dinleme kontrolü (Get-NetTCPConnection)
2. HTTP health endpoint (/)
3. Metrics readiness (prom/json)
4. Smoke test (WS delta + staleness)
5. Verify test (redirects + UX-ACK)
```

### 2. Content-Type Validation
```powershell
# HEAD request ile doğrula
$headers = (Invoke-WebRequest -Method Head -Uri "http://127.0.0.1:3004/api/public/metrics.prom").Headers

if ($headers.'Content-Type' -match 'text/plain.*version=0\.0\.4') {
  Write-Host "✅ Content-Type PASS" -ForegroundColor Green
} else {
  Write-Host "❌ Content-Type FAIL" -ForegroundColor Red
}
```

### 3. Evidence Archiving
```powershell
# Kanıtları ZIP'le
Compress-Archive -Path evidence/* -DestinationPath evidence_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip -Force
```

---

## 📚 Metrics Glossary

### Gauge Metrics
- **`spark_ws_staleness_seconds`**: Son WS mesajından bu yana geçen süre (saniye)
  - < 5: Fresh data ✅
  - \> 5: Stale data ⚠️
  - 999: WS bağlantısı yok ❌

- **`spark_ws_last_message_ts`**: Son WS mesajının timestamp'i (Unix ms)

### Counter Metrics
- **`spark_ws_btcturk_msgs_total`**: BTCTurk WS'den alınan toplam mesaj sayısı
- **`spark_ws_trades_msgs_total`**: Trade mesajları sayısı
- **`spark_ws_orderbook_msgs_total`**: Orderbook mesajları sayısı
- **`spark_ws_trades_errors_total`**: WS hata sayısı

---

## ⚙️ Troubleshooting

### Sorun: Content-Type yanlış

**Belirti:**
```
Content-Type: text/plain
```

**Çözüm:**
```typescript
// Next.js API route
export async function GET(request: Request) {
  const prom = generatePrometheusMetrics();
  
  return new Response(prom, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
```

### Sorun: SMOKE:ATTENTION (WS yok)

**Belirti:**
```
msgs_total delta: 0
staleness s: 999
SMOKE: ATTENTION
```

**Açıklama:**
- Bu **NORMAL** bir durumdur yerelde test ederken
- Canlı WS veri akışı yoksa delta 0 olur
- Metrics endpoint'ler çalışıyor demektir ✅

**Çözüm (opsiyonel):**
```bash
# WS bağlantısını tetikle
powershell -File scripts/smoke_v2.ps1 -TriggerWS

# Veya canlı ortamda test et
```

### Sorun: Port dinlemiyor

**Belirti:**
```
Get-NetTCPConnection: Port 3004 dinlemiyor
```

**Çözüm:**
```bash
# Standalone server'ı başlat
powershell -File scripts/start-standalone.ps1

# Veya
cd apps/web-next
$env:PORT="3004"
$env:HOSTNAME="127.0.0.1"
node .next/standalone/server.js
```

---

## 📖 Kaynaklar

- [Prometheus Exposition Formats](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [Content Negotiation](https://prometheus.io/docs/instrumenting/content_negotiation/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Son Güncelleme:** 2025-10-24  
**Bakım:** Metrics formatı değişikliklerinde güncellenir
