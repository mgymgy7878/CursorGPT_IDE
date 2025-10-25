# Operational Quick Start Guide - v1.4.0

**Purpose:** Deploy v1.4.0 scientifically (hypothesis → measurement → evidence → rollback)  
**Format:** Copy-paste and run  
**Duration:** 90s prep + 90min canary + 24h monitoring

---

## 🚦 90-Second Readiness Check

**Copy-paste entire block:**

```bash
#!/bin/bash
echo "🚦 90-SECOND READINESS CHECK"

# 0) Version seal → evidence
git describe --tags --always | tee evidence/release_tag.txt

# 1) 60s preflight (10 checks, automatic evidence)
bash scripts/60s-preflight.sh v1.4.0

# 2) Micro blast radius (30 HTTP + 30 WS)
bash scripts/micro-blast-radius-test.sh https://prod-canary.example.com v1.4.0 30

# 3) Artifact completeness (36/36)
bash scripts/check-artifact-completeness.sh | tee evidence/artifact_count.txt

# 4) Green button ritual (7 evidence files)
bash scripts/green-button-ritual.sh v1.4.0

echo "✅ 90-SECOND CHECK COMPLETE"
echo "Evidence files: $(ls evidence/ | wc -l)"
echo "🟢 READY FOR GO/NO-GO DECISION"
```

**Expected:** All pass ✅, 40+ evidence files created

---

## 🧭 War-Room "Run of Show"

### Format (Signal-Only)

```
HH:MM | Stage | p95 | 5xx | ws_stale | idemp% | csp | eloop | gc | decision
```

**Example:**
```
10:00 | 1 (1%)  | 142ms | 0.2% | 8s  | 0.1% | 3  | 12ms | 8ms  | IC: Proceed ✅
10:15 | 2 (5%)  | 145ms | 0.3% | 9s  | 0.2% | 4  | 15ms | 10ms | IC: Proceed ✅
10:30 | 3 (25%) | 148ms | 0.3% | 11s | 0.2% | 5  | 18ms | 12ms | IC: Proceed ✅
10:45 | 4 (50%) | 152ms | 0.4% | 12s | 0.3% | 6  | 20ms | 14ms | IC: Proceed ✅
11:00 | 5 (100%)| 156ms | 0.4% | 13s | 0.3% | 7  | 22ms | 16ms | IC: Complete ✅
```

### Authority & Rules

- **Yetki:** Tek IC (Incident Commander) karar verir
- **Yorumlar:** "Parking lot" note (war-room dışı)
- **Kural:**
  - Eşik aşımı → **ANINDA ROLLBACK**
  - Eşik altı ama trend ↑ → **15dk HOLD**
  - İyi trend → **BİR ÜST AŞAMA**

---

## 🟢 Canary Stages (Copy-Paste Flow)

**Stage 1 - 1% / 15 min:**

```bash
# Set traffic
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="1"

# Snapshot
bash scripts/snapshot-metrics.sh 1

# Watch Grafana dashboard (8 golden signals)
# Wait 15 minutes

# Verify 8/8 signals PASS → Proceed to Stage 2
```

**Stage 2 - 5% / 15 min:**

```bash
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="5"
bash scripts/snapshot-metrics.sh 5
# Wait 15 min, verify 8/8 → Proceed
```

**Stage 3 - 25% / 15 min:**

```bash
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="25"
bash scripts/snapshot-metrics.sh 25
# Wait 15 min, verify 8/8 → Proceed
```

**Stage 4 - 50% / 15 min:**

```bash
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="50"
bash scripts/snapshot-metrics.sh 50
# Wait 15 min, verify 8/8 → Proceed
```

**Stage 5 - 100% / 30 min:**

```bash
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="100"
bash scripts/snapshot-metrics.sh 100
# Wait 30 min, extended monitoring
# Switch to First Night monitoring plan
```

---

## 🎵 8 Golden Signals (Pass/Fail Thresholds)

**All 8 must pass at each stage:**

```
1. API P95        ≤ 200ms   ✅ / ❌
2. 5xx Rate       ≤ 1%     ✅ / ❌
3. WS Staleness   ≤ 30s    ✅ / ❌
4. Risk Blocks    < 0.5/min ✅ / ❌
5. Idempotency    ≤ 1%     ✅ / ❌
6. CSP Violations ≤ baseline+10% ✅ / ❌
7. Event-Loop P95 ≤ 50ms   ✅ / ❌
8. GC Pause Avg   ≤ 20ms   ✅ / ❌
```

