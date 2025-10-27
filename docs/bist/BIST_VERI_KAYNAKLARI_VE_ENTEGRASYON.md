# BIST Veri Kaynakları ve Entegrasyon Stratejisi

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## 🎯 GENEL BAKIŞ

BIST (Borsa İstanbul) gerçek zamanlı veri entegrasyonu için **lisanslı veri dağıtıcıları** kullanılması yasal zorunluluktur.

**Önemli Not**: BIST verileri doğrudan Borsa İstanbul'dan değil, **onaylı veri dağıtıcıları** üzerinden alınmalıdır.

---

## 📡 BIST VERİ DAĞITICILARI

### Seçenek 1: dxFeed (Önerilen - Kurumsal)

**Artıları**:
- ✅ Tick-by-tick gerçek zamanlı veri
- ✅ Level-1 ve Level-2 depth
- ✅ Historical data + replay
- ✅ API ve dosya teslimi
- ✅ HFT/algoritmik trading için optimize

**Eksileri**:
- ❌ Kurumsal fiyatlandırma

**Kapsam**:
- BIST hisse senetleri
- BIST vadeli işlemler (VİOP)
- BIST endeksleri

**Kaynak**: https://dxfeed.com/coverage/turkey/

---

### Seçenek 2: Matriks (Türkiye Odaklı)

**Artıları**:
- ✅ Türkiye'de yaygın kullanım
- ✅ Yerel destek
- ✅ Entegrasyon kolay
- ✅ Farklı paket seçenekleri

**Eksileri**:
- ⚠️ Son kullanıcı için genelde 15dk gecikmeli
- ⚠️ Gerçek zamanlı için kurumsal paket gerekli

**Kapsam**:
- BIST Pay Piyasası
- VİOP
- Endeksler

**Kaynak**: https://www.matriksdata.com/

---

### Seçenek 3: ICE Global Network (En Düşük Gecikme)

**Artıları**:
- ✅ Native feed erişimi
- ✅ Kolokasyon seçenekleri
- ✅ En düşük gecikme
- ✅ Kurumsal dayanıklılık

**Eksileri**:
- ❌ En yüksek maliyet
- ❌ Kurumsal entegrasyon karmaşık

**Kapsam**:
- BIST native feed
- Düşük gecikmeli akış

**Kaynak**: https://developer.ice.com/fixed-income-data-services/catalog/borsa-istanbul

---

### Diğer Seçenekler

BIST Data Vendors Directory'de daha fazla seçenek:
- Finnet
- Fintables
- Bloomberg (pahalı)
- Refinitiv (pahalı)

**Kaynak**: https://www.borsaistanbul.com/en/data/data-dissemination/data-vendors-directory

---

## 💰 PARA GİRİŞ-ÇIKIŞI (MONEY FLOW) HESAPLAMA

### Gerçek Zamanlı Money Flow Metrikleri

#### 1. Net Money Flow (NMF)

```typescript
// Her trade için
NMF = Σ (trade_price × trade_size × direction)

// Direction belirleme:
// - Up-tick: price > previous_price → +1
// - Down-tick: price < previous_price → -1
// - Zero-tick: price == previous_price → last_direction
```

#### 2. Cumulative Volume Delta (CVD)

```typescript
CVD = Σ (volume × (buy ? +1 : -1))

// Buy/Sell belirleme:
// - Trade price >= ask → Buyer initiated (buy)
// - Trade price <= bid → Seller initiated (sell)
```

#### 3. Order Book Imbalance (OBI)

```typescript
OBI = (bid_volume - ask_volume) / (bid_volume + ask_volume)

// OBI > 0: Daha fazla alım baskısı
// OBI < 0: Daha fazla satım baskısı
```

#### 4. VWAP (Volume Weighted Average Price)

```typescript
VWAP = Σ (price × volume) / Σ (volume)

// Kullanım:
// - Price > VWAP: Pozitif momentum
// - Price < VWAP: Negatif momentum
```

---

### Aracı Kurum Kırılımı (Broker Breakdown)

**BIST Tarafından Sağlanan**:
- "Üye Bazında Seanslık İşlem Sıralaması" (günlük)
- "İşlemlerin Üyelere Göre Aylık Dağılımı" (aylık)

**Önemli**: Bu veriler **gerçek zamanlı değil**, seanslık/aylık dosyalar halinde paylaşılır.

**Kullanım**:
- Batch ETL ile günlük/aylık dosyaları import et
- Strateji ve Copilot'a bağlam sağla
- Trend analizi için kullan

**Kaynak**: https://www.borsaistanbul.com/piyasa-verileri

