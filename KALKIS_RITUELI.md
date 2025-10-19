# 🚀 KALKIŞ RİTÜELİ - 15 Dakika Tek Geçiş Sertifikası
**Spark Trading Platform - Production Launch Ceremony**

**Version:** 1.0  
**Date:** 2025-01-16  
**Duration:** 15 dakika  
**Status:** 🎯 READY TO EXECUTE

---

## ⚡ TEK KOMUT ÇALIŞTIR

```powershell
# Kalkış ritüelini başlat
.\scripts\validation\final-gauntlet-15dk.ps1 -FullReport

# Beklenen süre: 10-15 dakika
# Geçme eşiği: ≥80% success rate
```

---

## ✅ ZORUNLU İMZALAR (7/7 Gerekli)

### İmza 1: Kill-Switch Disiplin
**Metrik:** `flipflop_rejects_total ≥ 1`  
**Kanıt:** Evidence ZIP'te `event.json` + `reason.txt`  
**Anlam:** Cooldown mekanizması çalışıyor, flip-flop engellenmiş

### İmza 2: WS Reconnect Cap
**Metrik:** `ws_reconnect_concurrent_gauge ≤ 2`  
**Kanıt:** 60s network cutoff sırasında max concurrent 2  
**Anlam:** Vendor overload koruması aktif

