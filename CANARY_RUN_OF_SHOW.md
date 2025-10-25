# Canary Run-of-Show (Operasyon Ritüeli)

**Purpose:** T-minus countdown + war-room protocol + freeze window  
**Timeline:** T-30 to T+24h  
**BIST-Aware:** No schema changes during market hours

---

## ⏰ T-Minus Countdown

### T-30 (30 minutes before canary)

**Action:** Freeze window starts

```bash
# Label pending PRs as on-hold
gh pr list --state open | while read pr; do
    gh pr edit $pr --add-label "hold-for-canary"
done

# Record freeze start
cat > evidence/freeze_window_start.txt << EOF
FREEZE WINDOW START
===================
Timestamp: $(date -u +%FT%TZ)
Release: v1.4.0
PRs on hold: $(gh pr list --label "hold-for-canary" --json number -q 'length')
Next deployment window: After canary + 24h monitoring

Allowed changes during freeze:
  • Hotfixes (critical bugs only)
  • Canary rollback
  • Monitoring adjustments
EOF

echo "🔒 Change freeze activated"
```

**Communication:**
- Slack: `#spark-deploys` - "🔒 Freeze window open for v1.4.0 canary"
- Status: "🟡 Deployment in progress"

---

### T-20 (20 minutes before canary)

**Action:** War-room activation

```bash
# Create war-room channel (if not exists)
# Slack: #spark-warroom-v140

# Set pager rotation to "yellow" mode
# On-call: High alert, 5-minute SLA
```

**War-Room Rules:**
- **Signal-only:** Graphs, metrics, evidence
- **No theory/opinion** in main thread → "parking lot" note
- **Single decision-maker:** Incident Commander (IC)
- **Minute format:** "Observation → Metric → Decision"

**War-Room Template:**
```
:00 | Stage 1 (1%) start | p95=XXms 5xx=X% ws=XXs | IC: Proceed
:15 | Stage 1 complete   | 6/6 metrics PASS | IC: Proceed to Stage 2
:20 | Stage 2 (5%) start | p95=XXms 5xx=X% ws=XXs | IC: Proceed
...
```

---

### T-10 (10 minutes before canary)

**Action:** Final preflight checks

```bash
# Execute preflight
bash scripts/60s-preflight.sh v1.4.0
# Expected: 9/9 ✅

# Execute blast radius test
bash scripts/micro-blast-radius-test.sh https://prod-canary.example.com v1.4.0 30
# Expected: >95% success, P95 <0.5s

# Upload evidence to war-room
ls -lh evidence/preflight.txt evidence/micro_blast_*.log
```

**Communication:**
- Post evidence files to `#spark-warroom-v140`
- IC confirms: "Preflight 9/9 ✅, Blast radius PASS ✅"

---

### T-0 (Canary Stage 1 start)

**Action:** Open 1% traffic to canary

```bash
# Set canary weight
kubectl annotate ingress spark-trading \
    nginx.ingress.kubernetes.io/canary-weight="1"

# Or feature flag
curl -X POST http://localhost:4001/api/features/rollout \
    -d '{"feature":"v1.4.0","percentage":1}'

# Start metrics snapshot
bash scripts/snapshot-metrics.sh 1

# Record start time
echo "T0=$(date -u +%FT%TZ)" >> evidence/canary_timeline.txt
```

**War-Room Minute (T+0):**
```
:00 | Stage 1 (1%) START | Traffic opened | IC: Monitor 6 metrics for 15 min
```

**Grafana Dashboard:** Open `risk-idempotency-pitr` dashboard  
**Watch:** All 10 panels, especially:
- HTTP P95 Latency
- Error Rate by Endpoint
- Idempotency Conflicts
- pgBouncer Pool Utilization

---

### T+15, T+30, T+45, T+60 (Stage Progressions)

**Each Stage:**
```bash
# Verify previous stage metrics
cat evidence/summary_stage_[previous].txt

# If 6/6 metrics PASS:
kubectl annotate ingress spark-trading \
    nginx.ingress.kubernetes.io/canary-weight="[next_percentage]"

bash scripts/snapshot-metrics.sh [stage]

# War-room minute
echo ":[TIME] | Stage [N] ([%]%) start | p95=[XX]ms 5xx=[X]% ws=[XX]s idemp=[X]% csp=[X] | IC: Proceed" >> evidence/warroom_log.txt
```

**Decision Matrix:**
- **Auto-trigger fires** → IMMEDIATE ROLLBACK
- **Metric < threshold but trend bad** → 15-minute hold + re-evaluate
- **All metrics good** → Proceed to next stage

---

### T+90 (Stage 5 complete - 100% traffic)

**Action:** Full deployment, extended monitoring

