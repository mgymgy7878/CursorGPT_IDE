# 🚀 GO-LIVE MINI PLAYBOOK

**Platform:** Spark Trading v2.0 ML Signal Fusion  
**Strateji:** Kademeli Açılış (Canary → %10 → %50 → %100)  
**Ritim:** Butonu bas → İzle → Tepki ver

---

## 0️⃣ PREFLIGHT (Tek Sefer - 5 dk)

### Health Check
```bash
# 1. API Health
curl -s http://localhost:3003/api/healthz | jq
# → { "ok": true, "buildSha": "...", "version": "1.5.0" }
# ✅ X-Build-SHA header var mı?

# 2. Public Endpoints (Graceful Degradation)
curl -s http://localhost:3003/api/public/alert/last | jq
curl -s http://localhost:3003/api/public/metrics | jq
curl -s http://localhost:3003/api/public/smoke-last | jq
# → { "_mock": true, "status": "DEMO" } veya gerçek veri
# ✅ Executor offline olsa bile 200 dönüyor mu?

# 3. ML Score (Fail-Closed Guard)
curl -s http://localhost:3003/api/ml/score \
  -H 'content-type: application/json' \
  -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}' | jq
# → Guardrails fail-closed response + advisory=true
# ✅ NaN/Infinity guard aktif mi?
```

### UI Kalite Kilitleri (Hızlı Doğrulama)
```javascript
// DevTools Console'da çalıştır:
// 1. Tek scroll disiplini
getComputedStyle(document.body).overflow === "hidden" // ✅
getComputedStyle(document.querySelector('main')).overflowY === "auto" // ✅

// 2. Hydration sükûneti
// Console'da "Text content does not match" yok mu? ✅

// 3. Toast politikası
// Sayfa yüklemede kırmızı toast yok mu? ✅

// 4. DEMO emniyeti
// Amber "DEMO" chip görünüyor mu? ✅
```

---

## 1️⃣ CANARY AÇILIŞI (4 Saat İzleme)

### Deployment
```bash
# Preview modda başlat (BTCUSDT-1h)
export FEATURE_ML_SCORING=preview
export CANARY_SYMBOL=BTCUSDT
export CANARY_TIMEFRAME=1h

# Deploy
./deploy.sh --canary

# Verify
curl -s http://localhost:3003/api/ml/version | jq
# → { "featureVersion": "v2.0", "modelVersion": "ml-fusion-1.2" }
```

### İzlenecek SLO'lar (4 Saat)
| Metrik | Hedef | Uyarı | Kritik | Aksiyon |
|--------|-------|-------|--------|---------|
| **p95 latency** | ≤ 1000ms | 1000-1500ms | >1500ms (15dk) | Preview-only, poll interval +%50 |
| **staleness** | ≤ 30s | 30-60s | >60s (30dk) | Executor ping, cron kontrol |
| **error_rate** | ≤ 1% | 1-2% | >2% (30dk) | ML scoring OFF, audit incele |
| **ml.score kardinalite** | ≥ 10/dk | 5-10/dk | <5/dk (1h) | Signal check, logs review |
| **confid median** | ≥ 0.55 | 0.45-0.55 | <0.45 (3h) | Ağırlık sabitle, v2.1 kalibrasyon |

### Monitoring Dashboard (3 Panel + 2 Sayaç)
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 SLOTimechart (p95, staleness, error_rate)               │
│    → Kırmızı threshold çizgileri sabit                      │
├─────────────────────────────────────────────────────────────┤
│ 📋 RecentActions (ml.score akışı)                           │
│    → Dakikada ≥10 entry                                     │
├─────────────────────────────────────────────────────────────┤
│ ⚠️ RiskGuardrailsWidget (breach monitoring)                │
│    → Auto-pause tetik: evet/hayır                          │
├─────────────────────────────────────────────────────────────┤
│ 🔢 Sayaç 1: Queue DLQ ≤ 2                                   │
│ 🔢 Sayaç 2: ml_bucket dağılımı (0.5-0.8 dengeli)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ KADEMELİ AÇILIŞ (Phased Rollout)

### Faz 1: %10 Traffic (60 dk)
```bash
export FEATURE_ML_SCORING=0.1
./deploy.sh --rolling

# 60 dakika izle
# ✅ p95 stabil mi?
# ✅ error_rate normal mi?
# ✅ confid dağılımı makul mu?
```

