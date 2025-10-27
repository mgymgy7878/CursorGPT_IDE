# ⚡ SPARK PLATFORM - HIZLI BAŞLANGIÇ

**Son Güncelleme:** 2025-10-10

---

## 🚀 5 DAKİKADA BAŞLA

### 1. Servisleri Başlat

```powershell
cd C:\dev\CursorGPT_IDE
.\basla.ps1
```

### 2. UI'yi Aç

```
http://localhost:3003
```

### 3. Grafana Dashboards

```
http://localhost:3005
```

**Varsayılan:** admin / admin

---

## 📊 ANA SAYFALAR

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| **Dashboard** | `/` | Ana gösterge paneli |
| **Portföy** | `/portfolio` | Binance + BTCTurk canlı veri |
| **Copilot Home** | `/copilot-home` | AI asistan + eylem merkezi |
| **Korelasyon** | `/correlation` | Lider-takipçi analiz |
| **Sinyal Merkezi** | `/signals` | Tüm sinyaller tek yerde |
| **Makro Takvim** | `/macro` | Faiz kararları + ekonomik takvim |
| **Haber/KAP** | `/news` | KAP bildirimleri + NLP analizi |
| **Strateji Lab** | `/strategy-lab-copilot` | Strateji üret/test/optimize |

---

## 🎯 HIZLI TEST KOMUTLARI

### Signals Hub
```powershell
# Özet
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/signals/summary

# Tüm sinyaller
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/signals/feed

# Kaynak bazlı
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/signals/feed?source=correlation"
```

### Korelasyon
```powershell
# Motor başlat
$body = @{
  universe = "BIST_CORE"
  windowSec = 900
  lagMax = 3
} | ConvertTo-Json

Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/correlation/start" `
  -ContentType 'application/json' -Body $body

# Matrix sorgula
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/correlation/matrix?universe=BIST_CORE"

# GARAN liderlerini bul
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/correlation/leaders?symbol=GARAN"
```

### Crypto Micro
```powershell
# Funding rate
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/crypto/funding?symbol=BTCUSDT"

# Open Interest
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/crypto/oi?symbol=BTCUSDT"

# Liquidations
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/crypto/liquidations?symbol=BTCUSDT"

# Taker Ratio
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/crypto/taker-ratio?symbol=BTCUSDT"
```

### Macro
```powershell
# Faiz beklentisi gir
$macro = @{
  bank = "TCMB"
  expectedBps = 250
  expBias = "hike"
  decisionTime = "2025-10-24T11:00:00Z"
} | ConvertTo-Json

Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/macro/rate/expectations" `
  -ContentType 'application/json' -Body $macro

# Yaklaşan kararlar
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:4001/macro/rate/upcoming"
```

### KAP/News
```powershell
# KAP tara
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/kap/scan"
```

---

## 🎨 GRAFANA DASHBOARDS

### 1. Spark Portfolio
```
http://localhost:3005/d/spark-portfolio
```
**Paneller:** Latency, Error Rate, Total Value, Staleness, Asset Count

### 2. Spark Futures
```
http://localhost:3005/d/spark-futures
```
**Paneller:** Order Latency, ACK/Reject, WS Reconnects, Uptime, Unrealized PnL

### 3. Spark Correlation & News
```
http://localhost:3005/d/spark-correlation
```
**Paneller:** Signal Triggers, Regime Breaks, News Classification, Macro Events

### 4. Spark Signals Center
```
http://localhost:3005/d/spark-signals
```
**Paneller:** Signal Triggers, Regime Breaks, News Classified, Macro Events

---

## 🔐 ENVIRONMENT VARIABLES

`.env` dosyası örneği:

```env
# Binance
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
BINANCE_TESTNET=1

# BTCTurk
BTCTURK_API_KEY=your_api_key
BTCTURK_API_SECRET=your_api_secret

# Futures
FUTURES_MAX_NOTIONAL=100

# URLs
EXECUTOR_BASE_URL=http://127.0.0.1:4001
```

---

## 🛠️ SORUN GİDERME

### Servisler çalışmıyor
```powershell
# Port kontrolü
Get-NetTCPConnection -LocalPort 3003,4001 -ErrorAction SilentlyContinue

# Port temizle
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3003).OwningProcess -Force
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4001).OwningProcess -Force

# Yeniden başlat
.\durdur.ps1
.\basla.ps1
```

### Grafana bağlanamıyor
```powershell
# Docker servisleri başlat
docker compose up -d prometheus grafana

# Log kontrol
docker logs grafana
docker logs prometheus
```

### Executor health check başarısız
```powershell
# Health endpoint
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/health

# Metrics endpoint
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4001/metrics
```

---

## 📚 DÖKÜMANLAR

| Belge | Açıklama |
|-------|----------|
| `PLATFORM_DURUMU_VE_ROADMAP.md` | Platform özeti + roadmap |
| `PORTFOLIO_ENTEGRASYON_REHBERI.md` | Portföy entegrasyonu |
| `KORELASYON_VE_HABER_STRATEJILERI.md` | Korelasyon + haber analizi |
| `TAM_SPEKTRUM_GOZLEMCI_COPILOT_TAMAMLANDI.md` | Tam sistem raporu |

---

## 🎯 HIZLI EYLEMLER (Copilot)

Copilot Home'dan tek tıkla çalıştırılabilir eylemler:

1. **WS Başlat (BTC,ETH)** - Binance Futures WebSocket
2. **Dry-Run BUY 0.001 BTC** - Test emri
3. **Canary Run** - Testnet canary
4. **Korelasyon: GARAN→XU100** - Lider-takipçi sinyali
5. **TCMB Faiz Beklentisi** - Makro senaryo
6. **BTC Funding Snapshot** - Kripto mikro-yapı

---

## ⚡ EN SIK KULLANILAN KOMUTLAR

```powershell
# Başlat
.\basla.ps1

# Durdur
.\durdur.ps1

# Logları göster
Get-Content -Path "services/executor/logs/app.log" -Tail 50 -Wait

# Health check
iwr -UseBasicParsing http://127.0.0.1:4001/health

# Signals özet
iwr -UseBasicParsing http://127.0.0.1:4001/signals/summary

# UI
start http://localhost:3003

# Grafana
start http://localhost:3005
```

---

## 🆘 DESTEK

Sorularınız için dökümanları kontrol edin veya GitHub Issues açın.

**Platform Durumu:** 🟢 Production Ready  
**Son Test:** 2025-10-10  
**Versiyon:** 1.0

