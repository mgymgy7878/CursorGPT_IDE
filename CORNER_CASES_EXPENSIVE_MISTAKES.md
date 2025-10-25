# Corner Cases & Expensive Mistakes (Red Team Extensions)

**Purpose:** Catch subtle bugs that only appear in production  
**When:** During red team check (T-10)  
**Impact:** High (can cause financial errors or data corruption)

---

## 🔴 1. Idempotency "Burst Replay"

**Risk:** Client generates 100 requests with same key (case variants, whitespace)

### Test

```bash
# Simulate burst replay
for i in {1..100}; do
    # Variations: case, whitespace, unicode
    KEY="test-key-$(printf '%03d' $((i % 10)))"
    curl -s -X POST http://localhost:4001/api/exec/order \
        -H "X-Idempotency-Key: $KEY" \
        -H "Content-Type: application/json" \
        -d '{"symbol":"BTCUSDT","side":"buy","quantity":0.01}' &
done
wait

# Check database
psql "$DATABASE_URL" -c "
SELECT key, count(*) as duplicates
FROM \"IdempotencyKey\"
WHERE key LIKE 'test-key-%'
GROUP BY key
HAVING count(*) > 1;
"

# Expected: 0 rows (all variants handled correctly)

# Check audit log
psql "$DATABASE_URL" -c "
SELECT count(DISTINCT key) as unique_keys,
       count(*) as total_requests
FROM \"IdempotencyKey\"
WHERE key LIKE 'test-key-%';
"

# Expected: unique_keys = 10, total_requests = 100
```

**Pass Criteria:**
- [ ] Only 1 execution per unique key
- [ ] All duplicates return 409 Retry-After
- [ ] Single audit entry per key
- [ ] No race conditions

**Evidence:**
```bash
evidence/idempotency_burst_test.txt
```

---

## 🔴 2. Decimal "Tick Drift"

**Risk:** Banker's rounding applied in calculation layer, not just reporting

### Test

```bash
# Test tick alignment across symbols
node -e "
const { MoneyUtils } = require('./services/shared/lib/money');

const symbols = [
  { name: 'BTCUSDT', tick: '0.01' },
  { name: 'ETHUSDT', tick: '0.01' },
  { name: 'BTCTRY', tick: '0.1' },
  { name: 'BIST:THYAO', tick: '0.01' },
  { name: 'FOREX:EURUSD', tick: '0.0001' },
];

symbols.forEach(sym => {
  const testPrice = '12345.6789';
  const aligned = MoneyUtils.alignToTick(
    MoneyUtils.fromString(testPrice),
    MoneyUtils.fromString(sym.tick)
  );
  
  console.log(\`\${sym.name} (tick=\${sym.tick}): \${testPrice} → \${aligned.toString()}\`);
});

// Test banker's rounding is ONLY in reporting layer
const calc = MoneyUtils.multiply(
  MoneyUtils.fromString('100.005'),
  MoneyUtils.fromString('10')
);
console.log('Calculation (no rounding): ' + calc.toString());
// Expected: 1000.05 (NOT 1000.0)

const display = MoneyUtils.formatForDisplay(calc, 2);
console.log('Display (banker rounding): ' + display);
// Expected: 1000.0 (rounded for display only)
" | tee evidence/decimal_tick_drift_test.txt
```

**Pass Criteria:**
- [ ] Tick alignment correct for all symbols
- [ ] Banker's rounding ONLY in formatForDisplay
- [ ] Calculations use full precision
- [ ] No rounding in MoneyUtils core operations

**Evidence:**
```bash
evidence/decimal_tick_drift_test.txt
```

---

## 🔴 3. Outbox "Clock Skew"

**Risk:** Producer NTP drift causes lag graph "teeth", dispatch uses producer timestamp

### Test

```sql
-- Check for clock skew between producer and dispatcher
SELECT 
    id,
    topic,
    extract(epoch from created_at) as producer_ts,
    extract(epoch from now()) as dispatcher_ts,
    extract(epoch from now() - created_at) as apparent_lag,
    CASE 
        WHEN abs(extract(epoch from now() - created_at)) > 3 THEN 'SKEW'
        ELSE 'OK'
    END as status
FROM "Outbox"
WHERE status = 'pending'
  AND created_at > now() - interval '1 minute'
ORDER BY created_at DESC
LIMIT 20;
```

