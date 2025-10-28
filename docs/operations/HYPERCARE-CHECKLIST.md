# Spark TA Module v1.0.0 - Hypercare Checklist

## 48-Hour Post-Deployment Monitoring Plan

---

## T+0 (Deployment Complete)

### Immediate Checks
- [ ] All services started successfully
- [ ] Health endpoints returning 200 OK
- [ ] Grafana dashboard showing data
- [ ] No critical errors in logs
- [ ] Redis connection established
- [ ] Leader election completed (only 1 instance)

### Commands
```bash
docker ps | grep spark
curl http://localhost:4001/health
curl http://localhost:3000/api/marketdata/candles?symbol=BTCUSDT&timeframe=1h&limit=1
docker logs executor-1 | grep "became leader"
```

---

## T+15 Minutes

### Metrics Validation
- [ ] `alerts_active` metric visible in Grafana
- [ ] `streams_connected` = 0 (no active streams yet, normal)
- [ ] `leader_elected_total` = 1 or 2 (initial election)
- [ ] `notifications_sent_total` exists (may be 0)

### Functional Tests
- [ ] Create test alert via UI (`/alerts` page)
- [ ] Enable live mode on chart (verify SSE connection)
- [ ] Test notification (Telegram/Webhook if configured)

### Commands
```bash
curl -s http://localhost:4001/metrics | grep alerts_active
curl -s http://localhost:4001/metrics | grep leader_elected_total
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams
```

---

## T+1 Hour

### Performance Checks
- [ ] Alert evaluation completing (check logs for "triggered" or "pollOnce")
- [ ] No alert errors (`alerts_errors_total` should be 0 or low)
- [ ] Notification delivery working (if alerts triggered)
- [ ] SSE streams stable (no rapid connect/disconnect)

### Resource Usage
- [ ] CPU: Executor <20%, Web-Next <15%
- [ ] Memory: Executor <500MB, Web-Next <1GB
- [ ] Redis: Memory <100MB (depends on alert count)

### Commands
```bash
docker stats --no-stream
curl -s http://localhost:4001/metrics | grep alerts_errors_total
curl -s http://localhost:4001/metrics | grep notifications_
```

---

## T+4 Hours

### Stability Checks
- [ ] No memory leaks (RSS not growing linearly)
- [ ] Leader still holding lock (no frequent re-elections)
- [ ] Cooldown working (check `alerts_suppressed_total{reason="cooldown"}`)
- [ ] SSE auto-reconnect working (test by restarting web-next)

### User Experience
- [ ] Charts loading <2 seconds
- [ ] Live mode streaming smoothly
- [ ] Alert creation successful
- [ ] History modal showing events (if any triggered)

### Commands
```bash
docker logs executor-1 | grep "became leader" | wc -l  # Should be 1-2
curl -s http://localhost:4001/metrics | grep alerts_suppressed_total
```

---

## T+12 Hours (Next Business Day)

### Operational Review
- [ ] Review all Grafana panels for anomalies
- [ ] Check notification delivery rate (should be >98%)
- [ ] Verify no error spikes in logs
- [ ] Confirm follower instances idle (low CPU)

### Tuning Decisions
- [ ] If `alerts_suppressed_total{reason="cooldown"}` too high → Adjust `ALERT_COOLDOWN_SEC`
- [ ] If `notifications_failed_total` > 2% → Investigate webhook/telegram config
- [ ] If `streams_errors_total` spiking → Check Binance connectivity

### Commands
```bash
# Notification success rate
curl -s http://localhost:4001/metrics | grep notifications_ | awk '{sum+=$2} END {print sum}'

# Suppression rate
curl -s http://localhost:4001/metrics | grep cooldown
```

---

## T+24 Hours

### Long-Term Stability
- [ ] Redis AOF file size reasonable (check `INFO persistence`)
- [ ] No connection leaks (SSE connections tracked properly)
- [ ] Alert history accumulating correctly
- [ ] No duplicate notifications (idempotency working)

### Performance Validation
- [ ] SSE message rate matches expected (e.g., 1/min for 1m timeframe)
- [ ] Alert evaluation P95 < 2s (from logs)
- [ ] Chart rendering <300ms (browser DevTools)

### Commands
```bash
docker exec spark-redis redis-cli INFO persistence | grep aof_current_size
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams-Connected
```

---

## T+48 Hours

### Final Validation
- [ ] All SLOs met:
  - SSE Availability ≥ 99.5%
  - Alert Latency P95 ≤ 2s
  - Notification Success ≥ 98%
- [ ] No incidents reported
- [ ] User feedback positive (if beta users)
- [ ] Ready to close hypercare

### Sign-Off
- [ ] Operations team briefed
- [ ] Runbook reviewed
- [ ] On-call rotation established
- [ ] Monitoring dashboards shared
- [ ] Post-deployment report written

---

## Incident Response (If Issues Arise)

### Scenario 1: Scheduler Not Running
```bash
# Check leader election
docker logs executor-1 | grep leader

# If no leader elected:
docker exec executor-1 sh -c "redis-cli GET spark:alerts:scheduler:lock"

# If lock stuck, delete:
docker exec spark-redis redis-cli DEL spark:alerts:scheduler:lock

# Restart executors
docker restart executor-1 executor-2
```

### Scenario 2: Notification Failures Spike
```bash
# Check failure reasons
curl -s http://localhost:4001/metrics | grep notifications_failed_total

# If timeout issues:
kubectl set env deployment/executor NOTIFY_RATE_LIMIT=10  # Reduce load

# If Telegram auth issue:
# Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
```

### Scenario 3: SSE Connection Overload
```bash
# Check current connections
curl -sI http://localhost:3000/api/marketdata/stream | grep X-Streams-Connected

# If > 100 connections:
# Reduce MAX_CONNECTIONS in code (3 → 1)
# Or add nginx limit_conn
```

### Scenario 4: Redis Connection Loss
```bash
# Check Redis status
docker exec spark-redis redis-cli PING

# If down:
docker restart spark-redis

# Executors will auto-reconnect (ioredis lazyConnect)
```

---

## Escalation Path

**Level 1 (Warn):** Operations team investigates  
**Level 2 (Critical):** Development team paged  
**Level 3 (Emergency):** Emergency disable via `SCHEDULER_ENABLED=false`

---

## Success Criteria (Hypercare Exit)

✅ 48 hours uptime with no critical incidents  
✅ All SLOs met continuously  
✅ No memory/CPU anomalies  
✅ User-reported issues < 2 (minor only)  
✅ Metrics trending as expected  

**Sign-off required:** Operations Lead + Development Lead

---

**Last Updated:** 2025-10-11  
**Version:** v1.0.0  
**Status:** Active Hypercare
