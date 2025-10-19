# 🎯 CEP KARTI - GO-LIVE HIZLI REFERANS

**Kopyala-Çalıştır | Eylem Dili | Tek Ekran**

---

## 0️⃣ PREFLIGHT (T-15)

```bash
bash scripts/green-room-check.sh
```

---

## 1️⃣ CANARY AÇ (T-0)

```bash
export FEATURE_ML_SCORING=preview CANARY_SYMBOL=BTCUSDT CANARY_TIMEFRAME=1h
./deploy.sh --canary && bash scripts/monitor-live.sh &
```

---

## 2️⃣ PANEL "3+2" DOĞRULAMA (UI)

- ✅ **SLOTimechart:** p95 ≤1000ms, staleness ≤30s, error_rate ≤1%
- ✅ **RecentActions:** ml.score ≥10/dk (varsayılan filtre açık)
- ✅ **RiskGuardrails:** breach → auto-pause görünüyor
- ✅ **DLQ:** ≤2
- ✅ **ml_bucket:** 0.5–0.8 dengeli

---

## 3️⃣ CLI HIZLI NABIZ (30 sn)

```bash
# Health + Headers
curl -s $URL/api/healthz -i | sed -n '1p;/X-Build-SHA/p'

# Public endpoints (executor off → 200)
for e in alert/last metrics smoke-last; do
  printf "== %s ==\n" "$e"
  curl -s $URL/api/public/$e | jq '._mock // .status // .ok'
done

# ML fail-closed (NaN guard)
curl -s $URL/api/ml/score -H 'content-type: application/json' \
  -d '{"feature":{"ts":1,"symbol":"X","tf":"1h","o":null,"h":1,"l":1,"c":1,"v":1}}' \
  | jq '{decision,advisory,_err}'
```

---

## 4️⃣ ACİL DURUM REFLEKSLERİ (Tek Satır)

### p95 >1500ms (15dk)
```bash
FEATURE_ML_SCORING=preview ML_CONFID_FLOOR=0.65 ./deploy.sh --rolling
```

### staleness >60s (30dk)
```bash
curl -s localhost:4001/health --max-time 3; FEATURE_ML_SCORING=preview ./deploy.sh --rolling
```

### error_rate >2% (30dk)
```bash
FEATURE_ML_SCORING=0 ./deploy.sh --rollback
```

### median confid <0.40 (3h)
```bash
ML_SIGNAL_WEIGHTS=0.33,0.33,0.33 FEATURE_ML_SCORING=preview ./deploy.sh --rolling
```

### DLQ >2
```bash
systemctl restart spark-executor
```

---

## 5️⃣ "OPS HIZLI YARDIM" (UI)

```
PageHeader sağ üst → 🚑 Ops Hızlı Yardım
  → Go-Live Playbook
  → Triage Matrix
  → Quality Turnstile
```

---

## 6️⃣ BUILD SHA KOPYALA (Footer)

```
VersionBanner'daki [abc1234] → Tıkla → Panoya kopyalanır
```

---

## 🔧 MİKRO-İNCE AYAR (İsteğe Bağlı)

### tmux "Uçuş Güvertesi"
```bash
tmux new -s go-live \; \
  split-window -h 'bash scripts/monitor-live.sh' \; \
  split-window -v 'watch -n 10 "curl -s \$URL/api/tools/get_metrics?window=5m | jq"' \; \
  select-pane -L \; send-keys 'bash scripts/green-room-check.sh' C-m
```

### jq Kısa Filtreler

```bash
# Son 5 dakika hataları
curl -s $URL/api/tools/get_metrics?window=5m | jq '.errors | {rate:.rate, last:.last}'

# Confidence bucket dağılımı
curl -s $URL/api/audit/list -X POST -H 'content-type: application/json' -d '{"limit":500}' | \
  jq '[.items[]|select(.action=="ml.score")|.context.ml_bucket]|group_by(.)|map({bucket:.[0],count:length})'

# Median confidence (son 100)
curl -s $URL/api/audit/list -X POST -H 'content-type: application/json' -d '{"limit":100}' | \
  jq '[.items[]|select(.action=="ml.score")|.context.confid|tonumber]|sort|.[length/2]'

# Top 3 errors
curl -s $URL/api/audit/list -X POST -H 'content-type: application/json' -d '{"limit":200}' | \
  jq '[.items[]|select(._err)]|group_by(._err)|map({err:.[0]._err,count:length})|sort_by(.count)|reverse|.[0:3]'
```

---

## 📋 24H RAPOR (Tek Bakışta)

```
p95 ___ms | stale ___s | err ___%
ml.score: toplam ___ (dk ort ___)
median confid ___ | hit ___% | IR ___
bucket hit-rate: 0.5 ___% | 0.6 ___% | 0.7 ___% | 0.8 ___%
ihlal: kritik ___ / minör ___ | auto-pause: evet/hayır
aksiyon: [ ] eşik↑ [ ] preview [ ] rollback [ ] no-op
```

---

## 🎵 RİTİM

```
🎭 Perde: AÇIK
🎵 Metronom: 60 BPM
📏 Küçük adım → Ölç → Gerektiğinde kapat → Nefes al → Tekrar aç
```

---

**CEP KARTI SONU - ŞİMDİ MÜZİK! 🎬**