---

### Yabancı İşlemleri (Foreign Flow)

**BIST Raporları**:
- Haftalık yabancı işlemleri
- Aylık sahiplik raporları (MKK)

**Kullanım**:
- Makro bağlam
- Long-term trend
- **İntra-day değil**

**Kaynak**: https://www.borsaistanbul.com/en/market-data

---

## 🏗️ MİMARİ TASARIM

### Ingest Layer

```
┌─────────────────────────────────────────┐
│      Data Sources                       │
├─────────────────────────────────────────┤
│ BIST: dxFeed/Matriks/ICE (WS/FIX)      │
│ Kripto: Binance WS/REST (✅ entegre)    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Marketdata Service                     │
├─────────────────────────────────────────┤
│ readers/                                │
│ ├── bist-eq.ts        (BIST Hisse)     │
│ ├── bist-viop.ts      (BIST Vadeli)    │
│ ├── binance-spot.ts   (✅ var)          │
│ └── binance-futures.ts (✅ var)         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Feature Engine                         │
├─────────────────────────────────────────┤
│ Money Flow Engine:                      │
│ ├── CVD (Cumulative Volume Delta)      │
│ ├── NMF (Net Money Flow)               │
│ ├── OBI (Order Book Imbalance)         │
│ ├── VWAP (Volume Weighted Avg Price)   │
│ └── Staleness detection                │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Storage & Analytics                    │
├─────────────────────────────────────────┤
│ Time-Series: Postgres/Prisma           │
│ Tick Data: Kafka + Parquet (yoğun)    │
│ EoD/Batch: BIST DataStore files       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Copilot & Strategy Lab                 │
├─────────────────────────────────────────┤
│ Inputs: NMF, CVD, OBI, VWAP, staleness│
│ Guardrails: staleness > 60s → no trade│
│ Suggestions: Money flow based signals │
└─────────────────────────────────────────┘
```

---

## 🚀 İMPLEMENTASYON PLANI

### Sprint BIST-R1: PoC - Gerçek Zamanlı Feed (2-4 gün)

**Hedef**: BIST gerçek zamanlı veri akışını sisteme entegre etmek

#### Task 1.1: Vendor Seçimi ve PoC Bağlantısı

**Seçenekler**:
1. **dxFeed** (önerilen - kurumsal)
2. **Matriks** (Türkiye odaklı)
3. **ICE** (en düşük gecikme)

**Aksiyon**:
- [ ] Vendor'larla iletişime geç
- [ ] Trial/PoC hesabı aç
- [ ] API credentials al
- [ ] Test connection kur

#### Task 1.2: BIST Reader Implementasyonu

**Dosyalar**:
```typescript
// services/marketdata/src/readers/bist-eq.ts
export class BISTEquityReader {
  constructor(vendor: VendorConfig) {}
  
  async connect() {
    // WS/FIX connection to vendor
  }
  
  onTrade(trade: BISTTrade) {
    // Update money flow metrics
  }
  
  onDepth(depth: BISTDepth) {
    // Update OBI metrics
  }
}

// services/marketdata/src/readers/bist-viop.ts
export class BISTFuturesReader {
  // VİOP (futures) için ayrı reader
}
```

#### Task 1.3: Money Flow Engine v0

**Dosyalar**:
```typescript
// services/marketdata/src/engines/money-flow.ts
export class MoneyFlowEngine {
  calculateCVD(trades: Trade[]): number
  calculateNMF(trades: Trade[]): number
  calculateOBI(depth: OrderBook): number
  calculateVWAP(trades: Trade[]): number
}
```

#### Task 1.4: Metrics

**Yeni Metrikler**:
```promql
bist_ws_connects_total
bist_ws_messages_total{message_type}
bist_trade_latency_ms
bist_staleness_seconds
bist_cvd{symbol}
bist_nmf{symbol,timeframe}
bist_obi{symbol}
bist_vwap{symbol}
```

#### Task 1.5: Grafana Dashboard

**Paneller**:
- BIST Money Flow (1m/5m CVD)
- OBI Heatmap (top symbols)
- VWAP drift
- Data staleness
- Trade volume

**Kabul Kriterleri**:
- [ ] Vendor connection başarılı
- [ ] Real-time trades akıyor
- [ ] Money flow metrikleri hesaplanıyor
- [ ] Grafana'da görselleşiyor
- [ ] Staleness < 5 saniye

---

### Sprint BIST-R2: Backfill & Context (3-5 gün)

**Hedef**: Tarihsel veri ve bağlamsal bilgileri eklemek

#### Task 2.1: Historical Data Ingestion

