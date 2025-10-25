# First Night Monitoring Guide (24 Hours)

**Duration:** 24 hours post-deployment  
**Objective:** Ensure stability and catch early issues

---

## 🎯 Overview

Critical monitoring period after canary deployment completes. Focus on SLO burn rate, database health, and user experience.

---

## 📊 Hour-by-Hour Checklist

### Hour 0-2 (Critical)

**Focus:** Immediate stability, CSP violations, user feedback

```bash
# Every 15 minutes
./scripts/snapshot-metrics.sh "first_2h"

# Watch for:
# - CSP violation storm (>50/min)
# - Error rate spike (>2%)
# - Latency degradation (P95 >300ms)
```

**Checks:**
- [ ] SLO burn rate (1h) < 2.0
- [ ] Error rate < 2%
- [ ] API P95 < 250ms
- [ ] CSP violations < 100 total
- [ ] No critical alerts fired
- [ ] User feedback channels monitored

**Evidence:**
```bash
evidence/first_2h_*.txt
```

---

### Hour 2-6 (High Alert)

**Focus:** Database performance, outbox processing, contract adherence

```bash
# Every 30 minutes
./scripts/snapshot-metrics.sh "hours_2_6"

# Database health check
psql $DATABASE_URL -c "SELECT * FROM backup_dashboard;"
psql $DATABASE_URL -c "SELECT * FROM check_backup_alerts();"

# Outbox health
curl http://localhost:4001/api/outbox/metrics
```

**Checks:**
- [ ] SLO burn rate (6h) < 2.0
- [ ] WAL archiving healthy (no failures)
- [ ] Outbox lag p50 < 2s, p99 < 10s
- [ ] Database query P95 < 50ms
- [ ] No slow queries (>5min)
- [ ] Contract spot checks PASS

**Contract Spot Check:**
```bash
# Run lightweight contract tests
pnpm test:contract:spot
```

**Evidence:**
```bash
evidence/hours_2_6_*.txt
evidence/contract_spot_*.txt
```

---

### Hour 6-12 (Sustained Load)

**Focus:** Peak traffic handling, memory stability, connection pooling

```bash
# Every hour
./scripts/snapshot-metrics.sh "hours_6_12"

# Resource check
docker stats --no-stream > evidence/docker_stats_h6_12.txt

# pgBouncer health
psql "postgresql://localhost:6432/spark_trading" -c "SHOW POOLS; SHOW STATS;" > evidence/pgbouncer_h6_12.txt
```

**Checks:**
- [ ] Memory usage stable (< 80%)
- [ ] CPU usage stable (< 70%)
- [ ] pgBouncer pool utilization < 80%
- [ ] No memory leaks detected
- [ ] Connection pool healthy
- [ ] No goroutine leaks (if applicable)

**Evidence:**
```bash
evidence/hours_6_12_*.txt
evidence/docker_stats_*.txt
```

---

### Hour 12-18 (Overnight - Low Traffic)

**Focus:** Background jobs, cleanup tasks, database maintenance

```bash
# Every 2 hours
./scripts/snapshot-metrics.sh "hours_12_18"

# Check background jobs
curl http://localhost:4001/api/jobs/status

# Check idempotency cleanup
curl http://localhost:4001/api/idempotency/metrics

# Check outbox cleanup
curl http://localhost:4001/api/outbox/metrics
```

**Checks:**
- [ ] Background jobs running
- [ ] Idempotency cleanup effective (TTL working)
- [ ] Outbox dispatcher healthy
- [ ] Database vacuum running (if scheduled)
- [ ] No stuck transactions
- [ ] Logs clean (no repeated errors)

**Evidence:**
```bash
evidence/hours_12_18_*.txt
evidence/jobs_status_*.txt
```

---

### Hour 18-24 (Morning Peak Prep)

**Focus:** Pre-peak readiness, final stability check

```bash
# Every hour
./scripts/snapshot-metrics.sh "hours_18_24"

# Final health check
curl http://localhost:4001/api/healthz | jq
curl http://localhost:3003/api/healthz | jq

# Metrics baseline
curl -s http://localhost:4001/api/public/metrics.prom > evidence/baseline_24h.txt
```

**Checks:**
- [ ] All services healthy
- [ ] Metrics returned to baseline
- [ ] No degradation over 24h
- [ ] SLO burn rate (24h) < 1.5
- [ ] Error budget consumption acceptable
- [ ] User feedback neutral/positive

**Evidence:**
```bash
evidence/hours_18_24_*.txt
evidence/baseline_24h.txt
```

---

## 🚨 Critical Metrics to Watch

### SLO Burn Rate

```promql
# 1-hour burn rate (check every 15 min)
(
  rate(http_requests_total{status=~"5.."}[1h]) / 
  rate(http_requests_total[1h])
) / 0.01  # SLO target 99%

# Should be < 2.0 (consuming budget at 2x normal rate)
```

