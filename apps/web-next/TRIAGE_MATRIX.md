# 🚨 TRİYAJ MATRİSİ - ACİL DURUM REFLEKSLERİ

**Kullanım:** Belirti → Eşik → Tek satırlık refleks (kopyala-çalıştır)

---

## 📊 BELİRTİLER VE REFLEKSLER

### 1️⃣ P95 Latency ↑ (Uzun Süre)

**Belirti:**
- p95 >1000ms ve artıyor
- API response time yüksek
- CPU usage arttı

**Eşik:** >1500ms (15 dakika boyunca)

**Refleks:**
```bash
# Preview-only mode + confidence floor yükselt
export FEATURE_ML_SCORING=preview
export ML_CONFID_FLOOR=0.65
export POLL_INTERVAL_MS=90000  # +%50 yavaşlat
./deploy.sh --rolling

# Verify
curl -s localhost:3003/api/healthz | jq
```

**İzleme:**
```bash
watch -n 10 'curl -s localhost:3003/api/tools/get_metrics | jq .p95_ms'
```

---

### 2️⃣ Staleness ↑ (Veri Gecikmesi)

**Belirti:**
- Staleness >30s
- "Last update" timestamp eski
- Data freshness düşük

**Eşik:** >60s (30 dakika boyunca)

**Refleks:**
```bash
# Executor ping test (3s timeout)
curl -s http://localhost:4001/health --max-time 3 || echo "❌ Executor timeout"

# Taze veri kapısı kontrol
curl -s http://localhost:4001/metrics | grep spark_last_update_timestamp

# Skorlamayı preview'a al
export FEATURE_ML_SCORING=preview
./deploy.sh --rolling
```

**İzleme:**
```bash
watch -n 5 'date && curl -s localhost:4001/metrics | grep staleness'
```

---

### 3️⃣ Error Rate ↑ (API Hataları)

**Belirti:**
- Error rate >1%
- 500/503 responses
- Audit log'da _err entries

**Eşik:** >2% (30 dakika boyunca)

**Refleks:**
```bash
# IMMEDIATE ROLLBACK
export FEATURE_ML_SCORING=0
./deploy.sh --rollback

# Verify health
curl -s localhost:3003/api/healthz | jq '.ok'

# Son 100 error analizi
curl -s localhost:3003/api/audit/list \
  -X POST \
  -H 'content-type: application/json' \
  -d '{"limit":100}' | jq '[.items[]|select(._err)]|group_by(._err)|map({err:.[0]._err,count:length})|sort_by(.count)|reverse|.[0:3]'
```

**İzleme:**
```bash
watch -n 10 'curl -s localhost:3003/api/tools/get_metrics | jq .error_rate'
```

---

### 4️⃣ Median Confidence ↓ (Model Güvensiz)

**Belirti:**
- ML confidence çok düşük
- Signal parts correlation zayıf
- Bucket 0.3-0.4'te yığılmış

**Eşik:** <0.40 (3 saat boyunca)

**Refleks:**
```bash
# Sinyal ağırlıklarını sabitle (equal weight)
export ML_SIGNAL_WEIGHTS="0.33,0.33,0.33"  # RSI, MACD, Trend
export FEATURE_ML_SCORING=preview

# Kalibrasyon data işaretle
echo "$(date -Iseconds),low_confidence_period,median_confid=$(curl -s localhost:3003/api/audit/list -X POST -d '{\"limit\":100}' | jq '[.items[]|select(.action==\"ml.score\")|.context.confid|tonumber]|add/length')" >> data/calibration_markers.csv

./deploy.sh --rolling
```

**İzleme:**
```bash
watch -n 60 'curl -s localhost:3003/api/audit/list -X POST -d "{\"limit\":100}" | jq "[.items[]|select(.action==\"ml.score\")|.context.confid|tonumber]|add/length"'
```

---

### 5️⃣ DLQ Büyüyor (Queue Problem)

**Belirti:**
- Dead Letter Queue >2
- Message processing fail
- Consumer lag arttı

**Eşik:** >2 (sürekli)

**Refleks:**
```bash
# Retry backoff + enqueue yarıya indir
export RETRY_BACKOFF_MS=5000
export MAX_ENQUEUE_RATE=50  # Yarıya indir

# Consumer sağlığı kontrol
curl -s http://localhost:4001/metrics | grep spark_dlq_size
curl -s http://localhost:4001/metrics | grep spark_consumer_lag

# Gerekirse restart
systemctl restart spark-executor
```

**İzleme:**
```bash
watch -n 30 'curl -s localhost:4001/metrics | grep -E "spark_dlq_size|spark_consumer_lag"'
```

---

## 🎯 HIZLI REFERans TRİYAJ TABLOSU

| Belirti | Eşik | 1-Satır Refleks |
|---------|------|----------------|
| **p95 ↑** | >1500ms (15dk) | `FEATURE_ML_SCORING=preview ML_CONFID_FLOOR=0.65 ./deploy.sh --rolling` |
| **staleness ↑** | >60s (30dk) | `curl localhost:4001/health --max-time 3 && FEATURE_ML_SCORING=preview ./deploy.sh` |
| **error_rate ↑** | >2% (30dk) | `FEATURE_ML_SCORING=0 ./deploy.sh --rollback` |
| **confid ↓** | <0.40 (3h) | `ML_SIGNAL_WEIGHTS=0.33,0.33,0.33 FEATURE_ML_SCORING=preview ./deploy.sh` |
| **DLQ ↑** | >2 | `systemctl restart spark-executor` |

