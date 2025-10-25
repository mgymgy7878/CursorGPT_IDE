# 🎚️ IC POCKET GUIDE
**v1.4.0 · Cep Boy Operasyon Kılavuzu**

---

## ⚡ 30 SANİYELİK DEVİR (HANDOFF)

```bash
HANDOFF $(date -Is) | IC: @giden → @gelen | durum: yeşil/sarı/kırmızı
p95=__ms 5xx=__% ws=__s idem=__% risk=__/dk csp=__ evloop=__ms gc=__ms
açık riskler: [---] | son karar: proceed/hold/rollback | dashboard: <link>
```

### Örnek
```bash
HANDOFF 2025-01-15T17:00:00Z | IC: @alice → @bob | durum: yeşil
p95=142ms 5xx=0.2% ws=18s idem=0.1% risk=0.1/dk csp=0 evloop=23ms gc=8ms
açık riskler: [yok] | son karar: proceed | dashboard: https://grafana.internal/d/spark-v140
```

### Devir Kontrol (30sn)
- [ ] 8 sinyal oku
- [ ] Açık incident var mı?
- [ ] Son 24h karar: proceed/hold/rollback?
- [ ] Dashboard linki paylaş

---

## 🚨 ALARM ANINDA 10 SANİYELİK KOMUTA İLANI

```bash
"I am IC." | karar süresi: 5 dk | tek-tık rollback yetkisi aktif
kanal: #war-room-spark | teori → parking-lot | sinyal-only konuşma
```

### Örnek
```
@alice: I am IC. | karar süresi: 5 dk | tek-tık rollback yetkisi aktif
kanal: #war-room-spark | teori → parking-lot | sinyal-only konuşma
```

### IC Komuta Checklist (10sn)
- [ ] "I am IC" ilan et
- [ ] War-room kanalını duyur
- [ ] Sinyal-only modunu hatırlat
- [ ] Karar süresini belirt (5 dk)

---

## 🔄 IC'NİN 60 SANİYELİK ROLLBACK TATBİKATI (KURU KOŞU)

```powershell
pwsh scripts/rollback.ps1 -Reason "drill" -Stage "current-%" -WhatIf
echo "$(date -Is) | IC=@me | rollback drill PASS" >> evidence/ops.log
```

### Haftalık Drill (Her Gün 7)
```bash
# Dry-run rollback
pwsh scripts/rollback.ps1 -Reason "weekly-drill" -Stage "current-%" -WhatIf

# Kanıt kaydet
echo "$(date -Is) | IC=@alice | rollback drill PASS | duration=58s" >> evidence/ops.log

# Başarı doğrula
if ($LASTEXITCODE -eq 0) {
  echo "✓ Drill successful"
} else {
  echo "✗ Drill failed - investigate"
}
```

---

## 🎯 RAG KARAR MATRİSİ (CEPLİK)

| Renk | Koşul | Süre | Aksiyon | IC Yetkisi |
|------|-------|------|---------|------------|
| 🟢 **Yeşil** | 8/8 ≤ eşik | 5 dk | **proceed** | - |
| 🟡 **Sarı** | 1-2 sinyal sınırda, eğim düzeliyor | 10 dk | **hold & re-measure** | Bekletme kararı |
| 🔴 **Kırmızı** | ≥3 kırmızı **VEYA** 5xx↑ & risk_block↑ | 3 dk | **rollback ≤5 dk** | **Tek-tık** (ön onay yok) |

### Eşikler (Kısa Referans)
```
p95     ≤ 200ms    (kırmızı: >400ms)
5xx     ≤ 1%       (kırmızı: >3%)
ws      ≤ 30s      (kırmızı: >120s)
risk    < 0.5/dk   (kırmızı: >0.5/dk)
idem    < 1%       (kırmızı: >1%)
csp     ≤ +10%     (kırmızı: >+10%)
evloop  ≤ 50ms     (kırmızı: >50ms)
gc      ≤ 20ms     (kırmızı: >20ms)
```

### Korelasyon Tetikleyicileri (Anında Rollback)
- `5xx↑ & risk_block↑` (3 dk sürekli)
- `p95>400ms & evloop>50ms` (backend tıkanma)
- `ws>120s & conn_creep↑` (bağlantı sızıntısı)
- `idem>1% & outbox_lag>30s` (veri tutarsızlığı)

---

## 📅 IC ROTA ŞABLONU (TEK SATIR/GÜN)

```bash
2025-11-01..07 IC @ad1 (yedek @ad2); 08..14 IC @ad2 (yedek @ad3); 15..21 IC @ad3 (yedek @ad1)
```

### Genişletilmiş Format (Haftalık)
```
W01 (Jan 01-07): IC @alice (backup @bob)
W02 (Jan 08-14): IC @bob (backup @charlie)
W03 (Jan 15-21): IC @charlie (backup @alice)
W04 (Jan 22-28): IC @alice (backup @bob)
```

### Rota Güncelleme (Ceplik)
```bash
# Haftalık rotasyonu otomatik güncelle
echo "W$(date +%V) ($(date -d 'monday' +%b\ %d)-$(date -d 'sunday' +%b\ %d)): IC @$(whoami) (backup @next)" >> evidence/ic_rota.log
```

---

## 🎚️ WAR-ROOM ALIAS (TEK SATIR ÖLÇ-KAYDET)

