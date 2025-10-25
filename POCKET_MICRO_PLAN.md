# 🚀 Pocket Micro Plan - v1.4.0 Go-Live

**Format:** Ultra-compact, copy-paste and fly  
**Kullanım:** Cebe sığar, terminal yeterli

---

## ⚡ T-10 dk | Freeze + Preflight

```bash
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh
```

**Beklenen:** All ✅, 40+ evidence files

---

## 🟢 T-2 dk | Green Button (kanıt üret)

```bash
bash scripts/green-button-ritual.sh v1.4.0
```

**Üretir:** SBOM, provenance, signed checklist (7 files)

---

## 🚀 T+0 | Canary Aşamaları

**1% → 5% → 25% → 50% → 100%** (her aşama 15 dk)

**Geçiş kuralı:** **8/8 sinyal yeşil**  
**Aksi:** Hold (10 dk) veya Rollback

---

## 🎵 8 Golden Signals (eşikler)

```
1. API P95      ≤ 200ms
2. 5xx          ≤ 1%
3. WS staleness ≤ 30s
4. Risk blocks  < 0.5/min
5. Idempotency  ≤ 1%
6. CSP          ≤ baseline+10%
7. Event-loop   ≤ 50ms
8. GC pause     ≤ 20ms
```

---

## 🚨 Rollback (≤5 dk, tek komut)

```powershell
pwsh -NoProfile -File scripts/rollback.ps1 `
  -Reason "trigger-name" `
  -Stage "current-%"
```

**20 auto-trigger** (standart 6 + enhanced 8 + guards 2 + enrichment 4)

---

## 🗣️ War-Room Format

```
Time | Stage | p95 | 5xx% | ws | risk/min | idem% | cspΔ | eloop | gc | Decision
08:15| 1%   | 140 | 0.3  |11s | 0.1      | 0.2   | +4%  | 12ms  | 8ms| Proceed
```

**Tek IC, signal-only, parking lot theory**

---

## ✅ T+90 | Kapanış

```bash
bash scripts/snapshot-metrics.sh 100 && \
bash scripts/generate-release-oneliner.sh v1.4.0
```

**24h monitoring** → `FIRST_NIGHT_MONITORING.md`  
**Release note** + freeze lift

---

## 🧷 Cep Acil Komutlar

```bash
# Prometheus targets
curl -s localhost:9090/api/v1/targets | jq '.data.activeTargets|length'

# Outbox lag (p95 < 10s)
curl -s https://canary/api/outbox/lag | jq '.p95,.max'

# pgBouncer pools
psql $PGBOUNCER_URL -c "SHOW POOLS;"

# Event loop lag
curl -s localhost:4001/metrics.prom | grep nodejs_eventloop_lag
```

---

## 🧪 3 Mini Drill (15 dk toplam)

```bash
# 1. Rollback drill (2 dk)
pwsh scripts/rollback.ps1 -Reason "drill" -Stage "25%" -DryRun

# 2. Idempotency burst (5 dk)
seq 1 100 | xargs -P 10 -I{} curl -so /dev/null -w "%{http_code}\n" \
  -H "X-Idempotency-Key:drill-$(date +%s)" \
  https://canary/api/exec/order | sort | uniq -c

# 3. Outbox lag smoke (3 dk)
curl -s https://canary/api/outbox/lag | jq '{p50,p95,p99,max}'
```

---

## 🎯 Success Criteria

```
"Canary 1→100%: 0 rollback, p95 ≤ 200ms, 5xx ≤ 1%, 
ws_stale_p95 ≤ 30s, idemp_conflict ≤ 1%, 
CSP viol ≤ baseline+10%; event-loop p95 ≤ 50ms, GC avg ≤ 20ms."
```

**Evidence-backed, auto-generated**

---

## 🔬 Kart Kuralı

**Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş**

**Sistem sadece hızlı değil, KANITLA HIZLI!** 🚀📊⚡

---

**🟢 BAS VE UÇ!**

---

_Laminate & carry | v1.4.0-ultimate_
