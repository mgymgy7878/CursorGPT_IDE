# 🎯 GO-LIVE CEP KARTI - Tek Ekranlık Operasyon Kılavuzu
**Spark Trading Platform v1.2 - Production Launch**

```
┌───────────────────────────────────────────────────────────────┐
│ ZAMAN: 30 dk │ WAR-ROOM: #spark-go-live │ SORUMLU: ________ │
├───────────────────────────────────────────────────────────────┤
│ KARAR MODELİ: 5/5 + ≥80% → GO │ Aksi → NO-GO + Rollback    │
└───────────────────────────────────────────────────────────────┘
```

---

## ⚡ 1) ANINDA DUMAN TESTLERİ (T+2dk)

```powershell
# Health check
curl http://localhost:3003/api/healthz | jq '{status, p95: .slo.latencyP95}'
# Expected: status="UP", p95<120

# Grafana quick glance
# ui_latency_p95_confidence == high
# ui_error_rate_pct < 1

# SSE canlılık
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep sse_queue_depth_avg_gauge
# Expected: <40, throttle ≈1.0-2.0
```

**✅ PASS:** HTTP 200 + UP + p95<120 + queue<40  
**❌ FAIL:** NO-GO → Rollback

---

## 🚨 2) 3 TRIP-WIRE (Tetiklenirse Düşünmeden Fren)

### Wire 1: Error Rate
```
error_rate ≥ 1% ve 2dk sürer → NO-GO
```

### Wire 2: Staleness
```
staleness ≥ 20s ve 2dk sürer → AUTO-DEGRADE (MOCK) + NO-GO
```

### Wire 3: Sustained 429
```
429_sustained_total ↑ (10dk içinde ≥1) ve backoff düşmüyor → Trafik daralt + Beklet
```

**Action:** Herhangi bir wire tetiklendi → Kırmızı Düğme

---

## 🔴 3) ROLLBACK DÜĞMESI (Tek Satır Zihni)

```
⌘K → Toggle Kill-Switch → MOCK
Evidence ZIP (otomatik)
Restore: 25%→50%→100% (her faz 10dk, P95<120 teyidi)
```

**NOT:** Rollback sonrası 10dk P95<120 teyidi alınmadan %100'e çıkma!

---

## 📣 OPERASYON ŞABLONLARI

### ✅ GO Duyurusu (Slack Copy-Paste)
```
✅ GO verildi. P95 <120ms, error <1%, staleness <20s.
Kalkanlar aktif (auto-degrade, kill-switch, evidence ZIP).
Rollback eşiği: error≥1% veya staleness≥20s (≥2dk) ya da schema canary 3× fail.
```

### ❌ NO-GO Duyurusu (Slack Copy-Paste)
```
❌ NO-GO. Tetikleyici: <metrik + değer>.
Adımlar: MOCK degrade → incident ZIP (trace-ID + git SHA) → 10dk izleme → 25%→50%→100% kontrollü restore.
```

### 🚨 Incident Başlığı Template
```
[INC][UTC-<timestamp>] Breach <metric> — trace:<id> sha:<git-sha>
```

---

## 🔍 5DK KÖR NOKTA SÜPÜRGESI (Manuel Tik-Tik)

- [ ] **1.** Eşik eşleşmesi: healthz thresholds = docs ✅
- [ ] **2.** Cooldown canlı: 2. toggle → 4xx "cooldown" ✅
- [ ] **3.** SSE nedensellik: dropped↑ ise throttle↑ ✅
- [ ] **4.** WS tavanı: concurrent≤2, 30s→1 ✅
- [ ] **5.** 429 ayrımı: burst OK, sustained=0 ✅
- [ ] **6.** Kardinalite: symbol series≤10 ✅
- [ ] **7.** Saat bağışıklığı: skew uyarı, staleness alarm YOK ✅
- [ ] **8.** Budget: used<80% ✅
- [ ] **9.** Schema canary: eski parser canlı ✅

**Geçme:** 7/9 ✅ → Continue  
**Fail:** <7/9 → Review + fix

---

## 🧪 KURU PROVA (T-5dk, 60 Saniye)

```powershell
# Incident ZIP
⌘K → "Collect Incident ZIP"
Reason: "Preflight drill"
# Verify: trace-ID + git SHA in terminal

# Kill-switch toggle 2×
curl -X POST http://localhost:3003/api/tools/kill-switch/toggle -d "{\"reason\":\"Test 1234567890\"}"
# Wait 2s
curl -X POST http://localhost:3003/api/tools/kill-switch/toggle -d "{\"reason\":\"Should fail\"}"
# Expected: 429 "Cooldown active"

# Grafana: ui_latency_p95_confidence==high
```

---

## 👁️ 72 SAAT GÖZ ÇİZGİSİ (Hedefler)

| Zaman | Check | Hedef |
|-------|-------|-------|
| **T+30dk** | Alarm sessiz | critical=0, throttle≤2.0 |
| **T+6h** | 429 trend | sustained=0, backoff decay |
| **T+24h** | Kardinalite | growth≤50%, "other" stabil |
| **T+48h** | BIST probe | P95<300, uptime>99.5%, delta<5% |
| **T+72h** | Retro | 3 soru → action items |

---

## 🧨 KIRMIZI TAKIM (Haftaya 30dk)

1. **Partial packet loss** → SSE throttle 4.0×, UI <10% hissedilirlik
2. **429 flip-flop** → Backoff 1.5↔2.0 decay smooth
3. **Symbol churn** → Top-N + "other", kardinalite sabit

---

## 🛫 KALKIŞ KOMUTU (Tek Atım, 30dk)

```powershell
cd C:\dev
.\scripts\validation\go-no-go-kit-10dk.ps1
.\scripts\validation\final-gauntlet-15dk.ps1 -FullReport

# Expected: GO DECISION → 🚀 PROD DEPLOY
```

---

## 🎯 ÖZET (3 Satır)

**Telemetri:** P95=17ms, Error=0%, Staleness=0s → **GO için mükemmel** ✅  
**Sistem:** Kalkan + Fren + Pusula → **Nezaketle yavaşlama refleksi** ✅  
**Kalkış:** 30dk (9 kör + 5 kit + 7 gauntlet) → **GO DECISION** → **PİST SİZİNDİR** 🏁

---

*Cep kartı hazır. Yazdır, cepte taşı, tek bakışta karar ver.* 🎯

