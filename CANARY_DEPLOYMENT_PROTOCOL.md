# Canary Deployment Protocol

**Duration:** 60-90 minutes (automatic monitoring)  
**Traffic Ramp:** 1% → 5% → 25% → 50% → 100%  
**Stage Duration:** 10-15 minutes per stage

---

## 🎯 Overview

Progressive traffic rollout with automatic health checks at each stage.

**Rollback Strategy:** Single-command rollback at any stage if metrics degrade.

---

## 📊 Traffic Stages

### Stage 1: 1% (Pilot - 15 minutes)

**Target:** Canary receives 1% of traffic  
**Objective:** Detect critical issues with minimal blast radius

```bash
# Set traffic weight
kubectl set image deployment/spark-trading-api api=spark-trading:v1.4.0 --record
kubectl scale deployment/spark-trading-api-canary --replicas=1
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="1"

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":1}'
```

**Pass Criteria:**
- [ ] API P95 < 200ms
- [ ] 5xx errors < 1%
- [ ] WebSocket staleness < 30s
- [ ] Risk block rate < 0.5%/min
- [ ] Idempotency conflicts < 1% of requests
- [ ] No CSP violations spike

**Evidence:**
```bash
# Snapshot metrics
curl -s http://localhost:4001/api/public/metrics.prom > evidence/rollout_stage_1.txt
gh run list --limit 1 > evidence/ci_stage_1.txt
```

**Duration:** 15 minutes

---

### Stage 2: 5% (Confidence Build - 15 minutes)

**Target:** Canary receives 5% of traffic  
**Objective:** Validate under increased load

```bash
# Increase traffic weight
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="5"

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":5}'
```

**Pass Criteria:**
- [ ] API P95 < 200ms
- [ ] 5xx errors < 1%
- [ ] Database connection pool < 70%
- [ ] Outbox lag < 5s (p50)
- [ ] Money utils operations error-free
- [ ] Position unique violations = 0

**Evidence:**
```bash
curl -s http://localhost:4001/api/public/metrics.prom > evidence/rollout_stage_5.txt
```

**Duration:** 15 minutes

---

### Stage 3: 25% (Quarter Traffic - 15 minutes)

**Target:** Canary receives 25% of traffic  
**Objective:** Validate under significant load

```bash
# Increase traffic weight
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="25"

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":25}'
```

**Pass Criteria:**
- [ ] API P95 < 200ms
- [ ] 5xx errors < 1%
- [ ] Database queries P95 < 50ms
- [ ] pgBouncer pool utilization < 80%
- [ ] BIST staleness < 60s
- [ ] Contract test spot checks PASS

**Evidence:**
```bash
curl -s http://localhost:4001/api/public/metrics.prom > evidence/rollout_stage_25.txt
pnpm test:contract:spot >> evidence/contract_spot_stage_25.txt
```

**Duration:** 15 minutes

---

### Stage 4: 50% (Half Traffic - 15 minutes)

**Target:** Canary receives 50% of traffic  
**Objective:** Validate at near-production scale

```bash
# Increase traffic weight
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="50"

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":50}'
```

**Pass Criteria:**
- [ ] API P95 < 200ms
- [ ] 5xx errors < 1%
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%
- [ ] WAL archiving healthy (no failures)
- [ ] Idempotency service responding < 10ms

**Evidence:**
```bash
curl -s http://localhost:4001/api/public/metrics.prom > evidence/rollout_stage_50.txt
psql $DATABASE_URL -c "SELECT * FROM backup_dashboard;" > evidence/db_stage_50.txt
```

**Duration:** 15 minutes

---

### Stage 5: 100% (Full Traffic - Monitoring)

**Target:** All traffic to new version  
**Objective:** Complete rollout, monitor stability

```bash
# Full traffic
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="100"
kubectl scale deployment/spark-trading-api-stable --replicas=0

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":100}'

# Remove canary annotation
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight-
```

**Pass Criteria:**
- [ ] All previous criteria maintained
- [ ] No degradation after 30 minutes
- [ ] Logs clean (no unexpected errors)
- [ ] User feedback neutral/positive

**Evidence:**
```bash
curl -s http://localhost:4001/api/public/metrics.prom > evidence/rollout_stage_100.txt
kubectl get pods -l app=spark-trading > evidence/pods_stage_100.txt
```

**Duration:** 30+ minutes (extended monitoring)

---

## 🚨 Automatic Rollback Triggers

**INSTANT ROLLBACK** if any of the following occur at ANY stage:

### Critical Triggers (No Grace Period)

