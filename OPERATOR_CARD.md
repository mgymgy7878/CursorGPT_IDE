# 🟢 OPERATOR CARD — Canary → İzle → (Gerekirse) Geri Al

**Kullanım:** Bu kart tek başına yeterli. Terminal + bu sayfa = bilimsel deploy.  
**Format:** Laminate & keep in pocket | Single-page complete guide

---

## ⚡ 90-Saniye Başlangıç (kanıt üretir)

```bash
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh && \
bash scripts/green-button-ritual.sh v1.4.0
```

**Beklenen:** Tümü ✅, 40+ evidence dosyası

---

## 🚀 Canary Akışı (kopyala-yapıştır)

```
Stage 1:  1%  → 15 dk → karar (T+15)
Stage 2:  5%  → 15 dk → karar (T+30)
Stage 3: 25%  → 15 dk → karar (T+45)
Stage 4: 50%  → 15 dk → karar (T+60)
Stage 5: 100% → 30 dk → kapanış (T+90)
```

**Karar pencereleri:** T+15 / +30 / +45 / +60 / +90  
**Geçiş kuralı:** Son 5 dk penceresinde 8/8 sinyal yeşil + yükselen hata/trend yok

---

## 🎵 8 Golden Signals (eşikler)

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

> **Stage geçişinde 8/8 şart.** Her sapma → **hold**; eşik üstü ve kötü trend → **rollback**

---

## 🧭 Karar Matrisi

| Durum | Eylem |
|-------|-------|
| 8/8 yeşil, trend stabil/iyimser | **Proceed** (bir sonraki stage) |
| 1-2 sarı, düşüşe geçen trend | **Hold** (10 dk yeniden değerlendir) |
| Eşik üstü + kötü trend / 20 tetikten biri | **Rollback** (tek komut, ≤5 dk) |

---

## 🚨 Rollback (tek komut, ≤5 dk, kanıt korumalı)

**Gerçek rollback:**

```powershell
pwsh -NoProfile -File scripts/rollback.ps1 `
  -Reason "canary-s3-latency-spike" `
  -Stage "25%"
```

**Kuru tatbikat (preflight drill):**

```bash
pwsh -NoProfile -File scripts/rollback.ps1 \
  -Reason "drill" -Stage "25%" -DryRun | \
  tee evidence/rollback_preflight_dryrun.txt
```

---

## 🧪 Corner Cases — 5 Tek Atımlık Test

```bash
# 1) Idempotency Burst Replay
seq 1 100 | xargs -P 10 -I{} curl -so /dev/null -w "%{http_code}\n" \
  -H "X-Idempotency-Key:test-$(date +%s)" https://canary/api/exec/order \
  | sort | uniq -c
# Beklenen: 1x 200, 99x 409

# 2) Decimal Tick Drift
node -e "const m=require('./services/shared/lib/money');console.log(m.testTickDrift());"
# Beklenen: Tüm semboller tick-aligned

# 3) Outbox Clock Skew
curl -s http://canary/api/outbox/lag | jq '.p95, .max'
# Beklenen: p95 < 10s, max < 30s

# 4) CSP Report Flood
curl -s http://canary/api/csp/reports/1m | jq '.rate'
# Beklenen: rate ≤ baseline+10%

# 5) SBOM License Drift
test -f evidence/sbom_v1.4.0.json && echo OK || \
  syft dir:. -o json > evidence/sbom_v1.4.0.json
jq '.artifacts[] | select(.licenses[]? | contains("GPL"))' evidence/sbom_v1.4.0.json
# Beklenen: No new GPL packages
```

---

## 🧷 Acil Durum Komutları (cep listesi)

```bash
# Prometheus hedef sayısı (scrape health)
curl -s http://prometheus:9090/api/v1/targets | \
  jq '.data.activeTargets|length'

# pgBouncer havuz doygunluğu hızlı bakış
psql $PGBOUNCER_URL -c "SHOW POOLS;" | \
  egrep 'active|cl_active|sv_active'

# Build/artefakt bütünlüğü
sha256sum -c evidence/release_manifest.sha256 | \
  tee -a evidence/release_manifest_verify.txt

# PITR ready check
psql $DATABASE_URL -c "SELECT * FROM backup_status;"

# Event loop lag (backpressure indicator)
curl -s localhost:4001/metrics.prom | \
  grep nodejs_eventloop_lag | grep 0.95

# GC pause (memory pressure indicator)
curl -s localhost:4001/metrics.prom | \
  grep nodejs_gc_duration_seconds
```

---

## 🗣️ War-Room Formatı (signal-only)

```
Time  | Stage | p95  | 5xx% | ws_stale | risk/min | idem% | cspΔ  | evloop_p95 | gc_avg | Decision
08:00 | 1%    | 140  | 0.3  | 11s      | 0.1      | 0.2   | +4%   | 12ms       | 8ms    | Proceed
08:15 | 5%    | 145  | 0.3  | 12s      | 0.1      | 0.2   | +5%   | 15ms       | 10ms   | Proceed
08:30 | 25%   | 150  | 0.4  | 13s      | 0.2      | 0.3   | +6%   | 18ms       | 12ms   | Proceed
08:45 | 50%   | 155  | 0.4  | 14s      | 0.2      | 0.3   | +7%   | 20ms       | 14ms   | Proceed
09:00 | 100%  | 160  | 0.5  | 15s      | 0.3      | 0.3   | +8%   | 22ms       | 16ms   | Complete
```

**Kurallar:**
- Tek komut → tek karar
- Tartışmalar "parking lot"
- IC konuşur, herkes ölçüm koyar

---

## ✅ Kapanış (Stage 5 sonrası)

```bash
# Final snapshot + one-liner
bash scripts/snapshot-metrics.sh 100 && \
bash scripts/generate-release-oneliner.sh v1.4.0

# Release note table doldurul
# FIRST_NIGHT_MONITORING.md saatlik kayıtları doldur

# Tag + freeze lift
git tag -a v1.4.0 -m "Canary successful: 8/8 signals pass"
gh pr list --label "hold-for-canary" | \
  xargs -I{} gh pr edit {} --remove-label "hold-for-canary"
```

---

## 🔮 v1.5 Odağı (derinlik > genişlik)

**Deepen reliability visibility, not expand features:**

1. **Shadow Trading + Error-Budget Panel**
2. **Supply-Chain Attestations (Auto-Attach)**
3. **Continuous Profiling (Flamegraphs)**
4. **SLO Budget Panel (Real-Time)**

---

## 📊 Quick Reference

```
┌───────────────────────────────────────────┐
│ PRE-DEPLOY: 25 checks, 30 min, 40 files  │
│ CANARY:     5 stages, 90 min, 8 signals  │
│ ROLLBACK:   < 5 min, 20 triggers         │
│ EVIDENCE:   50+ files, automatic         │
├───────────────────────────────────────────┤
│ 8 SIGNALS: All ≤ threshold → PASS ✅     │
│ 20 TRIGGERS: Any fires → ROLLBACK ❌     │
└───────────────────────────────────────────┘
```

---

## 🔬 Kart Kuralı

**Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş**

**Sistem sadece hızlı değil, KANITLA HIZLI!** 🚀🔬🛡️

---

**🟢 BAS VE UÇ!**

---

_Laminate & carry | Terminal + card = scientific deploy | v1.4.0-ultimate_
