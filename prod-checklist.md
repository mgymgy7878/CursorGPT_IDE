# 🚀 SPARK TRADING PLATFORM - PRODUCTION ROLLOUT CHECKLIST

## 📋 ÖN HAZIRLIK (Pre-Production)

### 1. Environment Setup
- [ ] **Production Environment Variables**
  ```bash
  # .env.production
  NODE_ENV=production
  LIVE_TRADING=false  # Canary testlerde true'ya geçmeden
  BINANCE_FUTURES_BASE_URL=https://fapi.binance.com
  BINANCE_FUTURES_API_KEY=your_live_key
  BINANCE_FUTURES_SECRET_KEY=your_live_secret
  BTCTURK_BASE_URL=https://api.btcturk.com
  EXECUTOR_URL=http://executor:4001
  NEXT_PUBLIC_EXECUTOR_URL=/api
  ```

- [ ] **SSL Certificates** (Production domain için)
- [ ] **Domain Configuration** (DNS, subdomain setup)
- [ ] **Firewall Rules** (Port 80, 443, 4001, 3003)

### 2. Security Hardening
- [ ] **API Keys Rotation** (Test keys → Production keys)
- [ ] **JWT Secret Update** (Production secret)
- [ ] **Rate Limiting** (API endpoint'ler için)
- [ ] **CORS Configuration** (Production domain'ler)
- [ ] **Environment Variables Encryption**

### 3. Database & Storage
- [ ] **Database Migration** (Test → Production)
- [ ] **Backup Strategy** (Automated backups)
- [ ] **Log Rotation** (50MB+ dosyalar için)
- [ ] **Evidence Storage** (Production evidence klasörü)

## 🔧 BUILD & DEPLOY

### 1. Build Process
```bash
# Windows
.\deploy.ps1

# Linux/macOS
./deploy.sh

# Docker Compose (Önerilen)
docker-compose -f docker-compose.prod.yml up -d
```

- [ ] **Build Success** (No TypeScript errors)
- [ ] **Docker Images** (web-next, executor)
- [ ] **Nginx Configuration** (Reverse proxy)
- [ ] **PM2 Process Management** (Alternative)

### 2. Service Startup
- [ ] **Executor Service** (Port 4001)
- [ ] **Web-Next Service** (Port 3003)
- [ ] **Nginx Proxy** (Port 80/443)
- [ ] **Prometheus** (Port 9090)
- [ ] **Grafana** (Port 3000)

## 🧪 TESTING & VALIDATION

### 1. Smoke Tests
```bash
# Tek-sefer kilidi ile
.\tools\once-lock.ps1 -Name "prod-smoke" -TtlSec 300
```

- [ ] **Health Check** (`/health` → 200 OK)
- [ ] **Futures Time** (`/api/futures/time` → 200 OK)
- [ ] **UI Rewrite** (`/api/futures/time` via 3003 → 200 OK)
- [ ] **Prometheus Metrics** (`/public/metrics/prom` → 200 OK)
- [ ] **ExchangeInfo** (`/api/futures/exchangeInfo` → 200 OK)

### 2. Canary Dry-Run
```bash
# 10 dakika paper trading
.\tools\canary-dryrun.ps1 -RunId "prod-canary-001" -DurationMinutes 10
```

- [ ] **BTCUSDT Klines** (Real-time data)
- [ ] **ETHUSDT Klines** (Real-time data)
- [ ] **ExchangeInfo** (Symbol data)
- [ ] **Paper Trading Loop** (10 minutes)
- [ ] **Evidence Report** (JSON output)

### 3. Strategy Lab Test
- [ ] **Browser Access** (`http://domain/strategy-lab`)
- [ ] **Backtest Job** (30s SSE stream)
- [ ] **AI Strategy Editor** (Monaco Editor)
- [ ] **JSON Validation** (Strategy schema)

## 📊 MONITORING & OBSERVABILITY

### 1. Prometheus Metrics
- [ ] **HTTP Requests** (`http_requests_total`)
- [ ] **Response Times** (`http_request_duration_seconds`)
- [ ] **Error Rates** (`http_requests_total{status=~"5.."}`)
- [ ] **Futures API Calls** (`futures_api_calls_total`)
- [ ] **System Resources** (CPU, Memory, Disk)

### 2. Grafana Dashboards
- [ ] **System Overview** (Health, Performance)
- [ ] **Trading Metrics** (API calls, Latency)
- [ ] **Error Tracking** (4xx, 5xx responses)
- [ ] **Resource Usage** (CPU, Memory, Network)

### 3. Alerting
- [ ] **Health Check Alerts** (Service down)
- [ ] **High Error Rate** (>5% 5xx responses)
- [ ] **High Latency** (>2s response time)
- [ ] **Resource Alerts** (CPU >80%, Memory >90%)

## 🔄 CANARY TO PRODUCTION

### 1. Canary Phase (1-2 hours)
```bash
# Gerçek market parametreleriyle
.\tools\canary-dryrun.ps1 -RunId "canary-live-001" -DurationMinutes 120
```

- [ ] **Live Market Data** (Real Binance Futures)
- [ ] **Paper Trading** (No real money)
- [ ] **Performance Monitoring** (Latency, Errors)
- [ ] **Strategy Execution** (AI strategies)
- [ ] **Evidence Collection** (2-hour report)

### 2. Production Switch
- [ ] **LIVE_TRADING=true** (Environment update)
- [ ] **Real API Keys** (Production Binance)
- [ ] **Position Limits** (Risk management)
- [ ] **Order Size Limits** (Safety limits)
- [ ] **Stop-Loss Rules** (Risk control)

### 3. Go-Live Validation
- [ ] **First Real Trade** (Small amount)
- [ ] **Position Monitoring** (Real-time)
- [ ] **P&L Tracking** (Profit/Loss)
- [ ] **Risk Metrics** (Drawdown, Sharpe)
- [ ] **System Stability** (24h monitoring)

## 🚨 ROLLBACK PLAN

### 1. Emergency Procedures
- [ ] **Service Shutdown** (`docker-compose down`)
- [ ] **Database Rollback** (Previous backup)
- [ ] **Environment Revert** (LIVE_TRADING=false)
- [ ] **API Key Rotation** (Back to test keys)
- [ ] **Position Closure** (Emergency exit)

### 2. Communication
- [ ] **Status Page** (Service status)
- [ ] **User Notification** (Maintenance window)
- [ ] **Team Alert** (Incident response)
- [ ] **Post-Mortem** (Root cause analysis)

## 📈 POST-PRODUCTION

### 1. Performance Optimization
- [ ] **Caching Strategy** (Redis/Memcached)
- [ ] **Database Optimization** (Indexes, Queries)
- [ ] **CDN Setup** (Static assets)
- [ ] **Load Balancing** (Multiple instances)

### 2. Feature Rollout
- [ ] **A/B Testing** (New features)
- [ ] **Gradual Rollout** (Percentage-based)
- [ ] **Feature Flags** (Toggle system)
- [ ] **User Feedback** (Analytics)

### 3. Maintenance
- [ ] **Regular Backups** (Daily/Weekly)
- [ ] **Security Updates** (Dependencies)
- [ ] **Performance Tuning** (Monitoring)
- [ ] **Capacity Planning** (Scaling)

## 🎯 SUCCESS CRITERIA

### Technical Metrics
- [ ] **Uptime** >99.9%
- [ ] **Response Time** <500ms (95th percentile)
- [ ] **Error Rate** <0.1%
- [ ] **Throughput** >1000 requests/minute

### Business Metrics
- [ ] **Strategy Execution** (Successful trades)
- [ ] **Risk Management** (No major losses)
- [ ] **User Experience** (Smooth operation)
- [ ] **System Reliability** (No downtime)

## 📞 CONTACTS & ESCALATION

### Team Contacts
- **DevOps Lead**: [Contact Info]
- **Trading Team**: [Contact Info]
- **Security Team**: [Contact Info]
- **On-Call Engineer**: [Contact Info]

### External Services
- **Binance Support**: [Contact Info]
- **BTCTurk Support**: [Contact Info]
- **Hosting Provider**: [Contact Info]
- **SSL Provider**: [Contact Info]

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Environment Setup
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build & Deploy
docker-compose -f docker-compose.prod.yml up -d

# 3. Smoke Test
.\tools\once-lock.ps1 -Name "prod-smoke" -TtlSec 300

# 4. Canary Test
.\tools\canary-dryrun.ps1 -RunId "prod-canary-001" -DurationMinutes 10

# 5. Monitor
# Check Grafana: http://domain:3000
# Check Prometheus: http://domain:9090
```

---

**Status**: ✅ READY FOR PRODUCTION  
**Last Updated**: 2025-01-20  
**Version**: 1.0  
**Health**: GREEN 🟢
