# Sonraki Sprint Planı - Portfolio Observability & BTCTurk Integration

**Tarih**: 10 Ekim 2025  
**cursor (Claude 3.5 Sonnet)**

---

## 🎯 GENEL BAKIŞ

Portfolio gerçek veri entegrasyonu tamamlandı (v1.2). Sonraki adımlar:
1. **Observability**: Prometheus metrics + Grafana dashboard
2. **UI Enhancement**: Portfolio Lab component
3. **Data Sources**: BTCTurk Spot Reader + BIST Integration

---

## 📊 SPRINT 3.1: OBSERVABILITY (Öncelik: YÜKSEK)

**Hedef**: Portfolio operasyonlarını izlenebilir ve ölçülebilir yapmak

**Süre**: 1-2 gün (6-12 saat)

### Görevler

#### ✅ Task 3.1.1: Portfolio Metrics (TAMAMLANDI)
- [x] `services/executor/src/metrics/portfolio.ts` oluşturuldu
- [x] Prometheus metrics tanımlandı:
  - `spark_portfolio_refresh_latency_ms` (Histogram)
  - `spark_exchange_api_error_total` (Counter)
  - `spark_portfolio_total_value_usd` (Gauge)
  - `spark_portfolio_asset_count` (Gauge)
  - `spark_portfolio_last_update_timestamp` (Gauge)
- [x] `portfolioService.ts`'ye metrics entegre edildi

#### ✅ Task 3.1.2: Grafana Dashboard (TAMAMLANDI)
- [x] Grafana provisioning yapılandırması
- [x] Prometheus datasource tanımı
- [x] Dashboard JSON oluşturuldu (5 panel)
- [x] docker-compose.yml güncellendi
- [x] Dokümantasyon hazırlandı

**Dashboard Panelleri**:
- Portfolio Refresh Latency (p50/p95)
- Exchange API Error Rate
- Total Portfolio Value (USD)
- Data Staleness
- Asset Count

#### ✅ Task 3.1.3: Prometheus Alert Rules (TAMAMLANDI)
- [x] Alert rules dosyası oluşturuldu
- [x] prometheus.yml güncellendi
- [x] 5 adet alert kuralı tanımlandı:
  - PortfolioRefreshLatencyHighP95
  - ExchangeApiErrorRateHigh
  - PortfolioDataStale
  - PortfolioValueDropAnomaly
  - PortfolioNoAssets
- [x] Smoke test komutları hazırlandı

#### ⏳ Task 3.1.4: Monitoring Dokümantasyonu (TAMAMLANDI)
```json
// grafana-portfolio-dashboard.json
{
  "title": "Portfolio Performance",
  "panels": [
    {
      "title": "Refresh Latency (p95)",
      "targets": [
        "histogram_quantile(0.95, rate(spark_portfolio_refresh_latency_ms_bucket[5m]))"
      ]
    },
    {
      "title": "API Error Rate",
      "targets": [
        "rate(spark_exchange_api_error_total[5m])"
      ]
    },
    {
      "title": "Total Portfolio Value",
      "targets": [
        "spark_portfolio_total_value_usd"
      ]
    },
    {
      "title": "Asset Count by Exchange",
      "targets": [
        "spark_portfolio_asset_count"
      ]
    }
  ]
}
```

#### ⏳ Task 3.1.3: Prometheus Alert Rules
```yaml
# rules/portfolio.yml
groups:
  - name: portfolio
    interval: 30s
    rules:
      - alert: PortfolioRefreshSlow
        expr: |
          histogram_quantile(0.95, 
            rate(spark_portfolio_refresh_latency_ms_bucket[5m])
          ) > 5000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Portfolio refresh is slow (p95 > 5s)"
          
      - alert: ExchangeAPIErrors
        expr: |
          rate(spark_exchange_api_error_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High exchange API error rate"
          
      - alert: PortfolioStale
        expr: |
          time() - spark_portfolio_last_update_timestamp > 300
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Portfolio data is stale (no update for 5 min)"
```

