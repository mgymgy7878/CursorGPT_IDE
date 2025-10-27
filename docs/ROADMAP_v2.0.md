# Spark Trading Platform — Plan & Roadmap  
**Güncel:** 2025-08-19 • **HEALTH:** GREEN

## Durum Özeti (v1.0)
- Prod altyapı tamam: PM2 cluster, Nginx/TLS, RBAC, rate-limit, backup/DR, metrics.
- Binance testnet REST/WS, userData listenKey, market streams çalışır.
- Incident drills, runbook ve canary çerçevesi hazır.

## Eksikler & Geliştirme İhtiyaçları

### Yüksek Öncelik
- **Real Canary Kanıtı:** Testnet real canary → orderId + (ACK/FILLED) kanıtı ve DB kayıt ekran görüntüsü (Day-1 raporu)
- **BTCTurk Spot Bağlayıcı:** REST + userData WS, sembol eşleme (USDT↔TRY), minNotional/lot adımı ve tickSize auto-round
- **BIST Veri Beslemesi:** Lisans/erişim, normalize edici "reader", BIST30/BIST100 akışlarını Strategy Lab grafiğine bağlama
- **Backtest/Historical Katmanı:** Postgres'te time-series indeksler (veya Timescale eklentisi), veri yutma (ingest) ve snapshot politikaları
- **Copilot Guardrails (Zorunlu):** Param-diff onayı, policy auto-fix ve risk skoru; ihlalde çalıştırmayı engelle
- **Portföy-Seviyesi Risk:** Net maruziyet, max position/ max loss / max drawdown guard; dynamic position sizing

### Orta Öncelik
- **Cross-Exchange Arb Guard:** BTCTurk↔Binance fiyat sapması tespiti, sapmada otomatik durdurma
- **Webhooks/Notifications:** İmzalı webhook (HMAC) + kritik olaylarda bildirim
- **Export@Scale:** 10k–1M satırlı CSV/JSON için akış odaklı export, imzalı URL
- **UI/UX:** Executions timeline (ACK→NEW→FILLED), Strategy Lab'da param ısı haritası, StatusBar drift(ms)
- **Observability:** Grafana panelleri (place→ACK P95, fill oranı), alarm kuralları (risk_halt, listenKey expire)
- **Testler:** Unit/E2E (execution, RBAC, rate-limit), WS dayanıklılık ve yük testleri

### Düşük Öncelik
- **Compliance:** PII politikaları, data retention; multi-tenant hazırlıkları (Phase 4 ile entegre)
- **Billing/Entitlement:** Anahtar rotasyonu, API kullanım kotası, planlar

## Sprint Planı

### v1.1 — Real Canary Evidence & Cleanup (1–2 gün)
**DoD:** orderId + ≥1 ACK/FILLED; Day-1 raporu; metrik ve audit kanıtı.

**Görevler:**
- [ ] Binance API key'leri ile real testnet canary execution
- [ ] OrderId ve ACK/FILLED event kanıtı toplama
- [ ] DB kayıt ekran görüntüleri
- [ ] Day-1 production report oluşturma
- [ ] Metrics ve audit log kanıtları

### v1.2 — BTCTurk Spot + BIST Reader (2 hafta)
**DoD:** BTCTurk testte orderId+ACK; BIST30/100 grafik; auto-round kuralları.

**Görevler:**
- [ ] BTCTurk REST API client implementation
- [ ] BTCTurk WebSocket user data stream
- [ ] Symbol mapping (BTCUSDT → BTCTRY)
- [ ] MinNotional/lot step auto-rounding
- [ ] BIST data feed reader
- [ ] BIST30/BIST100 Strategy Lab integration
- [ ] Cross-exchange price monitoring

### v1.3 — Copilot Guardrails Zorunlu + Optimization Lab (2 hafta)
**DoD:** Policy ihlalinde auto-fix & bloklama; grid/scalper optimizer + heatmap; "Promote to Ready".

**Görevler:**
- [ ] Mandatory policy enforcement
- [ ] Auto-fix integration with UI
- [ ] Risk scoring engine
- [ ] Grid strategy optimizer
- [ ] Scalper strategy optimizer
- [ ] Heat map visualization
- [ ] Promote to ready workflow

### v1.4 — Historical & Backtest Engine (2 hafta)
**DoD:** TS indeksli Postgres ingest→backtest→export; veri versiyon etiketi.

**Görevler:**
- [ ] PostgreSQL time-series indexes
- [ ] Data ingestion pipeline
- [ ] Historical data storage
- [ ] Backtest engine
- [ ] Results export system
- [ ] Data versioning

### v1.5 — Streams/Exports @Scale + Observability (1 hafta)
**DoD:** 100k+ export stabil; SSE/WS throttle/backpressure; Grafana panelleri & alarmlar.

**Görevler:**
- [ ] Large-scale export optimization
- [ ] SSE/WS backpressure handling
- [ ] Grafana dashboard creation
- [ ] Alert rules configuration
- [ ] Performance monitoring

### v2.0 — ML Sinyal Füzyonu & Risk Skoru (3 ay)
**DoD:** Basit tahmin/volatilite modelleri; sinyal füzyonu; risk skoru ve A/B rapor.