**Fix in Code:**
```typescript
// Use current time, not payload timestamp
async processEvent(event: OutboxEvent) {
  const dispatchTime = Date.now(); // Use dispatcher's clock
  const createdTime = event.createdAt.getTime(); // Producer's clock
  
  // Record both for skew detection
  outboxProducerTimestamp.set(createdTime / 1000);
  outboxDispatcherTimestamp.set(dispatchTime / 1000);
  
  // Calculate lag using dispatcher's clock
  const lagSeconds = (dispatchTime - createdTime) / 1000;
  outboxLagHistogram.observe(Math.abs(lagSeconds));
}
```

**Pass Criteria:**
- [ ] Clock skew < 3s
- [ ] Lag graph smooth (no "teeth")
- [ ] Dispatcher uses own clock for lag calculation
- [ ] Both timestamps recorded for skew detection

**Evidence:**
```bash
evidence/outbox_clock_skew_test.txt
```

---

## 🔴 4. CSP Report Endpoint Flood

**Risk:** If report-to endpoint returns 5xx, no fallback, logs flood

### Test

```bash
# Simulate CSP violation flood
for i in {1..100}; do
    curl -s -X POST http://localhost:3003/api/csp-report \
        -H "Content-Type: application/csp-report" \
        --data "{\"csp-report\":{\"blocked-uri\":\"test-$i\"}}" &
done
wait

# Check endpoint response
curl -i -X POST http://localhost:3003/api/csp-report \
    -H "Content-Type: application/csp-report" \
    --data '{"csp-report":{"blocked-uri":"test"}}'

# Expected: 204 No Content (fast response)

# Check for rate limiting
grep "csp-report" /var/log/nginx/access.log | tail -20
# Should show rate limiting if configured

# Check logs don't flood
wc -l evidence/csp_reports.log
# Should have limit (e.g., max 1000 entries, rotate)
```

**Fix in NGINX:**
```nginx
# Add rate limiting to CSP report endpoint
location /api/csp-report {
    limit_req zone=csp_reports burst=20 nodelay;
    proxy_pass http://backend;
}

# In http block:
limit_req_zone $binary_remote_addr zone=csp_reports:10m rate=10r/s;
```

**Pass Criteria:**
- [ ] Endpoint returns 204 under load
- [ ] Rate limiting active (429 after burst)
- [ ] Logs don't flood (rotation/limit configured)
- [ ] Fallback configured (if report-to fails)

**Evidence:**
```bash
evidence/csp_flood_test.txt
```

---

## 🔴 5. SBOM Restrictive License

**Risk:** Canary pod image includes new copyleft dependency

### Test

```bash
# Generate SBOM for canary image
syft dir:. -o json > evidence/sbom_canary_v1.4.0.json

# Check for GPL/AGPL licenses
jq -r '.artifacts[] | 
    select(.licenses[]? | contains("GPL") or contains("AGPL")) | 
    {name: .name, version: .version, licenses: .licenses}' \
    evidence/sbom_canary_v1.4.0.json | \
    tee evidence/sbom_restrictive_licenses.json

# Compare with baseline
diff <(jq -r '.artifacts[].name' evidence/sbom_v1.3.1.json | sort) \
     <(jq -r '.artifacts[].name' evidence/sbom_canary_v1.4.0.json | sort) \
     > evidence/sbom_diff_v1.4.0.txt

# Check for new GPL dependencies
grep "^>" evidence/sbom_diff_v1.4.0.txt | \
    xargs -I{} grep {} evidence/sbom_restrictive_licenses.json
```

**Pass Criteria:**
- [ ] No new GPL/AGPL dependencies
- [ ] All dependencies license-compliant
- [ ] SBOM diff reviewed
- [ ] License risk documented in release notes

**If GPL Found:**
```markdown
## Remaining Risks

### Risk 1: GPL Dependency Introduced

**Description:** Package X (GPL-3.0) added in v1.4.0
**Likelihood:** Low
**Impact:** High (legal compliance)
**Owner:** Legal Team
**Due Date:** 2024-11-01
**Mitigation:**
1. Review GPL terms for compatibility
2. Consider alternative package
3. Legal review if distribution planned
**Status:** 🟡 In Progress
```

**Evidence:**
```bash
evidence/sbom_restrictive_licenses.json
evidence/sbom_diff_v1.4.0.txt
```

---

## 🧪 PostgreSQL Bloat Preflight Check

**Add to 60s-preflight.sh:**

```bash
# Check dead tuples (auto-vacuum health)
echo "[10/10] 🗄️ PostgreSQL Bloat..."
psql "$DATABASE_URL" -Atc "
SELECT relname, 
       round(n_dead_tup::numeric/1e6, 2) || 'M' as dead_tuples
FROM pg_stat_user_tables 
ORDER BY n_dead_tup DESC 
LIMIT 5;
" | tee evidence/pg_dead_tuples_top5.txt

# Check auto-vacuum settings
psql "$DATABASE_URL" -Atc "
SHOW autovacuum_work_mem;
SHOW maintenance_work_mem;
" | tee evidence/pg_autovacuum_mem.txt

echo "✅ Bloat checked"
```