```bash
# Record completion
cat >> evidence/canary_timeline.txt << EOF
T90=$(date -u +%FT%TZ)
Stage: 5 (100%)
Status: Complete
Rollbacks: 0
Next: First Night Monitoring (24h)
EOF

# Switch to First Night monitoring
# Follow: FIRST_NIGHT_MONITORING.md
```

**War-Room:**
- Status update: "✅ Canary complete (1→100%), entering 24h monitoring"
- Switch to hourly check-ins

---

### T+24h (First Night complete)

**Action:** Release note, mini RCA, lift freeze

```bash
# Generate release one-liner
bash scripts/generate-release-oneliner.sh v1.4.0

# Create mini RCA (even if no rollback)
cat > evidence/mini_rca_v1.4.0.md << EOF
# Mini RCA - v1.4.0 Canary Deployment

## What Went Well
- [3 items]

## What Could Be Improved
- [3 items]

## Observations
- [Notable patterns]

## Remaining Risks (3)
1. [Risk 1 - Owner - Due Date]
2. [Risk 2 - Owner - Due Date]
3. [Risk 3 - Owner - Due Date]
EOF

# Lift freeze
gh pr list --label "hold-for-canary" | while read pr; do
    gh pr edit $pr --remove-label "hold-for-canary"
done

# Record freeze end
cat > evidence/freeze_window_end.txt << EOF
FREEZE WINDOW END
=================
Timestamp: $(date -u +%FT%TZ)
Duration: ~24h
PRs released: $(gh pr list --label "hold-for-canary" --json number -q 'length')
Status: Normal operations resumed
EOF
```

**Communication:**
- Slack: `#spark-deploys` - "✅ v1.4.0 stable (24h), freeze lifted"
- Close war-room channel
- Pager rotation: "Green" mode

---

## 📞 War-Room Communication Protocol

### Signal-Only Format

**Good:**
```
:15 | Stage 1 | p95=142ms 5xx=0.2% ws=8s idemp=0.1% csp=3 | 6/6 PASS | IC: Proceed
```

**Bad (move to parking lot):**
```
:15 | "I think the latency might be because of..." ❌
```

### Decision Matrix

```
┌─────────────────────────────┬──────────────────────────────┐
│ Condition                   │ Decision                     │
├─────────────────────────────┼──────────────────────────────┤
│ Auto-trigger fires          │ IMMEDIATE ROLLBACK           │
│ Metric < threshold, trend ↑ │ 15-min hold + re-evaluate    │
│ Metric < threshold, trend → │ Proceed to next stage        │
│ Metric > threshold          │ ROLLBACK                     │
└─────────────────────────────┴──────────────────────────────┘
```

---

## 🔒 Freeze Window Rules

### Allowed During Freeze

- ✅ Hotfixes (critical bugs, security)
- ✅ Canary rollback
- ✅ Monitoring/alert adjustments
- ✅ Read-only PRs (documentation)

### Blocked During Freeze

- ❌ Schema migrations
- ❌ New features
- ❌ Dependency updates
- ❌ Refactoring

### BIST Market Hours Restriction

**BIST Trading Hours:** 09:30-18:00 Istanbul Time

**Rules:**
- No schema changes during market hours
- Canary stages during off-hours or weekends preferred
- Emergency rollback: Any time (prioritize stability)

**DST Week Restriction:**
- Daylight Saving Time transition weeks
- Canary only in morning window (06:00-10:00)
- Avoid evening deployments (time confusion risk)

---

## 📊 War-Room Dashboard (Single Screen)

**Grafana View:**
- Dashboard: `risk-idempotency-pitr`
- Time range: Last 30 minutes (auto-refresh: 30s)
- Annotations: Stage transitions (auto-added)

**Alert View:**
- Prometheus alerts: http://localhost:9090/alerts
- Filter: `auto_rollback="true"`
- Sort by: Severity

**Evidence Feed:**
- Terminal: `tail -f evidence/warroom_log.txt`
- Auto-snapshot: `watch -n 60 "bash scripts/snapshot-metrics.sh [stage]"`

---

## 🎯 Success Criteria

**Canary Deployment Successful If:**
- ✅ All 5 stages completed (1→100%)
- ✅ 6/6 metrics PASS at each stage
- ✅ 0 rollbacks
- ✅ 0 critical alerts
- ✅ War-room log complete
- ✅ Evidence files collected (50+)

**First Night Successful If:**
- ✅ 24h monitoring complete
- ✅ SLO burn rate < 1.5
- ✅ No degradation
- ✅ User feedback neutral/positive

---

**Last Updated:** 2024-10-24  
**Version:** v1.4.0-ultimate  
**Owner:** Incident Commander