**Görevler:**
- [ ] Price prediction models
- [ ] Volatility models
- [ ] Signal fusion engine
- [ ] Risk score calculation
- [ ] A/B testing framework
- [ ] ML model monitoring

### v2.1 — Enterprise (6 ay)
**DoD:** Multi-tenant, gelişmiş RBAC, billing, uyum raporları, imzalı webhooks.

**Görevler:**
- [ ] Multi-tenant architecture
- [ ] Advanced RBAC system
- [ ] Billing integration
- [ ] Compliance reporting
- [ ] Signed webhooks
- [ ] Enterprise security features

## Başarı Kriterleri

### Latency
- **place→ACK P95:** < 1000 ms (hedef < 200 ms)
- **event→DB P95:** < 300 ms
- **API Response P95:** < 500 ms

### Security/Privacy
- **RBAC:** 401/403 doğru çalışır
- **Rate-limit:** 429 audit kaydı
- **Secrets:** Sadece environment variables
- **TLS:** Production-grade encryption

### Risk Management
- **MaxNotional Guard:** İhlalinde emir bloklanır
- **Drawdown Guard:** Maksimum drawdown kontrolü
- **Audit:** Tüm işlemler kaydedilir
- **Circuit Breaker:** Otomatik risk kontrolü

### Data/Export
- **10k+ satır export:** Sorunsuz çalışır
- **İmzalı URL:** Güvenli export
- **Veri bütünlüğü:** %100 doğruluk
- **Backup:** Otomatik yedekleme

### AI/ML
- **Guardrails zorunlu:** Policy ihlalinde bloklama
- **Param-diff onayı:** Onaysız canlı çıkış yok
- **Risk skoru:** UI'da görünür
- **Auto-fix:** Otomatik düzeltme önerileri

## İzleme & Raporlama

### Prometheus/Grafana Panelleri
- **placed_total:** Toplam emir sayısı
- **fills_total:** Toplam fill sayısı
- **ws_reconnect_total:** WebSocket yeniden bağlanma
- **listenkey_keepalive_total:** ListenKey yenileme
- **latency P50/P95:** Gecikme metrikleri

### Günlük Raporlar
- **Ops Report şablonu:** Standart operasyon raporu
- **İmzalı CSV/PDF:** Güvenli export
- **Performance metrics:** Performans göstergeleri
- **Risk metrics:** Risk metrikleri

## Teknik Mimari

### Paket Yapısı (Güncellenmiş)
```
packages/
├── execution/          # Order execution engine
├── copilot/           # AI risk management
├── marketdata/        # Market data feeds
├── arbitrage/         # Cross-exchange monitoring
├── optimization/      # Strategy optimization
├── backtest/          # Historical backtesting
└── ml/               # Machine learning models

apps/
├── web-next/          # Next.js frontend
└── mobile/            # React Native app (future)

services/
├── executor/          # Order execution service
├── analytics/         # Analytics service
└── ml-engine/         # ML inference service
```

### Veritabanı Şeması (Genişletilmiş)
```sql
-- Time-series optimized tables
CREATE TABLE executions (
  execution_id VARCHAR PRIMARY KEY,
  order_id VARCHAR,
  client_order_id VARCHAR,
  symbol VARCHAR,
  side VARCHAR,
  quantity DECIMAL,
  status VARCHAR,
  exchange_order_id VARCHAR,
  created_at TIMESTAMP,
  exchange VARCHAR -- BTCTurk, Binance, etc.
);

CREATE TABLE trades (
  trade_id VARCHAR PRIMARY KEY,
  execution_id VARCHAR,
  order_id VARCHAR,
  symbol VARCHAR,
  side VARCHAR,
  quantity DECIMAL,
  price DECIMAL,
  commission DECIMAL,
  timestamp TIMESTAMP,
  exchange VARCHAR
);

-- Historical data tables
CREATE TABLE market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR,
  price DECIMAL,
  volume DECIMAL,
  timestamp TIMESTAMP,
  exchange VARCHAR
);

-- Backtest results
CREATE TABLE backtest_results (
  id SERIAL PRIMARY KEY,
  strategy_name VARCHAR,
  parameters JSONB,
  results JSONB,
  created_at TIMESTAMP
);
```

## Risk Yönetimi

### Teknik Riskler
- **Exchange API Changes:** Version compatibility management
- **Data Quality Issues:** Validation and monitoring
- **Performance Degradation:** Continuous monitoring
- **Security Vulnerabilities:** Regular security audits

### İş Riskleri
- **Regulatory Changes:** Compliance monitoring
- **Market Volatility:** Risk management systems
- **Competition:** Feature differentiation
- **User Adoption:** User feedback integration

## Uygulama Zaman Çizelgesi

| Phase | Süre | Ana Özellikler |
|-------|------|----------------|
| v1.1 | 1-2 gün | Real canary evidence |
| v1.2 | 2 hafta | BTCTurk + BIST integration |
| v1.3 | 2 hafta | Copilot + Optimization Lab |
| v1.4 | 2 hafta | Historical & Backtest Engine |
| v1.5 | 1 hafta | Streams & Observability |
| v2.0 | 3 ay | ML Signal Fusion |
| v2.1 | 6 ay | Enterprise Features |

---

**Roadmap Owner:** Product Team  
**Last Review:** 2025-08-19  
**Next Review:** 2025-08-26  
**Version:** 2.1 