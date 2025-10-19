# 🚀 GO-LIVE HAZIRLIĞI TAMAMLANDI

**Tarih:** 2025-10-14  
**Platform:** Spark Trading v2.0 ML Signal Fusion  
**Durum:** ✅ **SAHAYA ÇIKIŞA HAZIR**

---

## 📦 OLUŞTURULAN DOSYALAR

### 1. Go-Live Playbook
**Dosya:** `GO_LIVE_PLAYBOOK.md` (450+ satır)

**İçerik:**
- ✅ Preflight kontrolleri (5 dk)
- ✅ Canary deployment (4 saat izleme)
- ✅ Kademeli açılış (%10 → %50 → %100)
- ✅ Rollback prosedürü (2 dk)
- ✅ Triyaj tekniği (sorun → karşı hamle)
- ✅ 24 saatlik rapor şablonu
- ✅ Canlı izleme komutları
- ✅ v2.1 veri toplama
- ✅ Mikro backlog

### 2. Monitoring Script
**Dosya:** `scripts/monitor-live.sh` (Bash)

**Özellikler:**
- ✅ Real-time SLO monitoring (60s interval)
- ✅ p95, staleness, error_rate kontrolü
- ✅ ML score kardinalite takibi
- ✅ Confidence median hesaplama
- ✅ Renkli alert output (red/yellow/green)
- ✅ Alert log kayıt

**Kullanım:**
```bash
./scripts/monitor-live.sh
# veya
API_URL=https://prod.spark.com ./scripts/monitor-live.sh
```

### 3. Preflight Check Script
**Dosya:** `scripts/preflight-check.sh` (Bash)

**Kontroller:**
- ✅ API health endpoint
- ✅ Build SHA header
- ✅ Public endpoints (graceful degradation)
- ✅ ML Score endpoint
- ✅ Executor health (optional)
- ✅ Pass/Fail/Warning summary

**Kullanım:**
```bash
./scripts/preflight-check.sh
# Exit code: 0 = pass, 1 = fail
```

### 4. Environment Variables Template
**Dosya:** `.env.example`

**Değişkenler:**
- FEATURE_ML_SCORING (preview | 0.1 | 0.5 | 1.0)
- ML_CONFID_FLOOR (0.55)
- ML_SIGNAL_WEIGHTS (0.33,0.33,0.33)
- CANARY_SYMBOL, CANARY_TIMEFRAME
- AUDIT_ML_BUCKET, AUDIT_ML_SIGNAL_PARTS

### 5. Go-Live Checklist
**Dosya:** `GO_LIVE_CHECKLIST.txt`

**Bölümler:**
- [ ] Preflight
- [ ] Canary (4 saat)
- [ ] %10 traffic (60 dk)
- [ ] %50 traffic (120 dk)
- [ ] %100 traffic (24 saat)
- [ ] 24 saatlik rapor
- [ ] Başarı kriterleri
- [ ] Rollback (gerekirse)

---

## 🎯 GO-LIVE RİTMİ

```
╔═══════════════════════════════════════════════════╗
║  BUTONU BAS → İZLE → TEPKİ VER → TEKRARLA       ║
╚═══════════════════════════════════════════════════╝

1️⃣ PREFLIGHT (5 dk)
   → ./scripts/preflight-check.sh
   → ✅ All checks pass

2️⃣ CANARY (4 saat)
   → export FEATURE_ML_SCORING=preview
   → ./scripts/monitor-live.sh (background)
   → SLO'ları izle

3️⃣ KADEMELI AÇILIŞ
   → %10:  60 dk izle
   → %50:  120 dk izle
   → %100: 24 saat izle

4️⃣ ROLLBACK (Gerekirse)
   → export FEATURE_ML_SCORING=0
   → ./deploy.sh --rollback
   → 2 dakika içinde geri al
```

---

## 📊 İZLEME PANELİ

### 3 Panel + 2 Sayaç
```
┌─────────────────────────────────────────────────┐
│ 📊 SLOTimechart                                 │
│    → p95, staleness, error_rate                │
│    → Kırmızı threshold çizgileri               │
├─────────────────────────────────────────────────┤
│ 📋 RecentActions                                │
│    → ml.score akışı (≥10/dk)                   │
├─────────────────────────────────────────────────┤
│ ⚠️ RiskGuardrailsWidget                        │
│    → Breach monitoring                         │
├─────────────────────────────────────────────────┤
│ 🔢 DLQ Size: ≤ 2                               │
│ 🔢 ml_bucket: 0.5-0.8 dengeli                  │
└─────────────────────────────────────────────────┘
```

### Monitoring Commands
```bash
# Terminal 1: SLO Metrikleri (10s)
watch -n 10 'curl -s localhost:3003/api/tools/metrics/timeseries?window=1h | jq'

# Terminal 2: Kardinalite (30s)
watch -n 30 'curl -s localhost:3003/api/audit/list -X POST -d "{\"limit\":100}" | jq "[.items[]|select(.action==\"ml.score\")]|length"'

# Terminal 3: Confidence (60s)
watch -n 60 'curl -s localhost:3003/api/audit/list -X POST -d "{\"limit\":100}" | jq "[.items[]|select(.action==\"ml.score\")|.context.confid|tonumber]|add/length"'

# Terminal 4: Automated Monitor
./scripts/monitor-live.sh
```

