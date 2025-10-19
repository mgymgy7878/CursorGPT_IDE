# Spark TA Module v1.0.0 - Deployment Guide

## 📦 Quick Deploy

```bash
# Linux/macOS
bash scripts/deploy.sh

# Windows (PowerShell)
.\scripts\deploy.ps1

# Verify
bash scripts/health-check.sh
bash scripts/smoke-test-v1.0.0.sh
bash scripts/regression-suite.sh
```

---

## 🔧 Prerequisites

### Required:
- Docker 20.10+
- Docker Compose 2.0+ (or `docker compose` plugin)
- Git
- jq (for test scripts)

### Optional:
- Nginx (reverse proxy)
- Prometheus (metrics)
- Grafana (dashboards)

---

## 🌍 Environment Variables

Create `.env` file:

```bash
# Core Services
REDIS_URL=redis://spark-redis:6379
EXECUTOR_URL=http://executor:4001
WEB_URL=http://web-next:3003

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_INTERVAL_SEC=30
SCHEDULER_LEASE_SEC=35
ALERT_COOLDOWN_SEC=600

# Notifications
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
NOTIFY_RATE_LIMIT=10
NOTIFY_ALLOWED_HOSTS=hooks.slack.com,discord.com

# Marketdata
MARKETDATA_URL=http://web-next:3000

# Limits
ALERT_EVAL_CONCURRENCY=5
MAX_SSE_CONNECTIONS=3

# Redis Persistence
REDIS_APPENDONLY=yes
REDIS_APPENDFSYNC=everysec

# Ports
EXECUTOR_PORT=4001
WEB_PORT=3000
REDIS_PORT=6379
```

---

## 🐳 Docker Compose

### Basic Setup:

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: spark-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --appendfsync everysec

  executor:
    build: ./services/executor
    container_name: executor-1
    ports:
      - "4001:4001"
    env_file: .env
    depends_on:
      - redis
    restart: unless-stopped

  web-next:
    build: ./apps/web-next
    container_name: web-next-1
    ports:
      - "3003:3003"
    env_file: .env
    depends_on:
      - executor
    restart: unless-stopped

volumes:
  redis-data:
```

### Multi-Instance (Leader Election):

```yaml
  executor-1:
    build: ./services/executor
    container_name: executor-1
    ports:
      - "4001:4001"
    env_file: .env
    environment:
      - SCHEDULER_ENABLED=true

  executor-2:
    build: ./services/executor
    container_name: executor-2
    ports:
      - "4002:4001"
    env_file: .env
    environment:
      - SCHEDULER_ENABLED=true
```

---

## 🌐 Nginx Configuration

```nginx
# /etc/nginx/sites-available/spark-ta

upstream executor_backend {
    least_conn;
    server localhost:4001;
    server localhost:4002;
}

upstream web_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name spark.example.com;

    # SSE-specific settings
    location /api/marketdata/stream {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        chunked_transfer_encoding off;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Disable buffering for SSE
        add_header X-Accel-Buffering no;
    }

    # API routes
    location /api/ {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Executor (direct access - optional, for internal tools)
    location /executor/ {
        proxy_pass http://executor_backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Metrics (internal only - restrict by IP)
    location /metrics {
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://executor_backend/metrics;
    }

    # Static files
    location / {
        proxy_pass http://web_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "no-referrer" always;
}
```

---

## 📊 Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'spark-executor'
    static_configs:
      - targets: ['localhost:4001', 'localhost:4002']
    metrics_path: '/metrics'

  - job_name: 'spark-web'
    static_configs:
      - targets: ['localhost:3003']
    metrics_path: '/metrics'
```

---

## 🎯 Deployment Steps

### 1. Pre-Deployment

```bash
# Clone repository
git clone https://github.com/your-org/spark-trading-platform.git
cd spark-trading-platform

# Checkout version
git checkout ta-module-v1.0.0

# Create environment file
cp .env.example .env
nano .env  # Update values

# Validate
docker compose config
```

### 2. Deploy

```bash
# Run deployment script
bash scripts/deploy.sh

# Expected output:
# ✅ Environment variables OK
# ✅ Images pulled
# ✅ Build complete
# ✅ Services started
# ✅ Executor: healthy
# ✅ Web-Next: healthy
# ✅ Redis: healthy
# ✅ Leader elected
# 🎉 DEPLOYMENT SUCCESSFUL!
```

### 3. Validation

```bash
# Health checks
bash scripts/health-check.sh

# Smoke tests (15s)
bash scripts/smoke-test-v1.0.0.sh

# Regression tests (45s)
bash scripts/regression-suite.sh
```

### 4. Monitoring Setup

```bash
# Import Grafana dashboard
# 1. Open Grafana UI
# 2. Dashboard → Import
# 3. Upload: monitoring/grafana/dashboards/spark-ta-module-v1.0.0.json
# 4. Select Prometheus data source
# 5. Import

# Verify metrics
curl http://localhost:4001/metrics | grep alerts_active
```

---

## 🔍 Post-Deployment Verification

### Check Services:
```bash
docker ps | grep spark
# Should show: executor-1, web-next-1, spark-redis (all up)

docker logs executor-1 | tail -20
docker logs web-next-1 | tail -20
```

### Check Leader Election:
```bash
docker logs executor-1 | grep "became leader"
# Should see: "became leader" in exactly ONE instance
```

### Check Metrics:
```bash
curl -s http://localhost:4001/metrics | grep "alerts_active"
# Should return: alerts_active 0 (or actual count)
```

### Check SSE Stream:
```bash
curl -I http://localhost:3003/api/marketdata/stream
# Should include: X-Streams-Connected, X-Streams-Messages
```

---

## 🚨 Troubleshooting

See `TROUBLESHOOTING.md` for detailed solutions.

**Common issues:**
- Port conflicts → Change ports in `.env`
- Redis connection refused → Check `REDIS_URL`
- No leader elected → Check `SCHEDULER_ENABLED=true`
- SSE not streaming → Check Nginx `proxy_buffering off`

---

## 📈 Scaling

### Horizontal Scaling (Executors):

```bash
# Scale to 3 instances
docker compose up -d --scale executor=3

# Verify leader election
docker logs executor-1 | grep leader
docker logs executor-2 | grep leader
docker logs executor-3 | grep leader
# Only ONE should show "became leader"
```

### Load Balancing (Nginx):

```nginx
upstream executor_backend {
    least_conn;
    server executor-1:4001;
    server executor-2:4001;
    server executor-3:4001;
}
```

---

## 🔄 Updates & Rollback

### Update to New Version:

```bash
# Pull new code
git fetch origin
git checkout ta-module-v1.1.0

# Deploy
bash scripts/deploy.sh

# Verify
bash scripts/regression-suite.sh
```

### Rollback:

```bash
# Rollback to previous tag
git checkout ta-module-v1.0.0

# Redeploy
bash scripts/deploy.sh
```

---

## 📚 Related Documentation

- **Operations:** `docs/operations/HYPERCARE-CHECKLIST.md`
- **Monitoring:** `docs/monitoring/README.md`
- **Testing:** `docs/testing/README.md`
- **API Reference:** `API_REFERENCE.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-11  
**Status:** Production Ready