---

## 🚨 ESKALASyon SEVİYELERİ

### 🟢 Level 0: Normal (No Action)
- p95 <1000ms
- staleness <30s
- error_rate <1%
- confid >0.55
- DLQ <2

**Aksiyon:** Yok, izlemeye devam

---

### 🟡 Level 1: Warning (Adjust)
- p95 1000-1500ms
- staleness 30-60s
- error_rate 1-2%
- confid 0.45-0.55
- DLQ 2-5

**Aksiyon:** 
```bash
export FEATURE_ML_SCORING=preview
export ML_CONFID_FLOOR=0.65
./deploy.sh --rolling
```

---

### 🟠 Level 2: Alert (Throttle)
- p95 >1500ms (<15dk)
- staleness >60s (<30dk)
- error_rate >2% (<30dk)
- confid <0.45 (<3h)
- DLQ >5

**Aksiyon:**
```bash
# Throttle aggressively
export FEATURE_ML_SCORING=preview
export POLL_INTERVAL_MS=120000  # 2 dakikaya yavaşlat
export ML_CONFID_FLOOR=0.70
./deploy.sh --rolling
```

---

### 🔴 Level 3: Critical (Rollback)
- p95 >1500ms (>15dk)
- staleness >60s (>30dk)
- error_rate >2% (>30dk)
- confid <0.40 (>3h)
- DLQ >10

**Aksiyon:**
```bash
# IMMEDIATE ROLLBACK
export FEATURE_ML_SCORING=0
./deploy.sh --rollback

# Notify team
echo "🚨 CRITICAL ROLLBACK: $(date)" | tee -a alerts.log
```

---

## 📋 24 SAATLİK RAPOR ŞABLONU

```markdown
# ML SCORING GO-LIVE RAPORU

**Tarih:** $(date +%Y-%m-%d)
**Faz:** Canary / %10 / %50 / %100
**Süre:** 24 saat

## Özet
- **p95:** ___ms (hedef: ≤1000ms)
- **staleness:** ___s (hedef: ≤30s)
- **error_rate:** ___% (hedef: ≤1%)
- **hit_rate:** ___% (ML score success)
- **incident_rate:** ___ (kritik/minör)
- **median_confid:** ___ (hedef: ≥0.55)

## Kardinalite
- **ml.score toplam:** ___ entries
- **Dakika ortalaması:** ___ entries/dk (hedef: ≥10)

## Kalibrasyon (Bucket Hit-Rate)
- **0.5-0.6:** ___%
- **0.6-0.7:** ___%
- **0.7-0.8:** ___%
- **0.8-0.9:** ___%

**Dağılım:** [ ] Dengeli  [ ] Çarpık  [ ] Yığılmış

## Sinyal Parçaları (Correlation)
- **RSI:** ___ (beklenen: ~0.33)
- **MACD:** ___ (beklenen: ~0.33)
- **Trend:** ___ (beklenen: ~0.33)

**Sonuç:** [ ] Dengeli  [ ] Dominant sinyal var  [ ] Bir sinyal baskın

## İhlaller (Breach History)
- **Kritik:** ___ (auto-pause: evet/hayır)
- **Minör:** ___

**Top 3:**
1. ___
2. ___
3. ___

## Aksiyon
- [ ] Eşik ↑ (metrik: ___, yeni değer: ___)
- [ ] Preview-only mode
- [ ] Rollback (neden: ___)
- [ ] No-op (tüm metrikler yeşil ✅)

## Sonraki Adım
___

---
**Hazırlayan:** ___
**İnceleyen:** ___
**Onaylayan:** ___
```

---

## 🎵 "BUTONU BAS → İZLE → TEPKİ VER" HIZLI AKIŞ

### 1. Bas 🔘
```bash
export FEATURE_ML_SCORING=preview
./deploy.sh --canary
```

### 2. İzle 👀
```bash
# Monitoring script (background)
bash scripts/monitor-live.sh &

# Panel 3+2
# → SLOTimechart (p95, staleness, error_rate)
# → RecentActions (ml.score ≥10/dk)
# → RiskGuardrails (breach monitoring)
# → DLQ ≤ 2
# → ml_bucket dengeli
```

### 3. Tepki Ver ⚡
```bash
# Yukarıdaki matrise göre:
# - 🟢 Normal → İzlemeye devam
# - 🟡 Warning → Preview mode + adjust
# - 🟠 Alert → Throttle aggressively
# - 🔴 Critical → ROLLBACK
```

### 4. Tekrarla 🔄
```bash
# Tempo: 60 BPM
# Adım: Küçük, ölçülebilir
# Fail-closed: Hep hazır
# Sinyal net → Genişlet
# Gürültü bastırır → Kapat, nefes al, tekrar aç
```

---

## 📌 HATIRLATMALAR

### ✅ Green-Room Checklist (T-15)
```bash
bash scripts/green-room-check.sh
```

### ✅ Canlı İzleme (3+2)
- SLOTimechart: Kırmızı çizgiler sabit
- RecentActions: ≥10/dk
- RiskGuardrails: Auto-pause teyidi
- DLQ: ≤2
- ml_bucket: 0.5-0.8 dengeli

### ✅ Triyaj Refleksi
- Belirti → Eşik → Tek satırlık refleks
- Kopyala-çalıştır ready
- No thinking, just execute

---

**MATRİS SONU - REFLEKSLER NET! ⚡**

