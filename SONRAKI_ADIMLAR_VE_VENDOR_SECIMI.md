# Sonraki Adımlar ve Vendor Seçimi

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 🎯 MEVCUT DURUM

**4 Sprint Tamamlandı** ✅:
1. Portfolio v1.2 (Gerçek Veri)
2. Observability (Monitoring)
3. Futures F0 (Testnet)
4. Copilot F1 (Anasayfa)

**Genel İlerleme**: %85

**Sistem Sağlık**: 🟢 PRODUCTION-READY (Testnet Mode)

---

## 🔀 İKİ YÖNTEM

### Yöntem A: Sprint F2'ye Devam Et

**Sprint F2: Strateji Lab Copilotu** (2-3 gün)

**Artıları**:
- ✅ UI iskelet zaten hazır
- ✅ Backend hazır (backtest engine var)
- ✅ Hızlı sonuç

**İçerik**:
- Strategy generation enhancement
- Backtest API integration
- Optimization loop
- Param-diff approval
- Canary deployment

**Sonuç**: Tüm copilot'lar tam çalışır durumda

---

### Yöntem B: BIST Vendor PoC Başlat

**Sprint BIST-R1: BIST Real-Time Feed PoC** (2-4 gün)

**Artıları**:
- ✅ BIST veri kaynağı entegre olur
- ✅ Money Flow metrikleri başlar
- ✅ Türkiye piyasası coverage

**İçerik**:
- Vendor seçimi (dxFeed/Matriks/ICE)
- PoC bağlantısı
- BIST reader implementasyonu
- Money Flow Engine v0
- Grafana BIST dashboard

**Zorunluluk**: Vendor ile iletişim ve PoC/trial hesabı gerekli

---

## 📊 VENDOR KARŞILAŞTIRMASI

| Özellik | dxFeed | Matriks | ICE |
|---------|--------|---------|-----|
| **Kapsam** | BIST hisse/VİOP/endeks | BIST tam | BIST native |
| **Latency** | Düşük | Orta | En düşük |
| **API** | ✅ REST + WS | ✅ Var | ✅ Var |
| **Historical** | ✅ Tam | ⚠️ Paket bağımlı | ✅ Tam |
| **Replay** | ✅ Var | ❌ Yok | ✅ Var |
| **Fiyat** | Kurumsal | Orta-Yüksek | En yüksek |
| **Destek** | Global | Türkiye | Global |
| **Entegrasyon** | Orta | Kolay | Zor |

**Öneri**: dxFeed (kapsamlı) veya Matriks (yerel destek)

---

## 🎯 ÖNERİLEN YÖNTEM

### ÖNCELİK 1: Sprint F2'yi Tamamla (Hızlı Kazanım)

**Neden**:
- UI ve backend iskelet hazır
- Hızlı sonuç (2-3 gün)
- Platform tam fonksiyonel olur
- BIST vendor süreci paralelde yürütülebilir

**Sonuç**: Tüm copilot'lar çalışır, platform kullanıma tam hazır

---

### ÖNCELİK 2: BIST Vendor İletişim (Paralel)

**Eylemler**:
1. dxFeed'e PoC talebi gönder
2. Matriks'ten bilgi al
3. Fiyat/kapsam karşılaştırması yap
4. Sprint BIST-R1 için hazırlık

**Sonuç**: F2 bitene kadar vendor süreci ilerler

---

### ÖNCELİK 3: Sprint BIST-R1 Başlat

**Ne zaman**: F2 tamamlandıktan sonra + Vendor PoC hazır olunca

**Tahmini Zaman**: 2-4 gün

---

## 📋 SPRINT F2: STRATEJİ LAB COPİLOTU

### Kapsam

**Backend** (4 dosya):
```
services/executor/src/routes/
├── strategy-builder.ts    (Strategy generation enhancement)
├── backtest-runner.ts     (Backtest integration)
└── optimizer.ts           (Optimization loop)

services/executor/src/engines/
└── param-diff.ts          (Parameter diff approval)
```

**Frontend** (1 güncelleme):
```
apps/web-next/src/app/strategy-lab-copilot/
└── page.tsx               (Backtest + optimize integration)
```

**API Endpoints** (6 yeni):
```
POST /ai/build-strategy       - Strategy code generation
POST /ai/validate-strategy    - Strategy validation
POST /backtest/start          - Start backtest
GET  /backtest/status/:id     - Backtest status
POST /optimize/start          - Start optimization
GET  /optimize/results/:id    - Optimization results
```

**Workflow**:
```
1. Prompt → Strategy draft
2. Review → Code generation
3. Backtest → Performance metrics
4. Optimize → Parameter tuning
5. Param-diff → Approval
6. Deploy → Canary → Live
```

---

## 🚀 HIZLI KARAR

### Seçenek 1: F2'ye Devam (Önerilen)

```powershell
# Hemen başlat
# Copilot'ları tam fonksiyonel yap
# Platform kullanıma hazır
# BIST vendor süreci paralelde
```

**Süre**: 2-3 gün  
**Sonuç**: Platform %100 hazır

---

### Seçenek 2: BIST PoC İlk

```powershell
# Vendor iletişimi başlat (1-2 hafta sürebilir)
# PoC credentials bekle
# BIST reader geliştir
# Money Flow engine ekle
```

**Süre**: 2-4 gün (PoC hazır olduktan sonra)  
**Bağımlılık**: Vendor süreci

---

## 💡 ÖNERİ

**Paralel Yürütme**:

```
Hafta 1-2:
├── Sprint F2 (Platform tamamlama)     → 2-3 gün
└── BIST vendor iletişim (paralel)     → 1-2 hafta

Hafta 3:
└── Sprint BIST-R1 (PoC bağlantı)      → 2-4 gün
    (Vendor credentials hazır olunca)

Hafta 4-5:
└── Sprint BIST-R2 (Production)        → 3-5 gün
```

**Toplam Süre**: 4-5 hafta  
**Sonuç**: Tam fonksiyonel platform + BIST entegrasyonu

---

## 🔗 VENDOR İLETİŞİM BİLGİLERİ

### dxFeed
- **Website**: https://dxfeed.com/
- **PoC Request**: Contact sales
- **Turkey Coverage**: https://dxfeed.com/coverage/turkey/

### Matriks
- **Website**: https://www.matriksdata.com/
- **İletişim**: Türkiye ofis
- **Paketler**: Kurumsal/bireysel

### ICE
- **Developer Portal**: https://developer.ice.com/
- **Borsa Istanbul**: https://developer.ice.com/fixed-income-data-services/catalog/borsa-istanbul
- **Contact**: Enterprise sales

---

## ✅ HEMEN YAPILABİLECEKLER

### 1. Sprint F2 Başlat (Önerilen)

Platform'u tamamla, sonra BIST ekle.

### 2. Vendor Email Gönder (Paralel)

```
Konu: BIST Real-Time Data Feed - PoC Request

Merhaba,

Spark Trading Platform için BIST gerçek zamanlı veri feed'i 
entegrasyonu planlıyoruz. 

Gereksinimler:
- BIST Pay Piyasası (Level-1/Level-2)
- Tick-by-tick trades
- Order book depth
- Historical data access
- API/WebSocket connectivity

PoC/Trial hesabı mümkün mü?

Teşekkürler,
[İletişim Bilgileri]
```

### 3. Dokümantasyon Güncelle

BIST entegrasyon planını roadmap'e ekle.

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**Karar bekliyor: F2'ye devam mı, BIST vendor sürecine mi odaklanmalı?**

**Öneri: F2'yi tamamla (2-3 gün), vendor süreci paralelde yürüsün!** 🚀