```bash
alias wr='echo "$(date -Is) | stage=${STAGE:-X%} | p95=${P95}ms 5xx=${E5}% ws=${WS}s idem=${ID}% risk=${RB}/dk csp=${CSP} evloop=${EL}ms gc=${GC}ms | karar=${DECISION} | IC=${IC}" | tee -a evidence/war-room.log'
```

### Kullanım
```bash
# Değişkenleri ayarla
export STAGE="50%" P95=142 E5=0.2 WS=18 ID=0.1 RB=0.1 CSP=0 EL=23 GC=8 DECISION="proceed" IC="@alice"

# War-room satırını kaydet
wr
```

### PowerShell Versiyonu
```powershell
function wr {
  $ts = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
  $line = "$ts | stage=$env:STAGE | p95=$($env:P95)ms 5xx=$($env:E5)% ws=$($env:WS)s idem=$($env:ID)% risk=$($env:RB)/dk csp=$env:CSP evloop=$($env:EL)ms gc=$($env:GC)ms | karar=$env:DECISION | IC=$env:IC"
  $line | Tee-Object -FilePath evidence/war-room.log -Append
}
```

---

## ⚠️ 3 KAYGAN TUZAK → HIZLI PANZEHİR

### 1. ÇİFTE-IC (Karışıklık)

**Tuzak:**
- İki kişi aynı anda komuta almaya çalışır
- Kararlar çakışır
- Rollback kaosu

**Panzehir:**
```bash
# IC ilanı yap (war-room'da)
echo "I am IC. @old-ic standby mode."

# Manifest linkini paylaş
echo "IC manifest: OWNERSHIP_MANIFEST.md | IC rota: evidence/ic_rota.log"
```

### 2. TOPLANTI SELİ (Analiz Felci)

**Tuzak:**
- War-room'da uzun teori tartışmaları
- 5 dk karar süresi aşılır
- Sistem kötüleşirken analiz devam eder

**Panzehir:**
```bash
# Sinyal-only modunu zorla
echo "SIGNAL-ONLY. Teori → parking-lot. 5 dk karar döngüsü."

# Timer başlat
echo "Decision deadline: $(date -d '+5 minutes' -Is)"

# 5 dk sonra karar
# proceed/hold/rollback - seç ve bildir
```

### 3. ONAY BEKLEME (Gecikme)

**Tuzak:**
- IC rollback için üst onay bekler
- Süre uzar (>5 dk)
- Müşteri etkisi büyür

**Panzehir:**
```bash
# IC tek-tık yetkisini hatırlat
echo "IC = tek-tık rollback (ön onay gerekmez). OWNERSHIP_MANIFEST.md"

# Rollback başlat
pwsh scripts/rollback.ps1 -Reason "post-canary-degradation" -Stage "current-%"

# Kanıt otomatik (evidence/)
echo "Rollback kanıtı: evidence/rollback_$(date +%s).log"
```

---

## 📋 CEPLİK KANIT ÇİVİSİ

### Tek Satır Git Kanıt
```bash
git add evidence && git commit -m "ops: $(date -Is) IC=@adX decision=proceed/hold/rollback" && git push
```

### Genişletilmiş Kanıt (Detaylı)
```bash
# Evidence snapshot al
bash scripts/snapshot-metrics.sh > evidence/snapshot_$(date +%s).txt

# Git commit
git add evidence/
git commit -m "ops: $(date -Is) IC=@alice decision=proceed stage=100% p95=142ms 5xx=0.2%"

# Push (otomatik CI tetiklemez)
git push origin main --no-verify
```

### War-Room Kapanış Kanıtı
```bash
# Kapanış log'u
echo "RESOLVED $(date -Is) | aksiyon: rollback | süre: 4m32s | IC: @alice | kanıt: evidence/rollback_$(date +%s).log" | tee -a evidence/war-room.log

# Git commit
git add evidence/ && git commit -m "incident: resolved - rollback completed" && git push
```

---

## 🎵 ÖZET: IC OPERASYON RİTMİ

### Normal Operasyon (Barış Zamanı)
```
IC: Pasif izleme
Ritüel: Gün 7 drill + Gün 14 alarm hijyeni + Gün 30 mezuniyet
Panel: Yeşil
Karar: Service Owner
```

### Alarm Durumu (War-Room)
```
IC: "I am IC." ilanı
Karar: IC'de (5 dk döngü)
Rollback: Tek-tık (≤5 dk)
Kanıt: Otomatik (evidence/)
Format: Sinyal-only
```

### Nöbet Devri (Handoff)
```
Süre: 30sn
Format: HANDOFF satırı
Kontrol: 8 sinyal + açık riskler + dashboard
Onay: Eski IC → Yeni IC el sıkışma
```

---

## 🎚️ FİNAL MANTRA (IC İÇİN)

**IC söylüyor**  
**Service Owner düzenliyor**  
**Herkes 8 sinyalle ritmi tutuyor**

**Panel yeşil; mikrofon sende.**

**Ölç · Kaydet · Karar Ver**

**Gerekirse zarifçe geri sar.**

---

## 💚 KANITLA HIZLI 💚

**🎚️🎵 Metrikler şarkısını söylüyor; orkestra IC'de. 🎵🎚️**

---

**Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş**

