# Spark Trading Platform - Production Runbook

Bu doküman, Spark Trading Platform'un production ortamında çalıştırılması, izlenmesi ve sorun giderme işlemlerini açıklar.

## 🚀 Hızlı Başlangıç

### 1. Servisleri Başlatma

**Windows:**
```cmd
scripts\windows\start_services.cmd
```

**Linux/Mac:**
```bash
# PM2 ile
pm2 start ecosystem.config.js --env production

# Manuel olarak
pnpm --filter @spark/web-next start  # Port 3003
pnpm --filter services/executor dev   # Port 4001
```

### 2. Health Check

**Windows:**
```cmd
scripts\windows\health_check.cmd
```

**Linux/Mac:**
```bash
curl -sS http://localhost:3003/api/public/health
curl -sS http://localhost:3003/api/public/metrics/prom
```

## 📋 Preflight Checklist

### Environment Variables
- [ ] `BINANCE_API_KEY` - Binance API anahtarı
- [ ] `BINANCE_API_SECRET` - Binance API gizli anahtarı
- [ ] `SPARK_EXCHANGE_MODE` - `spot-testnet` veya `futures-testnet`
- [ ] `NODE_ENV` - `production`

### Port Availability
- [ ] Port 3003 (UI) - Boş
- [ ] Port 4001 (Executor) - Boş

### Dependencies
- [ ] Node.js 18+ yüklü
- [ ] pnpm yüklü
- [ ] curl yüklü (health check için)

## 🔧 Servis Yönetimi

### PM2 ile Yönetim

```bash
# Servisleri başlat
pm2 start ecosystem.config.js --env production

# Servisleri durdur
pm2 stop spark-web-next spark-executor

# Servisleri yeniden başlat
pm2 restart spark-web-next spark-executor

# Logları görüntüle
pm2 logs spark-web-next
pm2 logs spark-executor

# Servis durumunu kontrol et
pm2 status
pm2 monit
```

### Manuel Yönetim

```bash
# UI servisini başlat
cd apps/web-next
PORT=3003 HOST=0.0.0.0 pnpm start

# Executor servisini başlat
cd services/executor
PORT=4001 HOST=0.0.0.0 pnpm dev
```

## 📊 Monitoring ve Metrics

### Health Endpoints

- **UI Health:** `http://localhost:3003/api/public/health`
- **Executor Health:** `http://localhost:4001/api/public/health`
- **UI Metrics:** `http://localhost:3003/api/public/metrics/prom`
- **Executor Metrics:** `http://localhost:4001/api/public/metrics/prom`

### Kritik Metrikler

```bash
# Canlı order sayısı
curl -sS http://localhost:3003/api/public/metrics/prom | grep live_orders_placed_total

# Fill sayısı
curl -sS http://localhost:3003/api/public/metrics/prom | grep live_fills_total

# WebSocket bağlantı durumu
curl -sS http://localhost:3003/api/public/metrics/prom | grep ws_reconnect_total
```

### Log Monitoring

```bash
# PM2 logları
pm2 logs --lines 100

# Manuel log takibi
tail -f logs/web-next-combined.log
tail -f logs/executor-combined.log
```

## 🚨 Sorun Giderme

### Yaygın Sorunlar

#### 1. Port Çakışması

**Belirti:** `EADDRINUSE` hatası

**Çözüm:**
```bash
# Port kullanımını kontrol et
netstat -an | grep :3003
netstat -an | grep :4001

# Kullanıcıyı bul ve sonlandır
lsof -i :3003
kill -9 <PID>
```

#### 2. Binance API Bağlantı Sorunu

**Belirti:** `Binance API Error: -1021` (timestamp drift)

**Çözüm:**
```bash
# Sistem saatini senkronize et
sudo ntpdate pool.ntp.org

# Servisleri yeniden başlat
pm2 restart all
```

#### 3. WebSocket Bağlantı Kopması

**Belirti:** ListenKey expire hatası

**Çözüm:**
```bash
# WebSocket durumunu kontrol et
curl -sS http://localhost:3003/api/public/metrics/prom | grep listenkey_keepalive_total

# Manuel yeniden başlatma
pm2 restart spark-executor
```

#### 4. Rate Limit Aşımı

**Belirti:** `429 Too Many Requests`

**Çözüm:**
```bash
# Rate limit metriklerini kontrol et
curl -sS http://localhost:3003/api/public/metrics/prom | grep rate_limit

# Nginx rate limit ayarlarını kontrol et
nginx -t
systemctl reload nginx
```

