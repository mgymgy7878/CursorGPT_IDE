# 🔴 KIRMIZI DÜĞME RUNBOOK
**Spark Trading Platform - Emergency Response**

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Emergency Contact:** ops@spark-trading.com

---

## ⚠️ NE ZAMAN KULLANILIR

**Kırmızı Düğme** aşağıdaki durumlarda devreye alınır:

1. **Otomatik Degrade Tetiklendi** → Auto-degrade sistemin MOCK'a geçmesini başlattı
2. **Vendor Tam Kesinti** → BTCTurk/BIST API'leri >5 dakika erişilemez
3. **SLO Kritik Breach** → P95 >300ms, error rate >10%, staleness >60s (>5 dakika)
4. **Financial Loss Risk** → Trading stratejileri beklenmedik davranış (manual intervention gerekli)
5. **Security Incident** → Güvenlik tehdidi tespit edildi

---

## 🚨 ANLIK MÜDAHALE (İlk 60 Saniye)

### 1️⃣ **Durum Teyidi** (10 saniye)

```powershell
# Quick health check
curl http://localhost:3003/api/healthz | jq .

# Check metrics
curl http://localhost:3003/api/tools/metrics?format=prometheus | grep -E "(error_rate|latency_p95|venue_staleness)"

# Check kill-switch status
curl http://localhost:3003/api/tools/kill-switch/toggle | jq .history[-1]
```

**Hangi kriterleri kontrol et:**
- `status: "DEGRADED"` veya `"DOWN"`
- `slo.errorRate > 10`
- `venues.btcturk.stalenessSec > 60`
- `kill-switch` history'de son event `triggeredBy: "auto"`

### 2️⃣ **Command Palette: Incident ZIP** (20 saniye)

**Hotkey:** `⌘K` (Mac) veya `Ctrl+K` (Windows)

**Komut:**
```
> Collect Incident ZIP & Slack Page
```

**Prompt:**
```
Incident reason: [Kısa açıklama, ör: "SLO breach: P95 >300ms, vendor timeout"]
```

**Beklenen Çıktı:**
```
✅ Incident ZIP created: evidence/incident_20251016_141530.zip
✅ Slack notification sent to #spark-ops
📋 Incident ID: inc-abc123-def456
```

**ZIP İçeriği:**
- Son 10 dakika `/api/healthz` responses
- Prometheus dump (son 15 dk)
- WS/rate-limit/SSE logs
- Config snapshot (`.env.local`, `docker-compose.yml`)
- "Neden" metni (`incident_reason.txt`)

### 3️⃣ **Manuel Kill-Switch (Gerekirse)** (30 saniye)

**Eğer otomatik degrade çalışmadıysa:**

```powershell
# Command Palette
⌘K → Toggle Kill Switch (REAL↔MOCK)

# Veya API direct call
curl -X POST http://localhost:3003/api/tools/kill-switch/toggle \
  -H "Content-Type: application/json" \
  -d '{"reason":"Manual intervention: SLO kritik breach"}'
```

**Beklenen Çıktı:**
```json
{
  "success": true,
  "message": "Data mode switched to MOCK",
  "newMode": "MOCK",
  "event": {
    "id": "ks-789...",
    "cooldownUntil": "2025-01-16T14:30:00Z",
    "evidenceZip": "kill_switch_20251016_141530.zip"
  }
}
```

**UYARI:** Cooldown 15 dakika. Bu süre içinde geri dönüş yapılamaz (güvenlik mekanizması).

---

## 📋 RESTORE PROSEDÜRÜ (Gradual Un-Mock)

**Cooldown dolmadan restore REDDEDİLİR.** Acil durumda cooldown override için CTO onayı gerekir.

### Restore Hazırlık Checklist

- [ ] **Root Cause Belirlendi:** Incident sebebi net (vendor, kod hatası, config, vb.)
- [ ] **Fix Uygulandı:** Root cause için patch/config change yapıldı
- [ ] **Staging Test PASS:** Fix staging'de doğrulandı (smoke test)
- [ ] **Metrics Normalize:** Son 15 dakika metrics baseline'a döndü
- [ ] **Vendor SLA Doğrulandı:** Vendor uptime >99% (son 1 saat)
- [ ] **Team Approval:** On-call lead + CTO onayı

### Restore Adımları (Gradual 25%→50%→100%)

#### Phase 1: 25% Real Data (10 dakika)

