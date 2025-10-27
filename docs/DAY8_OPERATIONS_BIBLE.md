# DAY-8 Strategy Automation Pack - Operations Bible

## Genel Bakış

**DAY-8 Strategy Automation Pack**, Spark Trading Platform'unu "production-grade auto-trader" seviyesine yükselten kapsamlı otomasyon sistemi. 5 katmanlı mimari ile signal processing'den risk management'a, ML tabanından otomatik raporlamaya kadar tüm süreçleri otomatikleştirir.

## Sistem Mimarisi

### Katman 1: Signal Processing Pipeline ✅
- **SignalProcessor**: Ana otomatik sinyal işleme sistemi
- **SignalValidator**: Çoklu kural tabanlı doğrulama
- **SignalQueue**: Öncelikli FIFO kuyruk yönetimi
- **SignalExecutor**: Mock order execution motoru
- **SignalMetrics**: Performans takip ve monitoring

### Katman 2: Risk Guard System ✅
- **RiskGuard**: Gelişmiş risk yönetimi sistemi
- **Emergency Stop**: Acil durum kontrolü
- **Daily Limits**: Günlük işlem limitleri
- **Drawdown Protection**: Portföy risk kontrolü
- **Position Size Limits**: Pozisyon büyüklüğü kontrolü

### Katman 3: Feature Store ✅
- **FeatureStore**: ML tabanı ve sinyal geçmişi
- **Signal Features**: Teknik ve market özellikleri
- **Pattern Analysis**: Trend ve reversal pattern'leri
- **Performance Metrics**: Başarı oranı ve metrikler
- **Signal Recommendations**: AI tabanlı öneriler

### Katman 4: 48h Report Pipeline ✅
- **Reporting Core**: Otomatik snapshot toplama
- **Session Management**: Rapor session'ları yönetimi
- **Data Aggregation**: PnL, metrikler, pozisyonlar
- **Multi-Format Export**: JSON ve CSV çıktıları
- **UI Integration**: ReportViewer component'i

### Katman 5: Final Integration ✅
- **Operations Bible**: Kapsamlı operasyonel dokümantasyon
- **Signal Test UI**: Frontend signal test sayfası
- **Production Checklist**: Canlı ortam deployment guide
- **Monitoring Setup**: Grafana ve Prometheus konfigürasyonu

## API Endpoints

### Signal Processing
```
POST /api/signal/submit          # Signal gönder
GET  /api/signal/status          # Processor durumu
GET  /api/signal/metrics         # Performans metrikleri
POST /api/signal/start           # Processor başlat
POST /api/signal/stop            # Processor durdur
POST /api/signal/clear-queue     # Kuyruğu temizle
PUT  /api/signal/config          # Konfigürasyon güncelle
```

### Risk Management
```
GET  /api/signal/risk/status     # Risk guard durumu
GET  /api/signal/risk/alerts     # Risk uyarıları
POST /api/signal/risk/emergency-stop  # Emergency stop
PUT  /api/signal/risk/config     # Risk konfigürasyonu
POST /api/signal/risk/reset      # Risk guard sıfırla
```

### Feature Store
```
GET  /api/signal/features/history      # Sinyal geçmişi
GET  /api/signal/features/executions   # Execution geçmişi
GET  /api/signal/features/patterns/:symbol  # Pattern analizi
GET  /api/signal/features/performance  # Performans metrikleri
POST /api/signal/features/recommendations  # AI önerileri
POST /api/signal/features/clear       # Geçmişi temizle
```

### 48h Report Pipeline
```
POST /api/private/report/session       # Session başlat
POST /api/private/report/snapshot      # Snapshot al
POST /api/private/report/finalize      # Raporu finalize et
GET  /api/private/report/latest        # Son raporu oku
GET  /api/private/report/list          # Rapor listesi
GET  /api/private/report/:id           # Belirli raporu oku
```

## Operasyonel Prosedürler

### Sistem Başlatma
```bash
# 1. Executor servisini başlat
cd services/executor
pnpm dev

# 2. Frontend'i başlat
cd apps/web-next
pnpm dev

# 3. Health check
curl http://localhost:4001/api/public/health
curl http://localhost:3003/api/health
```

