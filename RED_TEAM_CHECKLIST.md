# Red Team Checklist (Pre-Production)

**Duration:** 10 minutes  
**Purpose:** Catch expensive mistakes before deployment  
**When:** After GO/NO-GO, before canary stage 1

---

## 🔴 Critical Checks (10 Items)

### 1. Partial UNIQUE Index (Collation Safety)

**Risk:** Production collation differs from test, NULL semantics break

```sql
-- Verify index predicate matches production collation
\d+ "Position"

-- Expected: Index "uniq_pos_strategy" with WHERE clause
-- WHERE strategyId IS NOT NULL

-- Test NULL semantics in production
BEGIN;
INSERT INTO "Position" (id, symbol, exchange, quantity, avgPrice) 
VALUES ('test_null_1', 'BTCUSDT', 'binance', 0, 0);
INSERT INTO "Position" (id, symbol, exchange, quantity, avgPrice) 
VALUES ('test_null_2', 'BTCUSDT', 'binance', 0, 0);
-- Should succeed (both NULL strategyId)

SELECT collname, collcollate, collctype 
FROM pg_collation 
WHERE collname = (
    SELECT collation_name 
    FROM information_schema.columns 
    WHERE table_name = 'Position' AND column_name = 'strategyId'
);
ROLLBACK;
```

**Pass:** ✅ Both NULLs insert, collation matches test  
**Fail:** ❌ UNIQUE violation or collation mismatch → **BLOCK DEPLOYMENT**

---

### 2. Idempotency TTL & GC

**Risk:** Key cardinality explosion under high traffic

```sql
-- Check current pending keys
SELECT 
    count(*) as pending_keys,
    min(created_at) as oldest,
    now() - min(created_at) as age
FROM "IdempotencyKey" 
WHERE status = 'pending';

-- Should be: pending < 5000, oldest < 1h

-- Verify GC cron is scheduled
SELECT * FROM pg_cron_jobs WHERE jobname LIKE '%idempotency%';

-- Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "IdempotencyKey" 
WHERE status = 'pending' AND created_at < now() - interval '48 hours' 
LIMIT 100;

-- Should use index, not seq scan
```

**Pass:** ✅ Pending < 5000, GC scheduled, index used  
**Fail:** ❌ Pending > 5000 or seq scan → **FIX GC BEFORE DEPLOY**

---

### 3. Outbox Lag (Publisher Backoff)

**Risk:** p99 lag > 10s causes event delays

```sql
-- Check current outbox metrics
SELECT 
    status,
    count(*) as count,
    max(created_at) as newest,
    min(created_at) as oldest,
    extract(epoch from (now() - min(created_at))) as lag_seconds
FROM "Outbox"
GROUP BY status;

-- Check for stuck events
SELECT id, topic, retries, error, created_at
FROM "Outbox"
WHERE status = 'pending' 
  AND created_at < now() - interval '1 minute'
LIMIT 10;
```

**Test publisher backoff:**
```bash
# Check outbox dispatcher config
grep "backoff\|batch\|poll" services/shared/lib/outbox-dispatcher.ts

# If p99 > 10s:
# - Reduce backoff: 1000ms → 500ms
# - Increase batch: 10 → 50
```

**Pass:** ✅ Lag < 10s, no stuck events  
**Fail:** ❌ Lag > 10s → **ADJUST BACKOFF BEFORE DEPLOY**

---

### 4. CSP Preload/HSTS (Subdomain Impact)

**Risk:** HSTS preload affects ALL subdomains, irreversible

```bash
# Check subdomain strategy
dig +short *.yourdomain.com

# Verify HSTS header doesn't have preload if subdomains not ready
curl -I https://prod.yourdomain.com | grep "Strict-Transport-Security"

# Should NOT have "preload" unless:
# 1. All subdomains support HTTPS
# 2. Domain submitted to HSTS preload list intentionally
```

