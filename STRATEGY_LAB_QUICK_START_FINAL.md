# Strategy Lab • Ultra Hızlı Başlangıç (1-2 dk)

## 🎯 Hemen Kullan Akışı

### 1️⃣ AI Anahtarı (30 sn)
**Lab → AI Ayarları**
- Provider: `OpenAI`
- Base URL: `https://api.openai.com/v1`
- API Key: `sk-...` → **Kaydet & Test**
- ✅ Status: "Kaydedildi ✅"

### 2️⃣ Binance Futures Testnet (30 sn)
**Lab → Exchange Bağlantısı**
- Ortam: **Testnet** (canlıya geçme, hazır olana kadar)
- API Key/Secret → **Kaydet & Test Et**
- ✅ Response: `200 OK`

### 3️⃣ Strateji Üret (30 sn)
**Lab → AI Strateji Üretici**
```
BTCUSDT 5m — EMA50/EMA200 kesişimi long/short; risk %1; max 2 pozisyon; TP 0.6% SL 0.4%; market order.
```
- **Üret** → Kod çıkar + Üretilen Stratejiler'e otomatik kaydolur

### 4️⃣ Çalıştır - Güvenli (30 sn)
**Lab → Çalıştır**
- Semboller: `BTCUSDT`
- ✅ `dryRun` ve `riskGuard` açık
- Label: `lab`
- **Başlat** → Çalışan Stratejiler'de 5sn'de güncellenir
- **Durdur** ile durdur

### 5️⃣ Yeniden Kullan
**Üretilen Stratejiler listesinde:**
- **Kullan** - Stratejiyi aktif et
- **Kopyala** - Kodu kopyala
- **Sil** - Stratejiyi sil

### 6️⃣ OPS Monitoring
**/ops** → Health/Runtime, metrikler, alert yönetimi

---

## 🔧 En Sık 3 Sorun & Çözüm

### ❌ AI_API_KEY missing
**Çözüm:**
1. Lab → AI Ayarları'ndan kaydet
2. `.env`'de `ALGO_SECRETS_MASTER_KEY` en az 32 byte olsun
3. `pm2 restart web-next --update-env`

### ❌ Binance test/real karıştı
**Çözüm:**
- Testnet anahtarını **Testnet** ile kullan
- Canlı anahtarı **Live** ile kullan
- Canlı yetkilendirme/açık vadeli işlemler aktif olmalı
- Sistem saatini senkron tut

### ❌ "Çalışan Stratejiler" boş
**Çözüm:**
- Executor'ın `/strategy/status` endpoint'i ayakta olmalı
- Değilse executor loglarına bak: `pm2 logs executor`

---

## 🚀 Sonraki Küçük İyileştirmeler

**Hangisiyle devam edelim?**

### A) Hazır Şablonlar
- EMA/RSI/MACD tek tıkla doldur
- Popüler stratejiler hazır template'ler

### B) Çalışanlar Tablosu  
- ID, sembol, PnL, durum + "Durdur" tek satırdan
- Tabular grid interface

### C) Canlı-Mod Güvenlik
- Çift onay + kill-switch
- Live trading güvenlik katmanları

### D) Performans Paneli
- Win-rate, PnL, drawdown
- Strategy performance metrics

---

## ✅ Hızlı Test Checklist

- [ ] AI anahtarı kaydedildi
- [ ] Binance testnet bağlandı  
- [ ] Strateji üretildi
- [ ] Dry-run çalıştırıldı
- [ ] Çalışan Stratejiler'de görünüyor
- [ ] /ops sayfası çalışıyor

**🎉 Strategy Lab hazır! Hemen trading stratejilerini test etmeye başla!**
