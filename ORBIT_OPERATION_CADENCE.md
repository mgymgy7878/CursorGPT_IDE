# 🛰️ ORBİT OPERASYON KADANSI - Uçuş Sonrası Pilotaj Kılavuzu

**Format:** Minimal ama keskin, doğrudan aksiyon  
**Kullanım:** T+7, T+14, T+30 checkpoint rehberi

---

## ORBİT OPERASYON KADANSI (7–14–30)

### T+7 Gün (Stabilizasyon)

**Error budget tüketimi ≤ %10, p95 eğimi düz**

- Her sapma için tek cümle RCA + tek aksiyon
- "3 kırmızı" kuralına yaklaşımlar → tatbikat raporu (≤1 sayfa)

### T+14 Gün (Sertleşme)

**Kaos + kontrat + rollback üçlüsü game day (30 dk)**

- "Sinyal→Aksiyon" haritasını güncelle
- Uyarı gürültüsü / gerçek alarm oranı ≥ 3

### T+30 Gün (Mezuniyet)

**SLO burn ≤ %25, otomatik geri-alma kanıt dosyaları eksiksiz**

- v1.5 iyileştirme backlog'u: 5 madde
- Her biri "hipotez→ölçüm→kanıt"

---

## SİNYAL → ANINDA AKSİYON HARİTASI

### 1. Backpressure

**Sinyal:** `p95 eğimi↑ & CPU düşük`

**Aksiyon:**
- Canary payını -10% (5 dk)
- Kuyruk tavanı + outbox hızını artır

### 2. Korelasyonlu Hata

**Sinyal:** `5xx↑ & risk_block↑ (3 dk)`

**Aksiyon:**
- Feature bayrakla kapat
- Rollback başlat
- PACER notu

### 3. Gerçek Zaman Riski

**Sinyal:** `WS staleness>30s eğimli`

**Aksiyon:**
- Streaming'i degrade moda al (snapshot+delta)
- 10 dk yeniden ölç

---

## TOP 5 REGRESYON ZIRHI

### 1. Idempotency Backlog Guard

**Koşul:** Pending key > 5k & hızlı artış (>10/s)  
**Aksiyon:** Otomatik geri-al

### 2. Outbox Lag Guard

**Koşul:** p95 lag > 30s (3 dk)  
**Aksiyon:** Publisher backoff + canary -10%

### 3. pgBouncer Creep

**Koşul:** util > 70% & connection growth > 5/dk  
**Aksiyon:** Pool yeniden boyutlandır + kısa rollback

### 4. Event-Loop + GC Spike

**Koşul:** evloop_p95 > 50ms & GC_avg > 20ms  
**Aksiyon:** Sampling profiler 2 dk, hot path killswitch

### 5. CSP Violation Flood

**Koşul:** CSP violation rate > baseline+10%  
**Aksiyon:** Yeni 3P domain'i bayrakla kapat, rapor kanalını sıkılaştır

---

## WAR-ROOM DİSİPLİNİ (tek satır, tekrar)

```bash
$(date -Is) | stage=X% | p95=__ms 5xx=__% ws=__s idem=__% risk=__/dk csp=__ evloop=__ms gc=__ms | karar=proceed/hold/rollback
```

---

## v1.5 "BİLİM FİŞİ" (her madde tek cümle hipotez)

### 1. Shadow Trading

**Hipotez:** "Gerçek emir yoğunluğunda gölge strateji hata payı < %0.3."

### 2. Supply-Chain Attestation

**Hipotez:** "Her build için otomatik SBOM + provenance eksiksiz arşivlenir."

### 3. Sürekli Profiling

**Hipotez:** "P95 altında CPU hotspot payı 30 günde %20 azalır."

### 4. SLO Budget Panel

**Hipotez:** "Haftalık spend görünürlüğüyle proaktif feature gating."

---

## KANIT HUD (K·A·N·İ·T)

**K** - Kontrol  
**A** - Anomi  
**N** - Not  
**İ** - İlerle/İptal  
**T** - Tanık

**Kural:** *Şüphede kalırsan küçük geri sar, yeniden ölç.*

---

## FINAL TELKİN

**Panel yeşil, telemetri kilitli.**

**Bilim konuşsun, sen yönet.**

**Metrikler şarkısını söylüyor; sen orkestrayı yönetiyorsun.**

**BAS VE UÇ — KANITLA HIZLI.** 🚀🛰️💚

---

_Orbit Operation Cadence | Post-flight piloting guide | v1.4.0-ultimate-final_