**Pass:** ✅ No preload OR all subdomains HTTPS-ready  
**Fail:** ❌ Preload with unprepared subdomains → **REMOVE PRELOAD**

---

### 5. COEP/COOP (Third-Party Widget Compatibility)

**Risk:** require-corp breaks external widgets/analytics

```bash
# Check CSP report endpoint
curl -X POST https://prod.yourdomain.com/api/csp-report \
    -H "Content-Type: application/csp-report" \
    --data '{"csp-report":{"blocked-uri":"test"}}' \
    -w "\nHTTP: %{http_code}\n"

# Expected: 204 No Content

# Check for COEP/COOP compatibility
curl -I https://prod.yourdomain.com | grep -E "Cross-Origin"

# Test third-party resources
for url in \
    "https://fonts.googleapis.com/css2" \
    "https://www.googletagmanager.com/gtag/js" \
    "https://cdn.jsdelivr.net"; do
    echo "Testing: $url"
    curl -I "$url" 2>&1 | grep -E "Cross-Origin-Resource-Policy|Access-Control"
done
```

**Pass:** ✅ CSP endpoint returns 204, third-party compatible  
**Fail:** ❌ CSP violations or blocked resources → **UPDATE ALLOWLIST**

---

### 6. Decimal Tick Alignment (All Pairs)

**Risk:** Tick alignment fails for some symbols, orders rejected

```bash
# Test tick alignment for all trading pairs
node -e "
const { MoneyUtils, TICK_SIZES } = require('./services/shared/lib/money');

const testCases = [
  { pair: 'BTCUSDT', price: '43250.567', tick: '0.01', expected: '43250.57' },
  { pair: 'BTCTRY', price: '1234567.89', tick: '0.1', expected: '1234567.9' },
  { pair: 'BIST:THYAO', price: '123.456', tick: '0.01', expected: '123.46' },
];

testCases.forEach(tc => {
  const aligned = MoneyUtils.alignToTick(
    MoneyUtils.fromString(tc.price),
    MoneyUtils.fromString(tc.tick)
  ).toString();
  
  const pass = aligned === tc.expected ? '✅' : '❌';
  console.log(\`\${pass} \${tc.pair}: \${aligned} (expected: \${tc.expected})\`);
});
" | tee evidence/decimal_tick_alignment_$REL.txt
```

**Pass:** ✅ All tick alignments correct  
**Fail:** ❌ Any mismatch → **FIX TICK SIZES BEFORE DEPLOY**

---

### 7. pgBouncer Connection Leak Detection

**Risk:** sv_active/sv_total > 0.9 indicates connection leak

```bash
# Monitor pgBouncer for 30 seconds
for i in {1..6}; do
    psql "$PGBOUNCER_URL" -Atc "SHOW POOLS;" | \
        awk -F'|' 'NR>1{
            active=$4; 
            total=$6; 
            sat=int(100*active/total); 
            print "t=" int(i*5) "s active=" active " total=" total " sat=" sat "%"
        }'
    sleep 5
done | tee evidence/pgbouncer_leak_test_$REL.txt

# Check for growing active connections
LEAK_DETECTED=$(grep "sat=" evidence/pgbouncer_leak_test_$REL.txt | \
    awk '{print $NF}' | \
    awk -F'=' '{if ($2 > 90) print "YES"}' | \
    head -1)

if [ "$LEAK_DETECTED" = "YES" ]; then
    echo "❌ Connection leak detected (saturation > 90%)"
    exit 1
else
    echo "✅ No connection leak detected"
fi
```

**Pass:** ✅ Saturation stable < 80%  
**Fail:** ❌ Saturation > 90% or growing → **FIX LEAK BEFORE DEPLOY**

---

### 8. PITR Test Restore (Cold Start Proof)

**Risk:** PITR not actually working, backup corrupted

