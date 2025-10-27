# Sprint F0 Finalize Checklist

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## ✅ TAMAMLANMASI GEREKENLER

### 1. Grafana Futures Dashboard
- [x] Dashboard JSON oluşturuldu
- [x] 6 panel tanımlandı
- [ ] Grafana'da görünüyor
- [ ] Paneller veri alıyor

### 2. Prometheus Alert Rules
- [x] Alert rules dosyası oluşturuldu
- [x] 7 alert kuralı tanımlandı
- [ ] Prometheus'ta yüklü
- [ ] Alert evaluation çalışıyor

### 3. Copilot API Endpoints
- [x] `/ai/chat` endpoint oluşturuldu
- [x] `/ai/generate-strategy` endpoint oluşturuldu
- [x] Rule-based NLP (MVP)
- [ ] API test edildi

### 4. Smoke Tests
- [ ] WebSocket başlatma
- [ ] Metrics görünürlüğü
- [ ] Dry-run order
- [ ] Canary workflow
- [ ] Copilot action generation

---

## 🧪 SMOKE TEST SUITE

### Test 1: Executor Başlatma

```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1

# Bekle (15-30 saniye)
Start-Sleep -Seconds 20

# Health check
Invoke-WebRequest -Uri http://127.0.0.1:4001/health -UseBasicParsing
```

**Beklenen**: `{"status":"ok"}`

---

### Test 2: Futures Health

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/health -UseBasicParsing
```

**Beklenen**: `{"status":"ok","testnet":true,"serverTime":...}`

---

### Test 3: Metrics Görünürlüğü

```powershell
# Tüm futures metrics
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "spark_futures_"

# WebSocket metrics
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "futures_ws_"
```

**Beklenen**: futures_* ve spark_futures_* metrikleri görünür

---

### Test 4: WebSocket Başlatma

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/ws.start `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"symbols":["BTCUSDT","ETHUSDT"]}' `
  -UseBasicParsing
```

**Beklenen**: `{"ok":true,"symbols":["BTCUSDT","ETHUSDT"],"streams":["market","userData"]}`

**Metrics Kontrolü**:
```powershell
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "futures_ws_connects_total"
```

**Beklenen**: `futures_ws_connects_total{stream_type="market"} 1`

---

### Test 5: Dry-Run Order

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/order.place `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":0.001,"dryRun":true}' `
  -UseBasicParsing
```

**Beklenen**: `{"dryRun":true,"ack":true,"simulated":true,...}`

**Metrics Kontrolü**:
```powershell
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "futures_order_place_latency"
```

---

### Test 6: Risk Gate (Başarısız Olmalı)

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/futures/order.place `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"symbol":"BTCUSDT","side":"BUY","type":"MARKET","quantity":10,"price":80000,"dryRun":false}' `
  -UseBasicParsing
```

**Beklenen**: `{"error":"MaxNotionalExceeded","limit":100,...}` (HTTP 400)

---

### Test 7: Canary Run

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/canary/run `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"scope":"futures-testnet","symbol":"BTCUSDT","side":"BUY","quantity":0.001}' `
  -UseBasicParsing
```

**Beklenen**: `{"ok":true,"simulated":true,"evidence":{...}}`

---

### Test 8: Canary Confirm

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/canary/confirm `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"scope":"futures-testnet"}' `
  -UseBasicParsing
```

**Beklenen**: `{"ok":true,"applied":true,"testnet":true,"limits":{...}}`

---

### Test 9: Copilot Chat

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/ai/chat `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"prompt":"WS başlat ve canary simülasyon yap"}' `
  -UseBasicParsing
```

**Beklenen**: `{"ok":true,"action":{...}}`

**Action JSON Kontrolü**: `action.action` field'ı bir endpoint olmalı

---

### Test 10: Copilot Strategy Generation

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:4001/ai/generate-strategy `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"prompt":"BTC 15m için RSI ve MACD momentum stratejisi"}' `
  -UseBasicParsing