**Kabul Kriterleri**:
- [x] Grafana dashboard import edilebilir ✅
- [x] Tüm metrikler Prometheus'ta görünür ✅
- [x] Alert rules aktif ve çalışıyor ✅
- [x] Test senaryoları hazır (smoke test komutları) ✅
- [x] Docker Compose yapılandırması tamamlandı ✅
- [x] Dokümantasyon hazır (`docs/monitoring/GRAFANA_DASHBOARD.md`) ✅

---

## 🎨 SPRINT 3.2: PORTFOLIO LAB UI (Öncelik: ORTA)

**Hedef**: Portfolio verilerini görselleştirmek ve analiz etmek

**Süre**: 2-3 gün (12-18 saat)

### Görevler

#### Task 3.2.1: Portfolio Lab Page
```tsx
// apps/web-next/src/app/portfolio-lab/page.tsx

'use client';
import { Card, Title, AreaChart, DonutChart } from '@tremor/react';
import { useApi } from '@/lib/useApi';

export default function PortfolioLabPage() {
  // Real-time portfolio data
  const { data: portfolio } = useApi('/api/portfolio', { 
    refreshInterval: 30000 // 30 seconds
  });
  
  // Historical data (last 24h)
  const { data: history } = useApi('/api/portfolio/history');
  
  return (
    <div className="p-6 space-y-6">
      <Title>Portfolio Lab</Title>
      
      {/* Real-time Value Chart */}
      <Card>
        <Title>Total Value (Last 24h)</Title>
        <AreaChart 
          data={history}
          categories={["Binance", "BTCTurk"]}
          index="timestamp"
        />
      </Card>
      
      {/* Asset Allocation */}
      <Card>
        <Title>Asset Allocation</Title>
        <DonutChart
          data={allocationData}
          category="value"
          index="asset"
        />
      </Card>
      
      {/* Exchange Performance */}
      <Card>
        <Title>Exchange API Performance</Title>
        {/* Latency comparison, error rates */}
      </Card>
      
      {/* Currency Conversion */}
      <Card>
        <Title>USD/TRY Conversion</Title>
        {/* Real-time exchange rate, conversion calculator */}
      </Card>
    </div>
  );
}
```

#### Task 3.2.2: Portfolio History API
```typescript
// services/executor/src/routes/portfolio-history.ts

// Store portfolio snapshots every 5 minutes
// Return last 24h of data for charts
app.get('/api/portfolio/history', async (req, reply) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const data = await getPortfolioHistory(hours);
  return reply.send(data);
});
```

#### Task 3.2.3: WebSocket Live Updates (Opsiyonel)
```typescript
// Real-time portfolio updates via WebSocket
ws.on('connection', (socket) => {
  const interval = setInterval(async () => {
    const portfolio = await fetchAllPortfolios();
    socket.send(JSON.stringify({ type: 'portfolio', data: portfolio }));
  }, 10000); // 10 seconds
});
```

**Kabul Kriterleri**:
- [ ] Portfolio Lab sayfası erişilebilir
- [ ] Gerçek zamanlı grafikler çalışıyor
- [ ] Asset allocation doğru gösteriliyor
- [ ] Performance metrics görselleştiriliyor
- [ ] Responsive tasarım (mobil uyumlu)

---

## 📡 SPRINT 3.3: BTCTURK SPOT READER (Öncelik: YÜKSEK)

**Hedef**: BTCTurk'ten real-time ticker ve order book verisi çekmek

**Süre**: 3-4 gün (18-24 saat)

### Görevler