**Kaynaklar**:
- Vendor historical API
- BIST DataStore (EoD, depth snapshots)

**İşlem**:
```typescript
// Daily ETL job
async function ingestBISTHistorical(date: string) {
  // Fetch from vendor or DataStore
  // Store in time-series DB
  // Update analytics cache
}
```

**Kaynak**: https://www.borsaistanbul.com/en/data/historical-data-sales

#### Task 2.2: Batch Data Import

**BIST Dosyaları** (günlük/aylık):
- Üye Bazında Seanslık İşlem Sıralaması
- İşlemlerin Üyelere Göre Aylık Dağılımı
- Yabancı işlemleri raporları

**ETL Pipeline**:
```typescript
// services/marketdata/src/batch/bist-broker-data.ts
async function importBrokerData(file: string) {
  // Parse BIST broker distribution file
  // Store in database
  // Update context for strategies
}
```

#### Task 2.3: Copilot Features

**Money Flow Based**:
- "Para girişi artıyor" uyarıları (NMF slope)
- "OBI pozitif → alım baskısı" sinyalleri
- "VWAP üstü → momentum" önerileri

**Contextual**:
- Yabancı akımı bağlamı (aylık raporlar)
- Broker concentration analizi
- Sector money flow

#### Task 2.4: Guardrails

**Data Staleness Guard**:
```typescript
// BIST data staleness > 30s ise trade önerme
if (bistStaleness > 30) {
  return {
    blocked: true,
    reason: 'BISTDataStale',
    message: 'BIST verisi 30 saniyeden eski, trade güvenli değil',
  };
}
```

**Prometheus Alert**:
```yaml
- alert: BISTDataStale
  expr: time() - bist_last_update_timestamp > 30
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "BIST data stale"
    description: "Check vendor connection"
```

**Kabul Kriterleri**:
- [ ] Historical data 1+ yıl backfilled
- [ ] Broker data ETL çalışıyor
- [ ] Copilot money flow önerileri aktif
- [ ] Staleness guardrail çalışıyor
- [ ] Grafana panelleri tam

---

## 💡 MONEY FLOW METRİKLERİ DETAY

### CVD (Cumulative Volume Delta)

**Hesaplama**:
```typescript
interface Trade {
  price: number;
  volume: number;
  timestamp: number;
  isBuyerMaker: boolean; // Binance için
}

function calculateCVD(trades: Trade[]): number {
  let cvd = 0;
  
  for (const trade of trades) {
    const direction = trade.isBuyerMaker ? -1 : 1; // Buy = +1, Sell = -1
    cvd += trade.volume * direction;
  }
  
  return cvd;
}
```

**Kullanım**:
- CVD artıyor → Alım baskısı
- CVD düşüyor → Satım baskısı
- CVD divergence (fiyat ↑, CVD ↓) → Zayıf momentum

---

### NMF (Net Money Flow)

**Hesaplama**:
```typescript
function calculateNMF(trades: Trade[]): number {
  let nmf = 0;
  let lastPrice = trades[0]?.price || 0;
  
  for (const trade of trades) {
    // Determine direction (tick rule)
    let direction = 0;
    if (trade.price > lastPrice) direction = 1; // Up-tick
    else if (trade.price < lastPrice) direction = -1; // Down-tick
    else direction = 0; // Zero-tick
    
    nmf += trade.price * trade.volume * direction;
    lastPrice = trade.price;
  }
  
  return nmf;
}
```

**Kullanım**:
- NMF > 0 → Para girişi
- NMF < 0 → Para çıkışı
- NMF trend → Akım yönü

---

### OBI (Order Book Imbalance)

**Hesaplama**:
```typescript
interface OrderBook {
  bids: Array<{ price: number; volume: number }>;
  asks: Array<{ price: number; volume: number }>;
}

function calculateOBI(book: OrderBook, levels: number = 5): number {
  const bidVolume = book.bids
    .slice(0, levels)
    .reduce((sum, level) => sum + level.volume, 0);
  
  const askVolume = book.asks
    .slice(0, levels)
    .reduce((sum, level) => sum + level.volume, 0);
  
  const totalVolume = bidVolume + askVolume;
  
  if (totalVolume === 0) return 0;
  
  return (bidVolume - askVolume) / totalVolume;
}
```

**Kullanım**:
- OBI > 0.3 → Güçlü alım baskısı
- OBI < -0.3 → Güçlü satım baskısı
- OBI ≈ 0 → Dengeli

---

### VWAP Drift

**Hesaplama**:
```typescript
function calculateVWAPDrift(currentPrice: number, vwap: number): number {
  return (currentPrice - vwap) / vwap;
}
```