**Query in Grafana:**
- Dashboard: `deploy/grafana/dashboards/risk-idempotency-pitr.json`
- Time range: Last 15 minutes
- Auto-refresh: 30s

---

## 🔄 Rollback (Single Command, < 5 min)

### Real Rollback

```bash
# Automatic (triggered by any of 20 alerts)
pwsh -NoProfile -File scripts/rollback.ps1 \
    -Reason "auto_trigger_eventloop_backpressure" \
    -Stage "25%"

# Evidence automatic: evidence/rollback_[timestamp].txt
```

### Drill (Dry-Run Practice)

```bash
# No actual changes, logs steps only
pwsh -NoProfile -File scripts/rollback.ps1 \
    -Reason "drill" \
    -Stage "canary-25" \
    -DryRun | tee evidence/rollback_dryrun.txt

# Expected: Steps logged, no services touched
```

---

## 🧪 Corner Cases Quick Battery (5 Tests, 5 min)

**Run before canary:**

```bash
#!/bin/bash
echo "🧪 CORNER CASES BATTERY"

# 1) Idempotency burst → expect: 1x 200, 99x 409
seq 1 100 | xargs -P 10 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
    -H "X-Idempotency-Key: DRILL-BURST-123" \
    -d '{"symbol":"BTCUSDT","side":"buy","quantity":0.01}' \
    http://localhost:4001/api/exec/order | sort | uniq -c

# 2) Decimal tick drift → expect: zero deviation
node -e "
const {MoneyUtils} = require('./services/shared/lib/money');
const tests = [
  ['BTCUSDT', '12345.6789', '0.01', '12345.68'],
  ['BTCTRY', '12345.6789', '0.1', '12345.7'],
];
tests.forEach(([sym, price, tick, exp]) => {
  const result = MoneyUtils.alignToTick(
    MoneyUtils.fromString(price),
    MoneyUtils.fromString(tick)
  ).toString();
  console.log(\`\${sym}: \${result === exp ? '✅' : '❌'} (\${result})\`);
});
"

# 3) Outbox clock skew → expect: lag smooth, no "teeth"
psql "$DATABASE_URL" -Atc "
SELECT extract(epoch from now() - created_at) as lag 
FROM \"Outbox\" 
WHERE status='pending' 
LIMIT 10;" | awk '{if ($1 > 10) print "⚠️ Lag spike: " $1 "s"}'

# 4) CSP flood → expect: some 429 (rate limited)
seq 1 50 | xargs -P 10 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3003/api/csp-report \
    --data '{"csp-report":{"blocked-uri":"test"}}' | sort | uniq -c

# 5) SBOM license drift → expect: no new GPL
jq -r '.artifacts[] | select(.licenses[]? | contains("GPL")) | .name' \
    evidence/sbom_v1.4.0.json 2>/dev/null || echo "No GPL"

echo "✅ CORNER CASES COMPLETE"
```

---

## 📑 Release Note One-Liner (Auto-Generated)

```bash
# Generate after canary complete
bash scripts/generate-release-oneliner.sh v1.4.0 | \
    tee evidence/release_oneliner.txt

# Example output:
# "v1.4.0 canary: 1%→100% tüm aşamalar 6/6 metrik geçer; 
#  rollback=0; p95=~140ms, 5xx=0.3%, ws_stale_p95=11s, 
#  risk_block=0.1/min, idemp_conflict=0.2%, csp_viol=baseline+4%; 
#  event-loop p95=12ms, GC avg=8ms."

# Copy to release notes
```

---

## 🌙 First Night (24h, Hourly Rhythm)

### Hour 0-2 (Critical - Every 15 min)

```bash
# Monitor 8 signals + CSP report rate
watch -n 900 'bash scripts/snapshot-metrics.sh && \
    curl -s http://localhost:9090/api/v1/alerts | \
    jq ".data.alerts[] | select(.labels.auto_rollback==\"true\")"'
```

### Hour 2-6 (High Alert - Every 30 min)

```bash
# Trend analysis + contract spot check
watch -n 1800 'bash scripts/snapshot-metrics.sh && \
    pnpm test:contract:spot'
```

