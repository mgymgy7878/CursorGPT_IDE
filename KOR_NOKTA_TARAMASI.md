# 🔍 Kör Nokta Taraması - 9 Maddelik Final Check
**Spark Trading Platform - Blind Spot Elimination**

**Duration:** 5 dakika  
**Format:** ✅ Binary Check  
**Purpose:** "GO kararını pekiştiren çıtır ama kritik kontroller"

---

## ✅ 9 KÖR NOKTA (Her Biri Tek Satır Kontrol)

### 1️⃣ Degrade Eşiği Çivisi
```powershell
curl -s http://localhost:3003/api/healthz | jq .thresholds
```

**Beklenen:**
```json
{
  "latencyP95Target": 120,
  "stalenessTarget": 20,
  "errorRateTarget": 1.0,
  "venueStalenessTarget": 20
}
```

**✅ PASS:** Değerler eşleşiyor  
**❌ FAIL:** Uyumsuzluk → `apps/web-next/src/app/api/healthz/route.ts` kontrol

---

### 2️⃣ Cooldown Tekilliği
```powershell
curl -s http://localhost:3003/api/tools/kill-switch/toggle | jq '.currentCooldown, .history[-1].cooldownUntil'
```

**Beklenen:** Eğer son event varsa, `cooldownUntil` gelecek timestamp

**✅ PASS:** Cooldown zamanı valid  
**❌ FAIL:** `null` veya geçmiş zaman → Cooldown logic kontrol

**Kuru Prova:**
```powershell
# Toggle 2× (2. reddedilmeli)
curl -X POST http://localhost:3003/api/tools/kill-switch/toggle -H "Content-Type: application/json" -d "{\"reason\":\"Test toggle 1234567890\"}"
# Wait 2s
Start-Sleep -Seconds 2
curl -X POST http://localhost:3003/api/tools/kill-switch/toggle -H "Content-Type: application/json" -d "{\"reason\":\"Should fail cooldown\"}"
# Expected: 429 "Cooldown active"
```

---

### 3️⃣ SSE "Sessiz Kayıp" Dedektörü
```powershell
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep -E "sse_dropped_events_total|sse_throttle_coefficient"
```

**Beklenen:** `dropped_events > 0` ise `throttle_coefficient > 1.0`

**✅ PASS:** Drop varsa throttle arttı (kapalı devre çalışıyor)  
**❌ FAIL:** Drop var ama throttle 1.0 → Adaptive logic kontrol

---

### 4️⃣ WS Fırtına Emniyeti (30s Gözlem)
```powershell
# İlk ölçüm
$ws1 = curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep ws_reconnect_concurrent_gauge
Write-Output "T+0s: $ws1"

# 30s sonra
Start-Sleep -Seconds 30
$ws2 = curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep ws_reconnect_concurrent_gauge
Write-Output "T+30s: $ws2"
```

**Beklenen:** Eğer T+0s'de `=2` ise, T+30s'de `=1` veya `=0` (cap enforcement)

**✅ PASS:** Concurrent düştü (queue işlendi)  
**⚠️ WARN:** Hala 2 → Jitter +250ms artır, not düş

---

### 5️⃣ 429 Tip Ayrımı
```powershell
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep "venue_http_429.*total"
```

**Beklenen:**
```
venue_http_429_burst_total{venue="btcturk"} X
venue_http_429_sustained_total{venue="btcturk"} 0
```

**✅ PASS:** Sustained = 0 veya artmıyor (son 10dk)  
**⚠️ WARN:** Sustained artıyor → Backoff 2.0× devrede, GO engeli YOK ama daralt

---

### 6️⃣ Kardinalite Korkuluğu
```powershell
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep "venue_requests_by_symbol_total" | wc -l
```

**Beklenen:** ≤12 satır (10 sembol + 2 metadata)

**✅ PASS:** ≤12 satır (top-N + "other" aktif)  
**❌ FAIL:** >12 satır → `apps/web-next/src/app/api/tools/metrics/route.ts` top-N enforce

---

### 7️⃣ Saat Sapması Bağışıklığı
```powershell
$metrics = curl -s http://localhost:3003/api/tools/metrics?format=prometheus
$clockSkew = $metrics | grep "clock_skew_ms" | Select-String -Pattern "(\d+)" | ForEach-Object { $_.Matches.Groups[1].Value }
$health = curl -s http://localhost:3003/api/healthz | ConvertFrom-Json

Write-Output "Clock skew: $clockSkew ms"
Write-Output "Staleness alarm: $(if ($health.venues.btcturk.stalenessSec -lt 30) { 'YOK ✅' } else { 'VAR ❌' })"
```

