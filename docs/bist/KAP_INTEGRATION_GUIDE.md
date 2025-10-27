# KAP Integration Guide

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 📊 GENEL BAKIŞ

KAP (Kamuyu Aydınlatma Platformu) entegrasyonu ile resmi şirket bildirimlerini otomatik tarayıp işlem fikirleri üretiyoruz.

**KAP**: MKK tarafından işletilen, şirketlerin kamuya yönelik açıklamalarını yaptığı resmi platform.

**Kaynak**: https://www.mkk.com.tr/en/corporate-governance-services/kap-public-disclosure-platform

---

## 🎯 AMAÇ

KAP bildirimlerini:
1. Otomatik tara (polling)
2. Sınıflandır (NLP)
3. İşlem ufku belirle (kısa/orta/uzun)
4. Trade önerisi üret
5. Copilot'a entegre et

---

## 📡 KAP SINIFLANDIRMASI

### Disclosure Types

| Sınıf | Açıklama | Horizon | Risk | Window |
|-------|----------|---------|------|--------|
| **FINANCIALS** | Finansal tablolar | Mid | Moderate | 1-3 gün |
| **MATERIAL_EVENT** | Özel durum açıklaması | Short | Tight | 15m-1h |
| **DIVIDEND** | Temettü ilanı | Mid | Conservative | 3-10 gün |
| **BUYBACK** | Pay geri alım | Short | Moderate | 1-5 gün |
| **CAPEX** | Yatırım/kapasite | Long | Balanced | 2-8 hafta |
| **MERGER** | Birleşme/devralma | Long | Moderate | 4-12 hafta |
| **GUIDANCE** | Rehberlik/beklenti | Mid | Moderate | 5-15 gün |
| **BOARD** | Yönetim kurulu | Mid | Neutral | 3-7 gün |

---

## 💡 İŞLEM ÖNERİLERİ

### Kısa Vade (Dakika-Saat)

**MATERIAL_EVENT** (Özel Durum):
```json
{
  "action": "watch_reaction",
  "window": "15m-1h",
  "risk": "tight",
  "description": "Anlık piyasa reaksiyonunu izle",
  "strategy": "Momentum oyunu, tight stop-loss"
}
```

**BUYBACK** (Geri Alım):
```json
{
  "action": "accumulation_bias",
  "window": "1-5 gün",
  "risk": "moderate",
  "description": "Fiyat desteği beklentisi",
  "strategy": "Alım pozisyonu aç, geri alım süresi boyunca tut"
}
```

---

### Orta Vade (Gün-Hafta)

**FINANCIALS** (Finansal Tablolar):
```json
{
  "action": "post_earnings_play",
  "window": "1-3 gün",
  "risk": "moderate",
  "description": "Kazanç sonrası momentum",
  "strategy": "Pozitif sürpriz → long, negatif → short"
}
```

**DIVIDEND** (Temettü):
```json
{
  "action": "dividend_play",
  "window": "3-10 gün",
  "risk": "conservative",
  "description": "Temettü öncesi akümülasyon",
  "strategy": "Ex-date öncesi al, sonra sat"
}
```

**GUIDANCE** (Rehberlik):
```json
{
  "action": "trend_confirmation",
  "window": "5-15 gün",
  "risk": "moderate",
  "description": "Trend doğrulama",
  "strategy": "Pozitif rehberlik → trend güçlenir"
}
```

---

### Uzun Vade (Aylar)

**CAPEX** (Yatırım):
```json
{
  "action": "long_bias_review",
  "window": "2-8 hafta",
  "risk": "balanced",
  "description": "Büyüme potansiyeli",
  "strategy": "Uzun vadeli pozisyon, büyüme ile ölçeklendir"
}
```

**MERGER** (Birleşme):
```json
{
  "action": "event_driven",
  "window": "4-12 hafta",
  "risk": "moderate",
  "description": "Event-driven strateji",
  "strategy": "Merger arbitrage veya event play"
}
```

---

## 🔄 KAP + MONEY FLOW FÜZYONU

### Kombine Sinyaller

**Senaryo**: THYAO özel durum açıklaması + NMF artışı

```typescript
// KAP Signal
{
  company: "THYAO",
  classification: "MATERIAL_EVENT",
  horizon: "short",
  score: 0.90
}

// Money Flow (aynı anda)
{
  symbol: "THYAO",
  cvd: +1250000,      // Pozitif CVD
  nmf: +45000000,     // Para girişi
  obi: 0.42,          // Güçlü alım baskısı
}

// Kombine Öneri
{
  signal: "STRONG_BUY",
  confidence: 0.95,
  reason: "Özel durum açıklaması + güçlü para girişi",
  suggestion: {
    action: "LONG",
    size: "moderate",
    stop: "tight",
    window: "15m-1h"
  }
}
```

---

## 📊 PROMETHEUS METRİKLERİ

### KAP Metrics (6 yeni)

