# 🎯 GO-LIVE CLOSURE PROTOCOL
**v1.4.0 · Definition of Done · 10-Minute Check-Out**

---

## ✅ DEFINITION OF DONE (7 Madde)

### 1. **Canary Tamamlandı**
- ✓ 5 aşama (10%→25%→50%→75%→100%) geçildi
- ✓ 6/6 metrik eşiği geçti (p95, 5xx, ws, risk, idem, csp)
- ✓ Hiçbir rollback tetiklenmedi

### 2. **Stabil Pencere**
- ✓ 30 dakika boyunca 8/8 sinyal yeşil:
  - `p95 ≤ 200ms`
  - `5xx ≤ 1%`
  - `ws ≤ 30s`
  - `risk < 0.5/min`
  - `idem < 1%`
  - `csp ≤ +10%`
  - `evloop ≤ 50ms`
  - `gc ≤ 20ms`

### 3. **Kanıt Zinciri Mühürlü**
- ✓ 40+ evidence dosyası commit edildi
- ✓ Release notes yayınlandı
- ✓ Artifact deposu tam (59+ items)

### 4. **Handoff Yapıldı**
- ✓ War-room tek satır log kaydedildi
- ✓ "T+24h Mikro Debrief" görevi oluşturuldu
- ✓ Operasyon ekibi bilgilendirildi

### 5. **Rollback Tatbikatı**
- ✓ `rollback.ps1 -WhatIf` başarıyla geçti
- ✓ Rollback süresi ≤ 5dk doğrulandı
- ✓ Kanıt dosyaları yedeklendi

### 6. **Alarm Hijyeni**
- ✓ Kırmızı/yanlış-pozitif alarm yok
- ✓ Sessiz kritik alert kalmadı
- ✓ Uyarı eşikleri production için optimize edildi

### 7. **Freeze Kaldırıldı**
- ✓ PR'lar açıldı
- ✓ v1.5 backlog maddeleri oluşturuldu (4 hipotez)
- ✓ Deployment lock kaldırıldı

---

## ⏱️ 10 DAKİKALIK CHECK-OUT PROSEDÜRÜ

### Dakika 0–2: Son 30s Kilidi

```bash
bash tools/FINAL_30S_LOCK.sh
# Immutability checks (tag, build, SBOM)
# Alarm cleanliness verification
# Rollback dry-run drill
# KANIT HUD ping
```

**Beklenen Çıktı:**
```
✓ Tag immutable: v1.4.0
✓ Build immutable: SHA256 match
✓ SBOM sealed: 247 components
✓ Alarms clean: 0 red, 0 false-positive
✓ Rollback drill: 4.2s (PASS)
✓ KANIT HUD: 8/8 signals GREEN
```

---

### Dakika 2–5: Kanıt Mühürleme

```bash
# Son metrik snapshot
bash scripts/snapshot-metrics.sh > evidence/final_graduation_metrics.txt

# Evidence commit
git add evidence/*
git commit -m "v1.4.0 liftoff evidence (final graduation)"
git push origin main

# Artifact count check
bash scripts/check-artifact-completeness.sh
```

**Beklenen Çıktı:**
```
✓ 43 evidence files committed
✓ 59/59 artifacts complete
✓ Evidence size: 2.4 MB
```

---

### Dakika 5–7: Yayın & Handoff

**Release Notes Yayınla:**
```bash
gh release create v1.4.0 \
  -F docs/RELEASE_NOTES_v1.4.0.md \
  --title "Spark v1.4.0 - Scientific Deployment (Graduated)" \
  --notes "KANITLA HIZLI! · 59 artifacts · 99.9% readiness"
```

**War-Room Final Entry:**
```bash
echo "$(date -Is) | stage=100% | p95=142ms 5xx=0.2% ws=18s idem=0.1% risk=0.1/min csp=0/min evloop=23ms gc=8ms | karar=proceed (GRADUATED)" \
  | tee -a evidence/warroom.log
```

**T+24h Debrief Issue:**
```bash
gh issue create \
  -t "T+24h Micro Debrief - v1.4.0 Graduation" \
  -b "5-maddelik şablon: Metrikler, Anomaliler, Öğrenmeler, Aksiyonlar, v1.5 Hipotezler" \
  -l ops,debrief \
  -a @me
```

---

### Dakika 7–9: Freeze Kaldır

**Deployment Lock Kaldır:**
```bash
# GitHub branch protection update (örnek)
gh label delete "hold-for-canary" --yes || true

# Deployment pipeline enable
# (örnek: CI/CD config değişikliği)
```

