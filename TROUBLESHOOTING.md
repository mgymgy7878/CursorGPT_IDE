# Spark TA Module v1.0.0 - Troubleshooting Guide

## 🔍 Quick Diagnostics

```bash
# Check all services
docker ps | grep spark

# Check logs
docker logs executor-1 --tail 50
docker logs web-next-1 --tail 50
docker logs spark-redis --tail 50

# Check health
bash scripts/health-check.sh
```

---

## ❌ Common Issues & Solutions

### 1. Port Already in Use

**Symptom:**
```
Error: bind: address already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :4001  # Executor
lsof -i :3000  # Web-Next
lsof -i :6379  # Redis

# Kill process or change port in .env
EXECUTOR_PORT=4002
WEB_PORT=3001
```

---

### 2. Redis Connection Refused

**Symptom:**
```
Error: connect ECONNREFUSED redis:6379
```

**Solution:**
```bash
# Check Redis is running
docker ps | grep redis

# Check Redis health
docker exec spark-redis redis-cli PING
# Should return: PONG

# Restart Redis
docker restart spark-redis

# Check REDIS_URL in .env
REDIS_URL=redis://spark-redis:6379
```

---

### 3. No Leader Elected

**Symptom:**
```
# No "became leader" in logs
docker logs executor-1 | grep leader
# Empty output
```

**Solution:**
```bash
# Check SCHEDULER_ENABLED
grep SCHEDULER_ENABLED .env
# Should be: true

# Check Redis lock
docker exec spark-redis redis-cli GET spark:alerts:scheduler:lock
# If stuck, delete:
docker exec spark-redis redis-cli DEL spark:alerts:scheduler:lock

# Restart executors
docker restart executor-1 executor-2

# Wait 35 seconds and check again
sleep 35
docker logs executor-1 | grep "became leader"
```

---

### 4. SSE Stream Not Working

**Symptom:**
```
# Browser shows "pending" forever
# No data: events
```

**Solution:**

**A) Check Nginx Configuration:**
```nginx
# MUST have these for SSE:
proxy_buffering off;
proxy_cache off;
add_header X-Accel-Buffering no;
chunked_transfer_encoding off;
```

**B) Check WebSocket Connection:**
```bash
# Test SSE endpoint
curl -N http://localhost:3000/api/marketdata/stream?symbol=BTCUSDT\&timeframe=1m

# Should see:
# data: {"type":"open"}
# data: {"type":"kline",...}
```

**C) Check Binance Connectivity:**
```bash
# Test Binance WS from container
docker exec web-next-1 curl -I https://stream.binance.com/
```

---

### 5. Alerts Not Triggering

**Symptom:**
```
# Created alert but no triggers
curl http://localhost:4001/metrics | grep alerts_triggered_total
# Always 0
```

**Solution:**

**A) Check Alert is Active:**
```bash
curl -s http://localhost:4001/alerts/list | jq '.items[] | {id, active}'
# active should be true
```

**B) Check Scheduler Running:**
```bash
docker logs executor-1 | grep pollOnce
# Should see regular "pollOnce" logs every 30s
```

**C) Check Alert Evaluation:**
```bash
# Enable verbose logging (add to .env)
LOG_LEVEL=debug

# Restart
docker restart executor-1

# Check logs for evaluation details
docker logs executor-1 | grep evaluateOne
```

**D) Check Cooldown:**
```bash
# If recently triggered, might be in cooldown
curl -s http://localhost:4001/metrics | grep alerts_suppressed_total
# Check reason="cooldown" count
```

---

### 6. Notifications Not Sending

**Symptom:**
```
# Alert triggers but no Telegram/Webhook
curl http://localhost:4001/metrics | grep notifications_sent_total
# Always 0
```

**Solution:**

**A) Check Telegram Config:**
```bash
# Verify env vars
grep TELEGRAM .env
# TELEGRAM_BOT_TOKEN=...
# TELEGRAM_CHAT_ID=...

# Test token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
# Should return bot info
```

**B) Check Webhook Config:**
```bash
# Verify allowed hosts
grep NOTIFY_ALLOWED_HOSTS .env
# Should include your webhook domain

# Test webhook URL
curl -X POST https://your-webhook.com/test
```

**C) Check Notification Errors:**
```bash
docker logs executor-1 | grep notify
# Look for error details

curl -s http://localhost:4001/metrics | grep notifications_failed_total
# Check failure reasons
```

---

### 7. High Memory Usage

**Symptom:**
```
docker stats
# Executor or Web-Next using >2GB
```

**Solution:**