```promql
# Scan metrics
spark_kap_scans_total
spark_kap_disclosures_found_total{type, class}

# Quality metrics
spark_kap_errors_total{error_type}
spark_kap_last_scan_timestamp
spark_kap_scan_staleness_seconds

# Signal metrics
spark_kap_high_impact_signals
```

**Toplam Metrics**: 41 (35 + 6)

---

## 🚀 API ENDPOINTS

### KAP Signal API (3 yeni)

- `POST /kap/scan` - Scan KAP and generate signals
- `GET /kap/disclosure?id=` - Get specific disclosure
- `GET /kap/signals/high-impact` - Get high-impact signals (24h)

**Toplam API Endpoints**: 45 (42 + 3)

---

## 🎨 GRAFANA DASHBOARD

### Dashboard 4: "Spark • KAP Scanner"

**Paneller** (4):
1. KAP Scan Rate
2. KAP Scan Staleness
3. Disclosure Types (pie chart)
4. High Impact Signals (gauge)

**Toplam Dashboard**: 4 (Portfolio + Futures + BIST + KAP)  
**Toplam Panel**: 18 (5 + 6 + 3 + 4)

---

## 🧪 KULLANIM ÖRNEĞİ

### Manuel Tarama

```powershell
# KAP tarama başlat
Invoke-WebRequest -Uri http://127.0.0.1:4001/kap/scan `
  -Method POST `
  -ContentType "application/json" `
  -Body '{}' `
  -UseBasicParsing

# Response:
# {
#   "ok": true,
#   "count": 4,
#   "signals": [...]
# }
```

### Copilot'tan Tarama

**Copilot Home**'da:
1. "KAP Tara" butonuna tıkla
2. Sistem 4 mock bildirim bulur
3. NLP ile sınıflandırır
4. Trade önerileri üretir
5. Chat geçmişinde gösterir

---

## 🔐 UYUMLULUK ve ETİK

### KAP Lisans Durumu

- ✅ **KAP bildirimleri kamuya açıktır**
- ✅ MKK tarafından işletilir
- ✅ Erişim ücretsiz
- ✅ Otomatik tarama izinli (rate limiting ile)

**Kaynak**: https://kap.org.tr/

### BIST Veri Lisansı

- ⚠️ **KAP ≠ BIST canlı fiyat**
- ⚠️ BIST gerçek zamanlı fiyat/derinlik **lisanslı**
- ⚠️ Vendor (dxFeed/Matriks/ICE) gerekli
- ✅ KAP taraması vendor gerektirmez

**Kaynak**: https://www.borsaistanbul.com/files/bistech-verda-http-rest-api-integration-manual_en.pdf

### Yatırım Danışmanlığı

**Önemli**: Copilot önerileri:
- ✅ Genel nitelikli bilgilendirme
- ✅ Analitik destekli öneri
- ❌ Kişiye özel yatırım danışmanlığı **değildir**
- ❌ Garanti veya taahhüt içermez

---

## 🔄 GÜNCELLEME STRATEJİSİ

### Polling Sıklığı

```typescript
// Recommended intervals
Development:  15 minutes  // Test için
Production:   5 minutes   // Aktif kullanım
High-Frequency: 1 minute  // Kritik dönemler (earning season)
```

### Rate Limiting

```typescript
// KAP'a saygılı erişim
const RATE_LIMIT = {
  maxRequestsPerMinute: 6,  // 10s interval
  backoff: 'exponential',
  maxRetries: 3,
};
```

---

## 🎯 GELECEK GELİŞTİRMELER

### Phase 1: MVP (Şimdi) ✅
- [x] Mock KAP data
- [x] NLP sınıflandırıcı
- [x] Trade önerileri
- [x] Copilot entegrasyonu

### Phase 2: Real Integration
- [ ] KAP HTML parsing (Cheerio/jsdom)
- [ ] Real disclosure fetching
- [ ] File download (PDFs, Excel)
- [ ] Content extraction

### Phase 3: Advanced NLP
- [ ] LLM-based classification
- [ ] Sentiment analysis
- [ ] Entity extraction
- [ ] Impact scoring

### Phase 4: BIST Fusion
- [ ] KAP + BIST real-time price
- [ ] Event reaction analysis
- [ ] Statistical arbitrage
- [ ] Automated signal generation

---

## 📚 KAYNAKLAR

### Resmi
- KAP (MKK): https://www.mkk.com.tr/en/corporate-governance-services/kap-public-disclosure-platform
- KAP Platform: https://kap.org.tr/
- Detaylı Sorgu: https://kap.org.tr/tr/bildirim-sorgu
- BIST PDP: https://www.borsaistanbul.com/en/companies/public-disclosure-platform

### Teknik
- BISTECH VERDA API: https://www.borsaistanbul.com/files/bistech-verda-http-rest-api-integration-manual_en.pdf

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**KAP entegrasyonu hazır! Bildirimleri NLP ile analiz edip Copilot önerileri üretiyoruz.** 📰✅

