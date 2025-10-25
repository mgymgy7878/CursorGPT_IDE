# Go-Live Micro Plan (Day 0 → Day 1)

**Format:** Copy-paste and run  
**Duration:** 90s prep + 90min canary + 24h monitoring  
**Philosophy:** Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş

---

## ⏰ Timeline (T-minus to T+24h)

### T-10 dk | Freeze & Preflight

```bash
# Complete preflight suite (90 seconds)
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh

# Expected: All pass ✅, 40+ evidence files
```

---

### T-2 dk | Green Button Ritual (kanıt üret)

```bash
# Generate SBOM, provenance, signed checklist
bash scripts/green-button-ritual.sh v1.4.0

# Verify evidence files created
ls -lh evidence/sbom_v1.4.0.json \
       evidence/build_provenance_v1.4.0.json \
       evidence/go_nogo_signed_v1.4.0.txt
```

---

### T+0 | Canary Aşamaları (1%→5%→25%→50%→100%)

**Stage 1 (1%, 15 min):**
```bash
kubectl annotate ingress spark nginx.ingress.kubernetes.io/canary-weight="1"
bash scripts/snapshot-metrics.sh 1
# Watch Grafana, verify 8/8 signals → Proceed
```

**Stage 2-4:** Repeat with 5%, 25%, 50% (each 15 min)

**Stage 5 (100%, 30 min):** Complete, switch to first night

**Decision at each stage:**
- 8/8 signals green → **Proceed**
- Deviation → **Hold** (10 min re-measure)
- Threshold exceeded + bad trend / any of 20 triggers → **Rollback**

---

### Rollback (tek komut, ≤5 dk)

```powershell
pwsh -NoProfile -File scripts/rollback.ps1 `
  -Reason "trigger-name" `
  -Stage "25%"

# Evidence automatic: evidence/rollback_[timestamp].txt
```

---

### T+90 | Kapanış

```bash
# Final snapshot + one-liner
bash scripts/snapshot-metrics.sh 100 && \
bash scripts/generate-release-oneliner.sh v1.4.0

# Tag release
git tag -a v1.4.0 -m "Canary successful: 8/8 signals pass"
git push origin v1.4.0

# Lift freeze
gh pr list --label "hold-for-canary" | \
  xargs -I{} gh pr edit {} --remove-label "hold-for-canary"
```

**Switch to:** `FIRST_NIGHT_MONITORING.md` (24h hourly rhythm)

---

## 🎵 Saha Kartı: 8 Golden Signals (eşikler)

```
1. API P95        ≤ 200ms
2. 5xx            ≤ 1%
3. WS staleness   ≤ 30s
4. Risk blocks    < 0.5/min
5. Idempotency    ≤ 1%
6. CSP            ≤ baseline+10%
7. Event-loop P95 ≤ 50ms
8. GC pause avg   ≤ 20ms
```

> **Aşama geçişi = 8/8 yeşil.** Aksi: hold veya rollback.

---

## 🗣️ War-Room Formatı (signal-only)

```
Time  | Stage | p95  | 5xx% | ws_stale | risk/min | idem% | cspΔ  | evloop | gc   | Decision
08:00 | 1%    | 140  | 0.3  | 11s      | 0.1      | 0.2   | +4%   | 12ms   | 8ms  | Proceed
08:15 | 5%    | 145  | 0.3  | 12s      | 0.1      | 0.2   | +5%   | 15ms   | 10ms | Proceed
08:30 | 25%   | 150  | 0.4  | 13s      | 0.2      | 0.3   | +6%   | 18ms   | 12ms | Proceed
08:45 | 50%   | 155  | 0.4  | 14s      | 0.2      | 0.3   | +7%   | 20ms   | 14ms | Proceed
09:00 | 100%  | 160  | 0.5  | 15s      | 0.3      | 0.3   | +8%   | 22ms   | 16ms | Complete
```

**Tek IC, tek karar, tartışma "parking lot"**

---

## 🧪 İlk Uçuş İçin 3 Mini Tatbikat (15 dk toplam)