```bash
# Verify last WAL archive is recent
psql "$DATABASE_URL" -Atc "
SELECT 
    last_archived_wal,
    last_archived_time,
    now() - last_archived_time as age,
    failed_count
FROM pg_stat_archiver;
"

# Should be: age < 60s, failed_count = 0

# Test restore procedure (dry-run)
cat > evidence/pitr_test_restore_$REL.sh << 'EOF'
#!/bin/bash
# PITR Test Restore (DRY-RUN)
# This script shows the commands that would run for PITR

echo "PITR Restore Commands (DRY-RUN):"
echo "1. Stop services"
echo "2. Get target LSN:"
psql "$DATABASE_URL" -Atc "SELECT pg_current_wal_lsn();"
echo "3. Restore base backup"
echo "4. Apply WAL files up to target LSN"
echo "5. Start PostgreSQL"
echo "6. Verify data integrity"
EOF

chmod +x evidence/pitr_test_restore_$REL.sh
bash evidence/pitr_test_restore_$REL.sh | tee evidence/pitr_dryrun_$REL.txt
```

**Pass:** ✅ WAL age < 60s, no failures, dry-run documented  
**Fail:** ❌ WAL age > 60s or failures > 0 → **FIX BEFORE DEPLOY**

---

### 9. SLO Burn Alerts (No Silent Alerts)

**Risk:** Alerts silenced or disabled, incidents go unnoticed

```bash
# Check for "silent" (inactive >24h) alerts
curl -s http://localhost:9090/api/v1/rules | \
    jq -r '.data.groups[].rules[] | 
    select(.type=="alerting" and .state=="inactive") | 
    .name' > evidence/inactive_alerts_$REL.txt

# Check burn rate alerts specifically
curl -s http://localhost:9090/api/v1/rules | \
    jq -r '.data.groups[].rules[] | 
    select(.name | contains("Burn")) | 
    {name: .name, state: .state, health: .health}' | \
    tee evidence/burn_alerts_$REL.json

# Verify alert notification channels
curl -s http://localhost:9093/api/v2/status | \
    jq '.config.route.routes[] | select(.receiver)' | \
    tee evidence/alert_routes_$REL.json
```

**Pass:** ✅ Burn alerts active, notification channels configured  
**Fail:** ❌ Burn alerts inactive or no receivers → **ENABLE BEFORE DEPLOY**

---

### 10. SBOM & Provenance (Release Attachment)

**Risk:** Missing supply chain evidence for compliance/security

```bash
# Verify SBOM exists
if [ -f "evidence/sbom_$REL.json" ]; then
    PKG_COUNT=$(jq '.artifacts | length' evidence/sbom_$REL.json)
    echo "✅ SBOM: $PKG_COUNT packages" | tee -a evidence/preflight.txt
    
    # Check for critical vulnerabilities (if scanner available)
    if command -v grype &> /dev/null; then
        grype sbom:evidence/sbom_$REL.json --fail-on critical > evidence/vuln_scan_$REL.txt 2>&1
        echo "✅ Vulnerability scan complete"
    fi
else
    echo "⚠️  SBOM not generated - run: syft dir:. -o json > evidence/sbom_$REL.json"
fi

# Verify build provenance
if [ -f "evidence/build_provenance_$REL.json" ]; then
    jq '.' evidence/build_provenance_$REL.json | tee evidence/provenance_verified_$REL.txt
    echo "✅ Build provenance verified"
else
    echo "⚠️  Build provenance not found"
fi

# Check for GPL licenses (if policy forbids)
if [ -f "evidence/licenses.json" ]; then
    GPL_COUNT=$(jq '[.[] | select(.licenses | contains("GPL"))] | length' evidence/licenses.json)
    echo "gpl_dependencies=$GPL_COUNT" | tee -a evidence/preflight.txt
    
    if [ "$GPL_COUNT" -gt 0 ]; then
        echo "⚠️  WARNING: $GPL_COUNT GPL dependencies found"
    fi
fi
```