**Kullanım**:
- Drift > 0.02 → Fiyat VWAP'ın %2 üzerinde (güçlü)
- Drift < -0.02 → Fiyat VWAP'ın %2 altında (zayıf)

---

## 🔄 BIST + KRİPTO ENTEGRASYON

### Mevcut Kripto (Binance)

**Zaten Entegre** ✅:
- Binance Spot REST API
- Binance Futures REST API
- Binance WebSocket (market + userData)
- Historical klines (REST)

**WebSocket Limitler**:
- 1024 stream/connection
- 10 msg/s limit
- User data: 24h listenKey

**Kaynak**: https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams

---

### Unified Money Flow

**Hem BIST hem Kripto için tek engine**:

```typescript
// services/marketdata/src/engines/unified-money-flow.ts
export class UnifiedMoneyFlowEngine {
  private bistFlow: MoneyFlowEngine;
  private binanceFlow: MoneyFlowEngine;
  
  getCombinedMetrics(symbol: string): MoneyFlowMetrics {
    // BIST ve Binance'ten gelen verileri birleştir
  }
  
  getCrossMarketSignals(): Signal[] {
    // Cross-market arbitrage ve korelasyon sinyalleri
  }
}
```

---

## 📋 SPRINT PLANI

### Sprint BIST-R1: PoC & Real-Time (2-4 gün)

**Görevler**:
1. [ ] Vendor seçimi ve PoC hesabı açma
2. [ ] BIST reader implementasyonu (WS/FIX)
3. [ ] Money Flow Engine v0 (CVD, NMF, OBI, VWAP)
4. [ ] Prometheus metrics entegrasyonu
5. [ ] Grafana BIST dashboard

**Metrikler** (10 yeni):
```
bist_ws_connects_total
bist_ws_messages_total
bist_trade_latency_ms
bist_staleness_seconds
bist_cvd{symbol}
bist_nmf{symbol, timeframe}
bist_obi{symbol}
bist_vwap{symbol}
bist_last_update_timestamp
bist_connection_status
```

**Grafana Paneller** (6):
- Money Flow (CVD 1m/5m)
- NMF Trend
- OBI Heatmap
- VWAP Drift
- Trade Volume
- Data Staleness

---

### Sprint BIST-R2: Historical & Context (3-5 gün)

**Görevler**:
1. [ ] Historical data ingestion (vendor/DataStore)
2. [ ] Broker data ETL (günlük/aylık dosyalar)
3. [ ] Foreign flow import (haftalık/aylık)
4. [ ] Copilot money flow features
5. [ ] Staleness guardrail implementation

**Batch Jobs**:
```typescript
// Daily ETL (00:30)
- Import broker distribution file
- Import foreign flow data
- Calculate aggregate metrics
- Update strategy context

// Weekly ETL (Pazar 01:00)
- Import weekly foreign ownership
- Update trend indicators
```

**Copilot Enhancements**:
- "THYAO'da para girişi artıyor (NMF +15M TL/5dk)"
- "AKBNK OBI pozitif (0.42), alım baskısı güçlü"
- "BIST100 VWAP üstü, momentum devam edebilir"

---

## 🔐 UYUMLULUK (COMPLIANCE)

### BIST Veri Lisansı

**Önemli Noktalar**:
- ✅ Display vs. Non-display kullanım ayrımı
- ✅ Redistributionkısıtlamaları
- ✅ Gecikmeli (delayed) vs. gerçek zamanlı (real-time)
- ✅ Internal use vs. external redistribution