```bash
# .env.local düzenle
SPARK_REAL_DATA=1
SPARK_REAL_DATA_PERCENTAGE=25  # %25 trafik gerçek veriye

# Dev server restart
pnpm dev
```

**Monitoring:**
- `/api/healthz` → P95 <120ms, error rate <1%
- Venue staleness <20s
- No new incidents (10 dk)

**Rollback Trigger:**
- P95 >150ms (5 dakika sürekli)
- Error rate >2%
- Venue staleness >30s

#### Phase 2: 50% Real Data (10 dakika)

```bash
# .env.local güncelle
SPARK_REAL_DATA_PERCENTAGE=50
```

**Monitoring:** Same as Phase 1

#### Phase 3: 100% Real Data (∞)

```bash
# .env.local güncelle
SPARK_REAL_DATA_PERCENTAGE=100
# veya environment variable'ı tamamen kaldır (default 100%)
```

**Post-Restore Monitoring (24 saat):**
- SLO metrics her 5 dakikada kontrol
- Alert rules aktif (Grafana)
- Daily risk report review

---

## 🛡️ EMNİYET ŞERİDİ

### Otomatik NO-GO Tetikleyiciler

Aşağıdaki durumlar **otomatik MOCK'a dönüş** tetikler:

| Metrik | Threshold | Duration | Action |
|--------|-----------|----------|--------|
| `venues.btcturk.stalenessSec` | >20s | 2 dakika | Auto-degrade + alert |
| `slo.errorRate` | >1% | 2 dakika | Auto-degrade + alert |
| `ws_reconnects_total` | >5 | 5 dakika | Alert (degrade değil) |
| `venue_http_429_sustained_total` | >1 | 5 dakika | Throttle artır, alert |

### Manual Override (Acil Durum)

**Sadece CTO onayı ile:**

```bash
# Cooldown bypass (15 dk beklemeden restore)
curl -X POST http://localhost:3003/api/tools/kill-switch/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CTO_TOKEN" \
  -d '{"reason":"CTO override: Critical business need","approvedBy":"cto@spark.com"}'
```

**UYARI:** Override kullanımı audit log'a kaydedilir ve postmortem'de açıklanmalıdır.

---

## 📞 ESCALATION

### Level 1: On-Call Engineer (0-5 dakika)
**Action:**
- Incident ZIP oluştur
- Kill-switch manuel tetikle (gerekirse)
- Slack #spark-ops'ta durum update

**Escalate to Level 2 if:**
- Root cause belirsiz (>5 dakika)
- Vendor SLA breach (>10 dakika downtime)
- Financial loss riski

### Level 2: Engineering Lead (5-15 dakika)
**Action:**
- Root cause analizi
- Vendor support contact (gerekirse)
- Fix stratejisi belirleme

**Escalate to Level 3 if:**
- Fix >30 dakika sürecek
- Vendor unresponsive
- Revenue impact >$X

### Level 3: CTO + Management (15+ dakika)
**Action:**
- Executive decision (örn: vendor switch, manual trading pause)
- Customer communication
- Postmortem planning

---

## 📊 POST-INCIDENT CHECKLIST

### Immediate (< 1 saat)
- [ ] Incident timeline oluştur (Zaman çizelgesi)
- [ ] Evidence ZIP arşivle
- [ ] Affected users/strategies belirle
- [ ] Financial impact estimate

### Short Term (< 24 saat)
- [ ] Root cause analysis (5 Whys)
- [ ] Hotfix uygulandı mı?
- [ ] Monitoring gaps belirlendi mi?
- [ ] Alert rules güncellendi mi?

### Long Term (< 1 hafta)
- [ ] Postmortem raporu yayınlandı
- [ ] Action items assign edildi
- [ ] Runbook güncellendi (bu doküman)
- [ ] Team training yapıldı

---

## 📚 İLGİLİ DOKÜMANLAR

- **Monitoring Guide:** `docs/monitoring/README.md`
- **SLO Thresholds:** `apps/web-next/src/app/api/healthz/route.ts`
- **Vendor Comparison:** `BIST_VENDOR_COMPARISON_MATRIX.md`
- **Kill-Switch Implementation:** `apps/web-next/src/app/api/tools/kill-switch/`

---

## 🔄 VERSİYON GEÇMİŞİ

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-16 | İlk versiyon: Otomatik degrade, gradual restore |

---

*Kırmızı Düğme Runbook - Spark Trading Platform*  
*"Panik değil, prosedür"* 🔴

