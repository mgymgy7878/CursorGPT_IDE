# GO/NO-GO Deployment Checklist

**Duration:** 10 minutes  
**Decision:** GO ✅ or NO-GO ❌

---

## ✅ 1. Artifacts & Documentation

**Requirement:** All validation artifacts present and signed

```bash
# Check artifacts
ls -la FINAL_VALIDATION_RESILIENCE_SUMMARY.txt
ls -la VALIDATION_AND_RESILIENCE_PACKAGE.md
ls -la docs/VALIDATION_SIGNOFF_CHECKLIST.md

# Verify signatures (if applicable)
grep "APPROVED FOR PRODUCTION" FINAL_VALIDATION_RESILIENCE_SUMMARY.txt
grep "Sign-off:" docs/VALIDATION_SIGNOFF_CHECKLIST.md
```

**Pass Criteria:**
- [ ] All 3 files exist
- [ ] Sign-off section completed
- [ ] Date within last 7 days
- [ ] Approved by: CTO, DevOps Lead, Product Owner

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 2. CI/CD Pipeline

**Requirement:** All CI checks GREEN within last 24 hours

```bash
# Check latest CI runs
gh run list --limit 5 --json conclusion,createdAt,name

# Expected: conclusion = "success" for all
```

**Pass Criteria:**
- [ ] `contract-chaos-tests.yml` - SUCCESS (< 24h)
- [ ] `headers-smoke.yml` - SUCCESS (< 24h)
- [ ] `database-drift-check.yml` - SUCCESS (< 24h)
- [ ] `test-workflow.yml` - SUCCESS (< 24h)
- [ ] No pending/failed runs

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 3. Test Coverage

**Requirement:** Coverage ≥ 95%, contract & chaos tests fresh

```bash
# Check test coverage
pnpm test:coverage | grep "All files"

# Check contract test timestamp
ls -lt pacts/ | head -n 5

# Check chaos test timestamp
ls -lt tests/chaos/ | grep ".test.ts"
```

**Pass Criteria:**
- [ ] Unit test coverage ≥ 95%
- [ ] Contract tests (Pact) ≤ 24h old
- [ ] Chaos tests (Toxiproxy) ≤ 24h old
- [ ] All tests PASS
- [ ] No skipped critical tests

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 4. Rollback Readiness

**Requirement:** Rollback plan tested within last 7 days

```bash
# Check runbook exists
ls -la scripts/runbook-db-restore.md

# Check PITR last test
psql $DATABASE_URL -c "SELECT * FROM backup_status;"

# Verify rollback script
cat scripts/rollback.sh
```

**Pass Criteria:**
- [ ] Runbook complete and reviewed
- [ ] PITR tested ≤ 7 days ago
- [ ] Rollback script tested in staging
- [ ] Database backup < 24h old
- [ ] Emergency contacts updated

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 5. Security Headers

**Requirement:** CSP/COEP/HSTS active, violation reporting working

```bash
# Check security headers
curl -I http://localhost:3003 | grep -E "Content-Security-Policy|Cross-Origin|Strict-Transport"

# Test CSP violation endpoint
curl -X POST http://localhost:3003/api/csp-report \
  -H "Content-Type: application/csp-report" \
  --data '{"csp-report":{"document-uri":"test","violated-directive":"test"}}'

# Expected: 204 No Content
```

**Pass Criteria:**
- [ ] CSP header present (nonce-based)
- [ ] COEP: require-corp
- [ ] COOP: same-origin
- [ ] HSTS: max-age ≥ 15552000 (6 months)
- [ ] CSP violation endpoint returns 204

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 6. Feature Flags

**Requirement:** Critical features can be disabled independently

```bash
# Check feature flags configuration
cat .env.production | grep -E "FEATURE_|ENABLE_"

# Verify flag service
curl http://localhost:4001/api/features/status
```

**Pass Criteria:**
- [ ] `FEATURE_OUTBOX` - toggleable
- [ ] `FEATURE_BIST` - toggleable
- [ ] `FEATURE_PAPER_TRADING` - toggleable
- [ ] `FEATURE_EXECUTION` - toggleable
- [ ] Flags respond within 100ms

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 7. Database Health