### 1. Rollback Dry-Run (2 dk)

```bash
# No actual changes, logs steps only
pwsh -NoProfile -File scripts/rollback.ps1 \
  -Reason "drill-preflight" \
  -Stage "25%" \
  -DryRun | tee evidence/rollback_drill.txt

# Expected: Steps logged, services untouched
```

---

### 2. Idempotency Burst (5 dk)

```bash
# 100 requests, same key → watch for conflict spike
seq 1 100 | xargs -P 10 -I{} curl -so /dev/null -w "%{http_code}\n" \
  -H "X-Idempotency-Key:drill-$(date +%s)" \
  -d '{"symbol":"BTCUSDT","side":"buy","quantity":0.01}' \
  https://canary/api/exec/order | sort | uniq -c

# Expected: 1x 200 (or 201), 99x 409
# Check idempotency_conflict_total metric doesn't spike
```

---

### 3. Outbox Lag Smoke (3 dk)

```bash
# Check outbox processing lag
curl -s https://canary/api/outbox/lag | jq '{p50, p95, p99, max}'

# Expected:
# p50 < 2s
# p95 < 10s
# p99 < 30s
# max < 60s (outliers acceptable)

# No "teeth" pattern in lag graph
```

---

## 🎨 Son Rötuş (ince ama pahalı olmayan)

### 1. Operatör Kartı Fiziksel

**Print & Laminate:**
- File: `OPERATOR_CARD.md`
- Size: A5 or wallet-sized
- Material: Waterproof laminate
- Add: QR code (top-left) → `QUICK_START_DEPLOYMENT.md`

**QR Code Generation:**
```bash
# Generate QR for quick access to docs
qrencode -o operator_card_qr.png "https://github.com/[org]/[repo]/blob/main/QUICK_START_DEPLOYMENT.md"
```

---

### 2. Grafana Dashboard Enhancement

**Add 2 panels to existing dashboard:**

```json
// Panel 11: Event Loop Lag P95
{
  "id": 11,
  "title": "Event Loop Lag P95",
  "type": "gauge",
  "targets": [{
    "expr": "histogram_quantile(0.95, rate(nodejs_eventloop_lag_seconds_bucket[5m]))"
  }],
  "thresholds": {
    "steps": [
      { "value": null, "color": "green" },
      { "value": 0.030, "color": "yellow" },
      { "value": 0.050, "color": "red" }
    ]
  }
}

// Panel 12: GC Pause Average
{
  "id": 12,
  "title": "GC Pause Average",
  "type": "gauge",
  "targets": [{
    "expr": "rate(nodejs_gc_duration_seconds_sum[5m]) / rate(nodejs_gc_duration_seconds_count[5m])"
  }],
  "thresholds": {
    "steps": [
      { "value": null, "color": "green" },
      { "value": 0.015, "color": "yellow" },
      { "value": 0.020, "color": "red" }
    ]
  }
}
```

---

### 3. Haftalık "Oyun Günü" (30 dk)

**Every Monday 10:00 AM:**

```bash
# 1. Rollback drill (5 min)
pwsh scripts/rollback.ps1 -Reason "weekly-drill" -Stage "drill" -DryRun

# 2. Chaos mini-scenario (15 min)
# Run one random chaos test
pnpm test:chaos -- --testNamePattern="slow database"

# 3. Contract spot check (10 min)
pnpm test:contract:spot

# Record results
cat > evidence/weekly_drill_$(date +%Y%m%d).txt << EOF
Weekly Drill: $(date)
Rollback: PASS/FAIL
Chaos: PASS/FAIL
Contract: PASS/FAIL
Notes: [any observations]
EOF
```

**Purpose:** Keep team sharp, validate tools work

---

## 🎯 Release Note One-Liner (Auto-Generated)

**After canary completes:**

```bash
bash scripts/generate-release-oneliner.sh v1.4.0

# Example output:
# "v1.4.0 canary: 1%→100% tüm aşamalar 6/6 metrik geçer; 
#  rollback=0; p95=~140ms, 5xx=0.3%, ws_stale_p95=11s, 
#  risk_block=0.1/min, idemp_conflict=0.2%, csp_viol=baseline+4%; 
#  event-loop p95=12ms, GC avg=8ms."
```