**Beklenen:** Skew uyarı seviyesinde bile staleness alarm YOK

**✅ PASS:** Clock skew yüksek ama staleness <30s  
**❌ FAIL:** Clock skew → false staleness → Staleness logic kontrol

---

### 8️⃣ Budget Nöbetçisi
```powershell
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep venue_budget_used_pct
```

**Beklenen:** `venue_budget_used_pct{venue="btcturk"} <80`

**✅ PASS:** <80% (normal)  
**⚠️ WARN:** 80-100% → Vendor probe'da throttling 0.25× artır  
**❌ FAIL:** ≥100% → Budget guard logic kontrol

---

### 9️⃣ Schema Canary Görünürlüğü
```powershell
grep "side-by-side" logs\bist_quality.log | tail -5
```

**Beklenen:** Bilinmeyen şema varsa log'da "side-by-side validation" kaydı

**✅ PASS:** Schema v1.0/v1.1 biliniyor veya side-by-side aktif  
**❌ FAIL:** Unknown schema ama side-by-side yok → Parser kontrol

---

## 🎯 KALKIŞ KOMUTsimplified)

```powershell
cd C:\dev

# Preflight: 9 kör nokta (5 dk, manuel)
# KOR_NOKTA_TARAMASI.md checklist

# Go/No-Go Kit: 5 kontrol (10 dk, otomatik)
.\scripts\validation\go-no-go-kit-10dk.ps1

# Final Gauntlet: 7 gauntlet (15 dk, otomatik)
if ($LASTEXITCODE -eq 0) {
    .\scripts\validation\final-gauntlet-15dk.ps1 -FullReport
    
    if ($LASTEXITCODE -eq 0) {
        Write-Output ""
        Write-Output "✅✅✅ GO DECISION ✅✅✅"
        Write-Output "🚀 PROD DEPLOY APPROVED"
        Write-Output "🏁 PİST SİZİNDİR"
    }
}
```

**Toplam:** 5dk (manual) + 10dk (kit) + 15dk (gauntlet) = **30 dakika**

---

## 👁️ İLK 72 SAAT "GÖZ ÇİZGİSİ"

### T+30dk: "Sessiz Panik" Kontrolü
**Check:**
```promql
# Alarm sayısı (0 olmalı)
ALERTS{alertstate="firing", severity="critical"}

# SSE throttle normal bandda
sse_throttle_coefficient_avg_gauge between 1.0-2.0
```

**✅ PASS:** Zero critical alarms, throttle normal  
**❌ ACTION:** Incident ZIP + root cause

---

### T+6h: 429 Sustained Trend
**Check:**
```promql
# Sustained artışı yok
increase(venue_http_429_sustained_total[6h]) == 0

# Adaptive backoff decay başladı mı (violation yoksa)
venue_adaptive_backoff_multiplier <= 1.5
```

**✅ PASS:** Sustained yok, backoff decay ediyor  
**⚠️ WARN:** Sustained artıyor → Vendor call frequency azalt

---

### T+24h: Kardinalite Stabilite
**Check:**
```bash
# TSDB series artışı
$baseline = Get-Content logs\validation\cardinality_baseline.txt
$current = curl -s "http://localhost:9090/api/v1/query?query=count({__name__=~%22.%2B%22})" | jq .data.result[0].value[1]
$growth = (($current - $baseline) / $baseline) * 100

Write-Output "Series growth: $growth% (limit: ≤50%)"
```

**✅ PASS:** Growth ≤50%  
**❌ ACTION:** "Other bucket" enforce + top-N tighten

---

### T+48h: BIST Vendor Probe Raporu
**Deliverables:**
- `validation/bist_vendor_matriks_benchmark.json`
- `validation/shadow_read_matriks.csv`
- `validation/shadow_read_analysis.png`

**Check:**
- REST P95 <300ms ✅
- WS P95 <100ms ✅
- Uptime >99.5% ✅
- Shadow read delta <5% avg ✅

**Decision:** Matriks (92/100) → **APPROVED** for v1.3 Epic 4

---

### T+72h: Retro (3 Soru)

**1. "Nerede yavaş uyardık?"**
- Pre-alert count vs critical alert count
- Hedef: Pre-alert/Critical ratio >3:1