### Faz 2: %50 Traffic (120 dk)
```bash
export FEATURE_ML_SCORING=0.5
./deploy.sh --rolling

# 120 dakika izle
# ✅ Kardinalite arttı mı? (≥50/dk bekleniyor)
# ✅ ML bucket dağılımı dengeli mi?
# ✅ Breach count kabul edilebilir mi?
```

### Faz 3: %100 Traffic (24 Saat İzleme)
```bash
export FEATURE_ML_SCORING=1.0
./deploy.sh --rolling

# 24 saat boyunca izle
# ✅ Tüm SLO'lar hedef içinde mi?
# ✅ v2.1 veri toplama aktif mi?
# ✅ Reliability diagram verisi dolmaya başladı mı?
```

---

## 3️⃣ ROLLBACK REFLEKSİ (2 Dakika)

### Rollback Senaryoları
| Senaryo | Tetikleyici | Aksiyon |
|---------|-------------|---------|
| **Red Alert** | p95 >1500ms (15dk) | Immediate rollback |
| **Red Alert** | error_rate >2% (30dk) | Immediate rollback |
| **Red Alert** | staleness >60s (30dk) | Immediate rollback |
| **Yellow Warning** | confid <0.45 (3h) | Preview-only mode |
| **Yellow Warning** | DLQ >5 (1h) | Investigate + preview |

### Rollback Prosedürü
```bash
# 1. Feature flag OFF
export FEATURE_ML_SCORING=0

# 2. Deploy rollback
./deploy.sh --rollback

# 3. Verify health
curl -s http://localhost:3003/api/healthz | jq '.ok'
# → true

# 4. Check UI
# → Amber "DEMO" chip görünmeli
# → Kırmızı toast yok
# → RecentActions: ml.score entries durdu

# 5. Notify team
echo "ROLLBACK COMPLETE: ML Scoring disabled" | slack-notify
```

---

## 4️⃣ TRİYAJ TEKNİĞİ (Sorun → Karşı Hamle)

### p95 Latency Artıyor
**Belirtiler:**
- p95 >1000ms ve yükseliyor
- API response time arttı
- CPU usage yüksek

**Karşı Hamle:**
```bash
# 1. Confid floor'u yükselt (düşük confidence'ları filtrele)
export ML_CONFID_FLOOR=0.65

# 2. Poll interval'i azalt (yük düşür)
export POLL_INTERVAL_MS=90000  # 60s → 90s (+%50)

# 3. Preview-only mode
export FEATURE_ML_SCORING=preview
```

### Staleness >60s
**Belirtiler:**
- Veri gecikmesi arttı
- "Last update" timestamp eski
- Executor ping timeout

**Karşı Hamle:**
```bash
# 1. Executor health check
curl -s http://localhost:4001/health --max-time 3
# Timeout mu? → Executor restart gerekli

# 2. Cron job kontrolü
ps aux | grep cron
systemctl status cron

# 3. Timestamp drift kontrolü
date && curl -s localhost:4001/metrics | grep spark_last_update_timestamp
```

### Error Rate >2%
**Belirtiler:**
- API errors yükseldi
- 500/503 responses
- Audit log'da _err entries

**Karşı Hamle:**
```bash
# 1. ML Scoring OFF
export FEATURE_ML_SCORING=0

# 2. Preview-only mode
export FEATURE_ML_SCORING=preview

# 3. Audit incele (top 3 error)
curl -s localhost:3003/api/audit/list -X POST \
  -H 'content-type: application/json' \
  -d '{"limit":100}' | jq '[.items[]|select(._err)]|group_by(._err)|map({err:.[0]._err,count:length})|sort_by(.count)|reverse|.[0:3]'
```

### Median Confidence <0.4 (3 Saat)
**Belirtiler:**
- ML model çok düşük confidence veriyor
- Signal parts correlation zayıf
- Bucket dağılımı 0.3-0.4'te yığılmış

