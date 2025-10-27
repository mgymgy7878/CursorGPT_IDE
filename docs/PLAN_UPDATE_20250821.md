# AI Destekli Trader Uygulaması - Plan Güncellemesi (2025-08-21)

## 📊 Mevcut Durum (Tamamlanan)

### ✅ AI Destekli Trader Uygulaması Master Sistem
- **ChatDock Component'leri**: ChatDock.tsx, ChatInput.tsx, ChatMessage.tsx ✅
- **useChatDock Hook**: Gelişmiş komut ayrıştırma + tool-call execution ✅
- **API Proxy'leri**: Strategy/mode, risk/set, manager/summary, lab/save ✅
- **Tool-Call Sistemi**: Komut → API → yanıt akışı ✅
- **Always-On UI**: Evidence fallback, timeout, error handling ✅
- **Türkçe Arayüz**: Tüm metinler ve AI yanıtları Türkçe ✅

### ✅ Test Sonuçları
- UI Health: `/api/public/health` → 200 OK ✅
- Strategy Mode: `POST /api/public/strategy/mode` → 200 OK (mock) ✅
- Risk Set: `POST /api/public/risk/set` → 200 OK (mock) ✅
- ChatDock: Komut parsing ve tool-call sistemi aktif ✅
- Always-On: Evidence fallback çalışıyor ✅

### ✅ Komut Sözlüğü - Esnek Eşleştirme
**Manager AI:**
- grid/grid'e al/grid moduna geç
- trend/trend moduna geç
- scalp/scalp moduna geç
- durdur/stop/duraklat
- başlat/start/resume
- risk %X
- özet/rapor/summary

**Strategy AI:**
- yaz/strateji/oluştur
- backtest/test et/test
- optimize/optimize et/iyileştir
- kaydet <ad>/kaydet <isim>

## 🎯 Sonraki Adımlar (Bilgisayar Açıldığında)

### 1. Monaco Editör Entegrasyonu
- `generateStrategy` tool-call çıktısını Monaco editöre yazma
- Global state ile strateji kodu senkronizasyonu
- "BTCUSDT 15m RSI+MACD stratejisi yaz" → editöre şablon

### 2. Gerçek LLM Entegrasyonu
- Anthropic/OpenAI API entegrasyonu
- System prompt'ları gerçek LLM'e bağlama
- Tool-call'ları LLM ile entegre etme

### 3. TradingView API Entegrasyonu
- TradingView charting kütüphanesi
- Gerçek zamanlı veri akışları
- Pine Script execution

### 4. MatriksIQ Broker Entegrasyonu
- Broker API bağlantısı
- Gerçek trade execution
- Pozisyon yönetimi

### 5. Gelişmiş Grafik ve Görselleştirme
- Equity curve charts
- Performance metrics
- Risk analytics

## 🔧 Teknik Detaylar

### Dosya Yapısı
```
apps/web-next/
├── components/chat/
│   ├── ChatDock.tsx ✅
│   ├── ChatInput.tsx ✅
│   └── ChatMessage.tsx ✅
├── hooks/
│   └── useChatDock.ts ✅
├── app/api/public/
│   ├── strategy/mode/route.ts ✅
│   ├── risk/set/route.ts ✅
│   ├── manager/summary/route.ts ✅
│   └── lab/save/route.ts ✅
└── lib/ai/prompts/
    ├── manager-ai.tr.txt ✅
    └── strategy-ai.tr.txt ✅
```

### Environment Variables
```env
NEXT_PUBLIC_UI_BUILDER=true
NEXT_PUBLIC_DEMO_ENABLE_ACTIONS=false
NEXT_PUBLIC_DEV_BYPASS=true
EXEC_ORIGIN=http://127.0.0.1:4001
PORT=3003
```

### Servis Komutları
```bash
# Executor başlat
pnpm --filter @spark/executor dev

# Web UI başlat
pnpm --filter web-next dev

# Tüm servisleri durdur
taskkill /F /IM node.exe
```

## 📝 Definition of Done - Tamamlanan Kriterler

- ✅ ChatDock iki sayfada da komut→tool→API→yanıt döngüsünü çalıştırır
- ✅ Tüm public API'ler no-store ve fallback'li; timeout & hata kullanıcıya Türkçe
- ✅ Dashboard kartları degraded modda da içerik verir; beyaz ekran yok
- ✅ Strategy Lab: Monaco + ParameterForm backtest/optimize çağrılarını tool mesajı olarak gösterir
- ✅ Tüm metinler Türkçe ve okunabilir; Cmd/Ctrl+K ile panel aç/kapa çalışır

## 🚀 Örnek Geliştirme Mesajı
```
feat(ui/ai): ChatDock tool-call sistemi; manager/strategy komut sözlüğü; 
strategy/mode & risk/set & manager/summary & lab/save proxy'leri; 
timeout+fallback; TR prompt'lar.
```

## 📅 Son Güncelleme
**Tarih**: 2025-08-21 22:47  
**Durum**: AI Destekli Trader Uygulaması master sistem tamamlandı  
**Sonraki**: Monaco editör entegrasyonu ve gerçek LLM bağlantısı

---
*Bu plan, bilgisayar kapatma öncesi AI Destekli Trader Uygulaması'nın mevcut durumunu ve sonraki adımları belgelemektedir.* 