**Vendor Sözleşmesi Kontrol Listesi**:
- [ ] Display kullanım izni (UI'da gösterim)
- [ ] Non-display kullanım izni (algoritmik trading)
- [ ] Redistribution izni (client'lara veri sağlama)
- [ ] Historical data erişimi
- [ ] API kullanım hakkı

**Kaynak**: BIST Data Fee Schedule - https://www.borsaistanbul.com/files/2021-71-nolu-duyuru-eng.pdf

---

## 💰 MALİYET TAHMİNİ (Vendor Bağımlı)

### dxFeed
- **PoC/Trial**: İletişim gerekli
- **Production**: Kurumsal fiyatlandırma (symbol count, level, latency)

### Matriks
- **Gecikmeli**: Daha uygun
- **Gerçek zamanlı**: Kurumsal paket

### ICE
- **Enterprise**: En yüksek maliyet
- **Kolokasyon**: Ek maliyet

**Not**: Kesin fiyatlar için vendor'larla doğrudan iletişim gerekli.

---

## 🎯 COPILOT AKSIYON TASLAK ÖRNEKLERİ

### 1. BIST Feed PoC Başlatma

```json
{
  "action": "/advisor/suggest",
  "params": {
    "topic": "bist-feed-poc",
    "vendors": ["dxFeed", "Matriks", "ICE"],
    "requirements": ["Level1", "Level2", "Trades", "Replay", "Historical"],
    "notes": "MoneyFlow (CVD/NMF/OBI) + staleness<5s hedefi"
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "BIST gerçek-zamanlı akış PoC başlat"
}
```

### 2. BIST Staleness Alert

```json
{
  "action": "/alerts/create",
  "params": {
    "name": "BIST Data Staleness",
    "expr": "time() - bist_last_update_timestamp > 30",
    "for": "2m",
    "labels": { "severity": "warning" },
    "annotations": {
      "summary": "BIST data stale",
      "runbook": "check vendor connection"
    }
  },
  "dryRun": false,
  "confirm_required": false,
  "reason": "Veri tazeliği guardrail"
}
```

### 3. Money Flow Engine Canary

```json
{
  "action": "/canary/run",
  "params": {
    "scope": "analytics-only",
    "task": "moneyflow-poc",
    "symbols": ["BIST:THYAO", "BIST:AKBNK", "BIST:BIST100"],
    "duration": "1h",
    "metrics": ["CVD", "OBI", "VWAP"]
  },
  "dryRun": true,
  "confirm_required": false,
  "reason": "Money Flow hesap motoru canary"
}
```

---

## 🔗 KAYNAKLAR

### Resmi BIST
- Data Dissemination: https://www.borsaistanbul.com/en/data/data-dissemination
- Market Data Products: https://borsaistanbul.com/en/data/data-dissemination/market-data-products
- Data Vendors Directory: https://www.borsaistanbul.com/en/data/data-dissemination/data-vendors-directory
- Historical Data Sales: https://www.borsaistanbul.com/en/data/historical-data-sales
- Piyasa Verileri: https://www.borsaistanbul.com/piyasa-verileri

### Vendor'lar
- dxFeed Turkey: https://dxfeed.com/coverage/turkey/
- Matriks Data: https://www.matriksdata.com/
- ICE Borsa Istanbul: https://developer.ice.com/fixed-income-data-services/catalog/borsa-istanbul

### Binance
- Futures WebSocket: https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams
- Klines: https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Kline-Candlestick-Data

---

## 🚦 SONRAKİ ADIMLAR

### Öncelik 1: Vendor İletişim (Hemen)
1. dxFeed ile iletişime geç (PoC talebi)
2. Matriks ile görüş (alternatif)
3. ICE'den bilgi al (benchmark için)

### Öncelik 2: Sprint BIST-R1 Hazırlık (1 hafta sonra)
1. Vendor PoC credentials gelince
2. BIST reader implementasyonu
3. Money Flow Engine v0
4. Test ve validation

### Öncelik 3: Sprint BIST-R2 (2-3 hafta sonra)
1. Historical backfill
2. Batch ETL pipeline
3. Copilot integration
4. Production readiness

---

## 📊 MEVCUT DURUM vs. BIST HEDEF

### Mevcut (Kripto)
```
✅ Binance Spot: Real-time ✅
✅ Binance Futures: Real-time ✅  
✅ BTCTurk: Portfolio only (real-time trade stream yok)
❌ BIST: Yok
```

### Hedef (BIST Eklenmeli)
```
✅ Binance Spot: Real-time
✅ Binance Futures: Real-time
✅ BTCTurk: Portfolio + Trade stream
✅ BIST Equity: Real-time (vendor)
✅ BIST VİOP: Real-time (vendor)
✅ Money Flow: CVD, NMF, OBI, VWAP
```

---

## ⚠️ ÖNEMLİ NOTLAR

### BIST Yasal Zorunluluklar
1. ✅ Lisanslı vendor kullanımı **zorunlu**
2. ✅ Display/non-display kullanım ayrımı
3. ✅ Redistribution kısıtlamaları
4. ✅ Vendor sözleşmesi şartları

### Binance Hazır Durum
- ✅ WebSocket entegre
- ✅ REST API entegre
- ✅ Testnet desteği
- ✅ Metrics aktif

### BTCTurk Eksik
- ⚠️ Sadece portfolio API var
- ❌ Real-time trade stream yok
- ❌ Order book stream yok
- 📋 Sprint 3.3'te (ertelenmiş)

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**BIST entegrasyon stratejisi hazır! Vendor seçimi bekliyor.** 📊

