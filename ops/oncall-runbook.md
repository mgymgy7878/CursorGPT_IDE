# On-call Mini Runbook (Cep Kılavuzu)

## 🚨 BacktestSlowRunner FIRING

### Quick Check
```bash
# Check P95 runtime
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=histogram_quantile(0.95, sum by (le) (rate(bt_runtime_ms_bucket[10m])))'

# Check executor logs
tail -n 200 services/executor/logs/current.log
```

### Diagnosis
- **P95 yükseldiyse + bt_runs_total düşüyor**: Kuyruk kabarıyor → batch boyutu düşür
- **P95 yükseldiyse + bt_runs_total normal**: Sistem yavaşlıyor → kaynak kontrolü
- **P95 normal + bt_runs_total düşüyor**: Giriş azalıyor → upstream kontrolü

### Actions
1. Check system resources (CPU, memory, disk)
2. Check executor logs for errors
3. Check queue depth
4. Scale if needed
5. Adjust batch size if queue is backing up

## 🌐 WebNext5xxRate FIRING

### Quick Check
```bash
# Check web-next health
curl -s http://127.0.0.1:3003/api/health | jq .

# Check PM2 logs
pm2 logs web-next --lines 200
```

### Diagnosis
- **5xx artışı + latency normal**: Upstream (Strategy Lab) yanıtları kontrol et
- **5xx artışı + latency yüksek**: Web-next yavaşlıyor → kaynak kontrolü
- **5xx artışı + memory yüksek**: Memory leak → restart gerekli

### Actions
1. Check web-next health endpoint
2. Check PM2 logs for errors
3. Check upstream services (executor)
4. Restart web-next if needed
5. Check memory usage and restart if high

## 📈 MarketDataGapDetected FIRING

### Quick Check
```bash
# Check marketdata fetch job output
curl -s http://127.0.0.1:4001/api/public/marketdata/status

# Check gaps metrics
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=marketdata_gaps_total'
```

### Diagnosis
- **Gaps > 0**: Data source issue → upstream kontrolü
- **Gaps = 0 + alert firing**: False positive → alert threshold kontrolü
- **Gaps > 0 + CI FAIL**: Expected → alert threshold ayarı

### Actions
1. Check marketdata service status
2. Check data source connectivity
3. Check CI pipeline status
4. Adjust alert thresholds if needed
5. Restart marketdata service if needed

## 🛡️ RiskGateHighBandBurst FIRING

### Quick Check
```bash
# Check fusion gate status
curl -s http://127.0.0.1:4001/api/public/fusion/risk.gate/status

# Check risk scores
curl -s localhost:9090/api/v1/query \
  --data-urlencode 'query=fusion_risk_score_10m'
```

### Diagnosis
- **Risk score yüksek**: Market conditions → threshold kontrolü
- **Risk score normal + alert firing**: False positive → alert threshold kontrolü
- **Risk score yüksek + market volatile**: Expected → alert threshold ayarı

### Actions
1. Check market conditions
2. Check risk score trends
3. Adjust alert thresholds if needed
4. Check fusion gate configuration
5. Monitor for 30 minutes

## 📊 StrategyLabErrorRate FIRING

### Quick Check
```bash
# Check strategy lab health
curl -s http://127.0.0.1:3003/api/backtest/run \
  -H "content-type: application/json" \
  -d '{"strategy":"test","initial":1000}'

# Check error logs
pm2 logs web-next --lines 100 | grep -i error
```

### Diagnosis
- **Error rate yüksek**: Strategy Lab issue → web-next kontrolü
- **Error rate normal + alert firing**: False positive → alert threshold kontrolü
- **Error rate yüksek + latency yüksek**: Resource issue → kaynak kontrolü

### Actions
1. Check strategy lab API health
2. Check web-next logs for errors
3. Check system resources
4. Restart web-next if needed
5. Check upstream dependencies

## 🔧 Common Commands

### Service Status
```bash
# Check PM2 status
pm2 status

# Check service health
curl -s http://127.0.0.1:4001/__ping
curl -s http://127.0.0.1:3003/api/health
```

### Logs
```bash
# Executor logs
pm2 logs spark-executor --lines 200

# Web-next logs
pm2 logs spark-web --lines 200

# All logs
pm2 logs --lines 100
```

### Metrics
```bash
# Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Active alerts
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.state == "firing")'
```

### Restart Services
```bash
# Restart executor
pm2 restart spark-executor

# Restart web-next
pm2 restart spark-web

# Restart all
pm2 restart all
```

## 📞 Escalation

### Level 1 (0-15 min)
- Check service status
- Check logs for errors
- Restart services if needed
- Check system resources

### Level 2 (15-30 min)
- Check upstream dependencies
- Check alert thresholds
- Check configuration
- Check network connectivity

### Level 3 (30+ min)
- Check external dependencies
- Check data sources
- Check infrastructure
- Escalate to team lead