### Signal Processing Başlatma
```bash
# 1. Processor'ı başlat
curl -X POST http://localhost:4001/api/signal/start

# 2. Durumu kontrol et
curl http://localhost:4001/api/signal/status

# 3. Test signal gönder
curl -X POST http://localhost:4001/api/signal/test \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","action":"buy","confidence":0.8}'
```

### Risk Guard Konfigürasyonu
```bash
# 1. Risk durumunu kontrol et
curl http://localhost:4001/api/signal/risk/status

# 2. Emergency stop aktif et (gerekirse)
curl -X POST http://localhost:4001/api/signal/risk/emergency-stop \
  -H "Content-Type: application/json" \
  -d '{"active":true}'

# 3. Risk limitlerini güncelle
curl -X PUT http://localhost:4001/api/signal/risk/config \
  -H "Content-Type: application/json" \
  -d '{"maxDailyTrades":5,"maxDrawdown":0.05}'
```

### 48h Report Pipeline Başlatma
```bash
# 1. Tek seferlik test
cd runtime
.\report_once.cmd

# 2. 48 saatlik otomatik raporlama
.\report_48h.cmd

# 3. Son raporu kontrol et
curl http://localhost:4001/api/private/report/latest
```

## Monitoring ve Alerting

### Health Checks
```bash
# Sistem sağlığı
curl http://localhost:4001/api/public/health

# Signal processor durumu
curl http://localhost:4001/api/signal/status

# Risk guard durumu
curl http://localhost:4001/api/signal/risk/status

# Feature store durumu
curl http://localhost:4001/api/signal/features/performance
```

### Prometheus Metrics
```bash
# Tüm metrikleri görüntüle
curl http://localhost:4001/api/public/metrics/prom

# Önemli metrikler
- spark_signal_processed_total
- spark_signal_errors_total
- spark_risk_breach_total
- spark_report_runs_total
- spark_report_errors_total
```

### Grafana Dashboard
```
URL: http://localhost:3000
Dashboard: "Spark Trading - Operations"
Panels:
- Signal Processing Rate
- Risk Guard Status
- Feature Store Performance
- 48h Report Status
- Emergency Stop Status
```

## Troubleshooting

### Signal Processing Sorunları

#### Processor Başlamıyor
```bash
# 1. Log'ları kontrol et
cd services/executor
npx ts-node src/index.ts

# 2. Dependencies kontrol et
pnpm install

# 3. Port kontrol et
netstat -an | findstr :4001
```

#### Signal İşlenmiyor
```bash
# 1. Processor durumunu kontrol et
curl http://localhost:4001/api/signal/status

# 2. Queue durumunu kontrol et
curl http://localhost:4001/api/signal/queue-stats

# 3. Risk guard durumunu kontrol et
curl http://localhost:4001/api/signal/risk/status
```

### Risk Guard Sorunları

#### Emergency Stop Aktif
```bash
# Emergency stop'u deaktive et
curl -X POST http://localhost:4001/api/signal/risk/emergency-stop \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```

#### Risk Limitleri Aşıldı
```bash
# Risk guard'ı sıfırla
curl -X POST http://localhost:4001/api/signal/risk/reset

# Limitleri güncelle
curl -X PUT http://localhost:4001/api/signal/risk/config \
  -H "Content-Type: application/json" \
  -d '{"maxDailyTrades":10,"maxDrawdown":0.1}'
```

### Feature Store Sorunları

#### ML Önerileri Çalışmıyor
```bash
# 1. Feature store durumunu kontrol et
curl http://localhost:4001/api/signal/features/performance

# 2. Geçmişi temizle ve yeniden başlat
curl -X POST http://localhost:4001/api/signal/features/clear

# 3. Test signal gönder
curl -X POST http://localhost:4001/api/signal/features/recommendations \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","action":"buy","confidence":0.8}'
```

### 48h Report Pipeline Sorunları

#### Rapor Oluşturulmuyor
```bash
# 1. Executor servisini kontrol et
curl http://localhost:4001/api/public/health

# 2. Disk space kontrol et
dir runtime\reports

# 3. Manual test et
cd runtime
.\report_once.cmd
```

