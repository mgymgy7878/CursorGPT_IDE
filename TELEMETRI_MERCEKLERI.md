# 🔎 Telemetri Mercekleri - Hızlı Sağlık Kontrolü
**Spark Trading Platform - Quick Health Lens**

**Version:** 1.0  
**Date:** 2025-01-16  
**Usage:** Tek satır komutlarla sistem sağlığı

---

## 🎯 5 TEL Mercek (Her Biri 10 Saniye)

### Mercek 1: SLO Hızlı Bakış

**PromQL (Grafana):**
```promql
# P95 Latency (5 dk pencere)
ui_latency_p95_ms < 120

# Error Rate (5 dk pencere)
ui_error_rate_pct < 1

# Venue Staleness
venue_staleness_btcturk_sec < 20
venue_staleness_bist_sec < 20
```

**PowerShell (Terminal):**
```powershell
# Quick health JSON
curl -s http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95, error: .slo.errorRate, btc_stale: .venues.btcturk.stalenessSec}'

# Expected output
{
  "status": "UP",
  "p95": 17,
  "error": 0,
  "btc_stale": 0
}
```

**Pass Kriteri:** Status=UP, p95<120, error<1, stale<20

---

### Mercek 2: WS Sağlık

**PromQL:**
```promql
# Concurrent reconnects (max 2)
ws_reconnect_concurrent_gauge <= 2

# Reconnect rate (son 5 dk, max 5)
increase(ws_reconnects_total[5m]) <= 5

# Backoff active (rate limit sırasında 1 olmalı)
vendor_backoff_active
```

**PowerShell:**
```powershell
# WS metrics
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep -E "ws_reconnect|vendor_backoff"

# Expected
ws_reconnect_concurrent_gauge 1
ws_reconnects_total 7
vendor_backoff_active 0
```

**Pass Kriteri:** concurrent≤2, total artış ≤5/5dk, backoff logic aktif

---

### Mercek 3: SSE & Network

**PromQL:**
```promql
# Queue depth (max 100, hedef <80)
sse_queue_depth_avg_gauge < 80

# Throttle coefficient (1.0-4.0)
sse_throttle_coefficient_avg_gauge <= 4.0

# Dropped events (backpressure kanıtı)
sse_dropped_events_total{reason="backpressure"}
```

**PowerShell:**
```powershell
# SSE metrics
curl -s http://localhost:3003/api/tools/metrics?format=prometheus | grep -E "sse_queue|sse_throttle|sse_dropped"

# Expected
sse_queue_depth_avg_gauge 15
sse_throttle_coefficient_avg_gauge 1.0
sse_dropped_events_total{reason="backpressure"} 42
```

**Pass Kriteri:** queue<80, throttle≤4.0, dropped>0 (flood testinde)

---

### Mercek 4: Kardinalite & TSDB

**PromQL:**
```promql
# Total time series count
count({__name__=~".+"})

# Series by metric (top consumers)
topk(5, count by (__name__) ({__name__=~".+"}))
```

**PowerShell:**
```powershell
# Prometheus TSDB series
curl -s "http://localhost:9090/api/v1/query?query=count({__name__=~%22.%2B%22})" | jq .data.result[0].value[1]

# Expected: ~1500-2000 (baseline'a göre ≤%50 artış)

# Baseline ile karşılaştır
$baseline = Get-Content logs\validation\cardinality_baseline.txt
$current = 1620
$growth = (($current - $baseline) / $baseline) * 100
Write-Output "Growth: $growth% (limit: ≤50%)"
```

**Pass Kriteri:** Series artışı ≤50%, scrape süresi <5s

---

### Mercek 5: Evidence & Audit Trail

**Log Araması:**
```powershell
# Trace-ID ile incident chain
grep -E "trace_id=" logs\*.log | tail -10

# Flipflop rejects
grep "flipflop_reject" logs\audit.log

# Quality gate violations
grep -E "staleness_exceeded|price_anomaly|schema_validation" logs\bist_quality.log | tail -20
```

**Evidence ZIP Check:**
```powershell
# Son evidence ZIP'i kontrol et
$latestZip = Get-ChildItem evidence -Filter "*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestZip) {
    Write-Host "Latest evidence: $($latestZip.Name)"
    
    # ZIP içeriği
    Expand-Archive -Path $latestZip.FullName -DestinationPath "temp_check" -Force
    Get-ChildItem temp_check | Select-Object Name
    Remove-Item temp_check -Recurse -Force
}
```

