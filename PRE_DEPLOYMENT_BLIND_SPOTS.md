# Pre-Deployment Blind Spots Scan

**Duration:** 5 minutes  
**When:** Immediately before pressing GO button  
**Purpose:** Catch edge cases missed by standard checks

---

## ⏰ 1. Time & Sequence Numbers

**Why:** Clock drift causes auth failures, sequence anomalies indicate data corruption

```bash
# NTP drift check
ntpq -p | grep "^\*" | awk '{print $9}'
# Expected: offset < 100ms

# Node vs Database time
node -e "console.log(new Date().toISOString())" && \
psql $DATABASE_URL -c "SELECT now();"
# Expected: difference < 250ms

# Sequence anomalies
psql $DATABASE_URL -c "
SELECT 
    sequence_name,
    last_value,
    CASE 
        WHEN last_value > 1000000 THEN 'WARN: High usage'
        WHEN last_value < 0 THEN 'ERROR: Negative value'
        ELSE 'OK'
    END as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY last_value DESC;
"
```

**Pass Criteria:**
- [ ] NTP offset < 100ms
- [ ] Node/DB time diff < 250ms
- [ ] No negative sequence values
- [ ] No unexpected sequence jumps

**Evidence:**
```bash
evidence/time_sequence_check_$(date +%Y%m%d_%H%M%S).txt
```

---

## 🗄️ 2. Prisma Migrate Status

**Why:** Unapplied migrations cause runtime errors, shadow DB in prod is dangerous

```bash
# Migration status
pnpm prisma migrate status 2>&1 | tee evidence/migrate_status.txt

# Expected output: "Database schema is up to date!"

# Verify no shadow DB in production
cat .env.production | grep -i shadow
# Expected: No matches (or commented out)

# Check for pending migrations
pnpm prisma migrate status | grep "pending"
# Expected: No matches
```

**Pass Criteria:**
- [ ] "Database schema is up to date!"
- [ ] No pending migrations
- [ ] Shadow DB disabled in production
- [ ] No migration warnings

**Evidence:**
```bash
evidence/migrate_status.txt
```

---

## 🔄 3. pgBouncer Pool Mode

**Why:** Wrong pool mode causes connection leaks or transaction failures

```bash
# Check pgBouncer configuration
grep "pool_mode" deploy/postgres/pgbouncer.conf
# Expected: pool_mode = transaction

# Verify no long-running queries that need session mode
psql $DATABASE_URL -c "
SELECT 
    pid,
    now() - query_start as duration,
    state,
    query
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
  AND now() - query_start > interval '1 minute'
ORDER BY duration DESC;
"
# Expected: Empty (no long-running queries)

# Check for LISTEN/NOTIFY usage
psql $DATABASE_URL -c "
SELECT 
    datname,
    count(*) as listeners
FROM pg_stat_activity
WHERE wait_event = 'ClientRead'
  AND query LIKE 'LISTEN%'
GROUP BY datname;
"
# Expected: Empty (or dedicated session pool configured)
```

**Pass Criteria:**
- [ ] Pool mode = transaction
- [ ] No long-running queries (>1 min)
- [ ] LISTEN/NOTIFY in dedicated pool (if used)
- [ ] Connection pool settings match load

**Evidence:**
```bash
evidence/pgbouncer_config_check.txt
```

---

## 💰 4. Decimal Behavior

**Why:** Wrong rounding breaks financial calculations, tick misalignment rejects orders

```bash
# Test decimal precision
node -e "
const { MoneyUtils } = require('./services/shared/lib/money');
const tests = [
  { desc: 'Banker rounding 2.5', val: '2.5', places: 0, expected: '2' },
  { desc: 'Banker rounding 3.5', val: '3.5', places: 0, expected: '4' },
  { desc: 'Tick alignment', val: '123.4567', tick: '0.01', expected: '123.46' },
];

tests.forEach(t => {
  let result;
  if (t.tick) {
    result = MoneyUtils.alignToTick(
      MoneyUtils.fromString(t.val),
      MoneyUtils.fromString(t.tick)
    ).toString();
  } else {
    result = MoneyUtils.roundToPlaces(
      MoneyUtils.fromString(t.val),
      t.places
    ).toString();
  }
  const pass = result === t.expected ? '✅' : '❌';
  console.log(\`\${pass} \${t.desc}: \${result} (expected: \${t.expected})\`);
});
" | tee evidence/decimal_behavior_test.txt
```