**PR Gates Normalize:**
```bash
# Canary-specific gates → Standard gates
# (örnek: required checks listesi güncelleme)
```

---

### Dakika 9–10: v1.5 Kıvılcımı

**4 Hipotez → Backlog:**

```bash
# 1. Shadow Trading
gh issue create -t "v1.5: Shadow Trading Mode" \
  -b "Canlı feed, hayalet execution, risk-free test" \
  -l enhancement,v1.5

# 2. Attestations
gh issue create -t "v1.5: Evidence Attestations" \
  -b "Kanıt dosyaları için kriptografik imza" \
  -l enhancement,v1.5

# 3. Continuous Profiling
gh issue create -t "v1.5: Continuous Profiling Panel" \
  -b "CPU/memory flame graphs, production-ready" \
  -l enhancement,v1.5

# 4. SLO Budget Panel
gh issue create -t "v1.5: SLO Budget Panel" \
  -b "Error budget tracking, burn-rate alerts" \
  -l enhancement,v1.5
```

---

## 🛟 B PLANI (Emergency Rollback)

**İki ardışık HOLD** veya **3 kırmızı** görürsen:

```powershell
pwsh scripts/rollback.ps1 -Reason "post-canary-degradation" -Stage "current-%"
```

**Rollback Sonrası:**
1. Evidence snapshot al
2. Incident template doldur
3. Root cause analysis başlat
4. v1.4.1 patch planla

---

## 🔕 RİTÜEL KAPANIŞI (Steady-State Geçiş)

### Ritüel → Operasyon

**Haftalık Game Day (15 dk):**
```yaml
# .github/workflows/ops-cadence.yml
schedule:
  - cron: "0 9 * * 1"  # Her Pazartesi 09:00
jobs:
  game-day:
    - bash scripts/micro-blast-radius-test.sh
    - bash scripts/generate-release-oneliner.sh
```

**Aylık Kaos Tatbikatı:**
- Network latency injection (Toxiproxy)
- Database failover drill
- API rate-limit stress test

---

### Dashboard Dönüşümü

**"Canary" → "Ops Cadence" Görünümü:**
- Aynı 8 sinyal
- Daha uzun pencere (7 gün)
- Trend eğimleri
- SLO burn-rate

---

### Sürüm Damgası

```bash
git tag -a v1.4.0-graduated -m "Scientific Deployment - Production Ready"
git push origin v1.4.0-graduated
```

---

### Gürültü Diyeti

**Deneme Dönemindeki Ek Uyarıları Ayarla:**

```yaml
# Alert seviye ayarları
- name: experimental_metric_spike
  severity: warning  # critical → warning
  threshold: +20%    # +10% → +20%

# Gerçek P0'lar aynen kalır
- name: api_5xx_rate
  severity: critical
  threshold: 3%
```

---

## 📋 CLOSURE CHECKLIST

### Pre-Closure
- [ ] Canary 5 aşama tamamlandı
- [ ] 30dk stabil pencere doğrulandı
- [ ] 40+ evidence dosyası mevcut
- [ ] Rollback -WhatIf geçti

### Check-Out (10dk)
- [ ] Dakika 0–2: FINAL_30S_LOCK.sh ✓
- [ ] Dakika 2–5: Evidence commit ✓
- [ ] Dakika 5–7: Release + Handoff ✓
- [ ] Dakika 7–9: Freeze kaldır ✓
- [ ] Dakika 9–10: v1.5 backlog oluştur ✓

### Post-Closure
- [ ] T+24h debrief issue açık
- [ ] Ops cadence workflow aktif
- [ ] Dashboard "steady-state" modunda
- [ ] Gürültü diyeti uygulandı
- [ ] v1.4.0-graduated tag pushed

---

## 🎵 TL;DR

**Evet, BITER.**

1. Yukarıdaki 10 dakikalık check-out'u çalıştır
2. Definition-of-Done maddelerini doğrula
3. Freeze'i kaldır
4. v1.5 kıvılcımını yak

O andan sonra bu iş bir "deploy töreni" değil,
**ölç-kaydet-karar ver** ritmiyle süren **normal operasyon**.

---

## 🔮 FINAL MANTRA

**Panel yeşil, telemetri kilitli, KANIT HUD açık.**

**Metrikler şarkısını söylüyor; orkestra sende.**

**Kapanışı yap ve rahat nefes al.** 💚🚀

---

**Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş**

**KANITLA HIZLI! 🔬✨**