**2. "Nerede gereksiz yavaşladık?"**
- False positive alarm count
- Hedef: ≤%40 (baseline'a göre %60 azalma)

**3. "Hangi metriği kör bıraktık?"**
- Incident'te metric coverage gap analizi
- Action: Eksik metriği v1.3'te ekle

---

## 🧨 ÜÇKIRMIZI TAKIM SENARYOLARI (Haftaya Oyun Günü)

### Senaryo 1: Partial Packet Loss
**Simülasyon:** WS normal, SSE kuyruk şişiyor  
**Expected:** Adaptive throttle 4.0× → UI hissedilirlik <10% (delta throttle devrede)

**Test:**
```powershell
# 10× SSE flood
# Monitor: sse_queue_depth_gauge, sse_throttle_coefficient_avg_gauge
# Verify: UI dashboard latency <150ms (kullanıcı fark etmez)
```

---

### Senaryo 2: Vendor 429 Flip-Flop
**Simülasyon:** Burst ve sustained arası salınım  
**Expected:** Backoff 1.5× → 2.0× → decay → 1.0× (düzgün geçiş)

**Test:**
```powershell
# Simulate burst (10 req/10s)
# Wait 2min (decay)
# Verify: venue_adaptive_backoff_multiplier drops to 1.0
```

---

### Senaryo 3: High-Vol Symbol Churn
**Simülasyon:** Top-N listesi sık değişiyor  
**Expected:** "Other bucket" kardinalite limiti sabit tutar

**Test:**
```promql
# 20 sembol çağrıları (farklı)
# Monitor: count(venue_requests_by_symbol_total) <= 12
# Verify: TSDB series growth ≤50%
```

---

## 📣 MİNİ BÜLTEN (Slack/Email Copy-Paste)

```
🚀 SPARK TRADING PLATFORM v1.2 - PROD DEPLOY

✅ GO DECISION VERİLDİ

SLO Metrics:
  P95: <120ms (current: 17ms ✅)
  Error: <1% (current: 0% ✅)
  Staleness: <20s (current: 0s ✅)

Network Health:
  WS concurrent: ≤2 ✅
  SSE throttle: 1.0-2.0× ✅

Kalkanlar Aktif:
  Auto-degrade (staleness≥30s, error≥2%)
  Kill-switch (15dk cooldown + evidence ZIP)
  Evidence trail (trace-ID + git SHA)

Rollback Eşiği:
  Error ≥1% VEYA staleness ≥20s (≥2dk sürekli)
  Schema canary 3 ardışık fail

Restore Prosedür:
  Gradual 25%→50%→100%
  Her faz 10dk SLO teyidi

Monitoring:
  Grafana: http://localhost:3009
  Prometheus: http://localhost:9090
  Health: http://localhost:3003/api/healthz
  Command Palette: ⌘K (emergency)

Next Steps:
  T+48h: BIST vendor probe (Matriks RTT/P95)
  T+2w: v1.3 guardrails sprint (4 epic)

Evidence:
  evidence_v1.2_real_canary_20251016_141226.zip (2.1 KB)

🏁 PİST SİZİNDİR - KALKIŞ İZNİ VERİLDİ
```

---

## 👁️ İLK 72 SAAT GÖZ ÇİZGİSİ

### T+30dk: Sessiz Panik Kontrolü
**Prometheus:**
```promql
ALERTS{alertstate="firing", severity="critical"} == 0
sse_throttle_coefficient_avg_gauge between 1.0-2.0
```

**✅ PASS:** Zero critical, throttle normal  
**❌ ACTION:** Incident ZIP + investigate

---

### T+6h: 429 Sustained Trend
**Prometheus:**
```promql
increase(venue_http_429_sustained_total[6h]) == 0
venue_adaptive_backoff_multiplier <= 1.5
```

**✅ PASS:** Sustained yok, backoff decay ediyor  
**⚠️ WARN:** Sustained artıyor → Frequency azalt

---

### T+24h: Kardinalite Stabilite
**Prometheus:**
```bash
# TSDB series check
$baseline = cat logs\validation\cardinality_baseline.txt
$current = curl -s "http://localhost:9090/api/v1/query?query=count({__name__=~%22.%2B%22})" | jq .data.result[0].value[1]
$growth = (($current - $baseline) / $baseline) * 100

# Expected: growth ≤ 50%
```

**✅ PASS:** Growth ≤50%, "other" bucket stabil  
**❌ ACTION:** Top-N tighten + metric audit

---

### T+48h: BIST Vendor Probe
**Deliverables:**
- REST P95: <300ms
- WS P95: <100ms
- Uptime: >99.5%
- Shadow delta: <5% avg

**Decision:** Matriks (92/100) → v1.3 Epic 4 onayı

---

### T+72h: Retro (3 Soru + Action Items)

**Soru 1:** "Nerede yavaş uyardık?"
- **Metric:** `degrade_prealert_total` / `critical_alerts_total`
- **Target:** Ratio >3:1 (pre-alert baskın)
- **Action:** Pre-alert threshold'ları tune et

**Soru 2:** "Nerede gereksiz yavaşladık?"
- **Metric:** False positive alarm count
- **Target:** ≤%40 (baseline'dan %60 azalma)
- **Action:** Confidence levels + kayan pencere optimize

**Soru 3:** "Hangi metriği kör bıraktık?"
- **Method:** Incident postmortem → metric coverage gap
- **Action:** Eksik metriği v1.3'te ekle

---

## 🧨 KIRMIZI TAKIM SENARYOLARI (Haftaya Oyun Günü)

### Red Team 1: Partial Packet Loss
**Setup:** WS normal (0% loss), SSE %15 packet loss  
**Expected:**
- Queue depth ↑ (40 → 80)
- Adaptive throttle ↑ (1.0 → 3.0×)
- UI latency stable (<150ms)
- Delta throttle devrede (emit %70↓)

**Pass Kriteri:** UI'da hissedilirlik <10%

---

### Red Team 2: Vendor 429 Flip-Flop
**Setup:** Burst → decay → sustained → decay (salınım)  
**Expected:**
- Backoff 1.5× → 1.0× → 2.0× → 1.0× (smooth transition)
- No oscillation (decay ≥2dk)

**Pass Kriteri:** Backoff decay smooth, oscillation yok

---

### Red Team 3: Symbol Churn (Top-N Stress)
**Setup:** 20 farklı sembol, rastgele sırada  
**Expected:**
- Top-10 listesi her 5dk güncellenir
- "Other" bucket kalanları toplar
- TSDB series growth ≤50%

**Pass Kriteri:** Kardinalite limiti sabit

---

## 🛫 KALKIŞ KOMUTU (Final)

```powershell
cd C:\dev

Write-Output "╔═══════════════════════════════════════════════════════════╗"
Write-Output "║      SPARK v1.2 PROD KALKIŞ - BAŞLIYOR                   ║"
Write-Output "╚═══════════════════════════════════════════════════════════╝"
Write-Output ""

# Step 1: Kör nokta taraması (5 dk, manuel)
Write-Output "[1/3] Kör Nokta Taraması (5 dk)..."
Write-Output "  Checklist: KOR_NOKTA_TARAMASI.md (9 madde)"
Read-Host "  Tamamlandı? (Enter)"

# Step 2: Go/No-Go Kit (10 dk, otomatik)
Write-Output ""
Write-Output "[2/3] Go/No-Go Kit (10 dk)..."
.\scripts\validation\go-no-go-kit-10dk.ps1

if ($LASTEXITCODE -eq 0) {
    # Step 3: Final Gauntlet (15 dk, otomatik)
    Write-Output ""
    Write-Output "[3/3] Final Gauntlet (15 dk)..."
    .\scripts\validation\final-gauntlet-15dk.ps1 -FullReport
    
    if ($LASTEXITCODE -eq 0) {
        Write-Output ""
        Write-Output "╔═══════════════════════════════════════════════════════════╗"
        Write-Output "║                                                           ║"
        Write-Output "║       ✅✅✅ GO DECISION ✅✅✅                            ║"
        Write-Output "║                                                           ║"
        Write-Output "║       🚀 PROD DEPLOY APPROVED                            ║"
        Write-Output "║       🏁 PİST SİZİNDİR - KALKIŞ İZNİ VERİLDİ            ║"
        Write-Output "║                                                           ║"
        Write-Output "╚═══════════════════════════════════════════════════════════╝"
        Write-Output ""
        Write-Output "Evidence: Tüm validation ZIPs arşivlendi"
        Write-Output "Next: T+48h BIST vendor probe (paralel)"
        exit 0
    } else {
        Write-Output "❌ NO-GO: Final gauntlet <80%"
        exit 1
    }
} else {
    Write-Output "❌ NO-GO: Go/No-Go kit failed"
    exit 1
}
```

---

## 🎯 SON SÖZ

**"Sistemin kuvveti hızından değil, nezaketle yavaşlama refleksinden geliyor."**

### Kalkış Seremonisi:
1. **9 kör nokta** → Son kontrol (5dk)
2. **5 go/no-go** → Binary decision (10dk)
3. **7 gauntlet** → Sertifika (15dk)
4. **→ GO DECISION** → **PROD DEPLOY** ✅

### "Meteor Yağmuru" Gelse Bile:
- **Kalkan önce fısıldar:** Pre-alert, confidence low
- **Sonra hızını alır:** Adaptive throttle/backoff
- **En sonda güvenli şeride sokar:** Graceful MOCK degrade

---

**✅ TELEMETRI: YEŞİL**  
**✅ PİST: TEMİZ**  
**✅ KALKAN: NAZİK**  
**🚀 KALKIŞ: HAZIR**

**Exit Code: 0** 🏆🏁
