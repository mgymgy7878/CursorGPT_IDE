# 🔬 Whisper Checklist - 60-90s Bilimsel Düğme Ritüeli

**Format:** Cebe sığar, tek sayfa yeterli  
**Kullanım:** Lamine et, deploy sırasında yanında taşı

---

## ⚡ BAŞLAT (90s, kanıt üretir)

```bash
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh && \
bash scripts/green-button-ritual.sh v1.4.0
```

**Beklenen:** All ✅, 40+ evidence files, green light for canary

---

## 🚀 CANARY AKIŞI

**1% → 5% → 25% → 50% → 100%** (her aşama 15 dk)

**Geçiş kuralı:** 8/8 sinyal yeşil  
**Aksi:** 10 dk hold → hâlâ sarı/kırmızı → **ROLLBACK**

---

## 🎵 8 SİNYALİN TEK SATIRLIK EŞİĞİ

```
p95≤200ms | 5xx≤1% | ws≤30s | risk<0.5/min | 
idem≤1% | csp≤+10% | evloop_p95≤50ms | gc_avg≤20ms
```

**Stage geçişi = 8/8 yeşil | Değilse hold/rollback**

---

## 🚨 ÜÇ KIRMIZI = ANINDA GERİ SAR

**Auto-rollback triggers (20 total):**

1. **p95 > 400ms** VE/VEYA **5xx > 3%** (5 dk)
2. **BIST staleness > 120s** (3 dk)
3. **Idempotency conflict > 5%** (3 dk)
4. **Event-loop p95 > 100ms** (5 dk)
5. **GC avg > 20ms** (5 dk)
6. **pgBouncer pool > 90%** (3 dk)
7. **CSP violation flood** (2x baseline, 5 dk)
8. **Outbox lag p95 > 30s** (5 dk)

**Komut (tek satır, ≤5 dk):**

```powershell
pwsh scripts/rollback.ps1 -Reason "auto-trigger" -Stage "current-%"
```

---

## 🧷 3×30 SANİYELİK CEP KONTROLÜ

```bash
# 1. Prometheus target sayısı (health check)
curl -s :9090/api/v1/targets | jq '.data.activeTargets|length'

# 2. Outbox lag (p95 < 10s olmalı)
curl -s https://canary/api/outbox/lag | jq '.p95,.max'

# 3. Hızlı idem burst (10s smoke)
hey -z 10s -q 20 -m POST \
  -H "X-Idempotency-Key:test-$(date +%s)" \
  https://canary/api/exec/order
```

**Expected:**
- Prometheus: All targets UP
- Outbox p95 < 10s, max < 30s
- Idempotency: 1×200, 99×409 (conflict rate ~99%)

---

## 📊 KANIT DOSYASI ÇİPASI (otomatik)

**Auto-generated evidence (50+ files):**

- `release_tag.txt`
- `sbom_v*.json`
- `build_provenance_v*.json`
- `go_nogo_signed_v*.txt`
- `baseline_metrics_v*.txt`
- `canary_plan_v*.txt`
- `rollout_stage_*.txt` (per stage)
- `preflight_v*.txt`
- `micro_blast_v*.log`
- `artifact_manifest_v*.txt`

**Integrity check:**

```bash
sha256sum -c evidence/release_manifest.sha256
```

---

## 🕐 T+24h RİTMİ (kısa rota)

**Monitoring frequency:**
- **0–2h:** 15 dk'da bir metrik snapshot
- **2–6h:** 30 dk'da bir
- **6–24h:** Saatlik

**Kapanış (T+24h):**

```bash
bash scripts/snapshot-metrics.sh 100 && \
bash scripts/generate-release-oneliner.sh v1.4.0
```

**Freeze lift criteria:**
- 0 rollback triggers fired
- 0 escalations
- 8/8 signals green for 24h
- Evidence complete & archived

---

## 🧭 WAR-ROOM SINGLE-LINE FORMAT

```
T | S | p95 | 5xx | ws | risk | idem | csp | el | gc | ✓
```

**Example:**

```
08:15|1% |140|0.3|11s|0.1|0.2|+4%|12ms|8ms|✅
08:30|5% |145|0.3|12s|0.1|0.2|+5%|15ms|10ms|✅
08:45|25%|150|0.4|13s|0.2|0.3|+6%|18ms|12ms|✅
```

**Decision rules:**
- ✅ = 8/8 green → Proceed
- ⚠️ = 1-2 yellow → Hold 10m
- ❌ = Any red → Rollback

---

## 🔬 FINAL PHILOSOPHY

> **"Düğme bir deney başlatır: hipotez→ölçüm→kanıt→zarif geri dönüş. Sistem hızlı değil yalnızca; KANITLA HIZLI. 🚀🔬🛡️🎵"**

---

## 📋 PRE-FLIGHT MENTAL CHECKLIST (10s)

**Before pressing green button:**

- [ ] Kart cebimde (operator card laminated)
- [ ] Terminal açık (scripts ready)
- [ ] IC belirlendi (incident commander assigned)
- [ ] War-room kanal aktif (Slack/Teams)
- [ ] Rollback drill fresh (< 7 days)
- [ ] Evidence klasör temiz (ready to collect)
- [ ] Prometheus/Grafana erişim OK
- [ ] All hands on deck (team available)

---

## 🟢 SINGLE-COMMAND CHEAT SHEET

**Start:**
```bash
bash scripts/60s-preflight.sh v1.4.0 && \
bash scripts/micro-blast-radius-test.sh https://canary v1.4.0 30 && \
bash scripts/check-artifact-completeness.sh && \
bash scripts/green-button-ritual.sh v1.4.0
```

**Monitor:**
```bash
watch -n 5 'curl -s https://canary/api/healthz | jq'
```

**Rollback:**
```powershell
pwsh scripts/rollback.ps1 -Reason "[trigger]" -Stage "[%]"
```

**Close:**
```bash
bash scripts/snapshot-metrics.sh 100 && \
bash scripts/generate-release-oneliner.sh v1.4.0
```

---

## 🎯 SUCCESS CRITERIA (one-liner)

```
"Canary 1→100%: 0 rollback, p95≤200ms, 5xx≤1%, 
ws_p95≤30s, idem≤1%, csp≤+10%, el_p95≤50ms, gc≤20ms; 
50+ evidence files; freeze lift @ T+24h."
```

---

**🟢 KART LAMİNE, MİKRO PLAN CEPTE, OTOMASYON KEMERDE**

**DÜĞMEYE BAS, SİNYALLER ŞARKISINI SÖYLESİN;**  
**KANITLAR ARŞİVDE, GERİ DÖNÜŞ ZARAFETLE.**

**💚✈️ KANITLA HIZLI!**

---

_Laminate & carry | v1.4.0-ultimate-final | Scientific deployment pocket guide_