**Pass Criteria:**
- [ ] Banker's rounding works correctly
- [ ] Tick alignment matches exchange requirements
- [ ] No floating-point errors
- [ ] All decimal tests pass

**Evidence:**
```bash
evidence/decimal_behavior_test.txt
```

---

## 🔒 5. CSP/COOP/COEP Side Effects

**Why:** Isolation headers break third-party scripts, missing allowlist causes blank pages

```bash
# Check third-party resources in allowlist
curl -I http://localhost:3003 | grep "Content-Security-Policy"

# Expected third-party domains in CSP:
# - fonts.googleapis.com
# - cdnjs.cloudflare.com
# - etc.

# Test CSP report endpoint
curl -X POST http://localhost:3003/api/csp-report \
  -H "Content-Type: application/csp-report" \
  --data '{"csp-report":{"blocked-uri":"test"}}' \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP Status: 204

# Check crossOriginIsolated requirement
grep -r "crossOriginIsolated" apps/web-next/src/
# Document any features requiring isolation

# Verify COEP/COOP don't break embeddings
curl -I http://localhost:3003 | grep -E "Cross-Origin"
```

**Pass Criteria:**
- [ ] All third-party resources in CSP allowlist
- [ ] CSP report endpoint returns 204
- [ ] COEP/COOP don't break required features
- [ ] SharedArrayBuffer works (if needed)

**Evidence:**
```bash
evidence/csp_allowlist_check.txt
```

---

## 📊 6. Prometheus/Grafana

**Why:** Missing variables break dashboards, wrong scrape targets lose metrics

```bash
# Check Grafana dashboard variables
curl -s http://localhost:3001/api/dashboards/uid/risk-idempotency-pitr | \
  jq '.dashboard.templating.list[] | {name: .name, default: .current.value}'

# Expected: All variables have default values

# Verify Prometheus scrape targets
curl -s http://localhost:9090/api/v1/targets | \
  jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Count expected vs actual targets
curl -s http://localhost:9090/api/v1/targets | \
  jq '.data.activeTargets | length'
# Expected: Match configured target count
```

**Pass Criteria:**
- [ ] All dashboard variables have defaults
- [ ] Scrape target count matches expected
- [ ] All targets are "up"
- [ ] No stale metrics (check last_scrape)

**Evidence:**
```bash
evidence/prometheus_grafana_check.txt
```

---

## 🚩 7. Feature Flag Defaults

**Why:** Undefined defaults cause unpredictable behavior, wrong initial state breaks deploy

```bash
# Check feature flag configuration
cat .env.production | grep -E "FEATURE_|ENABLE_"

# Expected flags with explicit values:
# FEATURE_OUTBOX=false
# FEATURE_BIST=false
# FEATURE_PAPER_TRADING=true
# FEATURE_EXECUTION=false (canary start)

# Verify flag service responds
curl http://localhost:4001/api/features/status | jq '.'

# Check flag defaults in code
grep -r "FEATURE_" apps/ services/ | grep "process.env" | head -20
```

**Pass Criteria:**
- [ ] All critical features have explicit defaults
- [ ] Flag service responds correctly
- [ ] No undefined flag references
- [ ] Canary-safe initial state (conservative defaults)

**Evidence:**
```bash
evidence/feature_flags_check.txt
```

---

## 🚨 8. SLO Burn Alerts

**Why:** Silent alerts miss incidents, wrong thresholds cause alert fatigue

