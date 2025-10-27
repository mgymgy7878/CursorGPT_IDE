# Korelasyon + Haber + Faiz Kararı Analiz Sistemi

## 🎯 Genel Bakış

Spark platformuna eklenen gelişmiş analiz paketi:
- **Korelasyon & Lider-Takipçi**: Rolling correlation, beta, lead-lag analizi
- **Haber/KAP Sınıflandırma**: NLP tabanlı etki skorlama
- **Faiz Kararı Senaryoları**: Merkez bankası kararları ve etki modelleme

---

## 📊 1. Korelasyon Motoru

### Temel Kavramlar

- **Pearson ρ (Rho)**: -1 ile +1 arası korelasyon katsayısı
- **Beta (β)**: Follower'ın leader'a duyarlılığı (β=1: 1:1 hareket)
- **Lag**: Follower'ın kaç bar gecikmeli tepki verdiği (0-3 bar)
- **Z-Score**: Normalized momentum göstergesi

### API Kullanımı

#### Motor Başlatma
```bash
POST /correlation/start
{
  "universe": "BIST_CORE",    # BIST_CORE | CRYPTO_CORE | BIST_GLOBAL_FUSION | CUSTOM
  "windowSec": 900,            # 15 dakika
  "lagMax": 3,
  "customSymbols": []          # CUSTOM için
}
```

#### Korelasyon Matrisi
```bash
GET /correlation/matrix?universe=BIST_CORE
```
**Yanıt:**
```json
{
  "ok": true,
  "edges": [
    {
      "leader": "XU100",
      "follower": "GARAN",
      "rho": 0.82,
      "beta": 1.15,
      "lag": 1,
      "n": 120,
      "pValue": 0.001
    }
  ]
}
```