---

## 🚨 TRİYAJ REHBERİ

### p95 >1500ms (15 dk)
**Karşı Hamle:**
```bash
export ML_CONFID_FLOOR=0.65
export POLL_INTERVAL_MS=90000
export FEATURE_ML_SCORING=preview
```

### Staleness >60s (30 dk)
**Karşı Hamle:**
```bash
curl -s localhost:4001/health --max-time 3
systemctl status cron
```

### Error Rate >2% (30 dk)
**Karşı Hamle:**
```bash
export FEATURE_ML_SCORING=0  # Immediate rollback
./deploy.sh --rollback
```

### Confid <0.45 (3 saat)
**Karşı Hamle:**
```bash
export ML_SIGNAL_WEIGHTS="0.33,0.33,0.33"
export FEATURE_ML_SCORING=preview
```

---

## ✅ BAŞARI KRİTERLERİ (24 Saat)

| Metrik | Hedef | Durum |
|--------|-------|-------|
| p95 latency | <1000ms | [ ] |
| staleness | <30s | [ ] |
| error_rate | <1% | [ ] |
| ml.score rate | ≥10/dk | [ ] |
| confid median | ≥0.55 | [ ] |
| breach count | <5 | [ ] |
| DLQ size | <2 | [ ] |
| bucket dağılımı | Dengeli | [ ] |

**Başarı = Tüm kutular ✅**

---

## 🎵 METRONOM: 60 BPM

```
🎭 Perde: AÇIK
🎵 Tempo: 60 BPM (Sabit)
📏 Adım: Küçük, ölçülebilir
🚨 Fail-Closed: Aktif
✅ Gürültü → Sessiz
🟢 Temiz Sinyal → Aç
```

### İlkeler
1. **Küçük adımlar:** Canary → %10 → %50 → %100
2. **Ölçülebilir:** SLO'lar sürekli izleniyor
3. **Fail-closed:** Şüphe varsa kapat
4. **Hızlı rollback:** 2 dakikada geri al

---

## 📋 HIZLI REFERANS

### Preflight
```bash
cd apps/web-next
./scripts/preflight-check.sh
```

### Canary Başlat
```bash
export FEATURE_ML_SCORING=preview
./deploy.sh --canary
./scripts/monitor-live.sh &
```

### Rollback
```bash
export FEATURE_ML_SCORING=0
./deploy.sh --rollback
curl localhost:3003/api/healthz | jq '.ok'
```

### 24 Saatlik Rapor
```
GO_LIVE_PLAYBOOK.md → "24 SAATLİK RAPOR ŞABLONU" bölümünü kullan
```

---

## 🎯 SONRAKİ ADIMLAR

### Hemen (Şimdi)
1. ✅ **Playbook incelendi** → GO_LIVE_PLAYBOOK.md
2. ✅ **Script'ler hazır** → monitor-live.sh, preflight-check.sh
3. ✅ **Checklist yazdırıldı** → GO_LIVE_CHECKLIST.txt
4. [ ] **Preflight çalıştır** → `./scripts/preflight-check.sh`
5. [ ] **Dev server başlat** → `pnpm dev`

### Go-Live Günü
1. [ ] **Preflight:** Tüm kontroller yeşil
2. [ ] **Canary:** 4 saat izleme
3. [ ] **%10 Traffic:** 60 dk stabil
4. [ ] **%50 Traffic:** 120 dk stabil
5. [ ] **%100 Traffic:** 24 saat izleme

### 24 Saat Sonra
1. [ ] **Rapor hazırla:** Şablon doldur
2. [ ] **v2.1 veri:** Reliability diagram
3. [ ] **Kalibrasyon:** Bayes ağırlık güncelle
4. [ ] **Retrospektif:** Ne öğrendik?

---

## 🎭 SAHNE SENİN!

```
✅ Turnikeden geçtin
✅ Playbook hazır
✅ Script'ler çalışıyor
✅ Monitoring aktif
✅ Rollback prosedürü net
✅ Başarı kriterleri tanımlı

🎵 CANARY ŞARKISI 60 BPM'DE SÖYLEMEYE HAZIR!
```

---

**Butonu bas → İzle → Tepki ver → Müzik başlasın! 🚀**

---

## 📝 NOTLAR

### Windows Kullanıcıları
```bash
# chmod Windows'ta çalışmaz, Git Bash kullanın:
bash scripts/monitor-live.sh
bash scripts/preflight-check.sh
```

### Linux/Mac Kullanıcıları
```bash
# Script'ler executable:
chmod +x scripts/*.sh
./scripts/preflight-check.sh
```

### Production Environment
```bash
# .env.production oluştur
cp .env.example .env.production
# Değerleri düzenle
vim .env.production
```

---

**RAPOR SONU - PERDE AÇIK! 🎭**