**Karşı Hamle:**
```bash
# 1. Sinyal ağırlıklarını sabitle (equal weight)
export ML_SIGNAL_WEIGHTS="0.33,0.33,0.33"  # RSI, MACD, Trend

# 2. v2.1 kalibrasyon dataseti işaretle
echo "$(date -Iseconds),low_confidence_period,median_confid=0.38" >> data/calibration_markers.csv

# 3. Preview-only mode (advisory)
export FEATURE_ML_SCORING=preview
```

---

## 5️⃣ 24 SAATLİK RAPOR ŞABLONU

```markdown
# 📊 ML SCORING GO-LIVE RAPORU

**Tarih:** YYYY-MM-DD  
**Faz:** Canary / %10 / %50 / %100  
**Süre:** 24 saat

## Özet
- **p95 Latency:** ___ms (hedef: ≤1000ms)
- **Staleness:** ___s (hedef: ≤30s)
- **Error Rate:** ___% (hedef: ≤1%)
- **Hit Rate:** ___% (ML score success)
- **Incident Rate:** ___ (kritik/minör)
- **Median Confidence:** ___ (hedef: ≥0.55)

## Kardinalite
- **ml.score Toplam:** ___ entries
- **Dakika Ortalaması:** ___ entries/min (hedef: ≥10)
- **Tepe Saat:** ___ entries (saat: ___)

## Kalibrasyon
**Bucket Hit-Rate:**
- 0.5-0.6: ___%
- 0.6-0.7: ___%
- 0.7-0.8: ___%
- 0.8-0.9: ___%

**Dağılım Dengesi:** ✅ Dengeli / ⚠️ Çarpık / ❌ Yığılmış

## Sinyal Parçaları (Correlation)
- **RSI:** ___ (beklenen: ~0.33)
- **MACD:** ___ (beklenen: ~0.33)
- **Trend:** ___ (beklenen: ~0.33)

**Sonuç:** ✅ Dengeli / ⚠️ Dominant sinyal var / ❌ Bir sinyal baskın

## İhlaller (Breach History)
- **Kritik:** ___ (auto-pause tetik: evet/hayır)
- **Minör:** ___ (warning only)

**Top 3 Breach:**
1. ___ (metrik: ___, threshold: ___, duration: ___s)
2. ___ (metrik: ___, threshold: ___, duration: ___s)
3. ___ (metrik: ___, threshold: ___, duration: ___s)

## Aksiyon
- [ ] Eşiği ___'e ayarla (metrik: ___)
- [ ] Preview-only mode aktif et
- [ ] Rollback yap (neden: ___)
- [ ] No-op (her şey yeşil ✅)

## Sonraki Adım
___ (örn: %50 traffic'e geç, v2.1 kalibrasyon başlat)

---

**Raporu Hazırlayan:** ___  
**İnceleyen:** ___  
**Onaylayan:** ___
```

---

## 6️⃣ CANLI İZLEME KOMUT SETI

### Real-Time Monitoring
```bash
# Terminal 1: SLO Metrikleri (her 10s)
watch -n 10 'curl -s localhost:3003/api/tools/metrics/timeseries?window=1h | jq "{p95:.data[-1].p95_ms, stale:.data[-1].staleness_s, err:.data[-1].error_rate}"'

# Terminal 2: ML Score Kardinalite (her 30s)
watch -n 30 'curl -s localhost:3003/api/audit/list -X POST -H "content-type: application/json" -d "{\"limit\":100}" | jq "[.items[]|select(.action==\"ml.score\")]|length"'

# Terminal 3: Confidence Distribution
watch -n 60 'curl -s localhost:3003/api/audit/list -X POST -H "content-type: application/json" -d "{\"limit\":100}" | jq "[.items[]|select(.action==\"ml.score\")|.context.confid|tonumber]|add/length"'

# Terminal 4: DLQ Size
watch -n 30 'curl -s localhost:4001/metrics | grep spark_dlq_size | awk "{print \$2}"'
```