#### Lider Sorgulama
```bash
GET /correlation/leaders?symbol=GARAN&universe=BIST_CORE
```
Top 5 lider sembol döner (ρ ve lag'e göre sıralı).

#### Sinyal Üretme
```bash
POST /correlation/signal
{
  "follower": "GARAN",
  "leader": "XU100",
  "rule": "FOLLOWER_CONTINUATION",  # veya MEAN_REVERT, BETA_BREAK, LEAD_CONFIRM
  "params": {
    "corrMin": 0.6,
    "betaMin": 0.7,
    "zScoreMax": 1.5
  },
  "moneyFlow": {
    "nmf": 125000,    # Net Money Flow
    "obi": 0.35,      # Order Book Imbalance
    "cvd": 45000      # Cumulative Volume Delta
  }
}
```

### Sinyal Kuralları

#### 1. FOLLOWER_CONTINUATION
**Koşullar:**
- ρ ≥ 0.6 (güçlü korelasyon)
- Lag 0-2 bar (düşük gecikme)
- β ∈ [0.7, 1.3] (makul beta)
- Leader z-score ≥ 1.0 (momentum var)
- NMF > 0 (para girişi)

**Sinyal:** Leader ile aynı yön, high confidence

#### 2. FOLLOWER_MEAN_REVERT
**Koşullar:**
- ρ ≥ 0.6
- Spread z-score ≥ 2.0 (aşırı sapma)

**Sinyal:** Mean reversion (ters yön)

#### 3. BETA_BREAK
**Koşullar:**
- Δρ ≤ -0.3 (korelasyon düştü)
- veya |Δβ| ≥ 0.3 (beta değişti)

**Sinyal:** CLOSE (rejim değişti)

#### 4. LEAD_CONFIRM
**Koşullar:**
- ρ ≥ 0.6
- Lag 1-3 bar (net gecikme var)
- Leader z-score ≥ 1.5 (güçlü momentum)

**Sinyal:** Leader yönünde giriş

---

## 📰 2. Haber/KAP Sınıflandırma

### Desteklenen Konular (Topics)

| Topic              | Impact | Horizon | Açıklama                        |
|--------------------|--------|---------|---------------------------------|
| FINANCIAL_RESULTS  | 0/+1   | mid     | Finansal sonuçlar               |
| DIVIDEND           | +1     | mid     | Temettü duyurusu                |
| BUYBACK            | +1     | short   | Geri alım (kısa vadeli pozitif) |
| CAPEX              | +1     | long    | Yatırım/kapasite artışı         |
| DEBT               | 0/-1   | mid     | Borçlanma/finansman             |
| LEGAL_RISK         | -1     | mid     | Dava/soruşturma                 |
| PROJECT_WIN        | +1     | short   | İhale/proje kazanımı            |
| MANAGEMENT_CHANGE  | 0      | mid     | Yönetim değişimi                |
| OTHER              | 0      | mid     | Diğer                           |

### Seans Zamanı Çarpanı

- **09:00-11:00** (Açılış): ×1.3
- **17:00-18:00** (Kapanış): ×1.2
- **Diğer saatler**: ×1.0

### Örnek Kullanım

```typescript
import { classifyNewsWithImpact } from './nlp/news-classifier';

const result = classifyNewsWithImpact(
  'ASELS: Yeni İhale Kazanıldı',
  'Şirket 500M TL tutarında...',
  new Date('2025-10-10T10:30:00')
);

// {
//   topic: 'PROJECT_WIN',
//   impact: 1,
//   confidence: 0.65,
//   keywords: ['ihale', 'proje'],
//   horizon: 'short',
//   sessionTimeMultiplier: 1.3
// }
```

---

## 📈 3. Faiz Kararı Senaryoları

### Desteklenen Merkez Bankaları

- **TCMB**: Türkiye Cumhuriyet Merkez Bankası
- **FED**: US Federal Reserve
- **ECB**: European Central Bank
- **BOE**: Bank of England

### API Kullanımı

#### Beklenti Girişi
```bash
POST /macro/rate/expectations
{
  "bank": "TCMB",
  "expectedBps": 250,
  "expectedBias": "hike",
  "decisionTime": "2025-10-24T11:00:00Z"
}
```

#### Gerçek Karar & Etki Analizi
```bash
POST /macro/rate/decision
{
  "bank": "TCMB",
  "actualBps": 300,
  "statementTone": "hawkish"
}
```

**Yanıt:**
```json
{
  "ok": true,
  "surprise": {
    "surpriseBps": 50,
    "surpriseType": "hawkish",
    "magnitude": "moderate"
  },
  "impacts": [
    {
      "asset": "USDTRY",
      "expectedDirection": "down",
      "confidence": 0.75,
      "timeHorizon": "1-4 saat",
      "reason": "Beklenenden hawkish → TL güçlenir"
    },
    {
      "asset": "XBANK",
      "expectedDirection": "up",
      "confidence": 0.65,
      "timeHorizon": "1-3 gün",
      "reason": "Faiz artışı → banka marjları pozitif"
    }
  ]
}
```

### TCMB Etki Haritası

| Sürpriz       | USDTRY | XBANK | XU100 |
|---------------|--------|-------|-------|
| Hawkish (Yüksek) | ↓↓     | ↑↑    | ↓     |
| Hawkish (Orta)   | ↓      | ↑     | ~     |
| Inline           | ~      | ~     | ~     |
| Dovish (Orta)    | ↑      | ↓     | ~     |
| Dovish (Yüksek)  | ↑↑     | ↓↓    | ↑     |

### FED Etki Haritası

| Sürpriz       | DXY  | BTCUSDT | XU100 |
|---------------|------|---------|-------|
| Hawkish (Yüksek) | ↑↑   | ↓↓      | ↓↓    |
| Hawkish (Orta)   | ↑    | ↓       | ↓     |
| Inline           | ~    | ~       | ~     |
| Dovish (Orta)    | ↓    | ↑       | ↑     |
| Dovish (Yüksek)  | ↓↓   | ↑↑      | ↑↑    |

---

## 🔧 4. Prometheus Metrikleri

```
spark_corr_windows_total{universe}
spark_corr_matrix_last_ts_seconds
spark_corr_leaders_computed_total{symbol}
spark_signal_triggers_total{rule,action}
spark_follow_regime_breaks_total{symbol}
spark_news_items_classified_total{topic,impact}
spark_macro_events_total{bank,type}
```

### Örnek PromQL

```promql
# Son 5 dakikada tetiklenen sinyaller
sum by (rule, action)(rate(spark_signal_triggers_total[5m]))

# Rejim kırılması oranı (1 saat)
sum(rate(spark_follow_regime_breaks_total[1h]))

# En sık gelen haber konuları
topk(10, sum by (topic)(spark_news_items_classified_total))
```

---

## 📊 5. Grafana Dashboard

**Dashboard: Spark • Correlation & News**

### Paneller

1. **Signal Triggers (rate/5m)**: Kural bazlı sinyal oranları
2. **Regime Breaks (1h rate)**: Rejim değişikliği sıklığı
3. **News Classification (Top 10)**: En sık haber konuları
4. **Macro Events by Bank**: Merkez bankası bazlı olay sayısı

**Erişim:** http://localhost:3005/d/spark-correlation

---

## 🧪 6. Smoke Test

### Korelasyon
```powershell
# Motor başlat
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/correlation/start" `
  -ContentType 'application/json' -Body '{"universe":"BIST_CORE","windowSec":900,"lagMax":3}'

# Matrix sorgula
Invoke-WebRequest -Uri "http://127.0.0.1:4001/correlation/matrix?universe=BIST_CORE"

# Lider sorgula
Invoke-WebRequest -Uri "http://127.0.0.1:4001/correlation/leaders?symbol=GARAN"

# Sinyal üret
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/correlation/signal" `
  -ContentType 'application/json' `
  -Body '{"follower":"GARAN","leader":"XU100","rule":"FOLLOWER_CONTINUATION","params":{"corrMin":0.6}}'
```

### Faiz Kararı
```powershell
# Beklenti
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/macro/rate/expectations" `
  -ContentType 'application/json' `
  -Body '{"bank":"TCMB","expectedBps":250,"expBias":"hike","decisionTime":"2025-10-24T11:00:00Z"}'

# Karar & Etki
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:4001/macro/rate/decision" `
  -ContentType 'application/json' `
  -Body '{"bank":"TCMB","actualBps":300,"statementTone":"hawkish"}'
```

---

## 🎯 7. Copilot Entegrasyonu

### Örnek Action JSON'lar

```json
{
  "action": "/correlation/signal",
  "params": {
    "follower": "GARAN",
    "leader": "XU100",
    "rule": "FOLLOWER_CONTINUATION",
    "params": { "corrMin": 0.6, "betaMin": 0.7 },
    "moneyFlow": { "nmf": 0, "obi": 0, "cvd": 0 }
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Lider-takipçi momentum sinyali"
}
```

```json
{
  "action": "/macro/rate/plan",
  "params": {
    "bank": "TCMB",
    "expBps": 250,
    "decisionTime": "2025-10-24T11:00:00Z"
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "TCMB faiz kararı senaryosu"
}
```

---

## 🔐 8. Güvenlik & Uyumluluk

- Korelasyon analizleri **salt okunur** (trade etkisi yok)
- Sinyal üretimi **dry-run** varsayılan
- Haber sınıflandırması **bilgilendirme amaçlı**
- Otomatik trade için **confirm_required=true** + **RBAC=trader/admin**

---

## 📚 9. İleri Seviye

### Money Flow Entegrasyonu

Correlation sinyal kurallarında **NMF/OBI/CVD** koşulları:

```typescript
if (signal.action === 'open' && moneyFlow.nmf > 0 && moneyFlow.obi > 0.2) {
  // Para girişi ve alım tarafı baskın → yüksek güven
  signal.confidence *= 1.2;
}
```

### Üniverseler (Universes)

- **BIST_CORE**: XU100, XBANK, GARAN, AKBNK, ...
- **CRYPTO_CORE**: BTC, ETH, BNB, SOL, ...
- **GLOBAL_MACRO**: USDTRY, DXY, BRENT, VIX, ...
- **BIST_GLOBAL_FUSION**: Tüm kategoriler

### Custom Universe

```json
{
  "universe": "CUSTOM",
  "customSymbols": ["THYAO", "PGSUS", "ASELS", "BTCUSDT"]
}
```

---

## ✅ 10. Checklist

- [x] Correlation engine (Pearson, beta, xcorr)
- [x] Universe definitions (BIST, Crypto, Global)
- [x] Signal rules (CONTINUATION, MEAN_REVERT, BETA_BREAK, LEAD_CONFIRM)
- [x] News/KAP classifier (9 topic + impact + confidence)
- [x] Macro rate scenarios (TCMB, FED, ECB, BOE)
- [x] API routes (/correlation/*, /macro/rate/*)
- [x] Frontend UI (correlation page + heatmap)
- [x] Prometheus metrics
- [x] Grafana dashboard
- [x] Smoke tests
- [x] Dokümantasyon

---

**Son Güncelleme:** 2025-10-10  
**Versiyon:** 1.0  
**Durum:** ✅ Production Ready (Mock Data)