---

## 📋 Complete Preflight Checklist (Enhanced to 10)

Original 9 + PostgreSQL Bloat = **10 total**

1. Identity & Time Seal ✅
2. Time Drift (NTP/DB) ✅
3. pgBouncer Saturation ✅
4. Prisma Migration ✅
5. CSP/COEP Headers ✅
6. Sequence Anomalies ✅
7. Feature Flags ✅
8. Prometheus Targets ✅
9. Baseline Metrics ✅
10. **PostgreSQL Bloat** ⭐

---

## 🎯 Artifact Completeness Check

**Single Command:**

```bash
REQ=32
FOUND=$(grep -c '✅' DEPLOYMENT_ARTIFACTS_INDEX.md 2>/dev/null || echo 0)

printf "artifacts_required=%d found=%d\n" $REQ $FOUND | \
    tee evidence/artifact_count.txt

if [ "$FOUND" -ge "$REQ" ]; then
    echo "✅ Artifact completeness: $FOUND/$REQ"
else
    echo "🚨 Missing artifacts: $((REQ - FOUND))"
    exit 1
fi
```

**Evidence:**
```bash
evidence/artifact_count.txt
```

---

## 📝 Release Note Success Criteria (One-Line)

**Copy-Paste to Release Notes:**

```markdown
## Deployment Summary

**Canary Deployment:** 1% → 100% (5 stages, 75 minutes)

**Success Criteria:** ✅ ALL PASS
- 0 rollbacks
- P95 latency ≤ 200ms
- 5xx error rate ≤ 1%
- WebSocket staleness P95 ≤ 30s
- Idempotency conflicts ≤ 1%
- CSP violations ≤ baseline+10%
- Event loop lag P95 ≤ 50ms ⭐
- GC pause avg ≤ 20ms ⭐

**Health Summary:**
"v1.4.0 canary: 1%→100% tüm aşamalar 6/6 metrik geçer; rollback=0; 
p95=~140ms, 5xx=0.3%, ws_stale_p95=11s, risk_block=0.1/min, 
idemp_conflict=0.2%, csp_viol=baseline+4%; event-loop p95=12ms, 
GC avg=8ms."
```

---

## 🚨 War-Room Minute Template

```
Time | Stage | Metrics | Decision | Notes
-----|-------|---------|----------|-------
:00  | 1 (1%)  | p95=142ms 5xx=0.2% ws=8s idemp=0.1% csp=3 eloop=12ms gc=8ms | 6/6 PASS | IC: Proceed
:15  | 2 (5%)  | p95=145ms 5xx=0.3% ws=9s idemp=0.2% csp=4 eloop=15ms gc=10ms | 6/6 PASS | IC: Proceed
:30  | 3 (25%) | p95=148ms 5xx=0.3% ws=11s idemp=0.2% csp=5 eloop=18ms gc=12ms | 6/6 PASS | IC: Proceed
:45  | 4 (50%) | p95=152ms 5xx=0.4% ws=12s idemp=0.3% csp=6 eloop=20ms gc=14ms | 6/6 PASS | IC: Proceed
:60  | 5 (100%) | p95=156ms 5xx=0.4% ws=13s idemp=0.3% csp=7 eloop=22ms gc=16ms | 6/6 PASS | IC: Complete
```

---

## 🎯 Golden Signals (6 + 2 Enriched = 8 Total)

**Standard (6):**
1. API P95 latency
2. 5xx error rate
3. WebSocket staleness
4. Risk block rate
5. Idempotency conflicts
6. CSP violations

**Enriched (2) ⭐:**
7. **Event loop lag P95** (backpressure indicator)
8. **GC pause average** (memory pressure indicator)

---

## 📊 Bloat Controls (Preflight + Monitoring)

### Preflight Check

```sql
-- Dead tuples check
SELECT relname, n_dead_tup, n_live_tup,
       round(100.0 * n_dead_tup / NULLIF(n_live_tup, 0), 2) as bloat_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 100000
ORDER BY n_dead_tup DESC;

-- Auto-vacuum settings
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;
SHOW autovacuum_naptime;
```

### Monitoring Alert

```promql
# Dead tuple ratio > 20%
(
  pg_stat_user_tables_n_dead_tup / 
  (pg_stat_user_tables_n_live_tup + 1)
) > 0.20
```

