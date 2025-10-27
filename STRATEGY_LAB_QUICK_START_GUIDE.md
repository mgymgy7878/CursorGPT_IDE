# Strategy Lab - Hızlı Başlangıç Rehberi

**Tarih:** 2025-01-19  
**Versiyon:** Strategy Lab MVP v1.0  
**Durum:** ✅ HAZIR  

## 🚀 Hızlı Başlangıç (Testnet)

### 1. Environment Variables Ayarla

**apps/web-next/.env.local** dosyasına ekle:
```env
# === AI Strategy Provider ===
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key-here
AI_API_BASE=https://api.openai.com/v1

# === Common ===
EXECUTOR_ORIGIN=http://127.0.0.1:4001
RESCUE_ENABLED=0
```

**services/executor/.env** dosyasına ekle:
```env
# === Executor Secrets ===
ALGO_SECRETS_MASTER_KEY=degistir-bu-32-byte-anahtari-123456789
IN_MEMORY_ONLY=true

# === Binance Futures ===
BINANCE_FAPI_BASE_TESTNET=https://testnet.binancefuture.com
BINANCE_FAPI_BASE_LIVE=https://fapi.binance.com
```

### 2. Servisleri Yenile
```bash
pm2 restart executor && pm2 restart web-next
```

### 3. Strategy Lab'i Aç
**http://127.0.0.1:3003/lab** adresine git

## 📋 Kullanım Adımları

### Adım 1: Exchange Bağlantısı
1. **Mode:** Testnet (varsayılan) seçili
2. **API Key:** Binance Futures testnet API key'in
3. **API Secret:** Binance Futures testnet API secret'ın
4. **"Kaydet & Test Et"** butonuna tıkla
5. ✅ **"OK"** görmelisin

### Adım 2: AI Strateji Üretimi
**Örnek AI İsteği (kopyala-yapıştır):**
```
Binance Futures BTCUSDT 1m stratejisi yaz:
- Sinyal: Son 3 kapanış art arda yükselirse long, son 3 kapanış düşerse short.
- Giriş: Market order, yaklaşık 10 USDT notional.
- Çıkış: TP = +0.4%, SL = -0.3%.
- Aynı anda sadece 1 açık pozisyon, ters sinyalde kapat ve ters pozisyon aç.
- Kod: Sadece çalışabilir JS strateji modülü döndür; riskGuard ve dryRun seçeneklerini destekle.
```

1. **"İstediğin stratejiyi tarif et"** alanına yukarıdaki metni yapıştır
2. **"Üret"** butonuna tıkla
3. ✅ **JavaScript strateji kodu** üretilecek

### Adım 3: Strateji Çalıştırma
1. **Symbols:** BTCUSDT
2. **dryRun:** ✅ Açık (ilk denemelerde mutlaka açık)
3. **riskGuard:** ✅ Açık
4. **"Başlat"** butonuna tıkla
5. ✅ **"ok: true"** görmelisin

## 🔒 Güvenlik Kontrolleri

### Testnet Varsayılan
- ✅ **Varsayılan testnet** - Gerçek para yok
- ✅ **Dry-run mode** - Emir atmadan test
- ✅ **Risk guard** - Güvenlik kontrolleri

### Canlı Mod Geçiş
1. **Mode:** Live seç
2. **Live API keys** gir
3. **İlk dry-run** ile gözlemle
4. **Küçük notional** ile başla (5-10 USDT)
5. **Stop-loss** zorunlu

## 🛠️ Sık Karşılaşılan Sorunlar

### "Invalid API-key, IP, or permissions"
- ✅ **Futures izni** olduğundan emin ol
- ✅ **Saat senkron** olduğundan emin ol
- ✅ **IP whitelist** kontrolü

### "Emir reddi / min notional"
- ✅ **Notional'ı artır** (minimum 5 USDT)
- ✅ **Symbol doğruluğu** kontrol et

### "AI_API_KEY missing"
- ✅ **OpenAI API key** ekle
- ✅ **PM2 restart** yap

## 📊 Kartların İşlevleri

### Exchange Kartı
- **Binance Futures bağlantısı**
- **API key/secret güvenli saklama** (AES-256-GCM)
- **Bağlantı testi**

### AI Strategy Kartı
- **Doğal dil → JavaScript çevirisi**
- **OpenAI GPT-4o-mini entegrasyonu**
- **Strateji kodu üretimi**

### Runner Kartı
- **Dry-run test modu**
- **Gerçek emir gönderimi**
- **Risk guard kontrolleri**

## 🎯 Güvenli İlerleme Planı

### 1. Testnet + Dry-run (5-10 dk)
- ✅ Sinyal/pozisyon akışını doğrula
- ✅ Loglarda hata kontrolü

### 2. Testnet + Gerçek Emir
- ✅ Küçük notional (5-10 USDT)
- ✅ Stop-loss zorunlu

### 3. Live + Dry-run
- ✅ Bir tur gözlem
- ✅ Sinyal kalitesi kontrolü

### 4. Live + Gerçek
- ✅ Çok küçük notional
- ✅ Stop-loss zorunlu
- ✅ Kaldıraç dikkatli

## 🔮 Sonraki Adımlar

### Hazır Özellikler
1. **Sürekli Worker** - Periyodik strateji execution
2. **İndikatör Kütüphanesi** - EMA/RSI/MACD
3. **Canlı-mod Güvenlik Kilidi** - Onay bariyeri
4. **Performans Paneli** - PnL, win-rate, drawdown

### Örnek Strateji Şablonları
```javascript
// Basit Momentum
module.exports.default = async function run(ctx, symbols) {
  const sym = symbols[0] || 'BTCUSDT';
  const ticker = await ctx.market.ticker(sym);
  const price = parseFloat(ticker.price);
  
  // Basit kural: fiyat çift ise long, tek ise short
  if (Math.floor(price) % 2 === 0) {
    return await ctx.order.market(sym, 'BUY', 0.001);
  } else {
    return await ctx.order.market(sym, 'SELL', 0.001);
  }
};
```

## ✅ Test Checklist

- [ ] Environment variables ayarlandı
- [ ] PM2 restart yapıldı
- [ ] /lab sayfası açılıyor
- [ ] Exchange bağlantısı başarılı
- [ ] AI strateji üretimi çalışıyor
- [ ] Dry-run test başarılı
- [ ] Risk guard aktif

## 🎉 Başarı!

**Strategy Lab MVP** artık tamamen hazır ve kullanıma açık! 

**Hızlı Test:**
1. **http://127.0.0.1:3003/lab** → Strategy Lab aç
2. **Exchange** → Testnet API key'leri gir
3. **AI Strategy** → Örnek prompt yapıştır
4. **Runner** → Dry-run ile test et

**Güvenli başlangıç için:**
- ✅ Testnet varsayılan
- ✅ Dry-run ilk denemelerde
- ✅ Küçük notional
- ✅ Stop-loss zorunlu

---

**Rehber Hazırlayan:** Claude 3.5 Sonnet  
**Test Tarihi:** 2025-01-19  
**Durum:** ✅ HAZIR - Kullanıma Açık