**Requirement:** Database metrics nominal, connections healthy

```bash
# Check database health
psql $DATABASE_URL -c "SELECT * FROM backup_dashboard;"
psql $DATABASE_URL -c "SELECT * FROM check_backup_alerts();"

# Check pgBouncer
psql "postgresql://localhost:6432/spark_trading" -c "SHOW POOLS;"
```

**Pass Criteria:**
- [ ] No backup alerts (CRITICAL/WARNING)
- [ ] WAL archiving active (no failures)
- [ ] pgBouncer pool utilization < 80%
- [ ] Database size growth < 10%/day
- [ ] No long-running queries (> 5min)

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 8. Monitoring & Alerts

**Requirement:** Grafana dashboard configured, alerts functional

```bash
# Check Grafana dashboard
curl -f http://localhost:3001/api/dashboards/uid/risk-idempotency-pitr

# Check alert rules
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.type=="alerting")'
```

**Pass Criteria:**
- [ ] Grafana dashboard accessible
- [ ] All 10 panels displaying data
- [ ] 5+ alert rules configured
- [ ] Alert notification channels tested
- [ ] No firing alerts

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 9. Baseline Metrics

**Requirement:** Current production metrics within acceptable ranges

```bash
# Capture baseline metrics
curl -s http://localhost:4001/api/public/metrics.prom > evidence/baseline_metrics.txt

# Check key metrics
grep -E "http_request_duration|error_rate|database_connections" evidence/baseline_metrics.txt
```

**Pass Criteria:**
- [ ] API P95 latency < 200ms
- [ ] Error rate < 1%
- [ ] Database connections < 80% capacity
- [ ] WebSocket staleness < 10s
- [ ] CPU/Memory < 70%

**Status:** ⬜ GO ⬜ NO-GO

---

## ✅ 10. Team Readiness

**Requirement:** On-call team notified, deployment window scheduled

```bash
# Check on-call schedule
cat .github/ONCALL_SCHEDULE.md

# Verify deployment window
date
```

**Pass Criteria:**
- [ ] On-call engineer identified and available
- [ ] Secondary on-call available
- [ ] Deployment window: Low traffic period
- [ ] No conflicting deployments
- [ ] Stakeholders notified (Slack #spark-deploys)

**Status:** ⬜ GO ⬜ NO-GO

---

## 🎯 Final Decision

**Total Checks:** 10  
**Passed:** ___/10  
**Failed:** ___/10

**Minimum Required:** 10/10 ✅

---

### ✅ GO Decision

**All checks PASS** → Proceed to Canary Deployment

```bash
# Record GO decision
cat > evidence/go_decision_$(date +%Y%m%d_%H%M%S).txt << EOF
GO/NO-GO Decision: GO ✅
Timestamp: $(date -u)
Approver: [Name]
Checks Passed: 10/10
Next Step: Canary Deployment (1% → 100%)
EOF
```

**Approved by:** ________________  
**Date:** ________________  
**Time:** ________________

---

### ❌ NO-GO Decision

**Any check FAILS** → Block deployment, investigate

```bash
# Record NO-GO decision
cat > evidence/no_go_decision_$(date +%Y%m%d_%H%M%S).txt << EOF
GO/NO-GO Decision: NO-GO ❌
Timestamp: $(date -u)
Reason: [Specific failed checks]
Action: [Investigation/Fix required]
Next Review: [Date/Time]
EOF
```

**Failed Checks:**
- 
- 

**Action Required:**
- 

**Next Review:** ________________

---

## 📋 Quick Reference

**Decision Matrix:**
- 10/10 PASS → ✅ GO
- 9/10 PASS → ⚠️ Review (CTO approval required)
- < 9/10 PASS → ❌ NO-GO

**Emergency Override:**
- Requires: CTO + 2 senior engineers approval
- Document: `evidence/emergency_override_[date].txt`
- Risk assessment: Required

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-prep  
**Owner:** DevOps Lead