```promql
# P95 latency spike
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.4

# High error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.03

# BIST staleness
spark_bist_staleness_seconds > 120 for 3m

# CSP violation storm
rate(csp_violations_total[1m]) > 50

# Idempotency conflict storm
rate(idempotency_conflict_total[5m]) / rate(http_requests_total[5m]) > 0.05

# pgBouncer saturation
pgbouncer_pools_server_active / pgbouncer_pools_server_total > 0.9 for 3m
```

### Warning Triggers (5-minute grace period)

```promql
# Elevated P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.25

# Elevated error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.015

# Database slow queries
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 0.1
```

---

## 🔄 Rollback Procedure

### Automatic Rollback (Triggered by Alerts)

```bash
# Rollback script (automatic)
./scripts/rollback.sh --reason="[Alert Name]" --stage="[Current Stage]"
```

### Manual Rollback

```bash
# Immediate rollback to stable
kubectl annotate ingress spark-trading nginx.ingress.kubernetes.io/canary-weight="0"
kubectl scale deployment/spark-trading-api-canary --replicas=0
kubectl scale deployment/spark-trading-api-stable --replicas=3

# Or with feature flag
curl -X POST http://localhost:4001/api/features/rollout \
  -d '{"feature":"v1.4.0","percentage":0}'

# Record rollback
cat > evidence/rollback_$(date +%Y%m%d_%H%M%S).txt << EOF
Rollback Executed: $(date -u)
Stage: [Current Stage]
Reason: [Reason]
Triggered By: [Manual/Automatic]
EOF
```

**Rollback Verification:**
```bash
# Verify stable version serving traffic
curl http://localhost:4001/api/healthz | jq '.version'

# Check metrics returned to baseline
curl -s http://localhost:4001/api/public/metrics.prom | grep "http_request_duration_seconds"
```

---

## 📊 Grafana Dashboard Monitoring

**Dashboard:** `deploy/grafana/dashboards/risk-idempotency-pitr.json`

**Key Panels to Watch:**
1. **HTTP P95 Latency** (should stay < 200ms)
2. **Error Rate** (should stay < 1%)
3. **pgBouncer Pool** (should stay < 80%)
4. **Idempotency Conflicts** (should stay < 1%)
5. **Risk Blocks** (should stay flat)
6. **CSP Violations** (should stay near 0)
7. **BIST Staleness** (should stay < 30s)
8. **Outbox Lag** (should stay < 5s)
9. **Database Connections** (should stay < 80%)
10. **WAL Archiving** (should show no failures)

**Alert Annotations:**
- Green: Stage progression
- Yellow: Warning trigger
- Red: Rollback triggered

---

## 📝 Evidence Collection (Automatic)

```bash
# Run at each stage
./scripts/snapshot-metrics.sh [stage]

# Generates:
# - evidence/rollout_stage_[1,5,25,50,100].txt
# - evidence/grafana_screenshot_[stage].png
# - evidence/logs_[stage].txt
```

---

## 🎯 Success Criteria (All Stages)

**Deployment is successful if:**
- ✅ All 5 stages completed without rollback
- ✅ All pass criteria met at each stage
- ✅ No critical alerts fired
- ✅ Evidence collected at each stage
- ✅ Final stage stable for 30+ minutes

**Post-Deployment Actions:**
```bash
# Tag successful deployment
git tag -a v1.4.0 -m "Canary deployment successful"
git push origin v1.4.0

# Record success
cat > evidence/canary_success_$(date +%Y%m%d_%H%M%S).txt << EOF
Canary Deployment: SUCCESS ✅
Version: v1.4.0
Started: [Timestamp]
Completed: [Timestamp]
Duration: [Minutes]
Stages: 5/5 PASS
Rollbacks: 0
Evidence: evidence/rollout_stage_*.txt
EOF
```

---

## 🚨 Incident Response

**If rollback occurs:**
1. Execute rollback procedure (automatic or manual)
2. Collect logs and metrics
3. Create incident report
4. Notify stakeholders
5. Schedule post-mortem

**Incident Template:** `.github/INCIDENT_TEMPLATE.md`

---

## 📞 Escalation Path

**Level 1 (0-15 min):** On-call engineer handles rollback  
**Level 2 (15-30 min):** DevOps Lead + CTO notified  
**Level 3 (30+ min):** Full team召集, war room

**Communication:**
- Slack: `#spark-incidents`
- PagerDuty: Auto-escalation
- Status page: Update within 5 minutes

---

## 🎓 Training Checklist

**Before first canary deployment:**
- [ ] All team members trained on protocol
- [ ] Rollback procedure practiced in staging
- [ ] Grafana dashboard reviewed
- [ ] Alert triggers tested
- [ ] Evidence collection automated

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-prep  
**Owner:** DevOps Lead