```bash
# Check alert rules are enabled
curl -s http://localhost:9090/api/v1/rules | \
  jq '.data.groups[].rules[] | select(.type=="alerting") | {name: .name, state: .state}'

# Verify burn rate alerts exist
curl -s http://localhost:9090/api/v1/rules | \
  jq '.data.groups[].rules[] | select(.name | contains("Burn")) | .name'

# Expected alerts:
# - SLOBurnRate1h
# - SLOBurnRate6h

# Check for silent alerts (state = "inactive" for >24h)
curl -s http://localhost:9090/api/v1/rules | \
  jq '.data.groups[].rules[] | select(.type=="alerting" and .state=="inactive")'
```

**Pass Criteria:**
- [ ] 1h burn rate alert enabled
- [ ] 6h burn rate alert enabled
- [ ] No permanently inactive alerts
- [ ] Alert thresholds match SLO targets

**Evidence:**
```bash
evidence/slo_alerts_check.txt
```

---

## 📦 9. SBOM & Provenance

**Why:** Supply chain attacks, compliance requirements, audit trail

```bash
# Generate SBOM (if not already generated)
if command -v syft &> /dev/null; then
    syft dir:. -o json > evidence/sbom_v1.4.0.json
    echo "✅ SBOM generated"
else
    echo "⚠️  syft not installed - SBOM generation skipped"
fi

# Verify build provenance
if [ -f "evidence/build_provenance.json" ]; then
    cat evidence/build_provenance.json | jq '.builder, .metadata.buildStartedOn'
    echo "✅ Build provenance verified"
else
    echo "⚠️  Build provenance not found"
fi

# Check dependency licenses
if command -v license-checker &> /dev/null; then
    pnpm license-checker --json > evidence/licenses.json
    echo "✅ License check complete"
fi
```

**Pass Criteria:**
- [ ] SBOM generated (or generation attempted)
- [ ] Build provenance recorded
- [ ] No GPL dependencies (if policy forbids)
- [ ] Known vulnerabilities checked

**Evidence:**
```bash
evidence/sbom_v1.4.0.json
evidence/licenses.json
```

---

## ✅ Final Checklist

| Check | Status | Notes |
|-------|--------|-------|
| 1. Time & Sequences | ⬜ | |
| 2. Prisma Migrate | ⬜ | |
| 3. pgBouncer Mode | ⬜ | |
| 4. Decimal Behavior | ⬜ | |
| 5. CSP/COOP/COEP | ⬜ | |
| 6. Prometheus/Grafana | ⬜ | |
| 7. Feature Flags | ⬜ | |
| 8. SLO Alerts | ⬜ | |
| 9. SBOM & Provenance | ⬜ | |

**Required:** 9/9 ✅

---

## 🚨 Common Pitfalls

**1. UNIQUE Partial Index:**
```sql
-- Test null semantics in production collation
BEGIN;
INSERT INTO "Position" (id, symbol, exchange, quantity, avgPrice) 
VALUES ('test1', 'BTCUSDT', 'binance', 0, 0);
INSERT INTO "Position" (id, symbol, exchange, quantity, avgPrice) 
VALUES ('test2', 'BTCUSDT', 'binance', 0, 0);
-- Should succeed (both have NULL strategyId)
ROLLBACK;
```

**2. Idempotency TTL:**
```bash
# Monitor key cardinality
watch -n 60 'psql $DATABASE_URL -c "SELECT count(*) FROM \"IdempotencyKey\" WHERE status='\''pending'\'';"'
# Should stay < 1000 under normal load
```

**3. Outbox Lag:**
```bash
# Check p99 processing time
curl http://localhost:4001/api/outbox/metrics | jq '.lag_p99_seconds'
# If > 10s, reduce backoff or increase workers
```

**4. CSP/HSTS Preload:**
```bash
# Verify subdomain strategy
dig +short *.yourdomain.com
# All subdomains should support HTTPS
```

**5. pgBouncer Health:**
```bash
# Watch for connection leaks
watch -n 30 'psql "postgresql://localhost:6432/spark_trading" -c "SHOW POOLS;"'
# sv_active/sv_total should stay < 0.9
```

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-prep  
**Owner:** DevOps Lead
