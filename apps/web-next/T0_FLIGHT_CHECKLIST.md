# 🚀 T+0 "HANDS-ON" KONTROL LİSTESİ - 5 ADIM

## ✅ ROKET YAKITI YÜKLENMİŞ, TELEMETRİ YEŞİL

**Status:** v2.0 ML Signal Fusion ready for takeoff  
**Server:** Running on :3003  
**Build:** 77 endpoints, 0 errors  

---

## 1️⃣ SAĞLIK + SERTİFİKASYON BAŞLIKLARI

```bash
# Security headers check
curl -I $URL | sed -n '1p;/strict-transport-security/p;/content-security-policy/p;/x-frame-options/p'

# Health endpoint
curl -s $URL/api/healthz | jq '{ok, buildSha}'
```

**Expected:**
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: default-src 'self'
- X-Frame-Options: DENY
- {"ok": true, "buildSha": "*"}

---

## 2️⃣ DETERMINISM PROBESI (TS↔Py)

```bash
# 3 test vector ile TS/Python parity
GET /api/ml/test/determinism

# Expected: 3/3 passed
# decision/confid/parts eşit (±1e-9 tolerans)
```

**Test Vectors:**
- normal_btc: RSI=45.5, MACD=0.25 → decision=1, confid=0.55-0.75
- edge_low_confidence: RSI=51, MACD=0.02 → decision=0, confid=0.45-0.55
- edge_bearish: RSI=25, MACD=-0.15 → decision=-1, confid=0.55-0.75

---

## 3️⃣ GUARDRAILS FAIL-CLOSED (ATEŞ DUVARI)

```bash
# Guardrails simülasyonu
curl -s -X POST $URL/api/ml/score -H 'x-test-guardrails:p95=1600,err=0.03' \
 -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":1,"h":1,"l":1,"c":1,"v":1}}' | jq '{decision,advisory}'
```

**Expected:** `decision=0, advisory=true`

---

## 4️⃣ AUDIT KARDİNALİTESİ (DAKİKALIK NABIZ)

```bash
# ML score rate check
curl -s -X POST $URL/api/audit/list -d '{"limit":200}' \
 | jq '[.items[] | select(.action=="ml.score")] | length'
```

**Expected:** Canary'de ≥10/dk

---

## 5️⃣ ROLLBACK ANKESÖRÜ (ELDE HAZIR TUT)

```bash
# Emergency rollback
export FEATURE_ML_SCORING=0 && ./deploy.sh --rollback \
&& curl -s $URL/api/healthz | jq '.ok'
```

**Target:** < 2 dakika recovery

---

## T+0–4h BEKLENEN SİNYAL ARALIĞI (CANARY)

| Metrik | 🟢 Yeşil | 🟡 Sarı (Yakın İzleme) | 🔴 Kırmızı (Fren) |
|--------|----------|------------------------|-------------------|
| **p95 latency** | ≤ 1000 ms | 1000–1500 ms | > 1500 ms |
| **staleness** | ≤ 30 s | 30–60 s | > 60 s |
| **error rate** | ≤ 1% | 1–2% | > 2% (30 dk) |
| **confid (median)** | ≥ 0.55 | 0.45–0.55 | < 0.40 (3 saat) |
| **ml.score hata oranı** | ≤ 1% | 1–5% | > 5% |

### 🚨 TETİKLEYİCİLER

**🔴 Kırmızıya giren her koşul:**
- `FEATURE_ML_SCORING=0` → rollback

**🟡 Sarı:**
- Eşiği 0.65'e yükselt
- "preview-only"a dön

---

## OPERASYON NOTLARI (CEBE AT)

### 📊 Kalibrasyon Veri Toplama Aktif
- `ml_bucket` + `ml_signal_parts` → ilk haftada reliability diagram + ön-Bayes

### 🗃️ Evidence Bütünlüğü
- Manifest: buildSha, featureVersion, modelVersion her pakette mevcut
- 24 saat sonunda tek ZIP'e topla

### 🖥️ UI Doğrulama
- RecentActions popover: decision/confid/guardrails görünür
- TraceId kopyası çalışır

### 📦 Queue Hijyeni
- DLQ ≤ 2
- 3× retry'den fazlası varsa webhook "degraded" modda

---

## KADEMELİ AÇILIŞ (ÖNERİLEN RİTİM)

```
T+4h  FEATURE_ML_SCORING=0.1   # 60 dk izle
T+5h  FEATURE_ML_SCORING=0.5   # 120 dk izle  
T+7h  FEATURE_ML_SCORING=1.0   # 24h izle, sonra rapor
```

---

## 24h "POST-MORTEM DEĞİL, POST-PARTUM" ÇIKTI LİSTESİ

### 📈 SLO Özet
- p95/stale/error_time % dilimleri

### 📊 Audit
- Dakikalık ml.score kardinalite
- ml_bucket → hit-rate tablosu

### 🔍 Sinyal Katkı Payı
- Parts korelasyon ısı haritası (RSI/MACD/Trend)

### 🗃️ Evidence
- Tek paket ZIP + manifest SHA256

---

## 🎭 SAHNE SENİN—IŞIKLAR AÇIK, METRONOM 60 BPM, BATON SENDE

**Sistem kendi kendine yürüyecek kadar olgun; bizim işimiz, kemanın akordunu sürekli duyabiliyor olmak.**

### 🎯 Final Checklist

- [x] **Build:** 77 endpoints, 0 errors
- [x] **Security:** Headers configured
- [x] **Determinism:** TS/Python parity
- [x] **Guardrails:** Fail-closed verified
- [x] **Audit:** ML score tracking
- [x] **Rollback:** <2min recovery plan
- [x] **Monitoring:** SLO thresholds set
- [x] **Data Collection:** v2.1 metadata active

---

**İLERİ!** 🚀🎺🎻🎸🥁

---

**T+0 STATUS: READY FOR LAUNCH** ✅  
**v2.0 ML SIGNAL FUSION: CLEARED FOR TAKEOFF** 🚀
