# 🚦 GO-LIVE CEP KARTI — Tek Ekranlık Operasyon Kılavuzu

```
┌───────────────────────────────────────────────────────────────┐
│ ZAMAN: 30 dk │ WAR-ROOM: #spark-go-live │ SORUMLU: <owner> │
├───────────────────────────────────────────────────────────────┤
│ KARAR: 5/5 Go-No-Go PASS + Gauntlet ≥%80 ⇒ GO │ Aksi ⇒ NO-GO │
└───────────────────────────────────────────────────────────────┘
```

---

## 0️⃣ TEK KOMUTLA KALKIŞ (30 dk)

```powershell
cd C:\dev
.\scripts\validation\go-no-go-kit-10dk.ps1
.\scripts\validation\final-gauntlet-15dk.ps1 -FullReport
```

**Geçer not:** Go/No-Go 5/5, Gauntlet ≥%80

---

## 1️⃣ 2 DAKİKALIK DUMAN TESTİ (CLI + göz testi)

```bash
# Health check
curl http://localhost:3003/api/healthz
# Expected: 200, status:UP, latencyP95<120

# Grafana: ui_latency_p95_confidence==high, error_rate<1%
# SSE: sse_queue_depth_avg_gauge < 40, sse_throttle_coefficient_avg_gauge ≤ 2.0
```

**✅ PASS:** HTTP 200 + UP + p95<120 + queue<40  
**❌ FAIL:** NO-GO → Rollback

---

## 2️⃣ ÜÇ "TRIP-WIRE" (Tetiklenirse dur, tartışma yok)

### Wire 1: Error Rate
```
Error ≥ 1% ve ≥2 dk sürerse ⇒ NO-GO
```

### Wire 2: Staleness  
```
Staleness ≥ 20s ve ≥2 dk sürerse ⇒ AUTO-DEGRADE (MOCK) + NO-GO
```

### Wire 3: Sustained 429
```
429 sustained (10 dk içinde ≥1 artış) ve backoff düşmüyorsa ⇒ trafik daralt + beklet
```

**Action:** Herhangi bir wire tetiklendi → Kırmızı Düğme

---

## 3️⃣ KIRMIZI DÜĞME (60 sn, tek nefes)

```
⌘K → "Collect Incident ZIP" (trace-ID + Git SHA)
Kill-switch ⇒ MOCK (15 dk cooldown kanıtlı)
Gradual restore: 25% → 50% → 100% (her faz 10 dk, P95<120 teyidi)
```

**NOT:** Rollback sonrası 10dk P95<120 teyidi alınmadan %100'e çıkma!

---

## 4️⃣ SON 5 DK "KÖR NOKTA" SÜPÜRGESI (elde tik at)

- [ ] **Eşikler dokümanla birebir** (/api/healthz)
- [ ] **İkinci kill-switch denemesi** ⇒ "cooldown active" (4xx)
- [ ] **SSE nedensellik:** …dropped_events_total↑ ⇒ aynı pencerede …throttle_coefficient↑
- [ ] **WS tavan:** ws_reconnect_concurrent_gauge ≤ 2 (30 sn sonra 1'e iner)
- [ ] **429 ayrımı:** burst olabilir; sustained olamaz
- [ ] **Kardinalite:** venue_requests_by_symbol_total ≤10 seri, kalan "other"
- [ ] **Budget:** venue_budget_used_pct < 80

**Geçme:** 5/7 ✅ → Continue  
**Fail:** <5/7 → Review + fix

---

## 5️⃣ HAZIR SLACK ŞABLONLARI (kopyala-yapıştır)

### ✅ GO Bildirimi
```
✅ GO verildi. P95<120ms, error<1%, staleness<20s.
Kalkanlar aktif (auto-degrade, kill-switch, evidence ZIP). 
Rollback eşiği: error≥1% veya staleness≥20s (≥2 dk).
```

### ❌ NO-GO Bildirimi
```
❌ NO-GO. Tetikleyici: <metric>=<value>.
Adımlar: MOCK'a degrade → Incident ZIP (trace-ID + Git SHA) → 
10 dk izleme → 25%→50%→100% kontrollü geri yükleme.
```

### 🚨 Incident Başlığı
```
[INC][UTC-<ts>] Breach <metric> — trace:<id> sha:<git-sha>
```

---

## 6️⃣ 72 SAATLIK "GÖZ ÇİZGİSİ" (yalın hedefler)

| Zaman | Check | Hedef |
|-------|-------|-------|
| **T+30dk** | Alarm sessiz | critical=0, throttle_avg ≤ 2.0 |
| **T+6h** | 429 trend | sustained=0, backoff decay |
| **T+24h** | Kardinalite | growth≤50%, "other" stabil |
| **T+48h** | BIST probe | P95<300, uptime>99.5%, delta<5% |
| **T+72h** | Retro | 3 soru → action items |

---

## 7️⃣ HIZLI GERÇEKLİK KONTROLÜ (telemetri eşikleri)

**Mevcut:** P95 ~17ms (eşik 120ms) · Error 0% (eşik 1%) · Staleness 0s (eşik 20s)

**Kontrol:** WS cap ≤2, SSE throttle 1.0–4.0×, Rate-limit burst≠sustained

---

## 8️⃣ NOTLAR (pusu noktaları)

- **Schema sürümü bilinmiyorsa:** yeni parser gölgede, eski parser canlı
- **Holiday/DST:** zero-vol yalnızca seans içinde uyarı verir  
- **Evidence trail:** her olayda trace-ID + Git SHA kilitli

---

## 🎯 ÖZET (3 Satır)

**Pist:** Temiz ✅  
**Kalkan:** Nazik ✅  
**Fren:** Ayarlı ✅  

**Ateşleme anahtarını çevir; veri meteor yağmuru başlasa bile sistem önce fısıldar, sonra hızını alır, en sonda güvenli şeride sokar** 🚀

---

*Cep kartı hazır. Yazdır, cepte taşı, tek bakışta karar ver.* 🎯