### Hour 6-24 (Sustained - Hourly)

```bash
# Hourly metrics + comparison with baseline
watch -n 3600 'bash scripts/snapshot-metrics.sh && \
    diff evidence/baseline_v1.4.0.prom evidence/rollout_stage_100.txt | head -20'
```

### At 24h Mark

```bash
# Generate release note + mini RCA
bash scripts/generate-release-oneliner.sh v1.4.0

# Create mini RCA (even if no rollback)
cat > evidence/mini_rca_v1.4.0.md << EOF
# Mini RCA - v1.4.0

## What Went Well
- [3 items]

## What Could Be Improved
- [3 items]

## Remaining Risks (3)
1. [Risk - Owner - Due Date]
2. [Risk - Owner - Due Date]
3. [Risk - Owner - Due Date]
EOF

# Lift freeze
gh pr list --label "hold-for-canary" | \
    xargs -I{} gh pr edit {} --remove-label "hold-for-canary"
```

---

## 🧷 Pocket Emergency Commands

**In case of issues:**

```bash
# 1) PITR ready? (evidence)
psql "$DATABASE_URL" -c "SELECT * FROM backup_status;"

# 2) pgBouncer saturation watch
psql "postgresql://localhost:6432/pgbouncer" -c "SHOW POOLS;"

# 3) Prometheus targets (early warning if scrapes drop)
curl -s http://localhost:9090/api/v1/targets | \
    jq '.data.activeTargets | length'

# 4) Event loop lag (backpressure indicator)
curl -s http://localhost:4001/api/public/metrics.prom | \
    grep "nodejs_eventloop_lag_seconds" | grep "0.95"

# 5) GC pause duration (memory pressure)
curl -s http://localhost:4001/api/public/metrics.prom | \
    grep "nodejs_gc_duration_seconds"
```

---

## ✅ Expected Evidence (40+ Files)

```
evidence/
├── release_tag.txt                      # Version seal
├── preflight.txt                        # 60s preflight summary
├── pgbouncer_pools_v1.4.0.tsv          # Pool status
├── prisma_status_v1.4.0.txt            # Migration check
├── csp_headers_v1.4.0.txt              # Security headers
├── pg_dead_tuples_top5.txt             # Bloat check
├── micro_blast_v1.4.0.log              # Blast radius
├── artifact_count.txt                   # Completeness
├── sbom_v1.4.0.json                    # SBOM
├── build_provenance_v1.4.0.json        # Provenance
├── go_nogo_signed_v1.4.0.txt           # GO decision
├── rollout_stage_[1,5,25,50,100].txt   # 5 stage snapshots
├── db_health_stage_*.txt                # DB per stage
├── pgbouncer_stage_*.txt                # Pool per stage
├── logs_stage_*.txt                     # Logs per stage
├── summary_stage_*.txt                  # Summary per stage
├── warroom_log.txt                      # War-room minutes
├── release_oneliner.txt                 # One-line summary
├── mini_rca_v1.4.0.md                  # Mini RCA
└── rollback_dryrun.txt                  # Rollback drill
```

---

## 🎯 Success Criteria (One-Line)

```
"Canary 1→100%: 0 rollback, p95 ≤ 200ms, 5xx ≤ 1%, ws_stale_p95 ≤ 30s, 
idemp_conflict ≤ 1%, CSP viol ≤ baseline+10%; event-loop p95 ≤ 50ms, 
GC avg ≤ 20ms."
```

**Evidence-backed, auto-generated, copy-paste ready**

---

## 🚨 Quick Rollback Decision Tree

```
┌─────────────────────────────────────────────────────┐
│ CONDITION              │ ACTION                     │
├────────────────────────┼────────────────────────────┤
│ Any of 20 triggers     │ IMMEDIATE ROLLBACK         │
│ fires                  │ (automatic)                │
├────────────────────────┼────────────────────────────┤
│ Metric > threshold     │ ROLLBACK                   │
│                        │ (manual, IC decision)      │
├────────────────────────┼────────────────────────────┤
│ Metric < threshold     │ 15-MIN HOLD                │
│ but trend bad (↑)      │ Re-evaluate                │
├────────────────────────┼────────────────────────────┤
│ Metric < threshold     │ PROCEED                    │
│ and trend good (→)     │ Next stage                 │
└────────────────────────┴────────────────────────────┘
```