### Alert Script
```bash
#!/bin/bash
# alert_monitor.sh - SLO threshold alerter

while true; do
  P95=$(curl -s localhost:3003/api/tools/get_metrics | jq '.p95_ms')
  STALE=$(curl -s localhost:3003/api/tools/get_metrics | jq '.staleness_s')
  ERR=$(curl -s localhost:3003/api/tools/get_metrics | jq '.error_rate')
  
  # Check thresholds
  if (( $(echo "$P95 > 1500" | bc -l) )); then
    echo "🚨 RED ALERT: p95=$P95ms > 1500ms" | tee -a alerts.log
    # Rollback trigger
  elif (( $(echo "$P95 > 1000" | bc -l) )); then
    echo "⚠️ YELLOW WARNING: p95=$P95ms > 1000ms" | tee -a alerts.log
  fi
  
  if (( $(echo "$STALE > 60" | bc -l) )); then
    echo "🚨 RED ALERT: staleness=${STALE}s > 60s" | tee -a alerts.log
  fi
  
  if (( $(echo "$ERR > 2" | bc -l) )); then
    echo "🚨 RED ALERT: error_rate=$ERR% > 2%" | tee -a alerts.log
  fi
  
  sleep 60
done
```

---

## 7️⃣ v2.1 VERİ TOPLAMA (Hemen Başlasın)

### Aktif Et
```bash
# Audit'te ml_bucket ve ml_signal_parts aktif
export AUDIT_ML_BUCKET=true
export AUDIT_ML_SIGNAL_PARTS=true

# Verify
curl -s localhost:3003/api/audit/list -X POST -d '{"limit":1}' | jq '.items[0].context | {bucket:.ml_bucket, parts:.ml_signal_parts}'
```

### İlk 24 Saat Kuralı
```
⚠️ Ağırlıkları sabit tut, sadece topla
→ Bayes güncelleme için veri dengesini bozma
→ Haftalık reliability diagram için ham madde hazırla
```

### Veri Toplama Kontrolü
```bash
# Günlük snapshot
date=$(date +%Y%m%d)
curl -s localhost:3003/api/audit/list -X POST -d '{"limit":10000}' > data/audit_snapshot_${date}.json

# Bucket distribution
jq '[.items[]|select(.action=="ml.score")|.context.ml_bucket]|group_by(.)|map({bucket:.[0],count:length})' data/audit_snapshot_${date}.json

# Signal parts correlation
jq '[.items[]|select(.action=="ml.score")|.context.ml_signal_parts]|add/length' data/audit_snapshot_${date}.json
```

---

## 8️⃣ MİKRO BACKLOG (1 Sprint, Yüksek Fayda)

### 1. Virtual Scroll (Stratejilerim)
```bash
pnpm add @tanstack/react-virtual
```

**Fayda:** 100+ strateji listesinde CPU %70 düşer

### 2. RBAC Guards
```tsx
const { canStart, canStop, canOptimize } = usePermissions();

<Button disabled={!canStart} title={!canStart ? "Yetkiniz yok" : ""}>
  Başlat
</Button>
```

**Fayda:** Yetki ihlali önlenir, UX netleşir

### 3. Local Persist (Copilot/Sidebar)
```tsx
const [copilotOpen, setCopilotOpen] = useLocalStorage('spark-copilot-open', true);
```

**Fayda:** ✅ Zaten uygulandı! User preference hatırlanır

---

## 9️⃣ PERDE AÇIK, METRONOM SABİT

```
🎭 SAHNE AÇIK
🎵 METRONOM: 60 BPM
📏 ADIMLAR: Küçük, ölçülebilir
🚨 FAIL-CLOSED: Sinyal gürültüye dönerse kapat
✅ TEMPO GERİ GELDİĞİNDE: Tekrar aç
```

### Go-Live Ritmi
```
1. Butonu bas   → FEATURE_ML_SCORING=preview
2. İzle         → SLO'lar 4 saat
3. Tepki ver    → Yeşilse %10, kırmızıysa rollback
4. Tekrarla     → %10 → %50 → %100
```

---

## 🎯 BAŞARI KRİTERLERİ

**24 Saat Sonunda:**
- ✅ p95 <1000ms (stabil)
- ✅ staleness <30s (stabil)
- ✅ error_rate <1% (stabil)
- ✅ ml.score kardinalite ≥10/dk
- ✅ confid median ≥0.55
- ✅ breach count <5 (24h)
- ✅ DLQ <2 (sürekli)
- ✅ ml_bucket dağılımı dengeli

**Başarı = Canary şarkısı 60 BPM'de söyleniyor 🎵**

---

**PLAYBOOK SONU - MÜZİK BAŞLASIN! 🚀**