**Alert Threshold:**
- 1h burn rate > 5.0 → CRITICAL (error budget exhausted in 5 hours)
- 6h burn rate > 2.0 → WARNING

### Database Health

```sql
-- Run every hour
SELECT 
    'WAL Archiving' as check,
    CASE 
        WHEN failed_count = 0 THEN 'OK'
        ELSE 'FAIL'
    END as status
FROM pg_stat_archiver
UNION ALL
SELECT 
    'Slow Queries' as check,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK'
        ELSE 'WARN'
    END as status
FROM pg_stat_activity
WHERE state = 'active' 
  AND query_start < now() - interval '5 minutes';
```

### Outbox Processing

```bash
# Check every 30 minutes
curl http://localhost:4001/api/outbox/metrics | jq '{
  pending: .pending,
  sent_last_hour: .sent_last_hour,
  failed_last_hour: .failed_last_hour,
  lag_seconds: .lag_seconds
}'
```

**Thresholds:**
- Pending < 1000
- Lag < 10s (p99)
- Failed rate < 1%

### Contract Compliance

```bash
# Run every 6 hours
pnpm test:contract:spot 2>&1 | tee evidence/contract_spot_$(date +%H).txt
```

**If fails:**
- Document breaking change
- Assess impact
- Consider rollback

---

## 📝 Hourly Log Template

```bash
# Create hourly log entry
cat > evidence/hourly_log_$(date +%Y%m%d_%H).txt << EOF
HOURLY CHECK - Hour $(date +%H)
================================
Timestamp: $(date -u)

Metrics:
- API P95: [XXX]ms
- Error Rate: [X.XX]%
- Database Connections: [XX]/[MAX]
- Memory Usage: [XX]%
- CPU Usage: [XX]%

Observations:
- [Note any anomalies]
- [User feedback]
- [Alert status]

Actions Taken:
- [Any interventions]

Status: ✅ PASS / ⚠️ WARN / ❌ FAIL
EOF
```

---

## 🔔 Alert Configuration

**Critical Alerts (Wake up on-call):**
```yaml
- SLO burn rate 1h > 5.0
- Error rate 5min > 5%
- API P95 > 1s for 5min
- Database down
- CSP violations > 200/min
```

**Warning Alerts (Monitor during business hours):**
```yaml
- SLO burn rate 6h > 2.0
- Error rate 15min > 2%
- API P95 > 400ms for 10min
- pgBouncer pool > 90%
- Outbox lag > 30s
```

---

## 📊 Dashboard Panels to Watch

**Grafana:** `deploy/grafana/dashboards/risk-idempotency-pitr.json`

**Top 5 Panels:**
1. **SLO Burn Rate** (RED if >5.0)
2. **API Latency Heatmap** (watch for spikes)
3. **Error Rate by Endpoint** (identify problem routes)
4. **Database Connection Pool** (watch for saturation)
5. **Outbox Processing Lag** (should stay < 10s)

---

## 🎯 Success Criteria (24h Complete)

**Deployment is stable if:**
- ✅ SLO burn rate < 1.5 over 24h
- ✅ No critical alerts fired
- ✅ Error rate < 1%
- ✅ API P95 < 200ms
- ✅ Database healthy (no issues)
- ✅ User feedback neutral/positive
- ✅ No rollbacks triggered

**Post-24h Actions:**
```bash
# Tag as stable
git tag -a v1.4.0-stable -m "24h stability confirmed"
git push origin v1.4.0-stable

# Generate stability report
cat > evidence/stability_report_24h.md << EOF
# 24-Hour Stability Report

Version: v1.4.0
Deployed: [Timestamp]
Stable: [Timestamp]

## Metrics Summary

- SLO Burn Rate: [X.X]
- Error Rate: [X.XX]%
- API P95 Latency: [XXX]ms
- Uptime: 99.XX%

## Issues Encountered

- [List any issues]

## Observations

- [Key learnings]

## Recommendations

- [Any improvements needed]

## Status

✅ STABLE - Ready for full production load
EOF
```

---

## 📞 Escalation

**If any critical metric fails:**
1. Execute rollback (if within 6h)
2. Notify team (#spark-incidents)
3. Create incident report
4. Schedule emergency fix

**Contacts:**
- On-call: [Phone]
- DevOps Lead: [Phone]
- CTO: [Phone]

---

## 🎓 Lessons Learned Template

```markdown
# First Night Lessons - v1.4.0

## What Went Well

- 
- 

## What Could Be Improved

- 
- 

## Action Items

- [ ] 
- [ ] 

## Metrics Highlights

- 
- 
```

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-prep  
**Owner:** DevOps Lead