---

## 🔍 Connection Creep Detection (Enhanced)

```promql
# Connections growing + already high utilization
(
  deriv(pgbouncer_pools_server_active[5m]) > 5
) and (
  pgbouncer_pools_server_active / pgbouncer_pools_server_total > 0.70
)

# Action: ROLLBACK after 3 minutes
```

**Monitoring:**
```bash
# Watch connection growth in real-time
watch -n 10 'psql "$PGBOUNCER_URL" -Atc "SHOW POOLS;" | \
    awk -F"|" "{print \$4 \"/\" \$6 \" = \" int(100*\$4/\$6) \"%\"}"'
```

---

## 📁 Evidence Requirements

**Each Corner Case Must Produce:**
- Test execution log
- Pass/fail result
- Metric snapshots
- Recommendation (if failed)

**Example:**
```
evidence/
├── idempotency_burst_test.txt          # Burst replay test
├── decimal_tick_drift_test.txt         # Tick alignment
├── outbox_clock_skew_test.txt          # Clock skew
├── csp_flood_test.txt                  # CSP endpoint flood
├── sbom_restrictive_licenses.json      # License check
├── pg_dead_tuples_top5.txt             # Bloat check
└── connection_creep_monitor.txt        # Connection monitoring
```

---

## 🎯 Integration with Red Team Checklist

**Enhanced Red Team (Original 10 + 5 Corner Cases = 15 Total):**

1-10. Original Red Team Checks ✅

**Corner Cases (11-15):**
11. **Idempotency Burst Replay** ⭐
12. **Decimal Tick Drift** ⭐
13. **Outbox Clock Skew** ⭐
14. **CSP Report Flood** ⭐
15. **SBOM License Drift** ⭐

---

## 🚨 BIST Market Hours Awareness

**BIST Trading Hours:** 09:30-18:00 Istanbul Time

**Deployment Windows:**
- **Preferred:** Weekend (Saturday/Sunday)
- **Acceptable:** Weekday 06:00-09:00 or 19:00-22:00
- **Avoid:** During market hours (09:30-18:00)
- **Emergency:** Any time (stability > trading hours)

**DST Transition Weeks:**
- **Restriction:** Morning window only (06:00-10:00)
- **Reason:** Time confusion minimization
- **Coordination:** Notify BIST operations team

---

## 📄 One-Page Release Note Template (Final)

```markdown
# Release v1.4.0 - Deployment Summary

**Canary Timeline:** T-30 to T+24h  
**Stages:** 1% → 5% → 25% → 50% → 100%  
**Duration:** 75 minutes (canary) + 24h (monitoring)  
**Rollbacks:** 0  

**Health Summary:**
"v1.4.0 canary: 1%→100% tüm aşamalar 6/6 metrik geçer; rollback=0; 
p95=~140ms, 5xx=0.3%, ws_stale_p95=11s, risk_block=0.1/min, 
idemp_conflict=0.2%, csp_viol=baseline+4%; event-loop p95=12ms, 
GC avg=8ms."

**Success Criteria:** ✅ ALL PASS
- 0 rollbacks ✅
- P95 ≤ 200ms ✅ (actual: 140ms)
- 5xx ≤ 1% ✅ (actual: 0.3%)
- WS staleness ≤ 30s ✅ (actual: 11s)
- Idempotency ≤ 1% ✅ (actual: 0.2%)
- CSP ≤ baseline+10% ✅ (actual: baseline+4%)
- Event loop ≤ 50ms ✅ (actual: 12ms) ⭐
- GC pause ≤ 20ms ✅ (actual: 8ms) ⭐

**Remaining Risks:** 3 documented (see below)

**Evidence:** 50+ files in `evidence/` directory
```

---

## 🎓 Next Sprint Focus (v1.5 Radar)

**Deepen reliability visibility, not expand features:**

1. **Shadow Trading** + Error Budget Integration
   - Real feed + paper fills
   - Consistency drift metrics
   - Linked to SLO burn rate

2. **Supply-Chain Attestations** (Auto-Attach to Releases)
   - SBOM generation in CI
   - Signed provenance (Sigstore)
   - Vulnerability auto-scan
   - Attestation verification in deployment

3. **Performance Profiling** (Continuous)
   - Code-embedded latency marks
   - Pyroscope integration
   - Flame graph generation

4. **SLO Budget Panel** (Real-Time Visualization)
   - Error budget gauge
   - Burn rate dashboard
   - Freeze policy automation

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-ultimate  
**Owner:** Red Team Lead
