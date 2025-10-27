# BIST PoC Checklist

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## ✅ POC İSKELETİ HAZIR

Mock feed ve Money Flow v0 oluşturuldu. Gerçek vendor entegrasyonu için hazır.

---

## 📋 VENDOR HAZIRLIĞI

### Gerekli Adımlar

1. **Vendor Seçimi**
   - [ ] dxFeed ile iletişim
   - [ ] Matriks ile görüşme
   - [ ] ICE benchmark
   - [ ] Fiyat/kapsam karşılaştırması

2. **PoC/Trial Hesabı**
   - [ ] Trial account açılışı
   - [ ] API credentials alınması
   - [ ] Test environment setup
   - [ ] Dokumentasyon inceleme

3. **Lisans Kontrolü**
   - [ ] Display/non-display kullanım
   - [ ] Redistribution hakları
   - [ ] Real-time vs delayed
   - [ ] Symbol count limits

---

## 🔧 POC İSKELETİ DOSYALARI

### Oluşturulan Dosyalar

```
services/marketdata/src/
├── metrics/
│   └── bist.ts                   ✅ BIST metrics (9 adet)
├── readers/
│   └── bist-eq.ts                ✅ Mock reader (vendor adapter ready)
├── moneyflow/
│   └── engine.ts                 ✅ Money Flow v0 (CVD/NMF/OBI/VWAP)
└── routes/
    └── moneyflow.ts              ✅ Money Flow API (4 endpoint)

monitoring/grafana/provisioning/dashboards/
└── spark-bist.json               ✅ BIST dashboard (3 panel)

prometheus/alerts/
└── spark-bist.rules.yml          ✅ BIST alerts (3 rule)
```

---

## 📊 API ENDPOINTS

### Money Flow API (4)
- `POST /moneyflow/start` - Start engine (mock feed)
- `GET /moneyflow/summary` - All symbols money flow
- `GET /moneyflow/symbol?symbol=THYAO` - Single symbol
- `POST /moneyflow/stop` - Stop engine
- `POST /moneyflow/reset` - Reset metrics

---

## 📈 PROMETHEUS METRİKLERİ (9 Adet)

```promql
# Connection metrics
spark_bist_ws_connects_total
spark_bist_ws_messages_total{message_type}
spark_bist_ws_errors_total{error_type}

# Data quality
spark_bist_staleness_seconds
spark_bist_last_update_timestamp

# Money Flow
spark_bist_cvd{symbol}
spark_bist_nmf{symbol, timeframe}
spark_bist_obi{symbol}
spark_bist_vwap{symbol}
```

---

## 🧪 SMOKE TEST (Mock Feed)

```powershell
# Start Money Flow engine (mock)
Invoke-WebRequest -Uri http://127.0.0.1:4001/moneyflow/start `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"symbols":["THYAO","AKBNK","GARAN"]}' `
  -UseBasicParsing

# Get summary
Invoke-WebRequest -Uri http://127.0.0.1:4001/moneyflow/summary -UseBasicParsing

# Check metrics
(Invoke-WebRequest -Uri http://127.0.0.1:4001/metrics -UseBasicParsing).Content | Select-String "bist_"

# Beklenen metriklerde:
# spark_bist_cvd{symbol="THYAO"} 1234.5
# spark_bist_nmf{symbol="THYAO",timeframe="1m"} 567890.12
# spark_bist_obi{symbol="THYAO"} 0.35
```

---

## 🔄 VENDOR ADAPTER ENTEGRASYONU

### Mock → Real Adapter Değişimi

**Şu an** (`bist-eq.ts`):
```typescript
export function startBISTEquityMock(symbols: string[]) {
  // Mock tick generation
  setInterval(() => generateRandomTick(), 300);
}
```

**Vendor entegrasyonundan sonra**:
```typescript
// dxFeed Adapter örneği
import { DXFeedClient } from '@dxfeed/api';

export class DXFeedBISTAdapter {
  private client: DXFeedClient;
  
  async connect(symbols: string[]) {
    this.client = new DXFeedClient(API_KEY);
    await this.client.connect();
    
    this.client.subscribe(symbols, (tick) => {
      // Process real tick
      notifyListeners(tick);
    });
  }
}

export function startBISTEquityReal(symbols: string[]) {
  const adapter = new DXFeedBISTAdapter();
  adapter.connect(symbols);
}
```

---

## 📚 TODO: Vendor Seçildikten Sonra

### dxFeed Seçilirse
1. [ ] dxFeed API dokümantasyonu incele
2. [ ] TypeScript client kütüphanesi kur
3. [ ] Authentication setup
4. [ ] Symbol mapping (BIST codes ↔ dxFeed codes)
5. [ ] `bist-eq.ts` içinde DXFeedAdapter implement et

### Matriks Seçilirse
1. [ ] Matriks API dokümantasyonu incele
2. [ ] WebSocket endpoint bilgisi al
3. [ ] Authentication (API key/token)
4. [ ] Data format parsing
5. [ ] `bist-eq.ts` içinde MatriksAdapter implement et

### ICE Seçilirse
1. [ ] ICE developer portal erişimi
2. [ ] FIX protocol setup (muhtemelen)
3. [ ] Connectivity options (direct vs gateway)
4. [ ] `bist-eq.ts` içinde ICEAdapter implement et

---

## ⚠️ GUARDRAILS

### Staleness Guard

```typescript
// Money Flow engine içinde
if (getStaleness() > 60) {
  // Don't generate trade signals
  return {
    blocked: true,
    reason: 'BISTDataStale',
    staleness: getStaleness(),
    message: 'BIST verisi 60 saniyeden eski, trade güvenli değil',
  };
}
```

### Alert Integration

Prometheus alert'leri otomatik tetiklenecek:
- Staleness > 30s → Warning
- Staleness > 60s → Critical
- WS errors > 0.1/s → Warning

---

## 🎯 KABUL KRİTERLERİ

### PoC İskeleti (Şimdi - Mock)
- [x] Mock feed çalışıyor ✅
- [x] Money Flow metrikleri hesaplanıyor ✅
- [x] Prometheus metrics aktif ✅
- [x] Grafana dashboard hazır ✅
- [x] Alert rules tanımlandı ✅

### Vendor Entegrasyonu (Sonra - Real)
- [ ] Vendor PoC hesabı alındı
- [ ] Real adapter implemented
- [ ] Real-time data akıyor
- [ ] Latency < 100ms
- [ ] Staleness < 5s
- [ ] Money Flow doğru hesaplanıyor

---

## 📧 VENDOR İLETİŞİM ŞABLONUemailTemplate = `
Konu: BIST Real-Time Market Data - PoC Request

Merhaba,

Spark Trading Platform için BIST gerçek zamanlı veri feed entegrasyonu planlıyoruz.

İhtiyaçlar:
• BIST Pay Piyasası (Level-1/Level-2)
• Tick-by-tick trade data
• Real-time order book depth  
• Historical data (1+ yıl)
• WebSocket/API connectivity
• Replay capability

PoC/Trial hesabı ve fiyatlandırma bilgisi alabilir miyiz?

Platform: TypeScript/Node.js, Prometheus metrics
Requirement: Low-latency (<100ms)

Teşekkürler,
[İsim]
[Email]
`;

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

**BIST PoC iskeleti hazır! Vendor adapter için beklemede.** 📊