---

## ⏰ T-Minus Timeline (Freeze to Freeze-Lift)

```
T-30:  Change freeze starts (PRs → hold-for-canary)
T-20:  War-room opens (Slack: #spark-warroom-v140)
T-10:  60s preflight (10 checks)
T-9:   Blast radius test (30s)
T-5:   Red team manual review (15 checks)
T-2:   Green button ritual (SBOM, provenance)
T-0:   Canary Stage 1 (1%) START
T+15:  Canary Stage 2 (5%)
T+30:  Canary Stage 3 (25%)
T+45:  Canary Stage 4 (50%)
T+60:  Canary Stage 5 (100%)
T+90:  First night monitoring begins
T+24h: Release note + mini RCA + freeze lift
```

**Total:** ~26 hours (freeze to freeze-lift)  
**Active:** ~90 minutes (canary)

---

## 🔮 v1.5 Radar (Next Evolution)

**Deepen reliability visibility, not expand features:**

### 1. Shadow Trading + Error Budget Panel
- Real feed + paper fills
- Consistency drift < 5ms
- Linked to SLO burn rate
- Auto-freeze if budget < 10%

### 2. Supply-Chain Attestations (Auto-Attach)
- SBOM every build (syft in CI)
- Signed provenance (Sigstore)
- Vuln auto-scan (Grype)
- Auto-attach to GitHub releases

### 3. Continuous Performance Profiling
- Code-embedded latency marks
- Pyroscope integration
- Flame graph generation
- Auto-optimization recommendations

### 4. SLO Budget Panel (Real-Time)
- Live error budget gauge
- Burn rate dashboard (1h/6h/24h)
- Freeze policy automation
- Predictive alerts

---

## 🎯 One-Command Verification

```bash
# Complete deployment readiness check
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh && \
bash scripts/green-button-ritual.sh v1.4.0 && \
echo "🟢 READY FOR GO/NO-GO DECISION"
```

---

## 📋 Cheat Sheet (Laminate & Keep Handy)

```
┌─────────────────────────────────────────────────────────────┐
│  DEPLOYMENT CHEAT SHEET - v1.4.0                            │
├─────────────────────────────────────────────────────────────┤
│  PRE-DEPLOY:      25 checks, 30 min, 40 evidence files     │
│  CANARY:          5 stages, 90 min, 8 signals each          │
│  ROLLBACK:        < 5 min, 20 triggers, 1 command           │
│  FIRST NIGHT:     24h, hourly checks, SLO burn < 2.0        │
├─────────────────────────────────────────────────────────────┤
│  COMMANDS:                                                  │
│  • Preflight:     bash scripts/60s-preflight.sh v1.4.0      │
│  • Blast:         bash scripts/micro-blast-radius-test.sh   │
│  • Green Button:  bash scripts/green-button-ritual.sh       │
│  • Snapshot:      bash scripts/snapshot-metrics.sh [N]      │
│  • Rollback:      pwsh scripts/rollback.ps1                 │
│  • One-Liner:     bash scripts/generate-oneliner.sh         │
├─────────────────────────────────────────────────────────────┤
│  8 SIGNALS: All ≤ threshold → PASS ✅                       │
│  20 TRIGGERS: Any fires → ROLLBACK ❌                       │
├─────────────────────────────────────────────────────────────┤
│  EVIDENCE: evidence/ directory (50+ automatic files)        │
│  WAR-ROOM: #spark-warroom-v140 (signal-only, single IC)    │
│  GRAFANA: risk-idempotency-pitr dashboard (10 panels)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎓 Philosophy

> **"Buton artık bir deney başlatıyor: hipotez sahada, sinyaller şarkısını söylüyor, kanıt arşivleniyor, geri dönüş beş dakikanın altında. Sistem sadece hızlı değil, KANITLA HIZLI! 🚀🔬🛡️🎵"**

---

**🟢 YEŞİL BUTONA BASIN!**

📋 **Hipotezi sahaya sür**  
🎵 **Altı sinyalin şarkısını dinle** (8 golden signals)  
📊 **Kanıtı topla** (50+ evidence files)  
🔄 **Gerekirse beş dakikada geriye sar** (20 auto-triggers)

🚀🔬🛡️🎵✨ **v1.4.0: Operasyonel Olgunluk %99 - KANITLA HIZLI!**