**Pass Kriteri:** Trace-ID kaydedilmiş, ZIP'te git SHA + config + healthz

---

## 🚨 NO-GO Senaryoları & Aksiyonlar

### Senaryo 1: Staleness ≥20s (2 dk sürekli)

**Detection:**
```promql
venue_staleness_btcturk_sec >= 20 for 2m
```

**Auto-Action:**
1. Adaptive throttle ↑ (rate azalt)
2. Pre-alert log ("Staleness approaching limit")
3. 30s sonunda ≥30s ise → **MOCK degrade + Incident ZIP**

**Manual Override:**
```powershell
# Command Palette
⌘K → Toggle Kill-Switch (REAL↔MOCK)
Reason: "Manual intervention: Staleness sustained >20s"
```

---

### Senaryo 2: Error Rate ≥1% (2 dk sürekli)

**Detection:**
```promql
ui_error_rate_pct >= 1 for 2m
```

**Auto-Action:**
1. Check executor health (`/health`)
2. Pre-alert log ("Error rate approaching threshold")
3. 2dk sonunda ≥2% ise → **MOCK degrade + Incident ZIP**

**Manual Check:**
```powershell
# Executor health
curl http://127.0.0.1:4001/health

# Health detail
curl http://localhost:3003/api/healthz | jq .services.executor
```

---

### Senaryo 3: WS Reconnect Storm (concurrent >2)

**Detection:**
```promql
ws_reconnect_concurrent_gauge > 2
```

**Auto-Action:**
1. Global reconnect cap enforce (max 2 concurrent)
2. Queue excess reconnects
3. Log: "Reconnect storm detected, cap enforced"

**Manual Check:**
```powershell
# WS metrics
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep ws_reconnect

# Expected: concurrent_gauge ≤ 2 (cap working)
```

**NO Degrade:** Real feed tutulur, sadece throttle/backoff artırılır

---

### Senaryo 4: Schema Fail >3 Ardışık (BIST)

**Detection:**
```
Logs: "schema_validation FAILED" × 3 consecutive
```

**Auto-Action:**
1. Side-by-side parser aktif
2. Old parser devam eder
3. New parser canary modda test edilir
4. Alert: "Schema version mismatch, side-by-side active"

**Manual Check:**
```powershell
# BIST quality log
grep "schema_validation" logs\bist_quality.log | tail -10

# Metrics
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep bist_quality_gate
```

**Partial Degrade:** Sadece BIST kanalı mock'a döner, BTCTurk etkilenmez

---

## 📋 HIZLI TELEMETRI CHECKLIST (60 Saniye)

```powershell
# 1. Health (10s)
curl http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95, error: .slo.errorRate}'

# 2. Venue Staleness (5s)
curl http://localhost:3003/api/healthz | jq .venues

# 3. WS Status (5s)
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep ws_reconnect_concurrent

# 4. SSE Queue (5s)
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep sse_queue_depth_avg

# 5. Rate Limit (5s)
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep venue_http_429

# 6. Cardinality (10s - Prometheus)
curl "http://localhost:9090/api/v1/query?query=count({__name__=~%22.%2B%22})" | jq .data.result[0].value[1]

# 7. Evidence (5s)
ls evidence\*.zip | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# 8. Logs (10s)
grep -E "ERROR|CRITICAL|flipflop_reject" logs\*.log | tail -20
```

**Toplam:** ~60 saniye → **Sistem sağlığı snapshot**

---

## 🎯 "TEK SATIR" HEALTH CHECK

```powershell
# Süper hızlı (5 saniye)
curl -s http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95, error: .slo.errorRate, btc_stale: .venues.btcturk.stalenessSec, bist_stale: .venues.bist.stalenessSec}' && echo "✅ Quick check complete"

# Expected output
{
  "status": "UP",
  "p95": 17,
  "error": 0,
  "btc_stale": 0,
  "bist_stale": 0
}
✅ Quick check complete
```

**Alias (PowerShell profile):**
```powershell
# $PROFILE'e ekle
function spark-health {
    curl -s http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95, error: .slo.errorRate, btc: .venues.btcturk.stalenessSec}'
}

# Kullanım
spark-health
```

---

*Telemetri mercekleri hazır. Her biri 10 saniyede sistem sağlığını gösterir.* 🔍