### İmza 3: SSE Backpressure
**Metrik:** `sse_dropped_events_total > 0` (10× flood'da)  
**Kanıt:** Queue depth plateau, RAM stabil  
**Anlam:** Drop-oldest + adaptive throttle çalışıyor

### İmza 4: Kardinalite Sigortası
**Metrik:** TSDB series artışı ≤ 50%  
**Kanıt:** Prometheus query: `count({__name__=~".+"})`  
**Anlam:** Top-N aggregation aktif, kardinalite kontrol altında

### İmza 5: Staleness Critical Reject
**Metrik:** `stale > 30s → CRITICAL REJECT` (warning değil!)  
**Kanıt:** Quality gate log'da "staleness_exceeded" + reject  
**Anlam:** Veri kalitesi guard'ları sıkı

### İmza 6: Vendor Backoff Görünürlük
**Metrik:** `vendor_backoff_active = 1` (rate limit sırasında)  
**Kanıt:** Prometheus metrics + logs  
**Anlam:** Adaptif backoff devrede, vendor korunuyor

### İmza 7: Trace-ID Completeness
**Metrik:** Evidence ZIP'te `trace_id` + `git_sha` + `branch`  
**Kanıt:** `incident_meta.json` içinde  
**Anlam:** Uçtan uca izlenebilirlik

---

## 📊 HIZLI PANO BAKIŞI (Grafana/Prometheus)

### 5 Dakikalık Kaydırmalı Pencere Metrikleri

```promql
# P95 Latency (5 dk pencere)
histogram_quantile(0.95, rate(ui_latency_p95_ms[5m])) < 120

# Error Rate (5 dk pencere)
rate(ui_error_rate_pct[5m]) < 1

# Venue Staleness (5 dk pencere)
max_over_time(venue_staleness_btcturk_sec[5m]) < 20
```

**Geçme Kriteri:**
- ✅ Tüm metrikler yeşil (threshold altı)
- ✅ `vendor_backoff_active=1` olduğu anlarda bile UI P95 sapma yok (<10ms)
- ⚠️ Tek geçici spike kabul edilir (kayan pencere absorbe etmeli)

### Quick Glance Dashboard (Tek Bakış)

```
┌─────────────────────────────────────────────────┐
│ SPARK PLATFORM - QUICK GLANCE                   │
├─────────────────────────────────────────────────┤
│ P95 Latency:    17ms ✅ (120ms)                 │
│ Error Rate:      0% ✅ (1%)                      │
│ Staleness:       0s ✅ (20s)                     │
│ Venue (BTCTurk): 0s ✅ (20s)                     │
│ WS Concurrent:    1 ✅ (≤2)                      │
│ SSE Queue:      15% ✅ (<80%)                    │
│ TSDB Series:   +35% ✅ (≤50%)                    │
└─────────────────────────────────────────────────┘
```

---

## 🔒 EVIDENCE PAKETİNİ KİLİTLE

### Minimum ZIP İçeriği (7 Dosya)

```
evidence/final_gauntlet_$(timestamp).zip
├── gauntlet_summary.json        # 7 gauntlet sonuçları
├── healthz_dump.json            # /api/healthz snapshot
├── prometheus_metrics.txt       # Full metrics dump
├── trace_id.txt                 # Current trace ID
├── git_metadata.json            # SHA + branch + dirty status
├── config_snapshot.json         # .env.local + docker-compose
└── incident_timeline.md         # Kronolojik olaylar (varsa)
```

**Validation:**
```powershell
# ZIP içeriğini doğrula
$zipPath = "evidence\final_gauntlet_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
Expand-Archive -Path $zipPath -DestinationPath "temp_validate"

$required = @("gauntlet_summary.json", "healthz_dump.json", "prometheus_metrics.txt", "git_metadata.json")
$missing = @()

foreach ($file in $required) {
    if (-not (Test-Path "temp_validate\$file")) {
        $missing += $file
    }
}

if ($missing.Count -eq 0) {
    Write-Host "✅ Evidence package complete" -ForegroundColor Green
} else {
    Write-Host "❌ Evidence package incomplete: $($missing -join ', ')" -ForegroundColor Red
}

Remove-Item "temp_validate" -Recurse -Force
```

---

## 🚨 KIRMIZI BAYRAK → ANINDA TEPKİ

### Otomatik Tetikleyiciler (Auto-Action)

| Bayrak | Threshold | Duration | Auto-Action | Manual Override |
|--------|-----------|----------|-------------|-----------------|
| **Staleness ≥20s** | 20s | 2 dk | Adaptive throttle ↑ | N/A |
| **Staleness ≥30s** | 30s | 2 dk | **MOCK degrade** + ZIP | ⌘K kill-switch |
| **WS Reconnect Seli** | >2 concurrent | Anında | Reconnect cap devrede | Check network |
| **429 Burst** | >5 in 10s | Anında | Backoff 1.5× | N/A |
| **429 Sustained** | >15 in 1min | Anında | Backoff 2.0× | Reduce load |
| **Cardinality Explosion** | >50% growth | Anında | Top-N enforce | Review metrics |

### Manuel Müdahale (⌘K Quick Actions)

```
1. Collect Incident ZIP & Slack (20s)
   → trace-ID + git SHA + full context

2. Toggle Kill-Switch (10s)
   → REAL↔MOCK + 15dk cooldown

3. Show Venue Metrics (5s)
   → Prometheus snapshot

4. Widgets Smoke (5min)
   → Real data validation
```

---

## 🛠️ MIKRO-İNCE AYARLAR - 90 DAKİKA HIZLI KONTROL

### Batch 1: Sembol-Duyarlı Delta (30 dk)

**File:** `apps/web-next/src/lib/sse-delta-throttle.ts`

**Checklist:**
- [ ] `SYMBOL_THRESHOLDS` matrisi eklendi
- [ ] XRP_TRY: tickSize=0.0001, minChangePct=0.2
- [ ] BTC_TRY: tickSize=1, minChangePct=0.05
- [ ] `shouldEmitTickSymbolAware()` fonksiyonu aktif
- [ ] Test: XRP emit rate +%35, BTC korunur

**Verification:**
```powershell
# XRP vs BTC emit rate comparison
curl "http://localhost:3003/api/tools/metrics?format=prometheus" | grep "sse_delta_throttle_skipped_total"
# XRP skip count < BTC skip count olmalı
```

---

### Batch 2: SSE Kapalı Devre (30 dk)

**File:** `apps/web-next/src/app/api/market/btcturk/stream/route.ts`

**Checklist:**
- [ ] `AdaptiveSSEQueue` interface eklendi
- [ ] `adjustThrottleCoefficient()` fonksiyonu aktif
- [ ] Queue >80% → throttle +0.5
- [ ] Queue <40% → throttle -0.25
- [ ] Range: 1.0-4.0×

**Verification:**
```powershell
# SSE throttle coefficient
curl "http://localhost:3003/api/tools/metrics?format=prometheus" | grep "sse_throttle_coefficient"
# Normal trafik: ~1.0, yüksek trafik: ~2.0-3.0
```

---

### Batch 3: İzlenebilirlik (30 dk)

**Files:**
- `apps/web-next/src/middleware.ts` (trace-ID injection)
- `apps/web-next/src/app/api/tools/incident/create/route.ts`

**Checklist:**
- [ ] Middleware: `x-trace-id` header inject
- [ ] Incident API: Git SHA extraction
- [ ] ZIP contents: `incident_meta.json` with trace-ID + git
- [ ] Command Palette: "Collect Incident ZIP" updated

**Verification:**
```powershell
# Create test incident
curl -X POST http://localhost:3003/api/tools/incident/create \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test incident for trace-ID validation"}'

# Check ZIP contents
$zipPath = "evidence\incident_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
Expand-Archive -Path $zipPath -DestinationPath "temp_check"
cat temp_check\incident_meta.json | jq .traceId,.git.sha
```

---

## 📡 48 SAATLİK PARALEL PROBE (BIST Vendor)

### Hızlı Başlangıç

```powershell
# Phase 1: Trial Setup (4 saat)
.\scripts\bist-vendor-probe\setup-trials.ps1

# Phase 2-3: Benchmark + Shadow Read (48 saat, paralel)
Start-Job -ScriptBlock {
    .\scripts\bist-vendor-probe\rtt-benchmark.ps1 -VendorName "Matriks" -DurationHours 48
}

Start-Job -ScriptBlock {
    .\scripts\bist-vendor-probe\shadow-read.ps1 -VendorName "Matriks" -Symbols @("THYAO","AKBNK","GARAN")
}

# Progress monitoring
Get-Job | Receive-Job -Keep
```

### Day-2 Gözlem Kriterleri

**Grafana Dashboard: "BIST Vendor Probe"**

**Paneller:**
1. **RTT/P95 Timeline** (48h)
   - P50/P95/P99 eğrileri
   - Target: P95 <300ms
   
2. **Shadow Read Delta Distribution**
   - Vendor vs mock price delta
   - Target: Mean delta <5%
   
3. **Quality Gate Pass Rate**
   - Staleness, schema, anomaly
   - Target: >99.9%

4. **SSE Queue Depth Waves**
   - Queue utilization dalga yüksekliği
   - Target: %60-70 stabil

5. **Sustained 429 Trend**
   - Burst vs sustained violations
   - Target: Sustained = 0

**Olgunlaşma Kriteri:**
- Trend-aware CI gate devredeyken tek-spike alarm YOK
- Eşikler korunur (mean + 2σ formülü stabil)

---

## 🎬 ROLLBACK MİKRO-RUNBOOK (60 Saniye)

### T+0s: Quick Glance
```powershell
curl http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95, error: .slo.errorRate, staleness: .venues.btcturk.stalenessSec}'
```

**RED FLAGS:**
- `status: "DEGRADED"` veya `"DOWN"`
- `p95 > 150` (eşiğin %25 üstü)
- `error > 2` (eşiğin 2× üstü)
- `staleness > 30` (kritik eşik)

### T+20s: Incident ZIP
```powershell
# Command Palette (⌘K)
> Collect Incident ZIP & Slack

# Prompt
Reason: [Kısa, net, ör: "P95 spike 300ms, vendor timeout suspected"]

# Beklenen
✅ ZIP: evidence/incident_$(timestamp).zip
✅ Slack: #spark-ops notification
✅ Trace-ID logged
```

### T+30s: Kill-Switch (Gerekirse)
```powershell
# Command Palette
> Toggle Kill-Switch (REAL↔MOCK)

# Reason prompt
Reason: [Manual intervention: SLO kritik breach]

# Beklenen
✅ Mode: MOCK
✅ Cooldown: 15 dakika
✅ Evidence: kill_switch_$(timestamp).zip
```

### T+60s: Restore Preparation
```powershell
# Root cause belirleme (paralel, blocking değil)
# Fix uygulama (kod/config)
# Staging smoke test

# Cooldown dolduktan sonra (T+15 dakika):
# Gradual restore: 25% → 50% → 100% (her 10dk)
```

---

## 🎯 GEÇİŞ NOTU ŞABLONUgerçek çıktı)

```
═══════════════════════════════════════════════════════════
FINAL GAUNTLET - GEÇER NOT RAPORU
═══════════════════════════════════════════════════════════

✅ Gauntlet 1: Zaman Üçlüsü (3/3 PASS)
  ✅ clock_skew_ms=2500, staleness alarm YOK
  ✅ market_closed=1, zero-volume silent
  ✅ DST geçiş: Çift kayıt YOK

✅ Gauntlet 2: Kimlik & Kota (2/2 PASS)
  ✅ burst_violations_total=2, sustained=1, backoff=1.5x
  ✅ vendor_adaptive_backoff_multiplier aktif

✅ Gauntlet 3: Ağ Şiddeti (2/2 PASS)
  ✅ ws_reconnect_concurrent_gauge=1 (≤2 ✅)
  ✅ sse_dropped_events_total=42, egress ≤30%, RAM plato

✅ Gauntlet 4: Kardinalite (2/2 PASS)
  ✅ TSDB series: +35% (baseline: 1200 → current: 1620)
  ✅ Top-N: venue_requests_by_symbol_total = 10 series

✅ Gauntlet 5: Kill-Switch (3/3 PASS)
  ✅ flipflop_rejects_total=1, cooldown=15m
  ✅ Evidence ZIP: trace_id + git_sha + healthz + config
  ✅ Restore 25%→50%→100%: SLO alarm YOK

✅ Gauntlet 6: Veri Kalitesi (2/2 PASS)
  ✅ stale>30s → CRITICAL REJECT (warning değil!)
  ✅ +12% price jump → WARNING (VWAP check)

✅ Gauntlet 7: Maliyet (2/2 PASS)
  ✅ Budget %110: Throttle active, fallback YOK
  ✅ vendor_cost_usd_total tracking OK

═══════════════════════════════════════════════════════════
SERTİFİKA: ✅ BAŞARILI (95% success rate)
PROD'A ÇIKIŞ: ONAYLANDI ✅
═══════════════════════════════════════════════════════════

Evidence: validation/final_gauntlet_20251016_142030/
  - gauntlet_summary.json
  - healthz_dump.json
  - prometheus_metrics.txt
  - git_metadata.json (sha: a1b2c3d, branch: main)
  - trace_id.txt (trace-xyz789)

Exit Code: 0
```

---

## 📋 24 SAATLİK DAY-2 GÖZLEM

### Monitoring Checklist

#### Her 5 Dakikada (Otomatik)
- [ ] `/api/healthz` → P95, error, staleness
- [ ] Prometheus → `sse_queue_depth_gauge` trend
- [ ] Prometheus → `ws_reconnect_concurrent_gauge` max

#### Her 1 Saatte (Manuel Review)
- [ ] Grafana → P50/P95/P99 eğrileri (keskin pik yok mu?)
- [ ] Logs → `sustained_violations` trend (artış yok mu?)
- [ ] Logs → `degrade_prealert` count (yanlış-pozitif yok mu?)

#### Day-2 Sonunda (24h)
- [ ] Baseline güncelleme (yeni P95 ortalaması)
- [ ] Alert threshold mikro-ayar (gerekirse)
- [ ] Evidence package arşivleme

**Olgunlaşma Onayı:**
- Trend-aware CI gate aktif
- Tek-spike alarmı yok (kayan pencere absorbe etti)
- Mean + 2σ formülü stabil

---

## 🎯 NET NET - "PİST SİZİNDİR"

### Elinizde Ne Var:

**Kalkan (Koruma):**
- ✅ Auto-degrade + cooldown
- ✅ Quality gates (staleness critical reject)
- ✅ Cardinality guard (top-N + "other")

**Fren (Kontrol):**
- ✅ Adaptive throttle (SSE queue optimize)
- ✅ Adaptive backoff (burst/sustained)
- ✅ Rate limit cap (concurrent reconnect ≤2)

**Pusula (İzleme):**
- ✅ SLO pencereleri (kayan, min 50 sample)
- ✅ Trace-ID trail (uçtan uca)
- ✅ Evidence ZIP (otomatik + manuel)

### Ritüel Sırası:

```
1. Final gauntlet çalıştır (15 dk)
   → ≥80% success rate → PASS ✅

2. Evidence ZIP kilitle (5 dk)
   → 7 dosya eksiksiz → LOCKED ✅

3. Grafana quick glance (2 dk)
   → Tüm metrikler yeşil → READY ✅

4. Mikro-ince ayarlar (90 dk, opsiyonel)
   → Delta + SSE + Trace-ID → ENHANCED ✅

5. BIST probe başlat (48h, paralel)
   → Matriks RTT + shadow read → DECISION READY ✅

6. Day-2 gözlem (24h)
   → Trend stabil → MATURE ✅

═══════════════════════════════════════════════════════════
PROD'A ÇIKIŞ: ONAYLANDI ✅
PİST: SİZİNDİR 🏁
═══════════════════════════════════════════════════════════
```

---

*Kalkış Ritüeli hazır. Final gauntlet'i koşun, imzaları toplayın, pistten kalkın.* 🚀

