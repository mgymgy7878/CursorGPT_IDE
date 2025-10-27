# Bilgisayar Yeniden Başlatma Sonrası Kontrol Listesi

**Oluşturma Tarihi:** 2025-08-20T20:00:00Z  
**v1.6 Durumu:** ✅ TAMAMLANDI

## Öncelikli Kontroller

### 1. Temel Servisler
- [ ] **Node.js**: `node --version` (18.18.2+)
- [ ] **pnpm**: `pnpm --version` (8.0+)
- [ ] **Git**: `git --version` (2.30+)
- [ ] **Port Durumu**: 3003, 4001, 4501, 4601 boş mu?

### 2. Proje Durumu
- [ ] **Workspace**: `cd C:\dev\CursorGPT_IDE`
- [ ] **Dependencies**: `pnpm -w install`
- [ ] **Build**: `pnpm -w run build` (gerekirse)
- [ ] **Type Check**: `pnpm -w exec tsc --noEmit`

## Servis Başlatma Sırası

### 1. Backend Services
```bash
# Terminal 1: Executor Service
pnpm --filter @spark/executor dev

# Terminal 2: Backtest Engine  
pnpm --filter @spark/backtest-engine dev

# Terminal 3: Streams Service
pnpm --filter @spark/streams dev
```

### 2. Frontend Service
```bash
# Terminal 4: Web Frontend
pnpm --filter web-next dev
```

## Sağlık Kontrolleri

### 1. Health Endpoints
- [ ] **Executor**: http://127.0.0.1:4001/health
- [ ] **Backtest**: http://127.0.0.1:4501/health  
- [ ] **Streams**: http://127.0.0.1:4601/health
- [ ] **Web**: http://127.0.0.1:3003

### 2. Metrics Endpoints
- [ ] **Executor**: http://127.0.0.1:4001/metrics
- [ ] **Backtest**: http://127.0.0.1:4501/metrics
- [ ] **Streams**: http://127.0.0.1:4601/metrics

### 3. Grafana Dashboards
- [ ] **Streams Fabric**: Import `docs/grafana/streams_fabric.json`
- [ ] **Lag & Gaps**: Import `docs/grafana/lag_gaps.json`
- [ ] **Event to DB**: Import `docs/grafana/event_to_db.json`
- [ ] **Uptime & Heartbeats**: Import `docs/grafana/uptime_heartbeats.json`

## v1.6 Özellikleri Test

### 1. Streams Service Test
```bash
# Streams başlat
curl -X POST http://127.0.0.1:4601/start

# Chaos test (lag spike)
curl -X POST http://127.0.0.1:4601/chaos \
  -H "Content-Type: application/json" \
  -d '{"mode":"lag","duration":10000,"intensity":0.1}'

# Metrics kontrol
curl http://127.0.0.1:4601/metrics
```

### 2. Backtest Engine Test
```bash
# Smoke test
curl -X POST http://127.0.0.1:4501/start \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","initialCash":10000}'

# Multi-scenario test
curl -X POST http://127.0.0.1:4501/start-matrix \
  -H "Content-Type: application/json" \
  -d '{"scenarios":[{"shortWindow":5,"longWindow":20}]}'
```

## Sorun Giderme

### Yaygın Sorunlar
1. **Port Çakışması**: `netstat -ano | findstr :3003`
2. **Dependency Sorunları**: `pnpm -w install --force`
3. **TypeScript Hataları**: `pnpm -w exec tsc --noEmit`
4. **Permission Sorunları**: PowerShell'i yönetici olarak çalıştır

### Log Kontrolleri
- [ ] **Executor Logs**: Terminal çıktısı kontrol et
- [ ] **Backtest Logs**: Terminal çıktısı kontrol et  
- [ ] **Streams Logs**: Terminal çıktısı kontrol et
- [ ] **Web Logs**: Browser console kontrol et

## v1.7 Hazırlık

### Sonraki Adımlar
- [ ] **Production Planning**: v1.7 deployment roadmap
- [ ] **Multi-Exchange**: BTCTurk, BIST connector planning
- [ ] **Security Review**: Production hardening checklist
- [ ] **ML Signal Fusion**: v2.0 planning

### Kanıt Dosyaları
- [ ] **v1.6 Evidence**: `evidence/receipts-smoke/20250820200000-345678/`
- [ ] **Manifest**: `sha256-manifest.json` kontrol et
- [ ] **INDEX**: `INDEX.txt` güncel mi?

## Durum Raporu

### ✅ Tamamlanan
- v1.3: Guardrails & ML Engine
- v1.4: Backtest Engine  
- v1.5: Real Data ETL & Multi-Scenario
- v1.6: Streams & Observability

### 🔄 Devam Eden
- v1.7: Production Deployment (planlanıyor)
- v2.0: ML Signal Fusion (planlanıyor)

---
**HEALTH=GREEN** - Sistem hazır, v1.6 tamamlandı, production'a geçiş için hazır. 