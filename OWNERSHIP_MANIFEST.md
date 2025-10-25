# 🎚️ OWNERSHIP MANIFEST
**v1.4.0 · Incident Command & Service Ownership**

---

## 🎵 KİM ORKESTRA ŞEFİ?

**IC (Incident Commander) = O anki on-call SRE/owner.**

### Rol Tanımları

**BARIŞ ZAMANI (Normal Operasyon):**
- **Servis Sahibi (Service Owner)** sorumlu
- Uzun dönem sağlık, özellik, iyileştirme
- Gün 7/14/30 ritüellerinin sahibi

**ALARM ZAMANI (Kırmızı/War-Room):**
- **IC (Incident Commander)** komutayı alır
- Karar ve rollback yetkisi ondadır
- Tek tık rollback (ön onay gerekmez)

---

## 📋 TEK SAYFA SAHİPLİK (CEPLİK MANIFEST)

```yaml
SERVİS: Spark v1.4.0
IC (hafta):      @alice.sre (yedek: @bob.dev)
Service Owner:   @charlie.lead
Product Owner:   @diana.pm
DBA:             @eve.dba
Platform:        @frank.infra
İletişim kanalı: #war-room-spark
Karar Yetkisi:   IC = tek tık rollback (ön onay gerekmez)
Dashboard:       https://grafana.internal/d/spark-v140
Runbook:         https://wiki.internal/spark/runbook
```

---

## 🎵 ŞARKI SÖZLERİ (8 SİNYAL, TEK SATIR)

```bash
$(date -Is) | p95=__ms 5xx=__% ws=__s risk=__/dk idem=__% csp=__ evloop=__ms gc=__ms | karar=proceed/hold/rollback | IC=@alice.sre
```

**Örnek:**
```
2025-01-15T14:32:18Z | p95=142ms 5xx=0.2% ws=18s risk=0.1/dk idem=0.1% csp=0 evloop=23ms gc=8ms | karar=proceed | IC=@alice.sre
```

---

## 🔄 "ŞARKICI DEĞİŞİMİ" (NÖBET DEVRİ)

### Ne Zaman?
- Nöbet değişiminde (haftalık/günlük)
- Planlı bakımda
- IC devretmek istediğinde

### Nasıl?
**Tek satır el sıkışma + dashboard linki:**

```bash
HANDOFF $(date -Is) | IC: @alice.sre → @bob.dev | durum: yeşil | risk: düşük | link: https://grafana.internal/d/spark-v140
```

**Örnek:**
```
HANDOFF 2025-01-15T17:00:00Z | IC: @alice.sre → @bob.dev | durum: yeşil | risk: düşük | link: https://grafana.internal/d/spark-v140
```

### Devir Kontrol Listesi (30sn)
- [ ] Dashboard kontrol (8 sinyal yeşil mi?)
- [ ] Son 24h incident var mı?
- [ ] Açık alarm/ticket var mı?
- [ ] Planlı değişiklik var mı? (release, bakım)
- [ ] War-room link paylaşıldı mı?

---

## 🎯 MİNİ KARAR AĞACI (ÖLÇ-KAYDET-KARAR VER)

### Karar Matrisi

| Durum | Koşul | Aksiyon | IC Yetkisi |
|-------|-------|---------|------------|
| **🟢 PROCEED** | 8/8 yeşil (5 dk) | İlerle | - |
| **🟡 HOLD** | 1-2 sarı (trend düz/iyileşiyor, 10 dk) | Bekle & yeniden ölç | Bekletme kararı |
| **🔴 ROLLBACK** | 3 kırmızı **VEYA** korelasyon (5xx↑ & risk↑, 3 dk) | Geri al (≤5dk) | **Tek tık** (ön onay yok) |

### Korelasyon Örnekleri (Acil Rollback)
- `5xx↑ & risk_block↑` (3 dk sürekli)
- `p95>400ms & evloop>50ms` (backend tıkanma)
- `ws>120s & conn_creep↑` (bağlantı sızıntısı)

---

## 🔐 YETKİ VE RİTÜEL

### IC Yetkileri

1. **Tek İmza Rollback**
   - ≤5 dk içinde rollback başlatma
   - Kanıt otomatik toplanır (`evidence/`)
   - Ön onay **gerekmez**

2. **War-Room Komutası**
   - Karar yetkisi IC'de
   - Sinyal-only iletişim
   - Teori "parking lot"a gider