#### Veri Eksik
```bash
# 1. Private API endpoints kontrol et
curl http://localhost:4001/api/private/pnl/summary
curl http://localhost:4001/api/private/websocket/status

# 2. Prometheus metrics kontrol et
curl http://localhost:4001/api/public/metrics/prom
```

## Emergency Procedures

### Acil Durum Stop
```bash
# 1. Emergency stop aktif et
curl -X POST http://localhost:4001/api/signal/risk/emergency-stop \
  -H "Content-Type: application/json" \
  -d '{"active":true}'

# 2. Signal processor'ı durdur
curl -X POST http://localhost:4001/api/signal/stop

# 3. Raporlama durdur
pkill -f "report_48h.cmd"
```

### Sistem Recovery
```bash
# 1. Servisleri yeniden başlat
cd services/executor && pnpm dev
cd apps/web-next && pnpm dev

# 2. Emergency stop'u deaktive et
curl -X POST http://localhost:4001/api/signal/risk/emergency-stop \
  -H "Content-Type: application/json" \
  -d '{"active":false}'

# 3. Signal processor'ı başlat
curl -X POST http://localhost:4001/api/signal/start

# 4. Raporlamayı yeniden başlat
cd runtime && .\report_48h.cmd
```

## Performance Optimization

### Signal Processing
- **Queue Size**: maxQueueSize = 100 (varsayılan)
- **Concurrent Signals**: maxConcurrentSignals = 3
- **Processing Interval**: 1000ms

### Risk Guard
- **Daily Trade Limit**: 10 (varsayılan)
- **Max Drawdown**: 10% (varsayılan)
- **Position Size Limit**: 5% (varsayılan)
- **Confidence Threshold**: 60% (varsayılan)

### Feature Store
- **History Size**: 5000 signals (varsayılan)
- **Pattern Window**: 100 signals
- **Update Interval**: 60 seconds

### 48h Report Pipeline
- **Snapshot Interval**: 15 minutes
- **Duration**: 48 hours (192 snapshots)
- **Storage**: ~50MB per report

## Security Considerations

### API Security
- Private endpoints require authentication
- Rate limiting on public endpoints
- Input validation on all endpoints
- CORS configuration for frontend

### Risk Management
- Emergency stop always accessible
- Risk limits cannot be bypassed
- All trades logged and auditable
- Position size limits enforced

### Data Protection
- Sensitive data encrypted at rest
- API keys stored securely
- Audit logs maintained
- Backup procedures in place

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Ports available

### Deployment
- [ ] Executor service deployed
- [ ] Frontend deployed
- [ ] Database migrations run
- [ ] Monitoring configured
- [ ] Health checks passing

### Post-Deployment
- [ ] Signal processing tested
- [ ] Risk guard validated
- [ ] Feature store operational
- [ ] 48h report pipeline running
- [ ] Emergency procedures tested

## Maintenance Schedule

### Daily
- [ ] Health check review
- [ ] Error log analysis
- [ ] Performance metrics review
- [ ] Emergency stop status check

### Weekly
- [ ] Risk guard configuration review
- [ ] Feature store performance analysis
- [ ] 48h report analysis
- [ ] System optimization

### Monthly
- [ ] Full system audit
- [ ] Security review
- [ ] Performance optimization
- [ ] Documentation update

## Support Contacts

### Technical Support
- **Primary**: System Administrator
- **Secondary**: DevOps Team
- **Emergency**: On-Call Engineer

### Business Support
- **Trading Operations**: Trading Desk
- **Risk Management**: Risk Team
- **Compliance**: Compliance Officer

## Changelog

### v1.0.0 (2025-08-16)
- **Katman 1**: Signal Processing Pipeline
- **Katman 2**: Risk Guard System
- **Katman 3**: Feature Store
- **Katman 4**: 48h Report Pipeline
- **Katman 5**: Final Integration

### v1.1.0 (Planned)
- Enhanced ML capabilities
- Advanced risk models
- Real-time alerting
- Mobile dashboard

---

**Bu dokümantasyon, DAY-8 Strategy Automation Pack'in tam operasyonel kullanımı için hazırlanmıştır. Tüm değişiklikler burada dokümante edilmelidir.** 