#### Task 3.3.1: BTCTurk WebSocket Connector
```typescript
// services/marketdata/src/connectors/btcturk-ws.ts

import WebSocket from 'ws';

export class BTCTurkWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  constructor(private symbols: string[]) {}
  
  async connect() {
    this.ws = new WebSocket('wss://ws-feed-pro.btcturk.com');
    
    this.ws.on('open', () => {
      console.log('[BTCTurk WS] Connected');
      this.subscribe();
    });
    
    this.ws.on('message', (data) => {
      this.handleMessage(JSON.parse(data.toString()));
    });
    
    this.ws.on('error', (err) => {
      console.error('[BTCTurk WS] Error:', err);
    });
    
    this.ws.on('close', () => {
      console.log('[BTCTurk WS] Disconnected');
      this.reconnect();
    });
  }
  
  private subscribe() {
    const subscribeMsg = {
      type: 151,
      channel: 'ticker',
      event: this.symbols.join(','),
      join: true
    };
    this.ws?.send(JSON.stringify(subscribeMsg));
  }
  
  private handleMessage(msg: any) {
    if (msg.type === 151) { // Ticker
      this.onTicker(msg);
    } else if (msg.type === 431) { // Order Book
      this.onOrderBook(msg);
    } else if (msg.type === 421) { // Trades
      this.onTrade(msg);
    }
  }
  
  private async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BTCTurk WS] Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`[BTCTurk WS] Reconnecting in ${delay}ms...`);
    setTimeout(() => this.connect(), delay);
  }
  
  onTicker(data: any) {
    // Override in implementation
  }
  
  onOrderBook(data: any) {
    // Override in implementation
  }
  
  onTrade(data: any) {
    // Override in implementation
  }
}
```

#### Task 3.3.2: BTCTurk Spot Reader Service
```typescript
// services/marketdata/src/readers/btcturk-spot.ts

export class BTCTurkSpotReader {
  private ws: BTCTurkWebSocket;
  private tickerCache = new Map<string, Ticker>();
  
  constructor(symbols: string[]) {
    this.ws = new BTCTurkWebSocket(symbols);
    this.ws.onTicker = (data) => this.handleTicker(data);
  }
  
  async start() {
    await this.ws.connect();
  }
  
  private handleTicker(data: any) {
    const ticker: Ticker = {
      symbol: data.pair,
      price: parseFloat(data.last),
      volume: parseFloat(data.volume),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      timestamp: data.timestamp
    };
    
    this.tickerCache.set(ticker.symbol, ticker);
    this.emitTicker(ticker);
  }
  
  getTicker(symbol: string): Ticker | undefined {
    return this.tickerCache.get(symbol);
  }
  
  getAllTickers(): Ticker[] {
    return Array.from(this.tickerCache.values());
  }
}
```

#### Task 3.3.3: Rate Limiting & Error Handling
```typescript
// BTCTurk API rate limits
const RATE_LIMITS = {
  rest: {
    perSecond: 10,
    perMinute: 100
  },
  websocket: {
    connectionsPerIP: 2,
    subscriptionsPerConnection: 30
  }
};

// Implement token bucket or similar
```

**Kabul Kriterleri**:
- [ ] WebSocket bağlantısı stabil
- [ ] Ticker verisi real-time akıyor
- [ ] Reconnect mekanizması çalışıyor
- [ ] Rate limiting uygulanıyor
- [ ] Error handling tam
- [ ] Unit testler yazılmış

---

## 📈 SPRINT 3.4: BIST READER INTEGRATION (Öncelik: ORTA)

**Hedef**: BIST hisse verilerini portfolio'ya eklemek

**Süre**: 3-4 gün (18-24 saat)

### Araştırma Gerekli

#### BIST Data Provider Seçenekleri
1. **BIST Data Feed** (Resmi, ücretli)
2. **Bloomberg API** (Ücretli, profesyonel)
3. **Investing.com scraper** (Ücretsiz, güvenilirlik?)
4. **Yahoo Finance** (Sınırlı, gecikmeli)