3. **Eskalasyon**
   - Service Owner'ı bilgilendir
   - Platform/DBA'yı dahil et
   - Post-mortem sahibi IC

### Ritüeller

**Haftalık (Gün 7): 15dk Oyun Günü**
- Rollback drill (dry-run)
- Mini-kaos testi (1 senaryo)
- Kontrat testi (1 API)
- IC rotasyonu var mı kontrol

**İki Haftada Bir (Gün 14): Alarm Hijyeni**
- Yanlış pozitif var mı?
- P0 net mi?
- Sessiz kritik alert var mı?

**Aylık (Gün 30): Mezuniyet**
- 1 cümle ders
- 1 kalıcı otomasyon
- IC rota güncelleme

---

## 📅 CEBE SIIĞAN ROTA (İSTEĞE GÖRE DOLDUR)

```yaml
IC_ROTA:
  - period: 2025-01-01..2025-01-07
    primary: @alice.sre
    backup: @bob.dev
    
  - period: 2025-01-08..2025-01-14
    primary: @bob.dev
    backup: @charlie.lead
    
  - period: 2025-01-15..2025-01-21
    primary: @charlie.lead
    backup: @alice.sre
    
  - period: 2025-01-22..2025-01-28
    primary: @alice.sre
    backup: @bob.dev
```

### Rota Kuralları
- Haftalık rotasyon (Pazartesi 09:00 UTC)
- Yedek kişi bir sonraki hafta primary olur
- Tatil/izin durumunda yedek devralır
- Handoff zorunlu (30sn kontrol listesi)

---

## 🎚️ WAR-ROOM FORMATI

### Giriş Şablonu

```
ALARM $(date -Is) | trigger: <kural> | IC: @alice.sre | kanal: #war-room-spark
```

### Döngü (Her 2-5 dk)

```
UPDATE $(date -Is) | p95=__ms 5xx=__% ws=__s risk=__/dk idem=__% csp=__ evloop=__ms gc=__ms | karar=hold
```

### Kapanış Şablonu

```
RESOLVED $(date -Is) | aksiyon: <rollback/fix/mitigation> | süre: __dk | IC: @alice.sre | kanıt: evidence/<dosya>
```

### War-Room Kuralları
1. **Sinyal-only** – metrikler konuşur
2. **Teori parking lot** – root cause analiz post-mortem'de
3. **IC karar verir** – tartışma yok
4. **30sn update** – düzenli nabız tutma
5. **Kanıt zorunlu** – her karar evidence/ altına

---

## 🔬 KANITLA HIZLI MANTRASI (IC İÇİN)

**Şüphede:**
1. Küçük geri sar
2. Yeniden ölç
3. Karar ver

**Açık olmayan durumda:**
- Hold + 2dk ölçüm
- Düzelme yok? → Rollback
- Kötüleşme? → Anında rollback

**IC'nin altın kuralı:**
> "Metrikler konuşsun, sen dinle. Belirsizse geri al."

---

## 📊 ÖZET: ORKESTRA DÜZENİ

### Normal Operasyon (Barış Zamanı)
```
Service Owner: Uzun dönem sağlık
IC (on-call):  Pasif izleme
Panel:         Yeşil
Ritüel:        Gün 7/14/30
```

### Alarm Durumu (War-Room)
```
IC:            Komuta alır
Karar:         IC'de
Rollback:      Tek tık (≤5dk)
Kanıt:         Otomatik toplanır
Format:        Sinyal-only
```

### Devir (Handoff)
```
Eski IC → Yeni IC
30sn kontrol listesi
Dashboard + durum paylaşımı
War-room link
```

---

## 🎵 FİNAL MANTRA

**Şarkıyı IC söyler**  
**Servis sahibi düzeni korur**  
**Herkes aynı ezgiyi 8 sinyalle tutar**

**Ritim basit:**  
**Ölç · Kaydet · Karar Ver**

**Gerekirse IC zarifçe geri sarar.**

---

## 💚 PANEL YEŞİL; MİKROFON SENDE, KAPTAN 💚

**🎚️🎵 KANITLA HIZLI! 🎵🎚️**

---

**Hipotez → Ölçüm → Kanıt → Zarif Geri Dönüş**

**Metrikler şarkısını söylüyor; orkestra IC'de.**