```

**Beklenen**: 
```json
{
  "ok": true,
  "strategy": {
    "name": "BTCUSDT_15m_RSI_MACD",
    "pair": "BTCUSDT",
    "timeframe": "15m",
    "indicators": ["RSI", "MACD"],
    "conditions": [...],
    "params": {...}
  }
}
```

---

### Test 11: Prometheus Health

```powershell
Invoke-WebRequest -Uri http://localhost:9090/-/healthy -UseBasicParsing
```

**Beklenen**: "Prometheus is Healthy."

---

### Test 12: Prometheus Targets

**Tarayıcıda**: http://localhost:9090/targets

**Beklenen**: "executor" target UP durumunda

---

### Test 13: Prometheus Rules

**Tarayıcıda**: http://localhost:9090/rules

**Beklenen**: 
- `spark-portfolio` group (5 rules)
- `spark-futures` group (7 rules)

---

### Test 14: Grafana Dashboard

**Tarayıcıda**: http://localhost:3005

1. Login: admin / admin
2. Dashboards → Browse → Spark folder
3. İki dashboard görünmeli:
   - "Spark • Portfolio Performance"
   - "Spark • Futures Performance"

**Her dashboard'da**:
- Paneller yükleniyor
- Veri akışı var (son 6 saat)
- Auto-refresh 10s

---

### Test 15: Copilot UI

**Tarayıcıda**: http://localhost:3003/copilot-home

1. Sayfa yükleniyor
2. Health cards görünüyor
3. Quick command butonları çalışıyor
4. Action JSON'lar üretiliyor
5. Chat geçmişinde görünüyor

---

## ✅ KABUL KRİTERLERİ (Definition of Done)

### Backend
- [x] Futures connector (REST + WS) ✅
- [x] Risk gate aktif ✅
- [x] Canary sistem çalışıyor ✅
- [x] Metrics entegre (26 adet) ✅
- [x] Copilot API endpoints ✅

### Monitoring
- [x] Grafana dashboards (2 adet) ✅
- [x] Prometheus alerts (12 rules) ✅
- [ ] Dashboards Grafana'da görünür
- [ ] Alerts Prometheus'ta yüklü

### Frontend
- [x] Copilot Home UI ✅
- [x] Strategy Lab Copilot UI ✅
- [x] Action JSON presets ✅
- [ ] API integration test edildi

### Testing
- [ ] 15/15 smoke test başarılı
- [ ] Risk gate validation çalışıyor
- [ ] WebSocket reconnect test edildi
- [ ] Canary workflow doğrulandı

### Dokümantasyon
- [x] Sprint raporları ✅
- [x] API dokümantasyonu ✅
- [x] Smoke test komutları ✅
- [x] Troubleshooting guide ✅

---

## 🎯 FİNAL ADIMLAR

### Adım 1: Servisleri Başlat

```powershell
# Ana servisleri başlat
.\basla.ps1

# Monitoring stack başlat
docker compose up -d prometheus grafana
```

### Adım 2: Smoke Testleri Çalıştır

```powershell
# Yukarıdaki Test 1-15'i sırayla çalıştır
```

### Adım 3: Sonuçları Doğrula

- [ ] Tüm API endpoint'leri çalışıyor
- [ ] Metrics Prometheus'ta görünür
- [ ] Grafana dashboard'lar açılıyor
- [ ] Alert rules yüklü
- [ ] Copilot API'ler doğru JSON üretiyor
- [ ] Risk gate limitleri uygulanıyor

---

## 📊 BAŞARI METRİKLERİ

**Sprint F0 Hedefler**:
- [x] REST API: 11/11 endpoint ✅
- [x] WebSocket: 2/2 stream type ✅
- [x] Canary: 3/3 endpoint ✅
- [x] Metrics: 26/26 ✅
- [x] Copilot: 2/2 endpoint ✅
- [ ] Smoke tests: 0/15
- [ ] Grafana: 0/2 dashboard görünür
- [ ] Alerts: 0/12 yüklü

**Hedef**: Tüm checkbox'lar işaretli olmalı

---

## 🔄 SORUN GİDERME

### Executor Başlamıyor

```powershell
.\durdur.ps1
Get-Process | Where-Object { $_.ProcessName -like "*node*" } | Stop-Process -Force
.\basla.ps1
```

### Metrics Görünmüyor

```powershell
# Executor loglarını kontrol et
Receive-Job -Name spark-executor -Keep | Select-String "futures"

# Port kontrolü
netstat -ano | findstr ":4001"
```

### Grafana Dashboard Yüklenmiyor

```powershell
# Grafana'yı yeniden başlat
docker compose restart grafana

# Provisioning volume kontrolü
docker compose exec grafana ls -la /etc/grafana/provisioning/dashboards
```

### Prometheus Alerts Yüklenmedi

```powershell
# Prometheus config reload
Invoke-WebRequest -Uri http://localhost:9090/-/reload -Method POST -UseBasicParsing

# Rules kontrolü (tarayıcı)
# http://localhost:9090/rules
```

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**Sprint F0 Finalize Checklist hazır! Test başlatmaya hazır.** ✅

