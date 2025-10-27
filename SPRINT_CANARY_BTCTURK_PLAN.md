# SPRINT: CANARY TEST + BTCTURK SPOT ENTEGRASYONU
**Tarih:** 14 Ocak 2025  
**Hedef:** BTCTurk Spot entegrasyonu için canary test ve production hazırlığı  
**Durum:** Hazırlık Tamamlandı ✅

## 🎯 SPRINT HEDEFLERİ

### 1. Canary Test Infrastructure
- [x] Backup rotasyon sistemi kuruldu
- [x] Observability stack (Prometheus + Grafana) hazırlandı
- [x] Build stability check script'i oluşturuldu
- [x] Canary test script'i hazırlandı

### 2. BTCTurk Spot Entegrasyonu
- [ ] BTCTurk API endpoints test edilecek
- [ ] WebSocket stream entegrasyonu
- [ ] Order book real-time sync
- [ ] Trade execution pipeline

### 3. Production Readiness
- [ ] Health check endpoints
- [ ] Metrics collection
- [ ] Alert rules yapılandırması
- [ ] Performance monitoring

## 📋 EXECUTION PLAN

### Phase 1: Infrastructure Setup (TAMAMLANDI)
1. **Backup Management**
   - ✅ `scripts/backup-rotation.ps1` - Son 3 backup saklar
   - ✅ `scripts/backup-rotation.sh` - Linux/macOS versiyonu
   - ✅ Otomatik temp dosya temizliği

2. **Observability Stack**
   - ✅ `docker-compose.observability.yml` - Prometheus + Grafana
   - ✅ `scripts/start-observability.ps1` - Stack başlatma
   - ✅ `GRAFANA_PANEL_SEEDS.md` - Dashboard önerileri
   - ✅ `prometheus.yml` - Metrics konfigürasyonu

3. **Build Stability**
   - ✅ `scripts/build-stability-check.ps1` - Build kontrolü
   - ✅ TypeScript, linting, dependencies check
   - ✅ Workspace structure validation

### Phase 2: Canary Test (HAZIR)
1. **Test Script**
   - ✅ `scripts/canary-test.ps1` - Canary test automation
   - ✅ BTCTurk API endpoint testleri
   - ✅ WebSocket connectivity check
   - ✅ Metrics collection ve monitoring

2. **Test Scenarios**
   - [ ] Symbol: BTCTRY
   - [ ] Duration: 60 seconds (configurable)
   - [ ] Mode: Dry Run + Live Test
   - [ ] Health checks: Her 10 saniyede

### Phase 3: BTCTurk Integration (SONRAKI)
1. **API Endpoints**
   - [ ] `/api/public/btcturk/ticker?symbol=BTCTRY`
   - [ ] `/api/public/btcturk/orderbook?symbol=BTCTRY`
   - [ ] `/api/public/btcturk/trades?symbol=BTCTRY`

2. **WebSocket Streams**
   - [ ] Real-time ticker updates
   - [ ] Order book changes
   - [ ] Trade notifications

3. **Trading Pipeline**
   - [ ] Order placement
   - [ ] Position management
   - [ ] Risk controls

## 🚀 COMMANDS

### Observability Stack Başlatma
```powershell
.\scripts\start-observability.ps1
```

### Canary Test Çalıştırma
```powershell
# Dry run
.\scripts\canary-test.ps1 -DryRun

# Live test
.\scripts\canary-test.ps1 -Symbol BTCTRY -TestDuration 60

# Verbose mode
.\scripts\canary-test.ps1 -Verbose
```

### Backup Rotasyon
```powershell
.\scripts\backup-rotation.ps1
```

### Build Stability Check
```powershell
.\scripts\build-stability-check.ps1
```

## 📊 MONITORING DASHBOARDS

### Grafana URLs
- **Main Dashboard**: http://localhost:3000/dashboards
- **Prometheus**: http://localhost:9090
- **Web App**: http://localhost:3003
- **Executor API**: http://localhost:4001

### Key Metrics
1. **System Health**
   - Executor Health: `up{job="spark-executor"}`
   - Web Health: `up{job="spark-web"}`
   - UI Error Rate: `rate(http_requests_total{app="web-next",status=~"5.."}[5m])`

2. **Performance**
   - UI RPS: `sum(rate(http_requests_total{app="web-next"}[1m]))`
   - Executor Request Rate: `rate(http_requests_total{app="executor"}[5m])`
   - Response Time P95: `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`

3. **Trading Metrics**
   - Canary Latency: `histogram_quantile(0.95, sum by (le) (rate(canary_order_latency_seconds_bucket[5m])))`
   - Active Strategies: `active_strategies`
   - Rate Limit Hits: `rate(rate_limit_hits_total[5m])`

## 🚨 ALERT RULES

### Critical Alerts
- UI 5xx > 5%
- Executor down
- Memory > 1GB
- CPU > 95%

### Warning Alerts
- UI 5xx > 2%
- Canary latency > 1s
- Event loop lag > 100ms
- Rate limit hits > 10/min

## 📈 SLO TARGETS

### UI SLO
- **Availability**: 99.9% (5xx < 0.1%)
- **Latency**: P95 < 1s
- **Error Rate**: < 2%

### Executor SLO
- **Availability**: 99.95%
- **Latency**: P95 < 500ms
- **Memory**: < 512MB
- **CPU**: < 80%

### Trading SLO
- **Canary Latency**: P95 < 1s
- **Order Placement**: < 2s
- **Strategy Execution**: < 100ms

## 🔧 TROUBLESHOOTING

### Common Issues
1. **Services not starting**
   - Check Docker: `docker ps`
   - Check logs: `docker-compose logs`
   - Restart: `docker-compose restart`

2. **API endpoints not responding**
   - Check health: `curl http://localhost:4001/api/public/health`
   - Check metrics: `curl http://localhost:4001/api/public/metrics`

3. **BTCTurk API errors**
   - Check API key configuration
   - Verify network connectivity
   - Check rate limits

### Debug Commands
```powershell
# Service status
docker-compose -f docker-compose.observability.yml ps

# Logs
docker-compose -f docker-compose.observability.yml logs -f

# Health checks
Invoke-RestMethod -Uri "http://localhost:3003/api/public/health"
Invoke-RestMethod -Uri "http://localhost:4001/api/public/health"

# Metrics
Invoke-RestMethod -Uri "http://localhost:4001/api/public/metrics"
```

## 📋 NEXT STEPS

### Immediate (Today)
1. ✅ Infrastructure setup completed
2. ✅ Scripts and automation ready
3. [ ] Start observability stack
4. [ ] Run canary test (dry run)

### Short Term (This Week)
1. [ ] BTCTurk API integration
2. [ ] WebSocket stream setup
3. [ ] Real-time data flow
4. [ ] Performance optimization

### Medium Term (Next Sprint)
1. [ ] Production deployment
2. [ ] Live trading pipeline
3. [ ] Advanced monitoring
4. [ ] Alert automation

## 🎯 SUCCESS CRITERIA

### Technical
- [ ] All services healthy (99.9% uptime)
- [ ] Canary test passes (latency < 1s)
- [ ] BTCTurk API integration working
- [ ] Real-time data streaming
- [ ] Metrics collection active

### Business
- [ ] Trading pipeline operational
- [ ] Risk controls active
- [ ] Performance within SLO
- [ ] Monitoring dashboards live

---

**STATUS: READY FOR CANARY TEST** 🚀  
**Next Action: Start observability stack and run canary test**