**A) Check for Memory Leaks:**
```bash
# Monitor over time
docker stats --no-stream | grep executor

# If growing steadily, restart
docker restart executor-1
```

**B) Reduce Cache Size:**
```bash
# In code: reduce toolCache TTL or MAX_CONNECTIONS
```

**C) Enable Redis Memory Limits:**
```bash
# Add to redis.conf or docker command
maxmemory 512mb
maxmemory-policy allkeys-lru
```

---

### 8. Metrics Not Showing in Grafana

**Symptom:**
```
# Dashboard empty or "No data"
```

**Solution:**

**A) Check Prometheus Scraping:**
```bash
# Open Prometheus UI
open http://localhost:9090

# Go to Status → Targets
# Check spark-executor target is UP
```

**B) Check Metrics Endpoint:**
```bash
curl http://localhost:4001/metrics | grep alerts_active
# Should return numeric value
```

**C) Check Grafana Data Source:**
```
# Grafana → Configuration → Data Sources
# Test connection to Prometheus
```

**D) Check Time Range:**
```
# Grafana dashboard → Time picker
# Ensure "Last 1 hour" or appropriate range
```

---

### 9. Chart Not Rendering

**Symptom:**
```
# /technical-analysis page blank or error
```

**Solution:**

**A) Check Browser Console:**
```
F12 → Console
# Look for errors (CORS, fetch failed, etc.)
```

**B) Check Marketdata Endpoint:**
```bash
curl http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT\&timeframe=1h\&limit=100
# Should return JSON array
```

**C) Check Lightweight Charts:**
```bash
# Clear cache and reload
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

### 10. Docker Build Fails

**Symptom:**
```
ERROR [executor 5/8] RUN pnpm install
```

**Solution:**

**A) Clear Build Cache:**
```bash
docker builder prune -a

# Rebuild
docker compose build --no-cache
```

**B) Check Node/pnpm Version:**
```dockerfile
# In Dockerfile, ensure compatible versions
FROM node:18-alpine
RUN npm install -g pnpm@8
```

**C) Check Network:**
```bash
# Test npm registry
curl https://registry.npmjs.org/

# Use --network=host if needed
docker build --network=host .
```

---

## 🔬 Advanced Diagnostics

### Redis Key Inspection:
```bash
# List all alert keys
docker exec spark-redis redis-cli --scan --pattern "spark:alerts:*"

# Get alert count
docker exec spark-redis redis-cli SCARD spark:alerts:alerts:index

# Get specific alert
docker exec spark-redis redis-cli HGET spark:alerts:alert:<ID> json
```

### Network Debugging:
```bash
# Check container network
docker network inspect spark_default

# Test inter-container connectivity
docker exec executor-1 ping spark-redis
docker exec executor-1 curl http://web-next:3000/health
```

### Performance Profiling:
```bash
# Check CPU usage
docker stats --no-stream

# Check I/O
docker exec spark-redis redis-cli INFO stats | grep total_commands

# Check connection count
docker exec spark-redis redis-cli INFO clients
```

---

## 📞 Getting Help

### Log Collection:
```bash
# Collect all logs
mkdir -p logs
docker logs executor-1 > logs/executor.log 2>&1
docker logs web-next-1 > logs/web.log 2>&1
docker logs spark-redis > logs/redis.log 2>&1

# Collect metrics snapshot
curl http://localhost:4001/metrics > logs/metrics.txt

# Collect system info
docker info > logs/docker-info.txt
docker compose config > logs/compose-config.yml
```

### Issue Report Template:
```markdown
**Environment:**
- OS: (Linux/Mac/Windows)
- Docker version: (docker --version)
- Spark TA version: (git describe --tags)

**Issue:**
(Describe the problem)

**Steps to Reproduce:**
1. ...
2. ...

**Expected Behavior:**
(What should happen)

**Actual Behavior:**
(What actually happens)

**Logs:**
(Attach logs from above)

**Metrics:**
(Include relevant metrics)
```

---

## 🛠️ Emergency Procedures

### Full System Reset:
```bash
# Stop all services
docker compose down

# Remove volumes (⚠️ DELETES DATA)
docker volume rm spark_redis-data

# Restart
docker compose up -d
```

### Disable Scheduler (Emergency):
```bash
# Stop alert processing immediately
docker exec executor-1 sh -c "export SCHEDULER_ENABLED=false && kill -HUP 1"

# Or restart with flag
docker stop executor-1
docker run -e SCHEDULER_ENABLED=false executor-1
```

### Rollback:
```bash
# Checkout previous version
git checkout ta-module-v0.9.0

# Redeploy
bash scripts/deploy.sh
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-11  
**Status:** Production Ready