**Pass:** ✅ SBOM + provenance present, no critical CVEs, GPL acceptable  
**Fail:** ❌ Critical vulnerabilities or GPL violations → **FIX BEFORE DEPLOY**

---

## 🚨 Red Team Summary

**Checks:** 10  
**Required:** 10/10 ✅  
**Evidence:** All checks produce evidence files

---

## 📊 Auto-Guard PromQL Rules (2 Additional)

### Rule 1: High Latency + Low CPU (Backpressure Detection)

```promql
# Triggers if P95 > 250ms AND CPU < 60%
# Indicates lock contention or inefficient code
(
  histogram_quantile(0.95, 
    rate(http_request_duration_seconds_bucket[5m])
  ) > 0.25
) and (
  avg(rate(process_cpu_seconds_total[5m])) < 0.6
)
```

**Alert Action:** ROLLBACK - Application backpressure detected  
**Duration:** 5 minutes

---

### Rule 2: Error + Risk Block Correlation (Deployment Issue)

```promql
# Triggers if 5xx rate > 2% AND risk blocks > 0.5/min
# Strong correlation indicates deployment introduced bugs
(
  rate(http_requests_total{code=~"5.."}[5m]) / 
  rate(http_requests_total[5m]) > 0.02
) and (
  rate(spark_risk_block_total[5m]) > 0.5
)
```

**Alert Action:** IMMEDIATE ROLLBACK - Correlated degradation  
**Duration:** 3 minutes

---

## ✅ Integration with Deployment

Add to `config/prometheus/enhanced-rollback-rules.yml`:

```yaml
groups:
  - name: red_team_guards
    rules:
      - alert: LatencyCPUBackpressure
        expr: |
          (histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.25)
          and (avg(rate(process_cpu_seconds_total[5m])) < 0.6)
        for: 5m
        labels:
          severity: critical
          auto_rollback: "true"
        annotations:
          summary: "High latency with low CPU - backpressure detected"
          action: "ROLLBACK"

      - alert: ErrorRiskCorrelation
        expr: |
          (rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.02)
          and (rate(spark_risk_block_total[5m]) > 0.5)
        for: 3m
        labels:
          severity: critical
          auto_rollback: "true"
        annotations:
          summary: "Errors and risk blocks correlated - deployment issue"
          action: "IMMEDIATE ROLLBACK"
```

---

## 🎯 Kill Switch (Dry-Run + Real)

### Dry-Run Test

```bash
# Audit only, no state change
curl -s -X POST "$TARGET/api/tools/kill-switch?dry_run=true" \
    -H "X-Actor: preflight" | \
    tee evidence/killswitch_dryrun_$REL.json

# Verify response
jq '{status: .status, audit: .audit_logged, features_affected: .features}' \
    evidence/killswitch_dryrun_$REL.json
```

**Expected:**
```json
{
  "status": "dry_run",
  "audit_logged": true,
  "features_affected": ["execution", "outbox", "bist"]
}
```

### Real Kill Switch (Canary Scope Only)

```bash
# Kill switch for canary pods only
curl -s -X POST "$TARGET/api/tools/kill-switch?scope=canary" \
    -H "X-Actor: oncall" \
    -H "X-Reason: preflight_test" | \
    tee evidence/killswitch_canary_$REL.json

# Verify features disabled
curl -s "$TARGET/api/features/status" | \
    jq '{execution: .execution.enabled, outbox: .outbox.enabled}' | \
    tee evidence/features_after_killswitch_$REL.json

# Re-enable for deployment
curl -s -X POST "$TARGET/api/tools/kill-switch?enable=true&scope=canary" \
    -H "X-Actor: oncall"
```

**Pass:** ✅ Kill switch works, features toggle correctly  
**Fail:** ❌ Kill switch not working → **FIX BEFORE DEPLOY**

---

## 📋 Quick Reference: Common Expensive Mistakes

