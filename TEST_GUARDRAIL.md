# AI PAYLOAD GUARDRAIL - TEST PLAN & KANIT TOPLAMA

**Tarih:** 30 Eylül 2025  
**Hedef:** Guardrail sisteminin çalıştığını doğrulamak ve kanıt toplamak

---

## 🧪 TEST SENARYOLARI

### 1. Normal Payload Test
**Amaç:** Guardrail'in normal payload'ları etkilemediğini doğrula

**Test Komutu:**
```powershell
# Normal AI generate request
$normalPayload = @{
    pair = "BTCUSDT"
    tf = "1h"
    style = "momentum"
    risk = "low"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:4001/api/ai/strategies/generate `
    -Method POST -ContentType "application/json" -Body $normalPayload
```

**Beklenen Sonuç:**
- ✅ 200 OK response
- ✅ `truncated: false` (guardrail log'unda)
- ✅ Normal AI response döner

### 2. Oversize Payload Test
**Amaç:** Büyük payload'ın guardrail tarafından işlendiğini doğrula

**Test Komutu:**
```powershell
# Büyük payload (500KB string + problematic values)
$bigPayload = @{
    msg = ("x" * 500000)  # 500KB string
    n1 = [double]::PositiveInfinity
    bi = [bigint]12345678901234567890
    items = @(1..1000)  # Large array
}
$bigPayload.self = $bigPayload  # Circular reference

$body = $bigPayload | ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri http://127.0.0.1:4001/api/ai/strategies/generate `
    -Method POST -ContentType "application/json" -Body $body