### Emergency Procedures

#### Kill Switch Aktivasyonu

```bash
# Environment variable ile kill switch
export SPARK_KILL_SWITCH=1
pm2 restart spark-executor

# Veya API endpoint ile
curl -X POST http://localhost:4001/api/private/kill-switch
```

#### Circuit Breaker

```bash
# Circuit breaker durumunu kontrol et
curl -sS http://localhost:4001/api/public/health | jq '.circuit_breaker'

# Circuit breaker'ı kapat
curl -X POST http://localhost:4001/api/private/circuit-breaker/close
```

## 🔄 Backup ve Restore

### Otomatik Backup

```bash
# Günlük backup
0 2 * * * /path/to/scripts/backup/pg_backup.sh full 30

# Saatlik incremental backup
0 * * * * /path/to/scripts/backup/pg_backup.sh incremental 7
```

### Manuel Backup

```bash
# Tam backup
./scripts/backup/pg_backup.sh full

# Incremental backup
./scripts/backup/pg_backup.sh incremental
```

### Restore

```bash
# Restore talimatları için
cat docs/RESTORE.md
```

## 🧪 Canary Testing

### Testnet Canary

```bash
# Canary test çalıştır
export SPARK_EXCHANGE_MODE="spot-testnet"
export BINANCE_API_KEY="your_testnet_key"
export BINANCE_API_SECRET="your_testnet_secret"

pnpm -w exec tsx packages/execution/scripts/canary.ts \
  --mode testnet --symbol BTCUSDT --qty 0.00012 --arm --confirm --execute
```

### Beklenen Sonuçlar

- ✅ OrderId dolu (N-A değil)
- ✅ En az 1 WebSocket event (ACK/NEW/FILLED)
- ✅ DB'de Execution ve Trade kayıtları
- ✅ UI'da live metrics artışı

## 🔒 Güvenlik

### API Key Yönetimi

```bash
# API key'leri environment variable olarak sakla
export BINANCE_API_KEY="your_api_key"
export BINANCE_API_SECRET="your_api_secret"

# Production'da .env dosyası kullanma
# Sadece environment variable kullan
```

### Rate Limiting

```bash
# Nginx rate limit ayarları
# /etc/nginx/nginx.conf içinde:
limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=strict:10m rate=10r/m;
```

### Audit Logging

```bash
# Audit loglarını kontrol et
tail -f logs/audit.log

# Audit metriklerini kontrol et
curl -sS http://localhost:3003/api/public/metrics/prom | grep audit
```

## 📈 Performance Tuning

### Memory Optimization

```bash
# PM2 memory limitleri
pm2 start ecosystem.config.js --env production --max-memory-restart 1G

# Node.js memory ayarları
export NODE_OPTIONS="--max-old-space-size=1024"
```

### Database Optimization

```bash
# PostgreSQL ayarları
# postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

## 🚀 Deployment

### Production Deployment

```bash
# 1. Build
pnpm --filter @spark/web-next build

# 2. PM2 ile deploy
pm2 deploy production setup
pm2 deploy production

# 3. Health check
scripts/windows/health_check.cmd
```

### Rollback

```bash
# Önceki versiyona dön
pm2 deploy production rollback

# Veya manuel rollback
git checkout <previous_tag>
pnpm install
pm2 restart all
```

## 📞 Emergency Contacts

### On-Call Rotation
- **Primary:** [Primary Contact]
- **Secondary:** [Secondary Contact]
- **Escalation:** [Escalation Contact]

### Communication Channels
- **Slack:** #spark-trading-alerts
- **Email:** alerts@spark-trading.com
- **Phone:** [Emergency Phone]

## 📋 Maintenance Schedule

### Daily
- [ ] Health check review
- [ ] Metrics review
- [ ] Log review

### Weekly
- [ ] Backup verification
- [ ] Performance review
- [ ] Security scan

### Monthly
- [ ] Full system audit
- [ ] Capacity planning
- [ ] Disaster recovery test

## 🔗 Useful Links

- **Dashboard:** http://localhost:3003
- **API Docs:** http://localhost:3003/api/docs
- **Metrics:** http://localhost:3003/api/public/metrics/prom
- **Health:** http://localhost:3003/api/public/health
- **Grafana:** http://localhost:3000 (if configured)
- **Prometheus:** http://localhost:9090 (if configured) 