#### Öncelikli Özellikler
- [ ] THYAO, GARAN, AKBNK gibi ana hisseler
- [ ] Real-time fiyat (veya 15dk delay)
- [ ] Günlük OHLCV verisi
- [ ] Corporate actions (temettü, bölünme)

**Not**: BIST entegrasyonu için veri kaynağı lisans/maliyet analizi gerekiyor.

---

## 🔄 SPRINT SIRASI (Önerilen)

```
1. Observability (Sprint 3.1)    → 1-2 gün  ⭐ ŞİMDİ
2. BTCTurk Spot (Sprint 3.3)     → 3-4 gün  ⭐ SONRAKİ
3. Portfolio Lab UI (Sprint 3.2) → 2-3 gün  
4. BIST Reader (Sprint 3.4)      → 3-4 gün  (Araştırma sonrası)
```

**Toplam Tahmini Süre**: 9-13 gün (60-80 saat)

---

## 📋 KABUL KRİTERLERİ (Genel)

### Teknik
- [ ] Tüm TypeScript kod strict mode'da hatasız
- [ ] Unit test coverage > 70%
- [ ] Prometheus metrics tüm servislerde
- [ ] Error handling graceful
- [ ] Logging structured (JSON)

### Performans
- [ ] Portfolio refresh latency p95 < 3s
- [ ] API error rate < 1%
- [ ] WebSocket reconnect < 5s
- [ ] UI responsive (FCP < 2s)

### Güvenlik
- [ ] API key'ler environment'ta
- [ ] Rate limiting aktif
- [ ] Input validation tam
- [ ] CORS düzgün yapılandırılmış

### Dokümantasyon
- [ ] API endpoint'leri dokümante
- [ ] Metrics açıklamaları mevcut
- [ ] Setup guide güncel
- [ ] Architecture diagram güncel

---

## 📊 İLERLEME TAKİBİ

### Sprint 3.1: Observability
```
[██████████] 100% ✅ TAMAMLANDI
- Metrics: DONE ✅
- Dashboard: DONE ✅
- Alerts: DONE ✅
```

### Sprint 3.2: Portfolio Lab UI
```
[░░░░░░░░░░] 0%
- Page: TODO
- History API: TODO
- WebSocket: TODO
```

### Sprint 3.3: BTCTurk Spot
```
[░░░░░░░░░░] 0%
- WebSocket: TODO
- Reader: TODO
- Rate Limit: TODO
```

### Sprint 3.4: BIST Reader
```
[░░░░░░░░░░] 0%
- Research: TODO
- Integration: TODO
```

---

## 🎯 BAŞARI METRİKLERİ

### Sprint 3.1 Başarı Kriterleri
- Grafana'da 4+ panel canlı
- Alert kuralları test edilmiş
- Metrics dokumentasyonu tam

### Sprint 3.3 Başarı Kriterleri
- BTCTurk WS 99.9% uptime
- Latency p95 < 100ms
- 0 data loss

### Genel Başarı
- Portfolio UI gerçek veriyle çalışıyor
- Tüm metrics Prometheus'ta
- API error rate < 0.5%
- User feedback pozitif

---

**cursor (Claude 3.5 Sonnet) - 10 Ekim 2025**

---

## ⚡ HIZLI BAŞLANGIÇ

Observability metrics'i aktif etmek için:

```powershell
# 1. Değişiklikleri kaydet
cd C:\dev\CursorGPT_IDE

# 2. Executor'ı yeniden başlat
.\durdur.ps1
.\basla.ps1

# 3. Metrics endpoint'ini kontrol et
curl http://localhost:4001/metrics | findstr portfolio
```

Beklenen çıktı:
```
spark_portfolio_refresh_latency_ms_bucket{exchange="binance",status="success",le="50"} 0
spark_portfolio_total_value_usd{exchange="binance"} 45000.00
spark_portfolio_asset_count{exchange="binance"} 12
```

---

**İlk adım (Sprint 3.1.1) tamamlandı! Grafana dashboard'u için hazırız. ✅**