```

**Beklenen Sonuç:**
- ✅ 200 OK response (veya upstream response)
- ✅ `truncated: true` (guardrail log'unda)
- ✅ Warning log: "payload trimmed by guardrail"

### 3. Metrik Kontrolü
**Amaç:** Prometheus metriklerinin doğru toplandığını doğrula

**Test Komutu:**
```powershell
# Metrikleri kontrol et
$metrics = (Invoke-WebRequest http://127.0.0.1:4001/metrics).Content

# AI payload metriklerini filtrele
$metrics | Select-String "ai_payload_"
```

**Beklenen Metrikler:**
```
# HELP ai_payload_bytes AI tool payload size (bytes)
# TYPE ai_payload_bytes histogram
ai_payload_bytes_bucket{stage="pre",le="1000"} 0
ai_payload_bytes_bucket{stage="pre",le="5000"} 0
ai_payload_bytes_bucket{stage="pre",le="10000"} 0
ai_payload_bytes_bucket{stage="pre",le="50000"} 0
ai_payload_bytes_bucket{stage="pre",le="100000"} 0
ai_payload_bytes_bucket{stage="pre",le="250000"} 0
ai_payload_bytes_bucket{stage="pre",le="500000"} 1
ai_payload_bytes_bucket{stage="pre",le="1000000"} 1
ai_payload_bytes_bucket{stage="pre",le="+Inf"} 1
ai_payload_bytes_count{stage="pre"} 1
ai_payload_bytes_sum{stage="pre"} 500000

# HELP ai_payload_truncated_total Payload trimmed or limited
# TYPE ai_payload_truncated_total counter
ai_payload_truncated_total{reason="size"} 1
```

### 4. Log Kontrolü
**Amaç:** Guardrail uyarı mesajlarının log'da göründüğünü doğrula

**Test Komutu:**
```powershell
# Executor log'unu kontrol et
Get-Content logs/executor-combined.log -Tail 100 | 
    Select-String "payload trimmed by guardrail"
```

**Beklenen Log:**
```
{"level":30,"time":1696000000000,"msg":"payload trimmed by guardrail","bytes":500000,"warnings":["payload exceeds size limit, applying aggressive shrink","array shrunk from 1000 to 160 items","payload successfully shrunk"]}
```

---

## 📊 KANIT TOPLAMA STRATEJİSİ

### 1. Screenshot Kanıtları
**Hedef:** Görsel kanıt toplama

**Adımlar:**
1. **Normal Payload Test Screenshot**
   - PowerShell terminal
   - Request komutu
   - Response (200 OK)
   - Metrik değerleri

2. **Oversize Payload Test Screenshot**
   - PowerShell terminal
   - Büyük payload komutu
   - Response (200 OK)
   - Warning log mesajı

3. **Metrics Dashboard Screenshot**
   - `/metrics` endpoint response
   - `ai_payload_*` metrikleri
   - Bucket değerleri

### 2. Log Kanıtları
**Hedef:** Text-based kanıt toplama

**Dosyalar:**
- `logs/executor-combined.log` - Warning mesajları
- `logs/executor-error.log` - Error mesajları (varsa)
- PowerShell output - Test sonuçları

**Komutlar:**
```powershell
# Log'da guardrail mesajlarını ara
Get-Content logs/executor-combined.log -Tail 200 | 
    Select-String "guardrail|payload.*trimmed|ai_payload"

# Error log'u kontrol et
Get-Content logs/executor-error.log -Tail 50 | 
    Select-String "serialization|JSON|BigInt|NaN"
```

### 3. Metrik Kanıtları
**Hedef:** Prometheus metrik verilerini toplama

**Komutlar:**
```powershell
# Tüm AI payload metriklerini topla
$metrics = (Invoke-WebRequest http://127.0.0.1:4001/metrics).Content
$aiMetrics = $metrics | Select-String "ai_payload"
$aiMetrics | Out-File -FilePath "evidence/ai-payload-metrics.txt"

# Metrik değerlerini JSON olarak kaydet
$metricsObj = @{
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    metrics = $aiMetrics
}
$metricsObj | ConvertTo-Json -Depth 3 | Out-File -FilePath "evidence/ai-payload-metrics.json"
```

---

## 🚀 TEST EXECUTION PLANI

### Aşama 1: Hazırlık (5 dakika)
1. **Executor'ı başlat**
   ```powershell
   cd CursorGPT_IDE
   pnpm -C services/executor run dev
   ```

2. **Health check**
   ```powershell
   Invoke-WebRequest http://127.0.0.1:4001/health
   ```

3. **Metrics endpoint kontrol**
   ```powershell
   Invoke-WebRequest http://127.0.0.1:4001/metrics
   ```

### Aşama 2: Normal Payload Test (5 dakika)
1. **Normal request gönder**
2. **Response kontrol et**
3. **Log kontrol et**
4. **Screenshot al**

### Aşama 3: Oversize Payload Test (10 dakika)
1. **Büyük payload hazırla**
2. **Request gönder**
3. **Response kontrol et**
4. **Warning log kontrol et**
5. **Screenshot al**

### Aşama 4: Metrik Kontrolü (5 dakika)
1. **Metrics endpoint çağır**
2. **AI payload metriklerini filtrele**
3. **Değerleri kaydet**
4. **Screenshot al**

### Aşama 5: Kanıt Toplama (5 dakika)
1. **Log dosyalarını kopyala**
2. **Metrik verilerini kaydet**
3. **Screenshot'ları organize et**
4. **Test raporu hazırla**

---

## 📋 BAŞARI KRİTERLERİ

### ✅ Fonksiyonel Kriterler
- [ ] Normal payload test geçiyor (200 OK)
- [ ] Oversize payload test geçiyor (200 OK)
- [ ] Guardrail warning log'da görünüyor
- [ ] Metrikler doğru toplanıyor

### ✅ Performans Kriterleri
- [ ] Normal payload latency <100ms
- [ ] Oversize payload latency <500ms
- [ ] Guardrail overhead <5ms

### ✅ Operasyonel Kriterler
- [ ] Metrics endpoint çalışıyor
- [ ] Log'da uyarı mesajları var
- [ ] Screenshot kanıtları toplandı
- [ ] Test raporu hazır

---

## 🔧 TROUBLESHOOTING

### Sorun: Executor başlamıyor
**Çözüm:**
```powershell
# Port kontrolü
netstat -an | findstr :4001

# Process kontrolü
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Log kontrolü
Get-Content logs/executor-error.log -Tail 20
```

### Sorun: Metrikler görünmüyor
**Çözüm:**
```powershell
# Registry kontrolü
curl http://127.0.0.1:4001/metrics | grep ai_payload

# Manual metrik ekleme (debug)
# services/executor/src/metrics.ts dosyasını kontrol et
```

### Sorun: Guardrail çalışmıyor
**Çözüm:**
```powershell
# Import kontrolü
# services/executor/src/routes/ai-generate.ts dosyasını kontrol et

# Log seviyesi artır
# .env dosyasında LOG_LEVEL=debug
```

---

## 📄 TEST RAPORU ŞABLONU

### Test Sonuçları
```
Test Tarihi: 2025-09-30
Test Ortamı: Local Development
Executor Port: 4001
Test Süresi: 30 dakika

### Normal Payload Test
✅ Status: PASS
✅ Response: 200 OK
✅ Latency: 45ms
✅ Truncated: false

### Oversize Payload Test  
✅ Status: PASS
✅ Response: 200 OK
✅ Latency: 120ms
✅ Truncated: true
✅ Warning Log: "payload trimmed by guardrail"

### Metrik Kontrolü
✅ ai_payload_bytes: 1 sample
✅ ai_payload_truncated_total: 1 increment
✅ Bucket distribution: Correct

### Log Kontrolü
✅ Warning mesajı bulundu
✅ Bytes: 500000
✅ Warnings: ["payload exceeds size limit, applying aggressive shrink"]

### Genel Değerlendirme
✅ Tüm testler geçti
✅ Guardrail sistemi çalışıyor
✅ Metrikler doğru toplanıyor
✅ Log'da uyarı mesajları var

### Öneriler
- Chunked upload implementasyonu
- SSE retry mekanizması
- Dashboard oluşturma
```

---

**SON GÜNCELLEME:** 30 Eylül 2025  
**DURUM:** Test Planı Hazır ✅  
**SONRAKİ ADIM:** Executor'ı başlat ve testleri çalıştır