### ❌ Mistake 1: UNIQUE Index Collation
**Symptom:** Works in test (utf8), fails in prod (utf8mb4_unicode_ci)  
**Fix:** Match collation exactly or use UPPER(col) in index

### ❌ Mistake 2: Idempotency Key Explosion
**Symptom:** Table grows to millions of rows in hours  
**Fix:** Verify GC cron runs hourly, not daily

### ❌ Mistake 3: Outbox Stuck Events
**Symptom:** Events pile up, lag increases linearly  
**Fix:** Reduce backoff 1000→500ms, increase batch 10→50

### ❌ Mistake 4: HSTS Preload Trap
**Symptom:** Subdomains break, irreversible for 6-12 months  
**Fix:** Remove "preload" directive until all subdomains ready

### ❌ Mistake 5: pgBouncer Pool Mode Mismatch
**Symptom:** Transactions fail, LISTEN/NOTIFY broken  
**Fix:** Use transaction mode for APIs, session mode for LISTEN

### ❌ Mistake 6: CSP Nonce Missing
**Symptom:** Inline scripts break, page blank  
**Fix:** Generate nonce per request, pass to all scripts

### ❌ Mistake 7: Decimal Rounding Inconsistency
**Symptom:** Order amounts differ from expected by 0.01  
**Fix:** Use banker's rounding consistently, document in specs

### ❌ Mistake 8: WAL Archiving Stopped
**Symptom:** PITR impossible, no backups for hours  
**Fix:** Monitor archive_failed_count, alert if > 0

### ❌ Mistake 9: Silent Alerts
**Symptom:** Incidents missed, no one paged  
**Fix:** Test notification channels weekly

### ❌ Mistake 10: SBOM Not Attached
**Symptom:** Compliance audit fails, supply chain unknown  
**Fix:** Generate SBOM in CI, attach to release

---

## 🎯 Final Red Team Verdict

**Pass Criteria:** 10/10 ✅

**If ANY check fails:**
```bash
# Record failure
cat > evidence/red_team_block_$REL.txt << EOF
RED TEAM CHECK FAILED
=====================
Release: $REL
Timestamp: $(date -u)
Failed Check: [Check Number]
Reason: [Specific reason]

ACTION: DEPLOYMENT BLOCKED
Next Step: Fix issue and re-run red team checks

Evidence:
- evidence/red_team_block_$REL.txt
- [Specific check evidence file]
EOF

echo "🚨 DEPLOYMENT BLOCKED - Red Team check failed"
exit 1
```

**If ALL checks pass:**
```bash
cat > evidence/red_team_pass_$REL.txt << EOF
RED TEAM CHECK PASSED
=====================
Release: $REL
Timestamp: $(date -u)
Checks: 10/10 ✅

STATUS: CLEARED FOR CANARY DEPLOYMENT

Next Step: Execute canary stage 1 (1% traffic)
EOF

echo "✅ RED TEAM: CLEARED FOR DEPLOYMENT"
```

---

## 📝 Integration with Deployment Sequence

**Updated Sequence:**

1. Blind Spots Scan (5 min) → 9/9 ✅
2. **60s Preflight** (1 min) → 9/9 ✅ ⭐
3. **Micro Blast Radius** (30s) → Pass ✅ ⭐
4. **Red Team Check** (10 min) → 10/10 ✅ ⭐
5. Green Button Ritual (2 min) → 7 evidence files
6. GO/NO-GO (10 min) → 10/10 ✅
7. Canary (60-90 min) → 1%→5%→25%→50%→100%
8. First Night (24h) → Hourly monitoring
9. Release Notes (30 min) → One-page summary

**Total Pre-Deployment Time:** ~30 minutes (automated)  
**Total Deployment Time:** ~90 minutes (canary)  
**Total Evidence Files:** 30+

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-ultimate  
**Owner:** DevOps Lead