**Copy to:** `.github/RELEASE_NOTES_TEMPLATE.md` → Deployment Summary

---

## ✅ Success Criteria (Checklist)

**Canary Complete:**
- [ ] All 5 stages completed (1%→100%)
- [ ] 8/8 signals pass at each stage
- [ ] 0 rollbacks
- [ ] 0 critical alerts
- [ ] War-room log complete
- [ ] 50+ evidence files collected

**First Night (24h):**
- [ ] SLO burn rate < 1.5
- [ ] No degradation
- [ ] User feedback neutral/positive
- [ ] All hourly checks complete
- [ ] Mini RCA documented

---

## 🔮 v1.5 Kıvılcımı (hazır verilerle)

**Deepen reliability visibility:**

### 1. Shadow Trading + Error-Budget Panel
- Real feed + paper fills (consistency drift < 5ms)
- Error budget gauge (live)
- Auto-freeze if budget < 10%

### 2. Supply-Chain Attestations (Auto-Attach)
- SBOM in CI (every build)
- Signed provenance (Sigstore/Cosign)
- Manifest + GPG ready
- Auto-attach to GitHub releases

### 3. Continuous Profiling
- Event-loop/GC flamegraphs
- Pyroscope integration
- Auto-optimization recommendations

### 4. SLO Budget Panel (Real-Time)
- Burn rate dashboard (1h/6h/24h)
- Freeze policy automation
- Predictive alerts

---

## 🎓 Philosophy (Final)

> **"Deploy artık bir tören değil; hipotez→ölçüm→kanıt→zarif geri dönüş döngüsü. Düğmeye basın, sinyaller şarkısını söylesin, kanıt arşivlensin—gerekirse beş dakikada geriye sarın. Sistem sadece hızlı değil, KANITLA HIZLI."**

---

## 📋 Operator Essentials

**Physical:**
- [ ] `OPERATOR_CARD.md` printed & laminated
- [ ] QR code added (top-left corner)
- [ ] Kept in pocket during deployment

**Digital:**
- [ ] Grafana dashboard open (10+2 panels)
- [ ] War-room channel ready (#spark-warroom-v140)
- [ ] Terminal with scripts/ directory
- [ ] Evidence/ directory clean and ready

**Mental:**
- [ ] IC designated
- [ ] Escalation path clear
- [ ] Rollback command memorized
- [ ] 8 signal thresholds memorized

---

## 🚀 One-Command Flight Check

```bash
# Complete pre-flight in one command
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh && \
bash scripts/green-button-ritual.sh v1.4.0 && \
echo "🟢 CLEARED FOR TAKEOFF"
```

---

## 🎯 Mission Success Criteria

**Primary Objective:**
- Deploy v1.4.0 to 100% traffic with 0 rollbacks

**Secondary Objectives:**
- Maintain SLO (99% uptime, P95 <200ms)
- Collect comprehensive evidence (50+ files)
- Complete first night monitoring (24h)

**Success Definition:**
```
"Canary 1→100%: 0 rollback, p95 ≤ 200ms, 5xx ≤ 1%, 
ws_stale_p95 ≤ 30s, idemp_conflict ≤ 1%, CSP viol ≤ baseline+10%; 
event-loop p95 ≤ 50ms, GC avg ≤ 20ms."
```

---

## 🔬 Scientific Method Recap

**Hypothesis:** v1.4.0 maintains SLO under production load  
**Measurement:** 8 signals × 5 stages = 40 data points  
**Evidence:** 50+ timestamped files (automatic)  
**Rollback:** < 5 min if hypothesis fails (20 auto-triggers)

---

**🟢 BAS VE UÇ!**

**Sistem sadece hızlı değil, KANITLA HIZLI! 🚀🔬🛡️🎵✨**

---

_This plan replaces traditional deployment checklists with scientific rigor | v1.4.0-ultimate_
